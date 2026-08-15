export type JobStatus = 'to_apply' | 'applied' | 'interview' | 'offer' | 'rejected' | 'ghosted';

export const STATUS_LABELS: Record<JobStatus, string> = {
  to_apply:  'To Apply',
  applied:   'Applied',
  interview: 'Interviewing',
  offer:     'Offer Received',
  rejected:  'Rejected',
  ghosted:   'Ghosted',
};

export const STATUS_COLORS: Record<JobStatus, string> = {
  to_apply:  'bg-zinc-400',
  applied:   'bg-blue-500',
  interview: 'bg-amber-500',
  offer:     'bg-emerald-500',
  rejected:  'bg-red-500',
  ghosted:   'bg-zinc-300',
};

export const STATUS_TEXT: Record<JobStatus, string> = {
  to_apply:  'text-zinc-500',
  applied:   'text-blue-600',
  interview: 'text-amber-600',
  offer:     'text-emerald-600',
  rejected:  'text-red-600',
  ghosted:   'text-zinc-400',
};

/** Semantic match tier derived from relevance score */
export type MatchTier = 'strong' | 'good' | 'fair'

export function getMatchTier(score: number): { label: string; tier: MatchTier } {
  if (score >= 70) return { label: 'Strong match', tier: 'strong' }
  if (score >= 50) return { label: 'Good match',   tier: 'good'   }
  return               { label: 'Fair match',   tier: 'fair'   }
}

/** Tailwind colors per match tier */
export const MATCH_TIER_COLORS: Record<MatchTier, { bar: string; text: string; bg: string; border: string }> = {
  strong: { bar: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  good:   { bar: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200'   },
  fair:   { bar: 'bg-zinc-300',    text: 'text-zinc-500',    bg: 'bg-zinc-50',    border: 'border-zinc-200'    },
}

// ── Structured résumé document (returned by /generate/resume-document/) ───────

export interface ResumeLink {
  label: string;
  url: string;
}

export interface ResumeExperience {
  role: string;
  company: string;
  location?: string;
  start: string;
  end: string;
  bullets: string[];
}

export interface ResumeEducation {
  degree: string;
  school: string;
  location?: string;
  start?: string;
  end?: string;
}

export interface ResumeProject {
  name: string;
  description?: string;
  url?: string;
}

export interface ResumeDocument {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  links?: ResumeLink[];
  summary?: string;
  skills?: string[];
  experience?: ResumeExperience[];
  education?: ResumeEducation[];
  projects?: ResumeProject[];
}

// ─────────────────────────────────────────────────────────────────────────────

export interface CopilotJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  requirements: string[];
  applyUrl: string;
  source: 'manual' | 'url' | 'ai_search';
  addedAt: string;
  status: JobStatus;
  notes: string;
  /** Whether the user has starred/favorited this job. Persisted server-side. */
  favorite: boolean;
  /** ISO timestamp of when the user marked this job as applied. */
  appliedAt?: string;
  /** ISO date string (YYYY-MM-DD) for a user-set follow-up reminder/deadline. */
  followUpAt?: string;
  /** ID of the AI search session that surfaced this job. */
  searchSessionId?: string;
  /** Someone you know at this company (name, LinkedIn, email). */
  connections?: string;
  /** Recruiter or hiring manager contact info. */
  contact?: string;
  matchScore?: number;
  aiContent: {
    coverLetter?: string;
    tailoredResume?: string;
    /** Full structured résumé doc from /generate/resume-document/ — source for PDF + LaTeX export */
    resumeDocument?: ResumeDocument;
    interviewQuestions?: string[];
    companyResearch?: string;
    outreachEmail?: string;
    linkedinMessage?: string;
    salaryInsights?: string;
    skillGaps?: string[];
  };
}
