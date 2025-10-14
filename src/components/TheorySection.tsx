"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, FileText, RefreshCw, Layers, Zap, BarChart3 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const theoryCards = [
  {
    icon: Database,
    title: "Virtual Memory",
    description:
      "Virtual memory is a memory management technique that creates an illusion of a large, contiguous memory space by using disk storage as an extension of RAM. It allows programs to use more memory than physically available.",
  },
  {
    icon: Layers,
    title: "Paging",
    description:
      "Paging divides the virtual memory into fixed-size blocks called pages and physical memory into frames of the same size. This eliminates external fragmentation and simplifies memory allocation.",
  },
  {
    icon: FileText,
    title: "Page Table",
    description:
      "The page table is a data structure that maps virtual page numbers to physical frame numbers. It's maintained by the operating system and used by the Memory Management Unit (MMU) for address translation.",
  },
  {
    icon: Zap,
    title: "Page Fault",
    description:
      "A page fault occurs when a program tries to access a page that is not currently in physical memory. The OS must then load the required page from disk into a frame, which may require replacing an existing page.",
  },
  {
    icon: RefreshCw,
    title: "FIFO Algorithm",
    description:
      "First-In-First-Out replaces the oldest page in memory. It's simple to implement using a queue but may not always make optimal decisions, potentially leading to Belady's anomaly.",
  },
  {
    icon: BarChart3,
    title: "LRU Algorithm",
    description:
      "Least Recently Used replaces the page that hasn't been used for the longest time. It performs better than FIFO in most cases by considering the temporal locality of page references.",
  },
];

export default function TheorySection() {
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            theoryCards.forEach((_, index) => {
              setTimeout(() => {
                setVisibleCards((prev) => [...new Set([...prev, index])]);
              }, index * 150);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="theory"
      ref={sectionRef}
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-secondary/30"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Theoretical Concepts
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Understanding the fundamentals of virtual memory and paging mechanisms
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {theoryCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card
                key={index}
                className={`hover:shadow-xl transition-all duration-500 hover:scale-105 border-2 hover:border-primary/50 ${
                  visibleCards.includes(index)
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
                style={{
                  transitionDelay: visibleCards.includes(index) ? "0ms" : `${index * 150}ms`,
                }}
              >
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-semibold">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{card.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Paging Diagram */}
        <div className="mt-16">
          <h3 className="text-3xl font-bold text-center mb-8">How Paging Works</h3>
          <Card className="max-w-4xl mx-auto p-8 bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="text-center">
                <div className="bg-primary/10 rounded-lg p-6 mb-4">
                  <Database className="h-12 w-12 text-primary mx-auto mb-2" />
                  <h4 className="font-semibold text-lg">Virtual Memory</h4>
                  <p className="text-sm text-muted-foreground mt-2">Logical Address Space</p>
                </div>
                <div className="space-y-2">
                  <div className="bg-primary/20 rounded p-2 text-sm">Page 0</div>
                  <div className="bg-primary/20 rounded p-2 text-sm">Page 1</div>
                  <div className="bg-primary/20 rounded p-2 text-sm">Page 2</div>
                  <div className="bg-primary/20 rounded p-2 text-sm">Page n...</div>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-accent/10 rounded-lg p-6 mb-4">
                  <FileText className="h-12 w-12 text-accent mx-auto mb-2" />
                  <h4 className="font-semibold text-lg">Page Table</h4>
                  <p className="text-sm text-muted-foreground mt-2">Address Translation</p>
                </div>
                <div className="flex justify-center">
                  <div className="text-4xl text-accent">→</div>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-secondary rounded-lg p-6 mb-4">
                  <Layers className="h-12 w-12 text-primary mx-auto mb-2" />
                  <h4 className="font-semibold text-lg">Physical Memory</h4>
                  <p className="text-sm text-muted-foreground mt-2">RAM Frames</p>
                </div>
                <div className="space-y-2">
                  <div className="bg-secondary rounded p-2 text-sm border-2 border-primary">Frame 0</div>
                  <div className="bg-secondary rounded p-2 text-sm border-2 border-primary">Frame 1</div>
                  <div className="bg-secondary rounded p-2 text-sm border-2 border-primary">Frame 2</div>
                  <div className="bg-secondary rounded p-2 text-sm border-2 border-primary">Frame m...</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}