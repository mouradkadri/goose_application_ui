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
  BookOpen,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react"

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

interface AIInsightsProps {
  resumeUploaded: boolean
  selectedJob: Job
  onResumeUpload: () => void
}

export function AIInsights({ resumeUploaded, selectedJob, onResumeUpload }: AIInsightsProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    fitGap: false,
    resumeOpt: false,
    coverLetter: false,
    interview: false,
    careerPath: false,
    tracker: false,
    salary: false,
    skillBuilding: false,
  })

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  if (!resumeUploaded) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Your AI Career Coach Awaits</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Upload your resume to unlock personalized insights, interview prep, salary guidance, and career path
            recommendations tailored specifically for you.
          </p>
          <Button onClick={onResumeUpload} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Upload className="mr-2 h-4 w-4" />
            Get Started - Upload Resume
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
          Your personal AI coach guiding you through the job application journey step by step.
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
                  <span>1. Fit & Gap Analysis</span>
                </div>
                {openSections.fitGap ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Based on your resume and this job posting, here's how you align with the role requirements:
                </p>

                <div className="grid gap-4">
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-800 dark:text-green-200">Strong Matches</h4>
                      <ul className="text-sm text-green-700 dark:text-green-300 mt-1 space-y-1">
                        <li>• 8+ years experience (exceeds 5+ requirement)</li>
                        <li>• Expert in React, Node.js, TypeScript</li>
                        <li>• Proven leadership and team collaboration</li>
                        <li>• Strong problem-solving track record</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Partial Matches</h4>
                      <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                        <li>• Some agile experience but could be more detailed</li>
                        <li>• Cloud experience present but not AWS-specific</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800 dark:text-red-200">Skill Gaps</h4>
                      <ul className="text-sm text-red-700 dark:text-red-300 mt-1 space-y-1">
                        <li>• No specific AWS certification mentioned</li>
                        <li>• Limited machine learning experience</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Overall Assessment</h4>
                  <p className="text-sm text-muted-foreground">
                    You're an excellent fit for this role with {selectedJob.matchScore}% compatibility. Your extensive
                    experience and technical skills align perfectly with their needs. The minor gaps can be addressed
                    through targeted preparation.
                  </p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 2. Resume Optimization */}
      <Card>
        <Collapsible open={openSections.resumeOpt} onOpenChange={() => toggleSection("resumeOpt")}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between font-sans">
                <div className="flex items-center gap-3">
                  <PenTool className="h-5 w-5 text-primary" />
                  <span>2. Resume Optimization</span>
                </div>
                {openSections.resumeOpt ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Here are 5 targeted suggestions to optimize your resume for this specific role:
                </p>

                <div className="space-y-3">
                  {[
                    {
                      title: "Quantify your leadership impact",
                      current: "Led development team",
                      suggested:
                        "Led cross-functional team of 8 engineers, delivering 3 major features that increased user engagement by 40%",
                    },
                    {
                      title: "Highlight cloud architecture experience",
                      current: "Experience with cloud technologies",
                      suggested:
                        "Designed and implemented scalable cloud architecture on AWS, reducing infrastructure costs by 30%",
                    },
                    {
                      title: "Emphasize agile methodology",
                      current: "Worked in agile environment",
                      suggested:
                        "Championed agile practices as Scrum Master, improving sprint velocity by 25% and reducing bug count by 50%",
                    },
                    {
                      title: "Add specific technology stack",
                      current: "Full-stack development",
                      suggested:
                        "Full-stack development using React, Node.js, TypeScript, and PostgreSQL for high-traffic applications (1M+ users)",
                    },
                    {
                      title: "Include problem-solving examples",
                      current: "Strong problem-solving skills",
                      suggested:
                        "Resolved critical performance bottleneck, improving API response time from 2s to 200ms through database optimization",
                    },
                  ].map((suggestion, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{suggestion.title}</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-red-600 font-medium">Current: </span>
                          <span className="text-muted-foreground">{suggestion.current}</span>
                        </div>
                        <div>
                          <span className="text-green-600 font-medium">Suggested: </span>
                          <span className="text-foreground">{suggestion.suggested}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 3. Cover Letter Draft */}
      <Card>
        <Collapsible open={openSections.coverLetter} onOpenChange={() => toggleSection("coverLetter")}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between font-sans">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span>3. Cover Letter Draft</span>
                </div>
                {openSections.coverLetter ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  A personalized cover letter highlighting your relevant experience:
                </p>

                <div className="bg-muted p-6 rounded-lg">
                  <div className="space-y-4 text-sm">
                    <p>Dear Hiring Manager,</p>

                    <p>
                      I am excited to apply for the {selectedJob.title} position at {selectedJob.company}. With over 8
                      years of experience in full-stack development and a proven track record of leading high-performing
                      engineering teams, I am confident I can contribute significantly to your organization's continued
                      success.
                    </p>

                    <p>
                      In my current role as Senior Software Engineer at TechCorp, I have successfully led the
                      development of scalable web applications using React, Node.js, and TypeScript—technologies that
                      directly align with your requirements. My experience includes architecting cloud-based solutions
                      that serve over 1 million users, demonstrating the scalability and performance optimization skills
                      essential for this role.
                    </p>

                    <p>
                      What particularly excites me about this opportunity is {selectedJob.company}'s commitment to
                      innovation and technical excellence. Your focus on building cutting-edge solutions resonates with
                      my passion for solving complex technical challenges and mentoring junior developers to achieve
                      their full potential.
                    </p>

                    <p>
                      I would welcome the opportunity to discuss how my technical expertise, leadership experience, and
                      collaborative approach can contribute to your team's objectives. Thank you for considering my
                      application.
                    </p>

                    <p>
                      Best regards,
                      <br />
                      John Doe
                    </p>
                  </div>
                </div>

                <Button variant="outline" className="w-full bg-transparent">
                  Copy to Clipboard
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 4. Interview Prep */}
      <Card>
        <Collapsible open={openSections.interview} onOpenChange={() => toggleSection("interview")}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between font-sans">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <span>4. Interview Prep</span>
                </div>
                {openSections.interview ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  Likely interview questions with STAR-method answers based on your resume:
                </p>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2 text-blue-600">Behavioral Questions</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium">Q: Tell me about a time you led a challenging project.</p>
                        <div className="mt-2 pl-4 border-l-2 border-muted">
                          <p>
                            <strong>Situation:</strong> Led migration of legacy system at TechCorp
                          </p>
                          <p>
                            <strong>Task:</strong> Migrate 500K+ users with zero downtime
                          </p>
                          <p>
                            <strong>Action:</strong> Created phased migration plan, coordinated 8-person team
                          </p>
                          <p>
                            <strong>Result:</strong> Completed 2 weeks early, 40% performance improvement
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="font-medium">Q: Describe a time you solved a complex technical problem.</p>
                        <div className="mt-2 pl-4 border-l-2 border-muted">
                          <p>
                            <strong>Situation:</strong> API response times degrading to 2+ seconds
                          </p>
                          <p>
                            <strong>Task:</strong> Identify and resolve performance bottleneck
                          </p>
                          <p>
                            <strong>Action:</strong> Analyzed queries, implemented caching, optimized database
                          </p>
                          <p>
                            <strong>Result:</strong> Reduced response time to 200ms, improved user satisfaction
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2 text-green-600">Technical Questions</h4>
                    <div className="space-y-2 text-sm">
                      <p>• Explain the difference between server-side and client-side rendering</p>
                      <p>• How would you optimize a React application for performance?</p>
                      <p>• Describe your approach to API design and versioning</p>
                      <p>• How do you handle error handling in distributed systems?</p>
                      <p>• Explain your experience with cloud architecture patterns</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 5. Career Path Explorer */}
      <Card>
        <Collapsible open={openSections.careerPath} onOpenChange={() => toggleSection("careerPath")}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between font-sans">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span>5. Career Path Explorer</span>
                </div>
                {openSections.careerPath ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <p className="text-muted-foreground">Potential next career steps after this role:</p>

                <div className="grid gap-4">
                  {[
                    {
                      title: "Engineering Manager",
                      timeline: "2-3 years",
                      description: "Lead larger engineering teams and drive technical strategy",
                      skills: ["People management", "Strategic planning", "Budget management"],
                      actions: [
                        "Take on mentoring responsibilities",
                        "Lead cross-team initiatives",
                        "Develop business acumen",
                      ],
                    },
                    {
                      title: "Principal Engineer",
                      timeline: "3-4 years",
                      description: "Technical leadership across multiple teams and products",
                      skills: ["System architecture", "Technical mentoring", "Innovation leadership"],
                      actions: ["Drive architectural decisions", "Publish technical content", "Speak at conferences"],
                    },
                    {
                      title: "VP of Engineering",
                      timeline: "5-7 years",
                      description: "Executive leadership of entire engineering organization",
                      skills: ["Executive presence", "Organizational design", "Strategic vision"],
                      actions: ["Gain P&L experience", "Build industry network", "Develop leadership philosophy"],
                    },
                  ].map((path, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{path.title}</h4>
                        <Badge variant="outline">{path.timeline}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{path.description}</p>

                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-medium text-blue-600">Skills to develop:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {path.skills.map((skill, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-medium text-green-600">Action items:</span>
                          <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                            {path.actions.map((action, i) => (
                              <li key={i}>• {action}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 6. Application Tracker & Predictor */}
      <Card>
        <Collapsible open={openSections.tracker} onOpenChange={() => toggleSection("tracker")}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between font-sans">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>6. Application Tracker & Predictor</span>
                </div>
                {openSections.tracker ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Success Probability</h4>
                    <span className="text-2xl font-bold text-green-600">78%</span>
                  </div>
                  <Progress value={78} className="mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Based on your profile match, experience level, and market conditions
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-green-600">Strengths Boosting Success</h4>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        High skill match (90%)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Exceeds experience requirements
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Strong leadership background
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        Relevant industry experience
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-orange-600">Areas to Improve</h4>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-center gap-2">
                        <AlertCircle className="h-3 w-3 text-orange-600" />
                        Add AWS certification (+8%)
                      </li>
                      <li className="flex items-center gap-2">
                        <AlertCircle className="h-3 w-3 text-orange-600" />
                        Quantify achievements (+5%)
                      </li>
                      <li className="flex items-center gap-2">
                        <AlertCircle className="h-3 w-3 text-orange-600" />
                        Network with company (+7%)
                      </li>
                    </ul>
                  </div>
                </div>

                <Button className="w-full">Track This Application</Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 7. Salary & Negotiation Coach */}
      <Card>
        <Collapsible open={openSections.salary} onOpenChange={() => toggleSection("salary")}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between font-sans">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span>7. Salary & Negotiation Coach</span>
                </div>
                {openSections.salary ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-6 rounded-lg">
                  <h4 className="font-medium mb-4">Estimated Salary Range</h4>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Market Range</span>
                    <span className="font-bold">$120k - $180k</span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm">Your Target</span>
                    <span className="font-bold text-green-600">$155k - $165k</span>
                  </div>
                  <Progress value={75} className="mb-2" />
                  <p className="text-xs text-muted-foreground">Based on your experience, location, and company size</p>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Negotiation Script</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-blue-600">Opening:</p>
                      <p className="text-muted-foreground italic">
                        "I'm very excited about this opportunity and believe I can bring significant value to the team.
                        Based on my research and experience level, I was hoping we could discuss the compensation
                        package."
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-blue-600">Value Proposition:</p>
                      <p className="text-muted-foreground italic">
                        "With my 8+ years of experience and proven track record of leading successful projects, I
                        believe a salary in the range of $155k-$165k would be appropriate, which aligns with market
                        rates for senior engineers with my background."
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-blue-600">Flexibility:</p>
                      <p className="text-muted-foreground italic">
                        "I'm open to discussing the total compensation package, including equity, benefits, and
                        professional development opportunities."
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-green-600 mb-2">Do's</h5>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Research market rates thoroughly</li>
                      <li>• Highlight specific achievements</li>
                      <li>• Be confident but respectful</li>
                      <li>• Consider total compensation</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-red-600 mb-2">Don'ts</h5>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Don't accept first offer immediately</li>
                      <li>• Don't make it personal</li>
                      <li>• Don't negotiate via email only</li>
                      <li>• Don't forget non-salary benefits</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 8. Skill-Building Recommender */}
      <Card>
        <Collapsible open={openSections.skillBuilding} onOpenChange={() => toggleSection("skillBuilding")}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between font-sans">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>8. Skill-Building Recommender</span>
                </div>
                {openSections.skillBuilding ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Recommended learning resources to address skill gaps and enhance your profile:
                </p>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">AWS Cloud Architecture</h4>
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        High Priority
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Address the AWS certification gap identified in the job requirements
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm font-medium">AWS Solutions Architect Course</span>
                        <Badge variant="secondary">A Cloud Guru</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm font-medium">AWS Certified Solutions Architect</span>
                        <Badge variant="secondary">Official AWS</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm font-medium">Designing Cloud Architecture</span>
                        <Badge variant="secondary">Pluralsight</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Machine Learning Fundamentals</h4>
                      <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                        Medium Priority
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Emerging requirement in many senior engineering roles
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm font-medium">Machine Learning for Engineers</span>
                        <Badge variant="secondary">Coursera</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm font-medium">Hands-On Machine Learning</span>
                        <Badge variant="secondary">O'Reilly Book</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Advanced System Design</h4>
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        Nice to Have
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Strengthen your architecture and scalability knowledge
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm font-medium">Designing Data-Intensive Applications</span>
                        <Badge variant="secondary">Book</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm font-medium">System Design Interview Course</span>
                        <Badge variant="secondary">Educative</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Learning Plan Recommendation</h4>
                  <p className="text-sm text-muted-foreground">
                    Focus on AWS certification first (4-6 weeks), then explore ML fundamentals (2-3 months). This
                    combination will significantly strengthen your profile for similar roles.
                  </p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  )
}
