"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Brain, Calendar, MapPin, DollarSign, ExternalLink, Trash2, Star } from "lucide-react"
import Link from "next/link"
import { tracker, TrackedJob } from "@/lib/tracker"

export default function JobTracker() {
  const [activeTab, setActiveTab] = useState("saved")
  const [jobs, setJobs] = useState<TrackedJob[]>([])

  useEffect(() => {
    setJobs(tracker.getAll())
  }, [])

  const savedJobs = jobs.filter(j => j.status === 'saved')
  const appliedJobs = jobs.filter(j => j.status === 'applied')

  const handleRemove = (id: number) => {
    tracker.remove(id)
    setJobs(tracker.getAll())
  }

  const getMatchColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-blue-500"
    if (score >= 40) return "bg-yellow-500"
    return "bg-red-500"
  }

  const JobCard = ({ job }: { job: TrackedJob }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-card-foreground mb-1">{job.title}</CardTitle>
            <p className="text-muted-foreground font-medium">{job.company}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getMatchColor(job.matchScore)} text-white text-xs px-2 py-1`}>
              {job.matchScore}% match
            </Badge>
            <Badge
              className={`text-white text-xs px-2 py-1 ${job.status === 'applied' ? 'bg-blue-500' : 'bg-slate-500'}`}
            >
              {job.status === 'applied' ? 'Applied' : 'Saved'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.location}
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              {job.salary}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {job.status === 'applied' ? 'Applied' : 'Saved'} {new Date(job.trackedAt).toLocaleDateString()}
            </div>
          </div>

          {job.notes && <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{job.notes}</p>}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-transparent"
              onClick={() => window.open(job.applyUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              {job.status === 'applied' ? 'View Posting' : 'Apply Now'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 bg-transparent"
              onClick={() => handleRemove(job.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/workspace">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              <h1 className="text-lg md:text-2xl font-bold text-card-foreground font-sans">Job Tracker</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="saved">
                Saved Jobs ({savedJobs.length})
              </TabsTrigger>
              <TabsTrigger value="applied">
                Applied ({appliedJobs.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="saved" className="mt-0">
            {savedJobs.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {savedJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground text-lg font-medium">No saved jobs yet</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Hit "Save for Later" on any job to track it here
                </p>
                <Link href="/workspace">
                  <Button className="mt-4">Browse Jobs</Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="applied" className="mt-0">
            {appliedJobs.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {appliedJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground text-lg font-medium">No applications yet</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Click "Apply for this Job" on any matched job to track it here
                </p>
                <Link href="/workspace">
                  <Button className="mt-4">Find Jobs</Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
