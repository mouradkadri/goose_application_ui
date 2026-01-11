"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Star, 
  ExternalLink, 
  Bookmark, 
  CheckCircle2, 
  Briefcase,
  ArrowRight,
  List
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

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
  
  const formatDescription = (text: string) => {
    if (!text) return ""
    const footerFluff = /We are looking for a talented individual who can contribute to our growing team.*/gi;
    return normalizeMarkdown(text.replace(footerFluff, "").trim());
  }

  const hasStructuredData = (job.requirements && job.requirements.length > 0) || 
                            (job.benefits && job.benefits.length > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* --- HEADER SECTION --- */}
      <div className="relative border-b pb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              <Briefcase className="h-3 w-3" />
              {job.source || "Direct Listing"}
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground leading-[1.1]">
              {job.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm md:text-base">
              <div className="flex items-center gap-2 font-semibold text-foreground group">
                <div className="p-2 rounded-lg bg-secondary group-hover:bg-primary/20 transition-colors">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                {job.company}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {job.location}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {job.posted}
              </div>
            </div>
          </div>
          
          {resumeUploaded && (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent to-primary rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center gap-4 bg-card border shadow-sm p-4 rounded-xl">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Match Score</span>
                  <span className="text-3xl font-black bg-gradient-to-br from-accent to-primary bg-clip-text text-transparent">
                    {job.matchScore}%
                  </span>
                </div>
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Star className="h-6 w-6 text-accent fill-accent" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mt-8">
          <Badge variant="outline" className="px-4 py-1.5 text-sm font-medium border-primary/20 bg-primary/5 text-primary">
            {job.salary || "Salary Undisclosed"}
          </Badge>
          <Badge variant="outline" className="px-4 py-1.5 text-sm font-medium">
            Full-time
          </Badge>
          <Badge variant="outline" className="px-4 py-1.5 text-sm font-medium">
            Remote Friendly
          </Badge>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="grid gap-10">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1 bg-primary rounded-full" />
            <h2 className="text-2xl font-bold">Role Overview</h2>
          </div>
          
          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground/90 prose-p:leading-relaxed prose-li:text-muted-foreground">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h3: ({ children }) => (
                  <h3 className="text-xl font-bold mt-10 mb-4 flex items-center gap-2 text-foreground">
                    {children}
                  </h3>
                ),
                ul: ({ children }) => (
                  <ul className="grid grid-cols-1 md:grid-cols-1 gap-2 my-6 list-none pl-0">
                    {children}
                  </ul>
                ),
                li: ({ children }) => (
  <li className="flex items-start gap-3 pb-1">
    <div className="h-1.5 w-1.5 rounded-full bg-primary/40 mt-2 shrink-0" />
    <span>{children}</span>
  </li>
),
                p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>
              }}
            >
              {formatDescription(job.description)}
            </ReactMarkdown>
          </div>
        </section>

        {/* Requirements & Benefits Grid */}
        {hasStructuredData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {job.requirements && job.requirements.length > 0 && (
              <Card className="bg-secondary/30 border-none">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Must Haves
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {job.requirements.map((req, i) => (
                    <div key={i} className="flex gap-3 text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                      {req}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {job.benefits && job.benefits.length > 0 && (
              <Card className="bg-accent/5 border-none">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-accent" />
                    Perks & Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {job.benefits.map((benefit, i) => (
                    <div key={i} className="flex gap-3 text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent/40 mt-1.5 shrink-0" />
                      {benefit}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* --- ACTION BAR --- */}
      <div className="sticky bottom-6 mt-12">
        <div className="bg-background/80 backdrop-blur-xl border p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-4 justify-between transition-all duration-300 hover:border-primary/30">
          <div className="hidden md:block pl-2">
            <p className="text-sm font-bold text-foreground">{job.title}</p>
            <p className="text-xs text-muted-foreground">{job.company} • {job.location}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="lg" 
              className="group relative overflow-hidden px-8 transition-all duration-300 hover:border-primary/50"
            >
              <Bookmark className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
              <span>Save Position</span>
            </Button>

            <Button 
              size="lg"
              onClick={() => window.open(job.applyUrl, '_blank')}
              className="group relative overflow-hidden bg-primary px-8 font-bold text-primary-foreground transition-all duration-300 hover:shadow-[0_8px_30px_rgb(var(--primary)_/_0.4)] hover:-translate-y-1 active:translate-y-0"
            >
              <span className="relative z-10 flex items-center">
                Apply Now
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
              {/* Subtle shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            </Button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}