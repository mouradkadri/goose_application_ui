# GooseJobs UI — Frontend

The Next.js 15 frontend for GooseJobs — an AI-powered job-search copilot. Upload your resume, get a ranked list of live job openings from 20+ sources, then let the AI generate tailored cover letters, resume bullets, interview prep, and export-ready documents in PDF or LaTeX.

---

## Features

### Core flow
- **Resume upload** — drag-and-drop PDF; parsed server-side, stored in the backend session
- **Streaming job search** — SSE progress log while the backend searches 20+ job boards simultaneously
- **AI-ranked results** — jobs scored by a fine-tuned bi-encoder + cross-encoder ML pipeline

### Job Copilot panel
- **Cover Letter** — Gemini-generated, personalised to the exact job + your resume; auto-copies to clipboard on Apply
- **Tailored Resume Bullets** — rewritten bullet points optimised for the role
- **Interview Prep** — likely questions with STAR-format answers drawn from your experience
- **Fit & Gap Analysis** — strengths vs. gaps breakdown with a match confidence score
- **Structured Resume Generator** — builds a complete resume JSON document tailored to the job

### Export
- **PDF export** — client-side via `@react-pdf/renderer`; A4 résumé and cover letter with navy/indigo styling
- **LaTeX export** — Overleaf-ready `.tex` for both résumé and cover letter; no compiler required

### Job tracker
- **Pipeline board** — Kanban-style pipeline: To Apply → Applied → Interview → Offer → Rejected
- **Pipeline chart** — interactive funnel visualisation on the dashboard
- **Add jobs manually** — paste any URL, scrape the posting with AI, or fill in fields by hand
- **Quick Apply modal** — copy cover letter + bullets before opening the apply link

### Navigation & UX
- **Mobile bottom nav** — 5-tab bar (Home / Jobs / Apply / Resumes / More) on screens below `md`
- **Access code gate** — optional `ACCESS_CODE` env var locks the app behind a password cookie; configure via `/enter`
- **Onboarding flow** — guided first-run at `/onboarding`
- **Keyboard shortcuts** — `?` opens the shortcuts help overlay

### SEO & metadata
- OpenGraph + Twitter card meta tags
- `robots.txt`, `sitemap.ts`, `opengraph-image.tsx`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI library | React 19 |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Fonts | Geist |
| PDF rendering | @react-pdf/renderer (lazy, client-side) |
| State | Zustand (copilot store) |
| Charts | Recharts (pipeline funnel) |

---

## Project Structure

```
Goose_Job_UI/
├── app/
│   ├── page.tsx                      # Main shell — upload → stream → job list
│   ├── layout.tsx                    # Root layout + providers
│   ├── globals.css
│   ├── enter/                        # Access-code gate page
│   ├── onboarding/                   # First-run onboarding
│   ├── job-tracker/                  # Pipeline board (all saved jobs)
│   ├── opengraph-image.tsx           # OG image generation
│   ├── sitemap.ts
│   └── api/                          # Server-side proxy routes (backend never exposed to browser)
│       ├── auth/                     # Set/clear access cookie
│       ├── find-jobs/                # POST → /find-jobs/ (bulk)
│       ├── find-jobs-stream/         # POST → /find-jobs/stream/ (SSE)
│       ├── generate/
│       │   ├── cover-letter/
│       │   ├── tailored-resume/
│       │   ├── interview-prep/
│       │   ├── fit-analysis/
│       │   └── resume-document/
│       ├── jobs/                     # CRUD for saved jobs
│       ├── parse-resume/             # Stateless PDF text extraction
│       ├── resume/                   # Upload + retrieve session resume
│       ├── scrape-job/               # AI-powered URL scraper
│       └── supported-locations/     # Countries with good job coverage
├── components/
│   ├── dashboard-sidebar.tsx         # Desktop sidebar + MobileBottomNav
│   ├── job-list.tsx                  # Ranked job cards
│   ├── job-details.tsx               # Job detail pane
│   ├── job-copilot-panel.tsx         # Copilot tabs + ExportMenu
│   ├── job-board-toolbar.tsx         # Filters + search bar
│   ├── job-filters.tsx               # Filter sheet
│   ├── pipeline-chart.tsx            # Recharts funnel
│   ├── add-job-modal.tsx             # Manual job add / URL scrape
│   ├── quick-apply-modal.tsx         # Pre-apply copy kit
│   ├── ai-insights.tsx               # Match analysis card
│   ├── ai-search-loader.tsx          # SSE progress log UI
│   ├── resume-tab.tsx                # In-browser PDF viewer
│   ├── search-provider.tsx           # Search context
│   ├── search-status-pill.tsx        # Live search status
│   ├── shortcuts-help.tsx            # Keyboard shortcuts overlay
│   └── pdf/
│       ├── ResumePdf.tsx             # @react-pdf résumé template
│       └── CoverLetterPdf.tsx        # @react-pdf cover letter template
├── lib/
│   ├── backend-auth.ts               # HF bearer token header helper
│   ├── copilot-store.ts              # Zustand store for copilot state
│   ├── doc-export.ts                 # LaTeX export (escapeLatex, buildResumeTex, …)
│   ├── doc-export-pdf.ts             # PDF export wrappers (lazy @react-pdf)
│   ├── master-resume.ts              # Resume text caching
│   ├── search-sessions.ts            # SSE streaming hook helpers
│   ├── session.ts                    # Backend session ID management
│   ├── tracker.ts                    # Job tracker helpers
│   ├── use-job-search-stream.ts      # useJobSearchStream hook
│   └── utils.ts
├── middleware.ts                     # Access-code gate (cookie check)
├── types/
│   ├── job.ts                        # Job type
│   └── copilot-job.ts                # CopilotJob, ResumeDocument hierarchy
└── public/
    ├── goose_job_logo.png
    ├── goose.gif / goose2.gif
    └── robots.txt
```

---

## How the API Proxy Works

The browser never talks directly to the backend. All requests go through Next.js API routes that read credentials from server-side environment variables and forward the call. This prevents CORS issues and keeps all secrets off the client.

```
Browser → POST /api/find-jobs-stream/ → Next.js server → HuggingFace Space (GooseJobs AI)
```

The `HF_ACCESS_TOKEN` and `INTERNAL_API_KEY` headers are attached server-side by `lib/backend-auth.ts`.

---

## Environment Variables

Create `.env.local` (never commit this file — it is in `.gitignore`):

| Variable | Required | Description |
|---|---|---|
| `BACKEND_URL` | Yes | GooseJobs AI backend URL (e.g. `https://mourad675-goose-job-ai.hf.space` or `http://localhost:8000`) |
| `HF_ACCESS_TOKEN` | For private HF Space | HuggingFace access token to authenticate against a private Space |
| `INTERNAL_API_KEY` | If backend requires it | Internal API key passed as `x-internal-key` header to all proxy routes |
| `NEXT_PUBLIC_SITE_URL` | Production | Full site URL (e.g. `https://goosejobs.vercel.app`) — used by SEO metadata and sitemap |
| `ACCESS_CODE` | Optional | If set, the app shows a password gate at `/enter`. Leave unset for open access. |

Copy `.env.local.example` as a starting point:

```bash
cp .env.local.example .env.local
```

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.local.example .env.local
# Edit .env.local — set BACKEND_URL=http://localhost:8000

# 3. Start the dev server
npm run dev
```

Open `http://localhost:3000`. The GooseJobs AI backend must be running at `BACKEND_URL` (see the AI repo).

---

## Deploying to Vercel

1. Push this repo to GitHub
2. Import the project at [vercel.com](https://vercel.com)
3. In Vercel → Project Settings → **Environment Variables**, add:

| Variable | Value |
|---|---|
| `BACKEND_URL` | `https://mourad675-goose-job-ai.hf.space` |
| `HF_ACCESS_TOKEN` | Your HuggingFace token (for private Space) |
| `INTERNAL_API_KEY` | Your internal key |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` |
| `ACCESS_CODE` | Your chosen password (optional) |

4. Click **Deploy** — every push to `main` auto-deploys.

---

## Access Code Gate

If `ACCESS_CODE` is set, `middleware.ts` intercepts all requests. Users who don't have the `gj_access` cookie are redirected to `/enter` where they enter the code. On success, the cookie is set and they're forwarded to their original destination.

To remove the gate entirely: delete `ACCESS_CODE` from your environment variables.

---

## PDF & LaTeX Export

Both export paths share the same `ResumeDocument` JSON structure returned by `POST /generate/resume-document/`.

- **PDF** — `lib/doc-export-pdf.ts` lazy-imports `@react-pdf/renderer` (avoids SSR issues) and renders `components/pdf/ResumePdf.tsx` or `CoverLetterPdf.tsx` in the browser
- **LaTeX** — `lib/doc-export.ts` builds an Overleaf-compatible `.tex` string; no server or compiler required. Download and paste into Overleaf.
