"use client"

import { useEffect, useState } from "react"
import { Job } from "@/types/job"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ExternalLink, Upload } from "lucide-react"

interface ResumeTabProps {
  resumeUploaded: boolean
  selectedJob: Job
  onResumeUpload: () => void
  resumeFile: File | null
}

export function ResumeTab({ resumeUploaded, selectedJob, onResumeUpload, resumeFile }: ResumeTabProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!resumeFile) return
    const url = URL.createObjectURL(resumeFile)
    setPdfUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [resumeFile])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-sans">
          <FileText className="h-5 w-5" />
          Your Resume
        </CardTitle>
      </CardHeader>
      <CardContent>
        {resumeUploaded && pdfUrl ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg border">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">{resumeFile?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {resumeFile ? (resumeFile.size / 1024).toFixed(0) + ' KB' : ''}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(pdfUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <iframe
              src={pdfUrl}
              className="w-full rounded-lg border bg-card"
              style={{ height: '520px' }}
              title="Your Resume"
            />

            <Button
              variant="outline"
              className="w-full"
              onClick={onResumeUpload}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload a Different Resume
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Upload your resume to view it here</p>
            <Button onClick={onResumeUpload} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Upload Resume
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
