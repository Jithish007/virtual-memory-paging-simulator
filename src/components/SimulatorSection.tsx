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
        
        message = `Page ${page} is already in memory - Page Hit!`;
        
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
          
          message = `Page ${page} loaded into Frame ${emptyIndex} - Page Fault`;
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
          message = `Page ${page} replaced Page ${replacedPage} in Frame ${replacedFrame} - Page Fault`;
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
      alert("Please upload a valid file with page reference numbers!");
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
    }, 1500); // 1.5 seconds per step
  };

  const handleReset = () => {
    setUploadedFile(null);
    setPageSequence([]);
    setSimulationSteps([]);
    setCurrentStep(-1);
    setSimulationComplete(false);
    setTotalFaults(0);
  };

  return (
    <section id="simulator" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-secondary/30 to-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Virtual Memory and Paging Simulator
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload a text file with page reference numbers and watch the paging process step by step
          </p>
        </div>

        {/* File Upload Section */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
              
              <p className="text-sm text-muted-foreground">
                Upload a text file containing page reference numbers (e.g., "3 4 2 3 1 4 3" or "7,0,1,2,0,3,0,4")
              </p>
              
              {pageSequence.length > 0 && (
                <div className="p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
                  <p className="text-sm text-muted-foreground mb-2">Page Reference Sequence:</p>
                  <div className="flex flex-wrap gap-2">
                    {pageSequence.map((page, idx) => (
                      <Badge key={idx} variant="outline" className="text-base px-3 py-1">
                        {page}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    Total References: <span className="font-semibold">{pageSequence.length}</span>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle>Simulation Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="frames">Number of Memory Frames</Label>
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
                <Label htmlFor="algorithm">Page Replacement Algorithm</Label>
                <Select value={algorithm} onValueChange={(value) => setAlgorithm(value as Algorithm)}>
                  <SelectTrigger id="algorithm">
                    <SelectValue placeholder="Select algorithm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIFO">FIFO (First-In-First-Out)</SelectItem>
                    <SelectItem value="LRU">LRU (Least Recently Used)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button
                onClick={handleSimulation}
                disabled={!uploadedFile || pageSequence.length === 0 || isSimulating}
                className="bg-primary hover:bg-primary/90"
                size="lg"
              >
                <Play className="mr-2 h-4 w-4" />
                {isSimulating ? "Running Simulation..." : "Start Simulation"}
              </Button>
              <Button onClick={handleReset} variant="outline" size="lg">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Simulation Visualization */}
        {currentStep >= 0 && simulationSteps[currentStep] && (
          <Card className="mb-8 shadow-xl border-2 border-primary/30">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle className="text-2xl">
                  Step {simulationSteps[currentStep].stepNumber} of {simulationSteps.length}
                </CardTitle>
                <Badge 
                  variant={simulationSteps[currentStep].isFault ? "destructive" : "default"}
                  className="text-base px-4 py-2"
                >
                  {simulationSteps[currentStep].isFault ? "PAGE FAULT" : "PAGE HIT"}
                </Badge>
              </div>
              <p className="text-lg mt-3">
                Requesting Page: <span className="font-bold text-primary text-2xl">{simulationSteps[currentStep].pageRequest}</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Memory Frames */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Memory Frames:</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {simulationSteps[currentStep].frames.map((frame) => (
                    <div
                      key={frame.frameNumber}
                      className={`
                        relative rounded-xl p-6 text-center border-4 transition-all duration-700 transform
                        ${frame.isNew ? "bg-green-500/20 border-green-500 scale-110 shadow-2xl animate-in fade-in zoom-in" : ""}
                        ${frame.isReplacing && !frame.isNew ? "bg-red-500/20 border-red-500 animate-out fade-out zoom-out" : ""}
                        ${!frame.isNew && !frame.isReplacing && frame.pageNumber !== null ? "bg-blue-500/10 border-blue-500/50" : ""}
                        ${frame.pageNumber === null ? "bg-muted border-muted-foreground/20" : ""}
                      `}
                    >
                      <div className="text-xs text-muted-foreground mb-2 font-medium">
                        Frame {frame.frameNumber}
                      </div>
                      <div className="text-4xl font-bold">
                        {frame.pageNumber !== null ? frame.pageNumber : "—"}
                      </div>
                      {frame.isNew && (
                        <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg animate-bounce">
                          NEW
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Message */}
              <div className={`
                p-4 rounded-lg border-2 text-center font-medium text-lg
                ${simulationSteps[currentStep].isFault ? "bg-red-500/10 border-red-500/50 text-red-700" : "bg-green-500/10 border-green-500/50 text-green-700"}
              `}>
                {simulationSteps[currentStep].message}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Final Results */}
        {simulationComplete && (
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/50 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-3xl text-center">Simulation Complete! 🎉</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-background rounded-xl shadow-md">
                  <p className="text-sm text-muted-foreground mb-2">Total Page References</p>
                  <p className="text-5xl font-bold text-primary">{pageSequence.length}</p>
                </div>
                <div className="text-center p-6 bg-background rounded-xl shadow-md">
                  <p className="text-sm text-muted-foreground mb-2">Total Page Faults</p>
                  <p className="text-5xl font-bold text-red-600">{totalFaults}</p>
                </div>
                <div className="text-center p-6 bg-background rounded-xl shadow-md">
                  <p className="text-sm text-muted-foreground mb-2">Page Hits</p>
                  <p className="text-5xl font-bold text-green-600">{pageSequence.length - totalFaults}</p>
                </div>
              </div>
              
              <div className="mt-6 text-center p-4 bg-background/50 rounded-lg">
                <p className="text-lg">
                  Algorithm Used: <span className="font-bold text-primary">{algorithm}</span>
                  {" | "}
                  Hit Ratio: <span className="font-bold text-accent">{((pageSequence.length - totalFaults) / pageSequence.length * 100).toFixed(2)}%</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}