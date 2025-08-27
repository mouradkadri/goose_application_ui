"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Upload, Brain, Menu, X, BookmarkCheck } from "lucide-react"

// Import all three screen components that manage the user journey
import { ResumeUploadScreen } from "@/components/resume-upload-screen"
import { ProcessingResumeScreen } from "@/components/processing-resume-screen"
import { JobList } from "@/components/job-list"
import { JobDetails } from "@/components/job-details"
import { ResumeTab } from "@/components/resume-tab"
import { AIInsights } from "@/components/ai-insights"

// We define the possible states our application can be in.
// This is clearer and more scalable than using a simple boolean.
type AppState = "uploading" | "processing" | "ready";

const mockJobs = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  title: [
    "Senior Software Engineer", "Product Manager", "UX Designer", "Data Scientist", "DevOps Engineer",
    "Frontend Developer", "Backend Developer", "Full Stack Developer", "Marketing Manager", "Sales Representative",
  ][i % 10],
  company: [
    "TechCorp Inc.", "Innovation Labs", "Digital Solutions", "StartupXYZ", "Enterprise Co.",
    "Creative Agency", "Data Dynamics", "Cloud Systems", "AI Ventures", "Growth Partners",
  ][i % 10],
  location: [
    "San Francisco, CA", "New York, NY", "Austin, TX", "Seattle, WA", "Boston, MA",
    "Remote", "Los Angeles, CA", "Chicago, IL", "Denver, CO", "Miami, FL",
  ][i % 10],
  description: "Join our dynamic team and help build the future of technology. We offer competitive compensation, excellent benefits, and opportunities for growth.",
  salary: `$${80 + (i % 50)}k - $${120 + (i % 80)}k`,
  posted: `${1 + (i % 30)} days ago`,
  matchScore: 85 + (i % 15),
  requirements: ["5+ years of experience", "Strong problem-solving skills", "Team collaboration", "Agile methodology"],
  benefits: ["Health insurance", "Remote work options", "401k matching", "Professional development"],
}))

export default function JobMatcherPage() {
  // 1. This is the core of our new logic: a state to manage which screen to show.
  const [appState, setAppState] = useState<AppState>("uploading");

  // These states are for the "ready" view (the main job tracker UI)
  const [selectedJob, setSelectedJob] = useState(mockJobs[0]);
  const [activeTab, setActiveTab] = useState("details");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleJobSelect = (job: (typeof mockJobs)[0]) => {
    setSelectedJob(job);
    setIsMobileSidebarOpen(false);
  }

  // 2. Render the correct component based on the current appState.
  if (appState === "uploading") {
    // When the user uploads a file, we transition to the "processing" state.
    return <ResumeUploadScreen onUpload={() => setAppState("processing")} />;
  }

  if (appState === "processing") {
    // After 5 seconds, the processing component will call this function
    // to transition us to the "ready" state.
    return <ProcessingResumeScreen onProcessingComplete={() => setAppState("ready")} />;
  }

  // 3. This is the main job tracker UI, shown only when appState is "ready".
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}>
              {isMobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              <h1 className="text-lg md:text-2xl font-bold text-card-foreground font-sans">
                AI Career Co-pilot
              </h1>
            </div>
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground hidden sm:inline-flex">
              Resume Uploaded
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/job-tracker">
              <Button variant="outline" size="sm" className="border-border hover:bg-accent bg-transparent">
                <BookmarkCheck className="mr-1 md:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Track Jobs</span>
                <span className="sm:hidden">Track</span>
              </Button>
            </Link>
            <Button
              onClick={() => setAppState("uploading")} // Allow user to go back and upload a new resume
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              size="sm"
            >
              <Upload className="mr-1 md:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Upload New</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)] relative">
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
        )}

        <div className={`fixed md:relative z-50 md:z-auto w-80 md:w-[30%] h-full transform transition-transform duration-300 ease-in-out ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
          <JobList jobs={mockJobs} selectedJob={selectedJob} onJobSelect={handleJobSelect} resumeUploaded={true} />
        </div>

        <div className="flex-1 bg-background w-full md:w-[70%]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="border-b border-border px-4 md:px-6 py-4">
              <TabsList className="grid w-full grid-cols-3 max-w-md text-xs md:text-sm">
                <TabsTrigger value="details">Job Details</TabsTrigger>
                <TabsTrigger value="resume">Resume</TabsTrigger>
                <TabsTrigger value="analysis">AI Insights</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-4 md:p-6 h-[calc(100vh-145px)] overflow-auto">
              <TabsContent value="details" className="mt-0">
                <JobDetails job={selectedJob} resumeUploaded={true} />
              </TabsContent>
              <TabsContent value="resume" className="mt-0">
                <ResumeTab resumeUploaded={true} selectedJob={selectedJob} onResumeUpload={() => setAppState("uploading")} />
              </TabsContent>
              <TabsContent value="analysis" className="mt-0">
                <AIInsights resumeUploaded={true} selectedJob={selectedJob} onResumeUpload={() => setAppState("uploading")} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}