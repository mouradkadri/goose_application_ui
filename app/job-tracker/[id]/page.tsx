"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Brain,
  MapPin,
  DollarSign,
  ExternalLink,
  Building,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

// Combined job data for both applied and saved jobs
const allJobs = [
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
    type: "applied",
    description:
      "We are looking for a Senior Software Engineer to join our growing team. You will be responsible for designing, developing, and maintaining scalable web applications using modern technologies.",
    requirements: [
      "5+ years of experience in software development",
      "Proficiency in React, Node.js, and TypeScript",
      "Experience with cloud platforms (AWS, GCP, or Azure)",
      "Strong understanding of database design and optimization",
      "Experience with microservices architecture",
    ],
    benefits: [
      "Competitive salary and equity package",
      "Comprehensive health, dental, and vision insurance",
      "Flexible work arrangements and remote options",
      "Professional development budget",
      "Unlimited PTO policy",
    ],
    companySize: "500-1000 employees",
    industry: "Technology",
    timeline: [
      { date: "2024-01-15", event: "Application Submitted", status: "completed" },
      { date: "2024-01-18", event: "Application Reviewed", status: "completed" },
      { date: "2024-01-22", event: "Technical Interview", status: "upcoming" },
      { date: "TBD", event: "Final Interview", status: "pending" },
      { date: "TBD", event: "Decision", status: "pending" },
    ],
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
    type: "applied",
    description:
      "Join our product team to drive innovation and deliver exceptional user experiences. You'll work closely with engineering, design, and business teams to define product strategy and roadmap.",
    requirements: [
      "3+ years of product management experience",
      "Experience with agile development methodologies",
      "Strong analytical and problem-solving skills",
      "Excellent communication and leadership abilities",
      "Experience with user research and data analysis",
    ],
    benefits: [
      "Competitive salary and performance bonuses",
      "Stock options and equity participation",
      "Health and wellness programs",
      "Learning and development opportunities",
      "Flexible working hours",
    ],
    companySize: "100-500 employees",
    industry: "Technology",
    timeline: [
      { date: "2024-01-12", event: "Application Submitted", status: "completed" },
      { date: "2024-01-15", event: "Application Under Review", status: "current" },
      { date: "TBD", event: "Phone Screening", status: "pending" },
      { date: "TBD", event: "On-site Interview", status: "pending" },
      { date: "TBD", event: "Decision", status: "pending" },
    ],
  },
  {
    id: 4,
    title: "Full Stack Developer",
    company: "StartupXYZ",
    location: "Austin, TX",
    salary: "$95k - $125k",
    savedDate: "2024-01-16",
    matchScore: 90,
    notes: "Great company culture, planning to apply",
    type: "saved",
    description:
      "We're seeking a talented Full Stack Developer to help build our next-generation platform. You'll work on both frontend and backend systems, contributing to all aspects of our product development.",
    requirements: [
      "3+ years of full-stack development experience",
      "Proficiency in JavaScript, Python, or similar languages",
      "Experience with modern frontend frameworks (React, Vue, or Angular)",
      "Knowledge of database systems and API design",
      "Familiarity with DevOps practices and cloud deployment",
    ],
    benefits: [
      "Competitive salary and startup equity",
      "Comprehensive health benefits",
      "Flexible remote work policy",
      "Professional growth opportunities",
      "Casual work environment",
    ],
    companySize: "10-50 employees",
    industry: "Technology Startup",
    timeline: [],
  },
]

export default function JobDetails() {
  const params = useParams()
  const jobId = Number.parseInt(params.id as string)
  const job = allJobs.find((j) => j.id === jobId)

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
          <Link href="/job-tracker">
            <Button>Back to Job Tracker</Button>
          </Link>
        </div>
      </div>
    )
  }

  const getMatchColor = (score: number) => {
    if (score >= 90) return "bg-green-500"
    if (score >= 75) return "bg-blue-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "current":
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      case "upcoming":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/job-tracker">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tracker
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              <h1 className="text-lg md:text-2xl font-bold text-card-foreground font-sans">Job Details</h1>
            </div>
          </div>
          <div className="flex gap-2">
            {job.type === "saved" && (
              <Button>
                <ExternalLink className="h-4 w-4 mr-2" />
                Apply Now
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 py-6">
        {/* Job Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold text-card-foreground mb-2">{job.title}</CardTitle>
                <p className="text-xl text-muted-foreground font-medium mb-4">{job.company}</p>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {job.salary}
                  </div>
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {job.companySize}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {job.industry}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge className={`${getMatchColor(job.matchScore)} text-white`}>{job.matchScore}% match</Badge>
                  {job.type === "applied" && <Badge className={`${job.statusColor} text-white`}>{job.status}</Badge>}
                  <Badge variant="outline" className="capitalize">
                    {job.type}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="benefits">Benefits</TabsTrigger>
            {job.type === "applied" && <TabsTrigger value="timeline">Timeline</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-6">{job.description}</p>

                {job.notes && (
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <p className="text-muted-foreground">{job.notes}</p>
                  </div>
                )}

                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Match Analysis</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Overall Match</span>
                        <span>{job.matchScore}%</span>
                      </div>
                      <Progress value={job.matchScore} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Skills Match</span>
                        <span>{job.matchScore - 5}%</span>
                      </div>
                      <Progress value={job.matchScore - 5} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Experience Match</span>
                        <span>{job.matchScore + 3}%</span>
                      </div>
                      <Progress value={Math.min(job.matchScore + 3, 100)} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requirements" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Requirements & Qualifications</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {job.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benefits" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Benefits & Perks</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {job.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {job.type === "applied" && (
            <TabsContent value="timeline" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Application Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {job.timeline.map((item, index) => (
                      <div key={index} className="flex items-start gap-4">
                        {getStatusIcon(item.status)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{item.event}</h4>
                            <span className="text-sm text-muted-foreground">{item.date}</span>
                          </div>
                          <Badge
                            variant="outline"
                            className={`mt-1 text-xs capitalize ${
                              item.status === "completed"
                                ? "border-green-500 text-green-700"
                                : item.status === "current"
                                  ? "border-blue-500 text-blue-700"
                                  : item.status === "upcoming"
                                    ? "border-yellow-500 text-yellow-700"
                                    : "border-gray-300 text-gray-500"
                            }`}
                          >
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
