"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Building2,
  MapPin,
  Calendar,
  Star,
  Briefcase,
  ArrowRight,
  Clock,
  DollarSign,
  Share2,
  CheckCircle2,
  Zap,
  Bookmark,
  CheckCheck
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import { tracker } from "@/lib/tracker"

// --- Interfaces ---
interface Job {
  id: number
  title: string
  company: string
  location: string
  description: string
  salary: string
  posted: string
  matchScore: number
  requirements?: string[] | null
  benefits?: string[] | null
  applyUrl: string
  source?: string
}

interface JobDetailsProps {
  job: Job
  resumeUploaded: boolean
}


// --- Helper: Markdown Normalizer (Kept from your original code) ---
const normalizeMarkdown = (text: string) => {
  if (!text) return ""
  let output = text.replace(/\r\n/g, "\n")

  const sectionKeywords = [
    "What you will do", "What we can offer you", "Requirements", 
    "Nice to have", "About the role", "Qualifications", 
    "Key Responsibilities", "Benefits", "Responsibilities"
  ]

  sectionKeywords.forEach(keyword => {
    const regex = new RegExp(`(\\.|\\?|\\!|\\s|^)(${keyword}:?)(\\s|$)`, "gi")
    output = output.replace(regex, (match, p1, p2) => `${p1}\n\n### ${p2.trim()}\n\n`)
  })

  const actionVerbs = "Build|Design|Implement|Create|Manage|Lead|Develop|Experience|Familiarity|Ability|Solid|Strong|Comfort"
  const listRegex = new RegExp(`([.!?])\\s+(${actionVerbs})`, "g")
  output = output.replace(listRegex, "$1\n- $2")
  output = output.replace(/^\s*(\*\*|\*)([^*\n]{3,})(\*\*|\*)\s*/gm, "\n\n### $2\n\n")
  output = output.replace(/^[\s•‣▪▫◦–—]+/gm, "- ")
  output = output.replace(/\n{3,}/g, "\n\n")

  return output.trim()
}

export function JobDetails({ job, resumeUploaded }: JobDetailsProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [trackStatus, setTrackStatus] = useState<'saved' | 'applied' | null>(null)

  useEffect(() => {
    setTrackStatus(tracker.getStatus(job.id))
  }, [job.id])

  const handleSave = () => {
    tracker.save({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary || 'Competitive',
      matchScore: job.matchScore,
      applyUrl: job.applyUrl,
    })
    setTrackStatus('saved')
  }

  const handleMarkApplied = () => {
    if (trackStatus === null) {
      handleSave()
    }
    tracker.markApplied(job.id)
    setTrackStatus('applied')
    window.open(job.applyUrl, '_blank')
  }

  const formatDescription = (text: string) => {
    if (!text) return ""
    // Remove common generic footer text to keep it clean
    const footerFluff = /We are looking for a talented individual who can contribute to our growing team.*/gi;
    return normalizeMarkdown(text.replace(footerFluff, "").trim());
  }

  const hasStructuredData = (job.requirements?.length || 0) > 0 || (job.benefits?.length || 0) > 0;

  return (
    <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-500">
      
      {/* --- TOP NAVIGATION / BREADCRUMB AREA --- */}
      <div className="border-b top-0 bg-background/80 backdrop-blur-md z-20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <span className="hover:text-foreground cursor-pointer transition-colors">Jobs</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">{job.company}</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-foreground truncate max-w-[150px] sm:max-w-xs">{job.title}</span>
          </div>
          <div className="flex items-center gap-2">
<Button
  variant="ghost"
  size="icon"
  onClick={() => setIsFavorite(!isFavorite)}
  className="group relative transition-all duration-300 active:scale-75"
>
  <Star
    className={`h-7 w-7 transition-all duration-300 transform 
      ${isFavorite 
        ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)] scale-110" 
        : "text-muted-foreground group-hover:text-yellow-500 group-hover:scale-125 group-hover:drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]"
      }
    `}
  />
</Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button size="sm" className="hidden sm:flex" onClick={() => window.open(job.applyUrl, '_blank')}>
              Apply Now
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* --- LEFT CONTENT (8 cols) --- */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* HEADER */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                  {job.title}
                </h1>
                <div className="text-lg font-medium text-muted-foreground mt-1">
                  {job.company}
                </div>
              </div>
            </div>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-muted-foreground border-y py-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-foreground/70" />
                {job.location}
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-foreground/70" />
                Full-time
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-foreground/70" />
                {job.salary || "Competitive Salary"}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-foreground/70" />
                Posted {job.posted}
              </div>
            </div>
          </div>

          {/* DESCRIPTION CONTENT */}
          <article className="prose prose-slate dark:prose-invert max-w-none 
            prose-headings:font-semibold prose-headings:tracking-tight 
            prose-p:text-muted-foreground prose-p:leading-relaxed 
            prose-li:text-muted-foreground prose-li:marker:text-primary/50">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h3: ({ children }) => (
                  <h3 className="text-xl font-bold text-foreground mt-10 mb-4 flex items-center gap-2">
                    {children}
                  </h3>
                ),
                ul: ({ children }) => <ul className="space-y-2 my-6 pl-0 list-none">{children}</ul>,
                li: ({ children }) => (
                  <li className="flex gap-3 items-start">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span className="flex-1">{children}</span>
                  </li>
                ),
              }}
            >
              {formatDescription(job.description)}
            </ReactMarkdown>
          </article>

          {/* STRUCTURED DATA SECTION (Clean Grid) */}
          {hasStructuredData && (
            <div className="space-y-8 pt-6">
              {job.requirements && job.requirements.length > 0 && (
                <div className="bg-slate-50 dark:bg-secondary/20 rounded-xl p-6 border border-border/50">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Key Requirements
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {job.requirements.map((req, i) => (
                      <div key={i} className="flex gap-3 text-sm text-muted-foreground items-start">
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                        {req}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {job.benefits && job.benefits.length > 0 && (
                <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <Zap className="h-5 w-5 text-primary" />
                    Benefits & Perks
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {job.benefits.map((benefit, i) => (
                      <div key={i} className="flex gap-2 text-sm text-foreground/80 items-center">
                         <Star className="h-3 w-3 text-primary shrink-0" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- RIGHT SIDEBAR (4 cols) --- */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Sticky Apply Box */}
          <div className="sticky top-0 space-y-6">
            
            {/* Match Score Card */}
            {resumeUploaded && (
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">AI Match</h3>
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold tracking-tighter text-foreground">{job.matchScore}%</span>
                  <span className="text-sm text-muted-foreground mb-1.5">suitability</span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${job.matchScore}%` }} 
                  />
                </div>
              </div>
            )}

            {/* Action Card */}
            <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-muted-foreground">Interested in this role?</div>
                <div className="text-xs text-muted-foreground">
                  Read the description carefully before applying to {job.company}.
                </div>
              </div>
              
              <Button
                size="lg"
                className="w-full font-semibold text-base shadow-md hover:shadow-lg transition-all"
                onClick={handleMarkApplied}
              >
                {trackStatus === 'applied' ? (
                  <><CheckCheck className="mr-2 h-4 w-4" /> Applied</>
                ) : (
                  <>Apply for this Job <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>

              <Button
                variant="outline"
                className={cn("w-full", trackStatus && "border-primary text-primary")}
                onClick={handleSave}
                disabled={trackStatus === 'applied'}
              >
                <Bookmark className={cn("mr-2 h-4 w-4", trackStatus === 'saved' && "fill-primary")} />
                {trackStatus === 'saved' ? 'Saved' : trackStatus === 'applied' ? 'Applied' : 'Save for Later'}
              </Button>
            </div>

            {/* Quick Info */}
            <div className="rounded-xl bg-slate-50 dark:bg-secondary/20 p-5 space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Job Type</span>
                <span className="font-medium text-foreground">Full-time</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium text-foreground text-right">{job.location}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Posted</span>
                <span className="font-medium text-foreground">{job.posted}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Source</span>
                <Badge variant="secondary" className="font-normal rounded-md">
                  {job.source || "Direct"}
                </Badge>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer (Only shows on small screens) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-50 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={handleSave} disabled={trackStatus === 'applied'}>
          <Bookmark className={cn("mr-2 h-4 w-4", trackStatus && "fill-primary")} />
          {trackStatus ? (trackStatus === 'applied' ? 'Applied' : 'Saved') : 'Save'}
        </Button>
        <Button size="lg" className="flex-1 shadow-lg" onClick={handleMarkApplied}>
          {trackStatus === 'applied' ? 'Applied' : 'Apply Now'}
        </Button>
      </div>
    </div>
  )
}