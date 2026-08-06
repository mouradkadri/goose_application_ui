"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Building2, MapPin, Calendar, Inbox } from "lucide-react"
import { Job } from "@/types/job"
import { JobFilters, FilterState } from "./job-filters"

interface JobListProps {
  jobs: Job[]
  selectedJob: Job
  onJobSelect: (job: Job) => void
  resumeUploaded: boolean
  filters: FilterState
  setFilters: (filters: FilterState) => void
  totalJobs: number
}

export function JobList({ 
  jobs, 
  selectedJob, 
  onJobSelect, 
  resumeUploaded,
  filters,
  setFilters,
  totalJobs
}: JobListProps) {
  return (
    // FIX 1: h-full and overflow-hidden ensures this component fits exactly in the sidebar
    <div className="flex flex-col h-full overflow-hidden bg-sidebar border-r border-border">
      
      {/* Filters take their natural height (flex-none) */}
      <div className="flex-none">
        <JobFilters 
          filters={filters} 
          setFilters={setFilters} 
          totalJobs={totalJobs}
          shownJobs={jobs.length}
        />
      </div>

      {/* FIX 2: flex-1 takes remaining space, min-h-0 allows scrolling inside flex item */}
      <div className="flex-1 min-h-0"> 
        <ScrollArea className="h-full">
          <div className="p-2 space-y-2 pb-20"> {/* pb-20 adds buffer for bottom scrolling */}
            
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <Inbox className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">No matches found.</p>
              </div>
            ) : (
              jobs.map((job) => (
                <Card
                  key={job.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedJob?.id === job.id 
                      ? "border-primary bg-primary/5 shadow-sm" 
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => onJobSelect(job)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-card-foreground font-sans line-clamp-1 text-sm pr-2">
                        {job.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`ml-1 text-[10px] h-5 px-1.5 shrink-0 ${
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

                    <div className="space-y-1 text-xs text-muted-foreground">
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
                  </CardContent>
                </Card>
              ))
            )}
            
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}