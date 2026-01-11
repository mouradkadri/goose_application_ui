"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Building2, MapPin, Calendar } from "lucide-react"

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

interface JobListProps {
  jobs: Job[]
  selectedJob: Job
  onJobSelect: (job: Job) => void
  resumeUploaded: boolean
}

export function JobList({ jobs, selectedJob, onJobSelect, resumeUploaded }: JobListProps) {
  return (
    <div className="w-full h-full border-r border-border bg-sidebar">
      <div className="p-3 md:p-4 border-b border-sidebar-border">
        <h2 className="text-base md:text-lg font-semibold text-sidebar-foreground font-sans">Top Matches Found</h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          {resumeUploaded ? "Ranked by compatibility" : "Upload resume to see matches"}
        </p>
      </div>

      <ScrollArea className="h-[calc(100vh-145px)]">
        <div className="p-1 md:p-2">
          {jobs.map((job) => (
            <Card
              key={job.id}
              className={`mb-2 cursor-pointer transition-all hover:shadow-md ${
                selectedJob.id === job.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onClick={() => onJobSelect(job)}
            >
              <CardContent className="p-3 md:p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-card-foreground font-sans line-clamp-1 text-sm md:text-base pr-2">
                    {job.title}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`ml-1 text-xs shrink-0 ${
                      job.matchScore >= 90
                        ? "bg-green-50 text-green-700 border-green-200"
                        : job.matchScore >= 75
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : job.matchScore >= 60
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {job.matchScore}%
                  </Badge>
                </div>

                <div className="space-y-1 text-xs md:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3 shrink-0" />
                    <span className="line-clamp-1">{job.company}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="line-clamp-1">{job.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span>{job.posted}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{job.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
