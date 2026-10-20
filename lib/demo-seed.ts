import type { CopilotJob } from "@/types/copilot-job"
import type { StoredResume } from "@/lib/resume-store"

// ── Resume ────────────────────────────────────────────────────────────────────

export const DEMO_RESUME_TEXT = `Alex Chen
Full-Stack Engineer · San Francisco, CA
alex.chen@example.com · linkedin.com/in/alexchen-dev

EXPERIENCE

Senior Frontend Engineer — Acme Labs (2023 – present)
• Led migration from React 17 to React 18 + TypeScript strict mode, cutting runtime errors by 40%
• Built real-time collaboration features using WebSockets and Yjs, used by 12k+ daily active users
• Architected a Tailwind CSS v4 design-token system adopted across 3 product teams
• Mentored 2 junior engineers; conducted weekly 1:1s and code reviews

Full-Stack Developer — Freelance (2022 – 2023)
• Built and shipped 4 client projects: SaaS dashboards, e-commerce storefronts, internal tooling
• Delivered a multi-tenant job board platform (Next.js + FastAPI + PostgreSQL) 0 → production in 10 weeks
• Integrated Stripe, SendGrid, and Cloudinary; wrote end-to-end API tests with pytest

SKILLS
JavaScript, TypeScript, React, Next.js, Node.js, Python, FastAPI, PostgreSQL, Redis,
Docker, AWS (EC2 · S3 · Lambda), Tailwind CSS, GraphQL, REST APIs, Git

EDUCATION
BSc Computer Science — UC Davis, 2022`

export const DEMO_PREFS = {
  role: "Full-Stack Engineer",
  location: "United States",
  country_code: "US",
  is_remote: false,
  workStyle: "Remote",
  seniority: "Mid-level",
  resumeText: DEMO_RESUME_TEXT,
}

export const DEMO_RESUME_STORE: StoredResume[] = [
  {
    id: "demo-resume-01",
    name: "Alex_Chen_Resume.pdf",
    text: DEMO_RESUME_TEXT,
    uploadedAt: "2026-09-18T10:00:00.000Z",
    isActive: true,
  },
]

export const DEMO_WEEKLY_GOAL = "5"

// ── Jobs ──────────────────────────────────────────────────────────────────────

export const DEMO_JOBS: CopilotJob[] = [
  // ── TO APPLY (5 jobs) ────────────────────────────────────────────────────────
  {
    id: "demo-01",
    title: "Senior Frontend Engineer",
    company: "Vercel",
    location: "Remote, USA",
    salary: "$165,000 – $200,000",
    description: `We're building the infrastructure for the modern web. Our Developer Experience team needs a Senior Frontend Engineer who's obsessed with performance and craft.

You'll own architecture decisions across the Vercel dashboard and CLI, drive Core Web Vitals improvements, and ship polished UX that millions of developers use every day.

Requirements:
• 4+ years with React and TypeScript
• Experience with Next.js App Router
• Strong grasp of web performance and Core Web Vitals
• Excellent async communication — remote-first team
• Bonus: familiarity with edge runtimes, Rust tooling`,
    requirements: ["React", "TypeScript", "Next.js", "Web performance", "Edge runtimes"],
    applyUrl: "https://vercel.com/careers",
    source: "ai_search",
    addedAt: "2026-09-21T09:15:00.000Z",
    status: "to_apply",
    notes: "",
    favorite: true,
    matchScore: 92,
    aiContent: {
      coverLetter: `Dear Vercel Hiring Team,

I'm excited to apply for the Senior Frontend Engineer role. As someone who has spent two years building production Next.js apps — and who ships to Vercel every week — this feels like the natural next step.

At Acme Labs I led the migration from React 17 to React 18 with strict TypeScript, reducing runtime errors by 40%. I also architected a Tailwind CSS v4 design-token system that scaled across three product teams — the kind of cross-team infrastructure work I love.

What draws me to Vercel specifically is the obsession with the feedback loop: zero-config deploys, instant previews, edge analytics. I want to be on the team making that experience even faster.

I'd welcome the chance to talk about how my background maps to your team's current challenges.

Best,
Alex Chen`,
    },
  },
  {
    id: "demo-02",
    title: "Full-Stack Engineer",
    company: "Linear",
    location: "Remote, USA",
    salary: "$155,000 – $185,000",
    description: `Linear is building software for software teams. We care deeply about craftsmanship — every interaction is designed to feel fast, focused, and intentional.

You'll work across the React frontend, Node.js backend, and PostgreSQL data layer, and have a direct impact on the product thousands of engineering teams use daily.

Requirements:
• Proficiency in TypeScript across front and back
• Experience with React and modern state management
• Comfortable with PostgreSQL and API design
• Strong product sense — you notice when things feel off`,
    requirements: ["TypeScript", "React", "Node.js", "PostgreSQL", "Product sense"],
    applyUrl: "https://linear.app/careers",
    source: "ai_search",
    addedAt: "2026-09-20T14:30:00.000Z",
    status: "to_apply",
    notes: "",
    favorite: true,
    matchScore: 89,
    aiContent: {},
  },
  {
    id: "demo-03",
    title: "Software Engineer, Frontend",
    company: "Stripe",
    location: "Remote, USA",
    salary: "$160,000 – $210,000",
    description: `Stripe's mission is to increase the GDP of the internet. Our frontend engineers build the dashboard, docs, and developer tools that hundreds of thousands of businesses rely on.

You'll work on performance-critical UIs, collaborate with designers and PMs, and push the frontend forward.

Requirements:
• Deep React and TypeScript experience
• Strong CSS and layout fundamentals
• Understanding of accessibility (WCAG AA)
• Comfortable navigating large codebases`,
    requirements: ["React", "TypeScript", "CSS", "Accessibility", "Large codebases"],
    applyUrl: "https://stripe.com/jobs",
    source: "ai_search",
    addedAt: "2026-09-19T11:00:00.000Z",
    status: "to_apply",
    notes: "",
    favorite: false,
    matchScore: 87,
    aiContent: {},
  },
  {
    id: "demo-04",
    title: "Frontend Engineer",
    company: "Notion",
    location: "Remote, USA",
    salary: "$140,000 – $175,000",
    description: `Notion's editor is one of the most complex UIs on the web. You'd join the team that owns the core editing surface, real-time collaboration, and rendering performance.

We need engineers who can navigate a large React + TypeScript codebase and ship features that feel native.

Requirements:
• Solid React and TypeScript skills
• Experience with rich-text editors or collaborative UIs is a plus
• Comfort with product trade-offs
• Good eye for UX details`,
    requirements: ["React", "TypeScript", "Rich text", "Collaboration UX", "Performance"],
    applyUrl: "https://notion.so/careers",
    source: "ai_search",
    addedAt: "2026-09-18T08:45:00.000Z",
    status: "to_apply",
    notes: "",
    favorite: false,
    matchScore: 84,
    aiContent: {},
  },
  {
    id: "demo-05",
    title: "Software Engineer (TypeScript)",
    company: "Anthropic",
    location: "Remote, USA",
    salary: "$175,000 – $225,000",
    description: `Anthropic builds AI systems that are safe and beneficial. Our product team builds the interfaces — APIs, SDKs, the Console — that researchers, developers, and enterprises use to work with Claude.

You'll work on TypeScript across the full stack: React for the Console, Node.js for APIs and tooling.

Requirements:
• Strong TypeScript across front and back
• Experience shipping developer-facing products
• Curiosity about AI/ML systems
• Careful, thoughtful approach to engineering`,
    requirements: ["TypeScript", "React", "Node.js", "Developer tools", "API design"],
    applyUrl: "https://anthropic.com/careers",
    source: "ai_search",
    addedAt: "2026-09-22T16:20:00.000Z",
    status: "to_apply",
    notes: "High priority — apply before end of week",
    favorite: true,
    matchScore: 91,
    aiContent: {},
  },

  // ── APPLIED (4 jobs) ─────────────────────────────────────────────────────────
  {
    id: "demo-06",
    title: "Full-Stack Developer",
    company: "Figma",
    location: "Remote, USA",
    salary: "$145,000 – $180,000",
    description: `Figma makes design accessible to everyone. You'll build features across the Figma web app — collaborative editing, plugins, sharing infrastructure, and performance.

Requirements:
• TypeScript, React, Node.js
• Experience with real-time sync or CRDTs is a strong plus
• Good eye for design quality and detail`,
    requirements: ["TypeScript", "React", "Node.js", "Real-time sync", "Design quality"],
    applyUrl: "https://figma.com/careers",
    source: "ai_search",
    addedAt: "2026-09-11T10:00:00.000Z",
    status: "applied",
    notes: "",
    favorite: false,
    appliedAt: "2026-09-18T14:00:00.000Z",
    matchScore: 78,
    aiContent: {},
  },
  {
    id: "demo-07",
    title: "Frontend Engineer",
    company: "Loom",
    location: "Remote, USA",
    salary: "$130,000 – $155,000",
    description: `Loom helps teams communicate async through video. You'd be building the recording, playback, and editing surfaces that millions use daily.

Requirements:
• React, TypeScript
• Experience with WebRTC or media APIs is a plus
• Attention to pixel-level detail`,
    requirements: ["React", "TypeScript", "WebRTC", "Media APIs", "Performance"],
    applyUrl: "https://loom.com/jobs",
    source: "ai_search",
    addedAt: "2026-09-10T09:30:00.000Z",
    status: "applied",
    notes: "",
    favorite: false,
    appliedAt: "2026-09-19T11:00:00.000Z",
    matchScore: 76,
    aiContent: {},
  },
  {
    id: "demo-08",
    title: "React Developer",
    company: "Pitch",
    location: "Remote, Europe/USA",
    salary: "€95,000 – €125,000",
    description: `Pitch is a presentation tool built for modern teams. You'd join the frontend team to build beautiful, performant editor experiences.

Requirements:
• React, TypeScript, CSS
• Strong eye for design quality
• Experience with complex document editors is a plus`,
    requirements: ["React", "TypeScript", "CSS", "Editor experience", "Design quality"],
    applyUrl: "https://pitch.com/careers",
    source: "ai_search",
    addedAt: "2026-09-09T13:00:00.000Z",
    status: "applied",
    notes: "",
    favorite: false,
    appliedAt: "2026-09-20T10:30:00.000Z",
    matchScore: 72,
    aiContent: {
      coverLetter: `Dear Pitch Team,

Pitch's approach to presentations — the focus on collaboration, speed, and visual quality — is exactly what drew me to apply. I'm a full-stack engineer with deep React and TypeScript experience, and a genuine obsession with the craft of UI.

At Acme Labs I led our React 18 migration and built a real-time collaboration feature using WebSockets and Yjs — careful, conflict-aware work that required deep thought about UX under latency. I also own our design-token system: the kind of component-API work where the details matter.

What excites me about Pitch is the editor-centric product. Complex content models, collaborative sync, rich formatting — these are the problems I gravitate toward.

Alex Chen`,
    },
  },
  {
    id: "demo-09",
    title: "Software Engineer II",
    company: "Descript",
    location: "Remote, USA",
    salary: "$140,000 – $165,000",
    description: `Descript is an AI-powered video and podcast editor. You'd work on the editor frontend, AI features UI, and platform architecture.

Requirements:
• React, TypeScript
• Node.js and backend API experience
• Familiarity with media processing or AI products is a plus`,
    requirements: ["React", "TypeScript", "Node.js", "AI products", "Media processing"],
    applyUrl: "https://descript.com/careers",
    source: "ai_search",
    addedAt: "2026-09-08T11:15:00.000Z",
    status: "applied",
    notes: "",
    favorite: false,
    appliedAt: "2026-09-24T09:00:00.000Z",
    matchScore: 74,
    aiContent: {},
  },

  // ── INTERVIEW (3 jobs) ───────────────────────────────────────────────────────
  {
    id: "demo-10",
    title: "Full-Stack Engineer",
    company: "Retool",
    location: "Remote, USA",
    salary: "$145,000 – $175,000",
    description: `Retool lets anyone build internal tools faster. You'd work on the drag-and-drop builder, component library, and data-fetching layer.

Requirements:
• React, TypeScript, Node.js, PostgreSQL
• Experience building complex UI systems
• Care about developer ergonomics`,
    requirements: ["React", "TypeScript", "Node.js", "PostgreSQL", "UI systems"],
    applyUrl: "https://retool.com/careers",
    source: "ai_search",
    addedAt: "2026-09-01T10:00:00.000Z",
    status: "interview",
    notes: "Technical screen completed — system design next",
    favorite: false,
    appliedAt: "2026-09-07T14:00:00.000Z",
    followUpAt: "2026-09-26",
    matchScore: 81,
    aiContent: {},
  },
  {
    id: "demo-11",
    title: "Senior React Developer",
    company: "Superhuman",
    location: "Remote, USA",
    salary: "$160,000 – $195,000",
    description: `Superhuman builds the fastest email experience in the world. Every interaction is optimised for speed and keyboard-first use.

We're looking for engineers obsessed with performance and feel.

Requirements:
• Expert-level React and TypeScript
• Deep CSS and animation knowledge
• Experience with keyboard-driven UIs`,
    requirements: ["React", "TypeScript", "CSS animations", "Keyboard UX", "Performance"],
    applyUrl: "https://superhuman.com/jobs",
    source: "ai_search",
    addedAt: "2026-08-30T09:00:00.000Z",
    status: "interview",
    notes: "2nd round — culture fit + comp conversation",
    favorite: true,
    appliedAt: "2026-09-05T11:00:00.000Z",
    followUpAt: "2026-09-25",
    matchScore: 88,
    aiContent: {},
  },
  {
    id: "demo-12",
    title: "Frontend Engineer (TypeScript)",
    company: "Raycast",
    location: "Remote, Europe/USA",
    salary: "€110,000 – €145,000",
    description: `Raycast is a productivity tool for developers. You'll build the Raycast Store, onboarding, and web platform supporting 200k+ users.

Requirements:
• TypeScript, React, Next.js
• Strong product and design sensibility
• Experience with developer-facing products or APIs`,
    requirements: ["TypeScript", "React", "Next.js", "Developer tools", "Product sense"],
    applyUrl: "https://raycast.com/jobs",
    source: "ai_search",
    addedAt: "2026-08-28T13:00:00.000Z",
    status: "interview",
    notes: "Take-home submitted — follow up today",
    favorite: true,
    appliedAt: "2026-09-03T10:00:00.000Z",
    followUpAt: "2026-09-23",
    matchScore: 85,
    aiContent: {
      coverLetter: `Dear Raycast Team,

Raycast is the first thing I open every morning. The speed, extensibility, and keyboard-first UX — it's the kind of product I've wanted to help build for years. When I saw this role, I applied immediately.

My background maps closely to what you're looking for. At Acme Labs I own our design-token infrastructure and mentored junior engineers on component API design — work that requires the same care for developer experience that Raycast embeds in everything. I also shipped a Next.js 14 product from 0 to production with App Router, Tailwind v4, and a FastAPI backend — very close to your stack.

What I'd bring beyond the technical: a genuine understanding of the developer audience. I've built Raycast extensions and have strong opinions about what makes a developer tool feel right.

Alex`,
      tailoredResume: `SUGGESTED RESUME IMPROVEMENTS FOR RAYCAST ROLE:

1. Lead bullet (Acme Labs) — emphasise DX angle:
   BEFORE: "Led migration from React 17 to React 18 + TypeScript strict mode"
   AFTER:  "Led React 18 + TypeScript strict-mode migration and wrote internal guide adopted by 3 teams — improving DX and cutting type errors by 40%"

2. Add Raycast extension experience:
   "Published [X] Raycast extension with [Y] installs — demonstrating familiarity with Raycast's extension API and UX patterns"

3. Highlight Next.js App Router specifically in freelance bullet:
   "Built full-stack job platform with Next.js 14 (App Router), FastAPI, and PostgreSQL — shipped 0→production in 10 weeks"

4. Skills section — add: "Raycast Extensions API, developer tooling" to signal ecosystem familiarity

5. Add a one-line summary above experience:
   "Frontend-focused full-stack engineer with a developer-tools mindset. Builds products other engineers love to use."`,
    },
  },

  // ── OFFER (2 jobs) ───────────────────────────────────────────────────────────
  {
    id: "demo-13",
    title: "Software Engineer II",
    company: "Intercom",
    location: "Remote, USA",
    salary: "$150,000 – $180,000",
    description: `Intercom is the customer communications platform trusted by 25,000+ businesses. You'd join the Messenger team, building the real-time chat widget used by millions of end users daily.

Requirements:
• React, TypeScript, Node.js
• Performance optimisation experience
• Strong CS fundamentals`,
    requirements: ["React", "TypeScript", "Node.js", "Performance", "CS fundamentals"],
    applyUrl: "https://intercom.com/careers",
    source: "ai_search",
    addedAt: "2026-08-20T10:00:00.000Z",
    status: "offer",
    notes: "Offer: $165k base + $45k equity. Decision deadline Oct 3.",
    favorite: false,
    appliedAt: "2026-08-28T14:00:00.000Z",
    matchScore: 79,
    aiContent: {
      coverLetter: `Dear Intercom Team,

Building a chat widget that renders correctly and snappily for millions of users, in iframes, across every browser — that's one of the hardest frontend challenges in production. I want to work on that.

My experience at Acme Labs maps well: I've shipped real-time collaborative features at scale using WebSockets, built performance-critical UIs, and written TypeScript with a focus on long-term maintainability. I also have backend experience with Node.js and PostgreSQL, which I understand the Messenger team uses.

Looking forward to the conversation.

Alex Chen`,
    },
  },
  {
    id: "demo-14",
    title: "Full-Stack Engineer",
    company: "Pipe",
    location: "Remote, USA",
    salary: "$155,000 – $185,000",
    description: `Pipe is building the financial infrastructure for the new economy. You'd work across our React dashboard, Node.js API layer, and PostgreSQL data model.

Requirements:
• TypeScript full-stack (React + Node)
• PostgreSQL or similar relational DB
• Fintech or payments experience is a plus`,
    requirements: ["TypeScript", "React", "Node.js", "PostgreSQL", "Fintech"],
    applyUrl: "https://pipe.com/careers",
    source: "ai_search",
    addedAt: "2026-08-18T09:00:00.000Z",
    status: "offer",
    notes: "Offer: $162k base + 0.15% equity. Comparing to Intercom.",
    favorite: false,
    appliedAt: "2026-08-25T11:00:00.000Z",
    matchScore: 82,
    aiContent: {},
  },

  // ── REJECTED (1 job) ─────────────────────────────────────────────────────────
  {
    id: "demo-15",
    title: "Frontend Developer",
    company: "Coda",
    location: "Remote, USA",
    salary: "$130,000 – $155,000",
    description: `Coda is an all-in-one doc that blends docs, spreadsheets, and apps. You'd work on the formula engine UI and table rendering layer.

Requirements:
• React, TypeScript
• Experience with spreadsheet-like UIs or data grids
• Strong CSS skills`,
    requirements: ["React", "TypeScript", "Data grids", "Spreadsheet UX", "CSS"],
    applyUrl: "https://coda.io/jobs",
    source: "ai_search",
    addedAt: "2026-08-12T10:00:00.000Z",
    status: "rejected",
    notes: "Automated pass — likely needed spreadsheet/grid experience",
    favorite: false,
    appliedAt: "2026-08-19T14:00:00.000Z",
    rejectionReason: "skills",
    matchScore: 68,
    aiContent: {},
  },
]
