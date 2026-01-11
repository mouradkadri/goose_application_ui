"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Upload, Brain, Menu, X, BookmarkCheck, Lock } from "lucide-react" // Added Lock icon

import { ResumeUploadScreen } from "@/components/resume-upload-screen"
import { ProcessingResumeScreen } from "@/components/processing-resume-screen"
import { JobList } from "@/components/job-list"
import { JobDetails } from "@/components/job-details"
import { ResumeTab } from "@/components/resume-tab"
import { AIInsights } from "@/components/ai-insights"
import * as logo from "public/goose_job_logo.png"

// --- Types ---
type AppState = "uploading" | "processing" | "ready";

interface RawApiJob {
  title: string;
  company: string;
  location: string;
  description: string;
  responsibilities: string | null;
  requirements: string | null;
  benefits: string | null;
  relevance_score: number;
  date_posted: string;
  salary: string | null;
  apply_url: string;
}

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  salary: string;
  posted: string;
  matchScore: number;
  requirements: string[];
  benefits: string[];
  applyUrl: string;
}

export default function JobMatcherPage() {
  // --- CONFIGURATION ---
  // Change this to 'true' when you are ready to enable the Resume and AI Insights tabs
  const ENABLE_FUTURE_FEATURES = false; 
  // ---------------------

  const [appState, setAppState] = useState<AppState>("uploading");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // 1. Data Transformation Helper
  const cleanAndTransform = (rawList: RawApiJob[]): Job[] => {
    return rawList
      .filter((raw) => raw.relevance_score >= 0.65)
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .map((raw, index) => {
        const fullDescription = raw.description + 
          (raw.responsibilities ? "\n\nKey Responsibilities:\n" + raw.responsibilities : "");

        return {
          id: index + 1,
          title: raw.title,
          company: raw.company,
          location: raw.location,
          description: fullDescription,
          salary: raw.salary || "Competitive",
          posted: raw.date_posted || "Recently",
          matchScore: Math.round(raw.relevance_score * 100),
          requirements: raw.requirements ? raw.requirements.split('. ').filter(s => s.length > 3) : [],
          benefits: raw.benefits ? raw.benefits.split('. ').filter(s => s.length > 3) : [],
          applyUrl: raw.apply_url
        };
      });
  };

  // 2. The API Trigger
  const handleUploadComplete = async (file: File) => {
    setAppState("processing");
    
    try {
      const formData = new FormData();
      formData.append("resume_file", file);

      const response = await fetch("http://127.0.0.1:8000/find-jobs/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(errorMsg);
      }

      const data: RawApiJob[] = await response.json();
      const processedJobs = cleanAndTransform(data);
      
      setJobs(processedJobs);
      if (processedJobs.length > 0) setSelectedJob(processedJobs[0]);
      
      setTimeout(() => setAppState("ready"), 3000);
      
    } catch (error) {
      console.error("API Error:", error);
      alert("Error: Make sure the Python API is running on localhost:8000");
      setAppState("uploading");
    }
  };

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
    setIsMobileSidebarOpen(false);
  }

  // 3. Conditional Rendering
  if (appState === "uploading") {
    return <ResumeUploadScreen onUpload={handleUploadComplete} />;
  }

  if (appState === "processing") {
    return <ProcessingResumeScreen onProcessingComplete={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}>
              {isMobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <img src="/goose_job_logo.png"  width={100} height={100} alt="goose jobs"/>
              <h1 className="text-lg md:text-2xl font-bold text-card-foreground font-sans">
                AI Career Co-pilot
              </h1>
            </div>
            
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground hidden sm:inline-flex">
              {jobs.length} Matches Found
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setAppState("uploading")}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              size="sm"
            >
              <Upload className="mr-1 md:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">New Resume</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)] relative">
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
        )}

        <div className={`fixed md:relative z-50 md:z-auto w-80 md:w-[30%] h-full transform transition-transform duration-300 ease-in-out ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
          <JobList jobs={jobs} selectedJob={selectedJob!} onJobSelect={handleJobSelect} resumeUploaded={true} />
        </div>

        <div className="flex-1 bg-background w-full md:w-[70%]">
          {selectedJob ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <div className="border-b border-border px-4 md:px-6 py-4">
                <TabsList className="grid w-full grid-cols-3 max-w-md text-xs md:text-sm">
                  
                  <TabsTrigger value="details">Job Details</TabsTrigger>
                  
                  {/* LOCKED TABS */}
                  <TabsTrigger 
                    value="resume" 
                    disabled={!ENABLE_FUTURE_FEATURES}
                    className={!ENABLE_FUTURE_FEATURES ? "opacity-50 cursor-not-allowed gap-2" : ""}
                  >
                    My Resume
                    {!ENABLE_FUTURE_FEATURES && <Lock className="w-3 h-3" />}
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="analysis" 
                    disabled={!ENABLE_FUTURE_FEATURES}
                    className={!ENABLE_FUTURE_FEATURES ? "opacity-50 cursor-not-allowed gap-2" : ""}
                  >
                    AI Insights
                    {!ENABLE_FUTURE_FEATURES && <Lock className="w-3 h-3" />}
                  </TabsTrigger>

                </TabsList>
              </div>

              <div className="p-4 md:p-6 h-[calc(100vh-145px)] overflow-auto">
                <TabsContent value="details" className="mt-0">
                  <JobDetails job={selectedJob} resumeUploaded={true} />
                </TabsContent>
                
                {/* Only render content if enabled to prevent errors from unimplemented components */}
                {ENABLE_FUTURE_FEATURES && (
                  <>
                    <TabsContent value="resume" className="mt-0">
                      <ResumeTab resumeUploaded={true} selectedJob={selectedJob} onResumeUpload={() => setAppState("uploading")} />
                    </TabsContent>
                    <TabsContent value="analysis" className="mt-0">
                      <AIInsights resumeUploaded={true} selectedJob={selectedJob} onResumeUpload={() => setAppState("uploading")} />
                    </TabsContent>
                  </>
                )}
              </div>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center">
              <Brain className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-xl font-semibold">No high-match jobs found</h3>
              <p className="text-muted-foreground">Try tweaking your resume to highlight your AI and Dev experience.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}