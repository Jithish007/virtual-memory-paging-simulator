"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, Github } from "lucide-react";

export default function AboutSection() {
  return (
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-secondary/30 to-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            About This Project
          </h2>
          <p className="text-lg text-muted-foreground">
            An academic exploration of virtual memory management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center">
                <BookOpen className="h-6 w-6 text-primary mr-3" />
                <CardTitle>Course Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Course:</strong> Computer Organization and Architecture
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Project:</strong> Virtual Memory & Paging Simulator
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Semester:</strong> 3
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center">
                <GraduationCap className="h-6 w-6 text-accent mr-3" />
                <CardTitle>Institution</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-muted-foreground">
                <strong className="text-foreground">University:</strong> SRM RAMAPURAM
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">Department:</strong> CSE AIML
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-12">
          <CardHeader>
            <div className="flex items-center">
              <Users className="h-6 w-6 text-primary mr-3" />
              <CardTitle>Project Team</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-primary/5 rounded-lg text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl">
                  J
                </div>
                <h4 className="font-semibold">JITHISHWAR</h4>
                <p className="text-sm text-muted-foreground">Team Member</p>
              </div>

              <div className="p-4 bg-accent/5 rounded-lg text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl">
                  HN
                </div>
                <h4 className="font-semibold">HARIN NISANTH</h4>
                <p className="text-sm text-muted-foreground">Team Member</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-2">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Project Objectives</h3>
              <p className="text-muted-foreground mb-4 max-w-3xl mx-auto">
                This simulator demonstrates the fundamental concepts of virtual memory management and 
                page replacement algorithms. It provides an interactive learning tool for understanding 
                how operating systems efficiently manage memory resources and minimize page faults.
              </p>
              <div className="flex justify-center gap-4 mt-6">
                <a
                  href="#"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                >
                  <Github className="h-5 w-5" />
                  <span>View on GitHub</span>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}