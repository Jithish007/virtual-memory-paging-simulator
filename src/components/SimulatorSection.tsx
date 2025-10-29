"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, RotateCcw, Upload, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Algorithm = "FIFO" | "LRU" | "OPT";

interface PageState {
  pageNumber: number;
  status: "loaded" | "replaced" | "idle";
  inMemory: boolean;
}

interface MemoryFrame {
  frameNumber: number;
  pageNumber: number | null;
  justLoaded: boolean;
}

interface SimulationStep {
  pageRequest: number;
  frames: MemoryFrame[];
  isFault: boolean;
  replacedPage: number | null;
}

export default function SimulatorSection() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [pageSize, setPageSize] = useState<string>("4096"); // Default 4KB
  const [numFrames, setNumFrames] = useState<string>("3");
  const [algorithm, setAlgorithm] = useState<Algorithm>("FIFO");
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageStates, setPageStates] = useState<PageState[]>([]);
  const [simulationSteps, setSimulationSteps] = useState<SimulationStep[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [stats, setStats] = useState({
    totalPages: 0,
    framesUsed: 0,
    pageFaults: 0,
    pageHits: 0,
    hitRatio: 0,
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setFileSize(file.size);
      setSimulationComplete(false);
      setSimulationSteps([]);
      setCurrentStep(0);
      
      // Calculate number of pages
      const pageSizeBytes = parseInt(pageSize);
      const pages = Math.ceil(file.size / pageSizeBytes);
      setTotalPages(pages);
      
      // Initialize page states
      const initialPageStates: PageState[] = Array.from({ length: pages }, (_, i) => ({
        pageNumber: i,
        status: "idle",
        inMemory: false,
      }));
      setPageStates(initialPageStates);
    }
  };

  const generatePageAccessSequence = (totalPages: number): number[] => {
    // Simulate realistic page access pattern: sequential with some locality
    const sequence: number[] = [];
    const accessCount = Math.min(totalPages * 2, 50); // Limit to 50 accesses for visualization
    
    // Start with sequential access
    for (let i = 0; i < Math.min(totalPages, 10); i++) {
      sequence.push(i);
    }
    
    // Add some random accesses with locality
    for (let i = sequence.length; i < accessCount; i++) {
      if (Math.random() < 0.7 && sequence.length > 0) {
        // 70% chance to access nearby page (locality)
        const lastPage = sequence[sequence.length - 1];
        const offset = Math.floor(Math.random() * 5) - 2;
        const nextPage = Math.max(0, Math.min(totalPages - 1, lastPage + offset));
        sequence.push(nextPage);
      } else {
        // 30% chance to access random page
        sequence.push(Math.floor(Math.random() * totalPages));
      }
    }
    
    return sequence;
  };

  const runPageReplacement = (frames: number, pageSequence: number[], algo: Algorithm) => {
    const memory: (number | null)[] = Array(frames).fill(null);
    const steps: SimulationStep[] = [];
    let pageFaults = 0;
    let pageHits = 0;
    let fifoQueue: number[] = [];
    const lastUsed: Map<number, number> = new Map();

    pageSequence.forEach((page, time) => {
      const isInMemory = memory.includes(page);
      let replacedPage: number | null = null;

      if (isInMemory) {
        pageHits++;
        if (algo === "LRU") {
          lastUsed.set(page, time);
        }
        
        const frames: MemoryFrame[] = memory.map((p, idx) => ({
          frameNumber: idx,
          pageNumber: p,
          justLoaded: false,
        }));
        
        steps.push({
          pageRequest: page,
          frames,
          isFault: false,
          replacedPage: null,
        });
      } else {
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
        } else {
          // Need to replace
          let replaceIndex = 0;
          
          switch (algo) {
            case "FIFO":
              const pageToReplace = fifoQueue.shift()!;
              replaceIndex = memory.indexOf(pageToReplace);
              replacedPage = pageToReplace;
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
              lastUsed.set(page, time);
              break;
              
            case "OPT":
              let farthestIndex = -1;
              let pageToReplaceOpt = memory[0]!;
              
              memory.forEach((p) => {
                if (p !== null) {
                  const nextUse = pageSequence.slice(time + 1).indexOf(p);
                  const futureIndex = nextUse === -1 ? Infinity : time + 1 + nextUse;
                  
                  if (futureIndex > farthestIndex) {
                    farthestIndex = futureIndex;
                    pageToReplaceOpt = p;
                  }
                }
              });
              
              replaceIndex = memory.indexOf(pageToReplaceOpt);
              replacedPage = pageToReplaceOpt;
              break;
          }
          
          memory[replaceIndex] = page;
        }
        
        const frames: MemoryFrame[] = memory.map((p, idx) => ({
          frameNumber: idx,
          pageNumber: p,
          justLoaded: p === page,
        }));
        
        steps.push({
          pageRequest: page,
          frames,
          isFault: true,
          replacedPage,
        });
      }
    });

    const framesUsed = memory.filter((f) => f !== null).length;
    const hitRatio = ((pageHits / pageSequence.length) * 100).toFixed(2);

    return {
      steps,
      stats: {
        totalPages: Math.max(...pageSequence) + 1,
        framesUsed,
        pageFaults,
        pageHits,
        hitRatio: parseFloat(hitRatio),
      },
    };
  };

  const handleSimulation = () => {
    if (!uploadedFile) {
      alert("Please upload a file first!");
      return;
    }

    setIsSimulating(true);
    setSimulationComplete(false);
    setCurrentStep(0);

    setTimeout(() => {
      const frames = parseInt(numFrames);
      const pageSequence = generatePageAccessSequence(totalPages);
      const result = runPageReplacement(frames, pageSequence, algorithm);

      setSimulationSteps(result.steps);
      setStats(result.stats);
      
      // Animate through steps
      let step = 0;
      const interval = setInterval(() => {
        if (step < result.steps.length) {
          setCurrentStep(step);
          
          // Update page states
          const currentStepData = result.steps[step];
          setPageStates((prev) =>
            prev.map((ps) => {
              const inMemory = currentStepData.frames.some((f) => f.pageNumber === ps.pageNumber);
              let status: "loaded" | "replaced" | "idle" = "idle";
              
              if (currentStepData.pageRequest === ps.pageNumber && currentStepData.isFault) {
                status = "loaded";
              } else if (currentStepData.replacedPage === ps.pageNumber) {
                status = "replaced";
              } else if (inMemory) {
                status = "loaded";
              }
              
              return { ...ps, status, inMemory };
            })
          );
          
          step++;
        } else {
          clearInterval(interval);
          setSimulationComplete(true);
          setIsSimulating(false);
        }
      }, 400);
    }, 500);
  };

  const handleReset = () => {
    setUploadedFile(null);
    setFileSize(0);
    setTotalPages(0);
    setPageStates([]);
    setSimulationSteps([]);
    setCurrentStep(0);
    setSimulationComplete(false);
    setStats({
      totalPages: 0,
      framesUsed: 0,
      pageFaults: 0,
      pageHits: 0,
      hitRatio: 0,
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <section id="simulator" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-secondary/30 to-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            File-Based Paging Simulator
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload a file and visualize how virtual memory paging works with real file data
          </p>
        </div>

        {/* File Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  className="flex-1"
                  accept="*/*"
                />
                {uploadedFile && (
                  <Badge variant="secondary" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {uploadedFile.name}
                  </Badge>
                )}
              </div>
              
              {uploadedFile && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-primary/5 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">File Size</p>
                    <p className="text-lg font-semibold">{formatFileSize(fileSize)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pages</p>
                    <p className="text-lg font-semibold">{totalPages}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Page Size</p>
                    <p className="text-lg font-semibold">{formatFileSize(parseInt(pageSize))}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Simulation Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="pageSize">Page Size</Label>
                <Select
                  value={pageSize}
                  onValueChange={(value) => {
                    setPageSize(value);
                    if (uploadedFile) {
                      const pages = Math.ceil(fileSize / parseInt(value));
                      setTotalPages(pages);
                      const initialPageStates: PageState[] = Array.from({ length: pages }, (_, i) => ({
                        pageNumber: i,
                        status: "idle",
                        inMemory: false,
                      }));
                      setPageStates(initialPageStates);
                    }
                  }}
                >
                  <SelectTrigger id="pageSize">
                    <SelectValue placeholder="Select page size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1024">1 KB</SelectItem>
                    <SelectItem value="2048">2 KB</SelectItem>
                    <SelectItem value="4096">4 KB</SelectItem>
                    <SelectItem value="8192">8 KB</SelectItem>
                    <SelectItem value="16384">16 KB</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                    <SelectItem value="OPT">Optimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button
                onClick={handleSimulation}
                disabled={!uploadedFile || isSimulating}
                className="bg-primary hover:bg-primary/90"
              >
                <Play className="mr-2 h-4 w-4" />
                {isSimulating ? "Simulating..." : "Run Simulation"}
              </Button>
              <Button onClick={handleReset} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Page Visualization */}
        {pageStates.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Page Visualization</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Green = Loaded in Memory | Red = Replaced | Gray = Not in Memory
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {pageStates.slice(0, 50).map((page) => (
                  <div
                    key={page.pageNumber}
                    className={`
                      relative rounded-lg p-3 text-center font-semibold text-sm transition-all duration-500 transform
                      ${page.status === "loaded" ? "bg-green-500 text-white scale-110 shadow-lg" : ""}
                      ${page.status === "replaced" ? "bg-red-500 text-white scale-90" : ""}
                      ${page.status === "idle" && page.inMemory ? "bg-blue-500/20 border-2 border-blue-500" : ""}
                      ${page.status === "idle" && !page.inMemory ? "bg-muted text-muted-foreground" : ""}
                    `}
                  >
                    <div className="text-xs opacity-70">Page</div>
                    <div className="text-lg font-bold">{page.pageNumber}</div>
                  </div>
                ))}
              </div>
              {pageStates.length > 50 && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Showing first 50 pages of {pageStates.length} total pages
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Memory Frames Visualization */}
        {simulationSteps.length > 0 && currentStep < simulationSteps.length && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Memory Frames (Step {currentStep + 1} of {simulationSteps.length})</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Current Page Request: <span className="font-bold text-primary">Page {simulationSteps[currentStep].pageRequest}</span>
                {" - "}
                <Badge variant={simulationSteps[currentStep].isFault ? "destructive" : "default"}>
                  {simulationSteps[currentStep].isFault ? "PAGE FAULT" : "PAGE HIT"}
                </Badge>
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {simulationSteps[currentStep].frames.map((frame) => (
                  <div
                    key={frame.frameNumber}
                    className={`
                      relative rounded-lg p-6 text-center border-4 transition-all duration-500 transform
                      ${frame.justLoaded ? "bg-green-500/20 border-green-500 scale-110 shadow-xl" : "bg-primary/10 border-primary/30"}
                    `}
                  >
                    <div className="text-xs text-muted-foreground mb-2">Frame {frame.frameNumber}</div>
                    <div className="text-3xl font-bold">
                      {frame.pageNumber !== null ? frame.pageNumber : "-"}
                    </div>
                    {frame.justLoaded && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        NEW
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {simulationSteps[currentStep].replacedPage !== null && (
                <div className="mt-4 p-3 bg-red-500/10 border-2 border-red-500/30 rounded-lg text-center">
                  <span className="text-sm font-semibold text-red-600">
                    Replaced Page: {simulationSteps[currentStep].replacedPage}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Final Statistics */}
        {simulationComplete && (
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/30">
            <CardHeader>
              <CardTitle className="text-2xl">Simulation Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Total Pages</p>
                  <p className="text-3xl font-bold text-primary">{stats.totalPages}</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Frames Used</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.framesUsed}</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Page Faults</p>
                  <p className="text-3xl font-bold text-red-600">{stats.pageFaults}</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Page Hits</p>
                  <p className="text-3xl font-bold text-green-600">{stats.pageHits}</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Hit Ratio</p>
                  <p className="text-3xl font-bold text-accent">{stats.hitRatio}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}