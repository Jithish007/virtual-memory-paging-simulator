"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, RotateCcw, Upload, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Algorithm = "FIFO" | "LRU";

interface MemoryFrame {
  frameNumber: number;
  pageNumber: number | null;
  isNew: boolean;
  isReplacing: boolean;
}

interface SimulationStep {
  stepNumber: number;
  pageRequest: number;
  frames: MemoryFrame[];
  isFault: boolean;
  replacedPage: number | null;
  replacedFrame: number | null;
  message: string;
}

export default function SimulatorSection() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pageSequence, setPageSequence] = useState<number[]>([]);
  const [numFrames, setNumFrames] = useState<string>("3");
  const [algorithm, setAlgorithm] = useState<Algorithm>("FIFO");
  const [simulationSteps, setSimulationSteps] = useState<SimulationStep[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [totalFaults, setTotalFaults] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setSimulationComplete(false);
      setSimulationSteps([]);
      setCurrentStep(-1);
      
      // Read file content
      const text = await file.text();
      
      // Parse page numbers from text (supports space, comma, newline separated)
      const numbers = text
        .replace(/[,\n\r\t]+/g, ' ')
        .trim()
        .split(/\s+/)
        .map(num => parseInt(num.trim()))
        .filter(num => !isNaN(num) && num >= 0);
      
      setPageSequence(numbers);
    }
  };

  const runPageReplacement = (frames: number, pageSeq: number[], algo: Algorithm) => {
    const memory: (number | null)[] = Array(frames).fill(null);
    const steps: SimulationStep[] = [];
    let pageFaults = 0;
    let fifoQueue: number[] = [];
    const lastUsed: Map<number, number> = new Map();

    pageSeq.forEach((page, time) => {
      const isInMemory = memory.includes(page);
      let replacedPage: number | null = null;
      let replacedFrame: number | null = null;
      let message = "";

      if (isInMemory) {
        // Page Hit
        if (algo === "LRU") {
          lastUsed.set(page, time);
        }
        
        message = `Page ${page} - HIT (already in memory)`;
        
        const framesCopy: MemoryFrame[] = memory.map((p, idx) => ({
          frameNumber: idx,
          pageNumber: p,
          isNew: false,
          isReplacing: false,
        }));
        
        steps.push({
          stepNumber: time + 1,
          pageRequest: page,
          frames: framesCopy,
          isFault: false,
          replacedPage: null,
          replacedFrame: null,
          message,
        });
      } else {
        // Page Fault
        pageFaults++;
        
        if (memory.includes(null)) {
          // Empty frame available
          const emptyIndex = memory.indexOf(null);
          memory[emptyIndex] = page;
          
          if (algo === "FIFO") {
            fifoQueue.push(page);
          }
          if (algo === "LRU") {
            lastUsed.set(page, time);
          }
          
          message = `Page ${page} loaded into Frame ${emptyIndex}`;
        } else {
          // Need to replace
          let replaceIndex = 0;
          
          switch (algo) {
            case "FIFO":
              const pageToReplace = fifoQueue.shift()!;
              replaceIndex = memory.indexOf(pageToReplace);
              replacedPage = pageToReplace;
              replacedFrame = replaceIndex;
              fifoQueue.push(page);
              break;
              
            case "LRU":
              let lruPage = memory[0]!;
              let lruTime = lastUsed.get(lruPage) ?? -1;
              
              memory.forEach((p) => {
                if (p !== null) {
                  const pTime = lastUsed.get(p) ?? -1;
                  if (pTime < lruTime) {
                    lruTime = pTime;
                    lruPage = p;
                  }
                }
              });
              
              replaceIndex = memory.indexOf(lruPage);
              replacedPage = lruPage;
              replacedFrame = replaceIndex;
              lastUsed.set(page, time);
              break;
          }
          
          memory[replaceIndex] = page;
          message = `Page ${page} replaced Page ${replacedPage} in Frame ${replacedFrame}`;
        }
        
        const framesCopy: MemoryFrame[] = memory.map((p, idx) => ({
          frameNumber: idx,
          pageNumber: p,
          isNew: p === page,
          isReplacing: idx === replacedFrame,
        }));
        
        steps.push({
          stepNumber: time + 1,
          pageRequest: page,
          frames: framesCopy,
          isFault: true,
          replacedPage,
          replacedFrame,
          message,
        });
      }
    });

    return { steps, totalFaults: pageFaults };
  };

  const handleSimulation = () => {
    if (!uploadedFile || pageSequence.length === 0) {
      return;
    }

    setIsSimulating(true);
    setSimulationComplete(false);
    setCurrentStep(-1);

    const frames = parseInt(numFrames);
    const result = runPageReplacement(frames, pageSequence, algorithm);

    setSimulationSteps(result.steps);
    setTotalFaults(result.totalFaults);
    
    // Animate through steps
    let step = 0;
    const interval = setInterval(() => {
      if (step < result.steps.length) {
        setCurrentStep(step);
        step++;
      } else {
        clearInterval(interval);
        setSimulationComplete(true);
        setIsSimulating(false);
      }
    }, 1500);
  };

  const handleReset = () => {
    setUploadedFile(null);
    setPageSequence([]);
    setSimulationSteps([]);
    setCurrentStep(-1);
    setSimulationComplete(false);
    setTotalFaults(0);
    setIsSimulating(false);
  };

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-primary">
            Virtual Memory and Paging Simulator
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload a text file with page reference numbers and watch the FIFO algorithm in action
          </p>
        </div>

        {/* File Upload */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Upload className="h-5 w-5" />
              Upload Page Reference File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  className="flex-1"
                  accept=".txt,text/plain"
                />
                {uploadedFile && (
                  <Badge variant="secondary" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {uploadedFile.name}
                  </Badge>
                )}
              </div>
              
              {pageSequence.length > 0 && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium mb-2">Page Sequence:</p>
                  <div className="flex flex-wrap gap-2">
                    {pageSequence.map((page, idx) => (
                      <Badge key={idx} variant="outline" className="text-base px-3 py-1">
                        {page}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="frames">Number of Frames</Label>
                <Input
                  id="frames"
                  type="number"
                  min="1"
                  max="10"
                  value={numFrames}
                  onChange={(e) => setNumFrames(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="algorithm">Algorithm</Label>
                <Select value={algorithm} onValueChange={(value) => setAlgorithm(value as Algorithm)}>
                  <SelectTrigger id="algorithm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIFO">FIFO</SelectItem>
                    <SelectItem value="LRU">LRU</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSimulation}
                disabled={!uploadedFile || pageSequence.length === 0 || isSimulating}
                className="bg-primary hover:bg-primary/90"
                size="lg"
              >
                <Play className="mr-2 h-5 w-5" />
                Start Simulation
              </Button>
              <Button onClick={handleReset} variant="outline" size="lg">
                <RotateCcw className="mr-2 h-5 w-5" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Simulation Display */}
        {currentStep >= 0 && simulationSteps[currentStep] && (
          <Card className="mb-6 shadow-xl border-2 border-primary/40">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Step {simulationSteps[currentStep].stepNumber} of {simulationSteps.length}</p>
                  <p className="text-2xl font-bold mt-1">
                    Accessing Page: <span className="text-primary">{simulationSteps[currentStep].pageRequest}</span>
                  </p>
                </div>
                <Badge 
                  variant={simulationSteps[currentStep].isFault ? "destructive" : "default"}
                  className="text-sm px-4 py-2"
                >
                  {simulationSteps[currentStep].isFault ? "PAGE FAULT" : "PAGE HIT"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Memory Frames */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Memory Frames</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {simulationSteps[currentStep].frames.map((frame) => (
                    <div
                      key={frame.frameNumber}
                      className={`
                        relative rounded-lg p-6 text-center border-4 transition-all duration-700
                        ${frame.isNew ? "bg-green-100 border-green-500 shadow-lg animate-in fade-in zoom-in" : ""}
                        ${frame.isReplacing && !frame.isNew ? "bg-red-100 border-red-500 animate-out fade-out" : ""}
                        ${!frame.isNew && !frame.isReplacing && frame.pageNumber !== null ? "bg-blue-50 border-blue-400" : ""}
                        ${frame.pageNumber === null ? "bg-gray-100 border-gray-300" : ""}
                      `}
                    >
                      <div className="text-xs text-muted-foreground mb-2 font-medium">
                        Frame {frame.frameNumber}
                      </div>
                      <div className="text-3xl font-bold text-primary">
                        {frame.pageNumber !== null ? frame.pageNumber : "—"}
                      </div>
                      {frame.isNew && (
                        <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          NEW
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div className={`
                p-4 rounded-lg text-center font-medium text-lg
                ${simulationSteps[currentStep].isFault ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}
              `}>
                {simulationSteps[currentStep].message}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {simulationComplete && (
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Simulation Complete!</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="inline-block p-6 bg-background rounded-xl shadow-md">
                  <p className="text-sm text-muted-foreground mb-2">Total Page Faults</p>
                  <p className="text-6xl font-bold text-primary">{totalFaults}</p>
                </div>
                <p className="text-lg text-muted-foreground">
                  Algorithm: <span className="font-semibold text-foreground">{algorithm}</span>
                  {" • "}
                  Total References: <span className="font-semibold text-foreground">{pageSequence.length}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}