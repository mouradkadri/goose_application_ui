"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Brain, Calendar, MapPin, DollarSign, ExternalLink, Trash2, Eye } from "lucide-react"
import Link from "next/link"

const appliedJobs = [
  {
    id: 1,
    title: "Senior Software Engineer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    salary: "$120k - $160k",
    appliedDate: "2024-01-15",
    status: "Interview Scheduled",
    statusColor: "bg-blue-500",
    matchScore: 92,
    notes: "Technical interview scheduled for next week",
  },
  {
    id: 2,
    title: "Product Manager",
    company: "Innovation Labs",
    location: "New York, NY",
    salary: "$110k - $140k",
    appliedDate: "2024-01-12",
    status: "Under Review",
    statusColor: "bg-yellow-500",
    matchScore: 88,
    notes: "Waiting for HR response",
  },
  {
    id: 3,
    title: "UX Designer",
    company: "Creative Agency",
    location: "Remote",
    salary: "$90k - $120k",
    appliedDate: "2024-01-10",
    status: "Rejected",
    statusColor: "bg-red-500",
    matchScore: 75,
    notes: "Position filled internally",
  },
]

const savedJobs = [
  {
    id: 4,
    title: "Full Stack Developer",
    company: "StartupXYZ",
    location: "Austin, TX",
    salary: "$95k - $125k",
    savedDate: "2024-01-16",
    matchScore: 90,
    notes: "Great company culture, planning to apply",
  },
  {
    id: 5,
    title: "Data Scientist",
    company: "Data Dynamics",
    location: "Seattle, WA",
    salary: "$130k - $170k",
    savedDate: "2024-01-14",
    matchScore: 85,
    notes: "Requires Python expertise",
  },
  {
    id: 6,
    title: "DevOps Engineer",
    company: "Cloud Systems",
    location: "Boston, MA",
    salary: "$115k - $145k",
    savedDate: "2024-01-13",
    matchScore: 82,
    notes: "AWS certification preferred",
  },
]

export default function JobTracker() {
  const [activeTab, setActiveTab] = useState("applied")

  const getMatchColor = (score: number) => {
    if (score >= 90) return "bg-green-500"
    if (score >= 75) return "bg-blue-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  const JobCard = ({ job, type }: { job: any; type: "applied" | "saved" }) => (
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
            {type === "applied" && (
              <Badge className={`${job.statusColor} text-white text-xs px-2 py-1`}>{job.status}</Badge>
            )}
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
              {type === "applied" ? `Applied ${job.appliedDate}` : `Saved ${job.savedDate}`}
            </div>
          </div>

          {job.notes && <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{job.notes}</p>}

          <div className="flex gap-2 pt-2">
            <Link href={`/job-tracker/${job.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full bg-transparent">
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Button>
            </Link>
            {type === "saved" && (
              <Button size="sm" className="flex-1">
                <ExternalLink className="h-4 w-4 mr-1" />
                Apply Now
              </Button>
            )}
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/">
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
              <TabsTrigger value="applied" className="flex items-center gap-2">
                Applied Jobs ({appliedJobs.length})
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center gap-2">
                Saved Jobs ({savedJobs.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="applied" className="mt-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {appliedJobs.map((job) => (
                <JobCard key={job.id} job={job} type="applied" />
              ))}
            </div>
            {appliedJobs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No applied jobs yet</p>
                <Link href="/">
                  <Button className="mt-4">Start Applying</Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedJobs.map((job) => (
                <JobCard key={job.id} job={job} type="saved" />
              ))}
            </div>
            {savedJobs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No saved jobs yet</p>
                <Link href="/">
                  <Button className="mt-4">Browse Jobs</Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
