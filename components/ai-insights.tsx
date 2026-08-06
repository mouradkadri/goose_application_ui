"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Brain,
  Upload,
  Target,
  PenTool,
  MessageSquare,
  Users,
  TrendingUp,
  BarChart3,
  DollarSign,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react"
import { Job } from "@/types/job"

interface AIInsightsProps {
  resumeUploaded: boolean
  selectedJob: Job
  onResumeUpload: () => void
}

function deriveInterviewQuestions(requirements: string[]): string[] {
  const verbs = ['experience', 'familiarity', 'knowledge', 'ability', 'proficiency', 'understanding', 'exposure']
  return requirements.slice(0, 6).map(req => {
    const lower = req.toLowerCase()
    const tech = req.replace(/^(experience|familiarity|knowledge|ability|proficiency|strong|good|solid|deep)\s+(with|in|of)?\s*/i, '').trim()

    if (verbs.some(v => lower.includes(v))) {
      return `Can you walk us through your experience with ${tech}?`
    }
    if (lower.includes('lead') || lower.includes('manag')) {
      return `Tell me about a time you led a team or project. What was the outcome?`
    }
    if (lower.includes('design') || lower.includes('architect')) {
      return `Describe a system you designed. What trade-offs did you consider?`
    }
    return `How have you applied ${tech} in a previous role or project?`
  })
}

function buildCoverLetter(job: Job): string {
  const topReqs = (job.requirements || []).slice(0, 2).join(' and ')
  return `Dear Hiring Manager,

I am excited to apply for the ${job.title} position at ${job.company}. After reviewing the role, I believe my background aligns well with what you are looking for.

${topReqs ? `Your requirements around ${topReqs} match closely with projects I have worked on, and I am confident I can contribute meaningfully from day one.` : `The scope of this role aligns with my technical background and the impact I want to make in my next position.`}

What draws me to ${job.company} is the opportunity to work on ${job.title.toLowerCase().includes('senior') ? 'impactful, high-ownership problems' : 'challenging, real-world problems'} in a team that values craft and results. I thrive in environments where there is room to iterate and push for quality.

I would welcome the opportunity to discuss how my experience maps to your needs and how I can contribute to the team's goals.

Best regards,
[Your Name]`
}

export function AIInsights({ resumeUploaded, selectedJob, onResumeUpload }: AIInsightsProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    fitGap: true,
    coverLetter: false,
    interview: false,
    careerPath: false,
    tracker: false,
  })
  const [copied, setCopied] = useState(false)

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const coverLetterText = buildCoverLetter(selectedJob)
  const interviewQuestions = deriveInterviewQuestions(selectedJob.requirements || [])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(coverLetterText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!resumeUploaded) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Your AI Career Coach Awaits</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Upload your resume to unlock personalized insights, interview prep, cover letter drafts, and more.
          </p>
          <Button onClick={onResumeUpload} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Upload className="mr-2 h-4 w-4" />
            Get Started — Upload Resume
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground font-sans mb-2">AI Career Assistant</h2>
        <p className="text-muted-foreground">
          Insights for <span className="font-medium text-foreground">{selectedJob.title}</span> at{" "}
          <span className="font-medium text-foreground">{selectedJob.company}</span>
        </p>
      </div>

      {/* 1. Fit & Gap Analysis */}
      <Card>
        <Collapsible open={openSections.fitGap} onOpenChange={() => toggleSection("fitGap")}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between font-sans">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-primary" />
                  <span>1. AI Match Analysis</span>
                </div>
                {openSections.fitGap ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Overall AI Match</span>
                  <span className="text-3xl font-bold text-primary">{selectedJob.matchScore}%</span>
                </div>
                <Progress value={selectedJob.matchScore} className="h-2.5" />
                <p className="text-xs text-muted-foreground mt-3">
                  Computed by our semantic bi-encoder + cross-encoder pipeline against your resume
                </p>
              </div>

              {(selectedJob.requirements || []).length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Job Requirements
                  </h4>
                  <ul className="space-y-2">
                    {(selectedJob.requirements || []).map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(selectedJob.benefits || []).length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-green-500" />
                    What They Offer
                  </h4>
                  <ul className="space-y-2">
                    {(selectedJob.benefits || []).map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 2. Cover Letter */}
      <Card>
        <Collapsible open={openSections.coverLetter} onOpenChange={() => toggleSection("coverLetter")}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between font-sans">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span>2. Cover Letter Draft</span>
                </div>
                {openSections.coverLetter ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <p className="text-sm text-muted-foreground">
                A starter draft built around this specific role. Personalize it with your own achievements before sending.
              </p>
              <div className="bg-muted rounded-lg p-5 text-sm whitespace-pre-line leading-relaxed">
                {coverLetterText}
              </div>
              <Button variant="outline" className="w-full" onClick={handleCopy}>
                {copied ? <><Check className="mr-2 h-4 w-4 text-green-500" /> Copied!</> : <><Copy className="mr-2 h-4 w-4" /> Copy to Clipboard</>}
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 3. Interview Prep */}
      <Card>
        <Collapsible open={openSections.interview} onOpenChange={() => toggleSection("interview")}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between font-sans">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <span>3. Interview Prep</span>
                </div>
                {openSections.interview ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <p className="text-sm text-muted-foreground">
                Questions derived from this job's actual requirements — review and prepare your answers.
              </p>

              {interviewQuestions.length > 0 ? (
                <div className="space-y-3">
                  {interviewQuestions.map((q, i) => (
                    <div key={i} className="flex gap-3 p-3 border rounded-lg">
                      <span className="font-bold text-primary text-sm shrink-0">Q{i + 1}</span>
                      <p className="text-sm text-foreground">{q}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No structured requirements found for this posting — check the full job description for cues.
                </p>
              )}

              <div className="bg-muted rounded-lg p-4 text-sm space-y-1">
                <p className="font-medium">Tip: Use the STAR method</p>
                <p className="text-muted-foreground">Situation → Task → Action → Result. Keep each answer under 2 minutes.</p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 4. Application Tracker */}
      <Card>
        <Collapsible open={openSections.tracker} onOpenChange={() => toggleSection("tracker")}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between font-sans">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>4. Match Confidence</span>
                </div>
                {openSections.tracker ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">AI Match Score</h4>
                  <span className="text-2xl font-bold text-primary">{selectedJob.matchScore}%</span>
                </div>
                <Progress value={selectedJob.matchScore} className="mb-3" />
                <p className="text-sm text-muted-foreground">
                  {selectedJob.matchScore >= 80
                    ? "Strong match — your resume aligns well with this role. Consider applying soon."
                    : selectedJob.matchScore >= 60
                    ? "Good match — you meet most requirements. Tailor your resume to improve alignment."
                    : "Moderate match — focus on requirements where you have transferable experience."}
                </p>
              </div>

              <div className="border rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium">How the score is calculated</p>
                <p className="text-muted-foreground">
                  Our bi-encoder model embeds your resume and the job posting into the same semantic space, then a
                  cross-encoder re-ranks the top results for precision. The final score reflects semantic similarity
                  between your background and this specific role.
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  )
}
