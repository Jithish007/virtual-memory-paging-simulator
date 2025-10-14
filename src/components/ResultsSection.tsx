"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { TrendingDown, Clock, Layers } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ResultsSection() {
  const chartData = {
    labels: ["FIFO", "LRU", "OPT"],
    datasets: [
      {
        label: "Page Faults",
        data: [9, 7, 6],
        backgroundColor: "rgba(79, 70, 229, 0.7)",
        borderColor: "rgba(79, 70, 229, 1)",
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Algorithm Performance Comparison",
        font: {
          size: 16,
          weight: "bold" as const,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Number of Page Faults",
        },
      },
    },
  };

  return (
    <section id="results" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-secondary/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Results & Performance Analysis
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Understanding algorithm efficiency, latency, and scalability
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Algorithm Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-lg">
                <div className="flex items-center mb-2">
                  <TrendingDown className="h-5 w-5 text-primary mr-2" />
                  <h4 className="font-semibold">FIFO Algorithm</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Simple implementation but may suffer from Belady's anomaly. Average performance in most scenarios.
                </p>
              </div>

              <div className="p-4 bg-accent/5 rounded-lg">
                <div className="flex items-center mb-2">
                  <TrendingDown className="h-5 w-5 text-accent mr-2" />
                  <h4 className="font-semibold">LRU Algorithm</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Better performance by considering temporal locality. Requires tracking page usage history.
                </p>
              </div>

              <div className="p-4 bg-green-500/5 rounded-lg">
                <div className="flex items-center mb-2">
                  <TrendingDown className="h-5 w-5 text-green-600 mr-2" />
                  <h4 className="font-semibold">Optimal Algorithm</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Theoretical best performance. Requires future knowledge, not practical but useful for comparison.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-2 hover:border-primary/50 transition-all">
            <CardHeader>
              <div className="flex items-center">
                <Clock className="h-6 w-6 text-primary mr-3" />
                <CardTitle>Latency Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                <strong>Latency</strong> refers to the delay in accessing memory. In virtual memory systems:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span><strong>Page Hit:</strong> ~10-100 nanoseconds (direct RAM access)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span><strong>Page Fault:</strong> ~1-10 milliseconds (disk I/O required)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Minimizing page faults is crucial for reducing average memory access time</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Better algorithms (like LRU) reduce latency by improving hit rates</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all">
            <CardHeader>
              <div className="flex items-center">
                <Layers className="h-6 w-6 text-accent mr-3" />
                <CardTitle>Scalability</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                <strong>Scalability</strong> measures how well the system handles increasing workloads:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-accent mr-2">•</span>
                  <span><strong>Frame Allocation:</strong> More frames typically reduce page faults</span>
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">•</span>
                  <span><strong>Working Set:</strong> Pages actively used by a process must fit in memory</span>
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">•</span>
                  <span>Virtual memory enables running programs larger than physical RAM</span>
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">•</span>
                  <span>Efficient paging allows multiple large processes to coexist in limited memory</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}