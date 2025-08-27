"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Zap } from "lucide-react"

interface Job {
  id: number
  title: string
  company: string
  location: string
  description: string
  salary: string
  posted: string
  matchScore: number
  requirements: string[]
  benefits: string[]
}

interface ResumeTabProps {
  resumeUploaded: boolean
  selectedJob: Job
  onResumeUpload: () => void
}

export function ResumeTab({ resumeUploaded, selectedJob, onResumeUpload }: ResumeTabProps) {
  const handleFitResumeToJob = () => {
    console.log("[v0] Fitting resume to job:", selectedJob.title)
    // This would trigger AI-powered resume optimization
    alert(`Optimizing your resume for ${selectedJob.title} at ${selectedJob.company}...`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-sans">
          <FileText className="h-5 w-5" />
          Resume
        </CardTitle>
      </CardHeader>
      <CardContent>
        {resumeUploaded ? (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">John Doe</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Senior Software Engineer with 8+ years of experience in full-stack development, specializing in React,
                Node.js, and cloud technologies.
              </p>

              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm">Experience</h4>
                  <p className="text-sm text-muted-foreground">
                    • Senior Software Engineer at TechCorp (2020-Present)
                    <br />• Full Stack Developer at StartupXYZ (2018-2020)
                    <br />• Junior Developer at WebSolutions (2016-2018)
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-sm">Skills</h4>
                  <p className="text-sm text-muted-foreground">
                    React, Node.js, TypeScript, Python, AWS, Docker, Kubernetes
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-transparent">
                View Full Resume
              </Button>
              <Button
                onClick={handleFitResumeToJob}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Zap className="mr-2 h-4 w-4" />
                Fit Resume to Job
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Upload your resume to view it here</p>
            <Button onClick={onResumeUpload} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Upload Resume
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
