"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Algorithm = "FIFO" | "LRU" | "OPT";

interface SimulationStep {
  page: number;
  frames: (number | null)[];
  hit: boolean;
}

export default function SimulatorSection() {
  const [numFrames, setNumFrames] = useState<string>("3");
  const [referenceString, setReferenceString] = useState<string>("7,0,1,2,0,3,0,4,2,3,0,3,2");
  const [algorithm, setAlgorithm] = useState<Algorithm>("FIFO");
  const [simulationResult, setSimulationResult] = useState<{
    steps: SimulationStep[];
    pageFaults: number;
    pageHits: number;
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const runFIFO = (frames: number, pages: number[]) => {
    const memory: (number | null)[] = Array(frames).fill(null);
    const steps: SimulationStep[] = [];
    let pageFaults = 0;
    let pageHits = 0;
    let nextFrameIndex = 0;

    pages.forEach((page) => {
      if (memory.includes(page)) {
        pageHits++;
        steps.push({ page, frames: [...memory], hit: true });
      } else {
        pageFaults++;
        memory[nextFrameIndex] = page;
        nextFrameIndex = (nextFrameIndex + 1) % frames;
        steps.push({ page, frames: [...memory], hit: false });
      }
    });

    return { steps, pageFaults, pageHits };
  };

  const runLRU = (frames: number, pages: number[]) => {
    const memory: (number | null)[] = Array(frames).fill(null);
    const lastUsed: Map<number, number> = new Map();
    const steps: SimulationStep[] = [];
    let pageFaults = 0;
    let pageHits = 0;

    pages.forEach((page, time) => {
      if (memory.includes(page)) {
        pageHits++;
        lastUsed.set(page, time);
        steps.push({ page, frames: [...memory], hit: true });
      } else {
        pageFaults++;
        
        if (memory.includes(null)) {
          const emptyIndex = memory.indexOf(null);
          memory[emptyIndex] = page;
        } else {
          let lruPage = memory[0];
          let lruTime = lastUsed.get(lruPage!) ?? -1;
          
          memory.forEach((p) => {
            if (p !== null) {
              const pTime = lastUsed.get(p) ?? -1;
              if (pTime < lruTime) {
                lruTime = pTime;
                lruPage = p;
              }
            }
          });
          
          const replaceIndex = memory.indexOf(lruPage);
          memory[replaceIndex] = page;
        }
        
        lastUsed.set(page, time);
        steps.push({ page, frames: [...memory], hit: false });
      }
    });

    return { steps, pageFaults, pageHits };
  };

  const runOptimal = (frames: number, pages: number[]) => {
    const memory: (number | null)[] = Array(frames).fill(null);
    const steps: SimulationStep[] = [];
    let pageFaults = 0;
    let pageHits = 0;

    pages.forEach((page, currentIndex) => {
      if (memory.includes(page)) {
        pageHits++;
        steps.push({ page, frames: [...memory], hit: true });
      } else {
        pageFaults++;
        
        if (memory.includes(null)) {
          const emptyIndex = memory.indexOf(null);
          memory[emptyIndex] = page;
        } else {
          let farthestIndex = -1;
          let pageToReplace = memory[0];
          
          memory.forEach((p) => {
            if (p !== null) {
              const nextUse = pages.slice(currentIndex + 1).indexOf(p);
              const futureIndex = nextUse === -1 ? Infinity : currentIndex + 1 + nextUse;
              
              if (futureIndex > farthestIndex) {
                farthestIndex = futureIndex;
                pageToReplace = p;
              }
            }
          });
          
          const replaceIndex = memory.indexOf(pageToReplace);
          memory[replaceIndex] = page;
        }
        
        steps.push({ page, frames: [...memory], hit: false });
      }
    });

    return { steps, pageFaults, pageHits };
  };

  const handleSimulation = () => {
    setIsSimulating(true);
    
    setTimeout(() => {
      const frames = parseInt(numFrames);
      const pages = referenceString.split(",").map((p) => parseInt(p.trim())).filter((p) => !isNaN(p));
      
      let result;
      switch (algorithm) {
        case "FIFO":
          result = runFIFO(frames, pages);
          break;
        case "LRU":
          result = runLRU(frames, pages);
          break;
        case "OPT":
          result = runOptimal(frames, pages);
          break;
        default:
          result = runFIFO(frames, pages);
      }
      
      setSimulationResult(result);
      setIsSimulating(false);
    }, 500);
  };

  const handleReset = () => {
    setSimulationResult(null);
    setNumFrames("3");
    setReferenceString("7,0,1,2,0,3,0,4,2,3,0,3,2");
    setAlgorithm("FIFO");
  };

  return (
    <section id="simulator" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-secondary/30 to-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Interactive Simulator
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Visualize how different page replacement algorithms handle memory management
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="frames">Number of Frames</Label>
                <Input
                  id="frames"
                  type="number"
                  min="1"
                  max="10"
                  value={numFrames}
                  onChange={(e) => setNumFrames(e.target.value)}
                  placeholder="e.g., 3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Reference String (comma-separated)</Label>
                <Input
                  id="reference"
                  value={referenceString}
                  onChange={(e) => setReferenceString(e.target.value)}
                  placeholder="e.g., 7,0,1,2,0,3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="algorithm">Algorithm</Label>
                <Select value={algorithm} onValueChange={(value) => setAlgorithm(value as Algorithm)}>
                  <SelectTrigger id="algorithm">
                    <SelectValue placeholder="Select algorithm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIFO">FIFO (First-In-First-Out)</SelectItem>
                    <SelectItem value="LRU">LRU (Least Recently Used)</SelectItem>
                    <SelectItem value="OPT">OPT (Optimal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button
                onClick={handleSimulation}
                disabled={isSimulating}
                className="bg-primary hover:bg-primary/90"
              >
                <Play className="mr-2 h-4 w-4" />
                {isSimulating ? "Running..." : "Run Simulation"}
              </Button>
              <Button onClick={handleReset} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {simulationResult && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Algorithm Used</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{algorithm}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Page Faults</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{simulationResult.pageFaults}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Page Hits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{simulationResult.pageHits}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Simulation Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3 text-left font-semibold">Page Request</th>
                        {Array.from({ length: parseInt(numFrames) }, (_, i) => (
                          <th key={i} className="p-3 text-center font-semibold">Frame {i}</th>
                        ))}
                        <th className="p-3 text-center font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simulationResult.steps.map((step, index) => (
                        <tr key={index} className="border-b hover:bg-secondary/50 transition-colors">
                          <td className="p-3 font-mono font-bold">{step.page}</td>
                          {step.frames.map((frame, frameIndex) => (
                            <td key={frameIndex} className="p-3 text-center">
                              {frame !== null ? (
                                <span className="inline-block bg-primary/20 px-3 py-1 rounded font-mono">
                                  {frame}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          ))}
                          <td className="p-3 text-center">
                            <Badge variant={step.hit ? "default" : "destructive"}>
                              {step.hit ? "HIT" : "FAULT"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </section>
  );
}