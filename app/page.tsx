import Link from "next/link"
import Image from "next/image"
import {
  Search, FileText, BarChart2, Star,
  ArrowRight, Zap, CheckCircle2,
} from "lucide-react"

// ── V-formation signature ─────────────────────────────────────────────────────

function GooseFormation({ className = "" }: { className?: string }) {
  const birds = [
    { x: 60, y: 6, lead: true },
    { x: 48, y: 14 }, { x: 72, y: 14 },
    { x: 37, y: 22 }, { x: 83, y: 22 },
    { x: 27, y: 30 }, { x: 93, y: 30 },
  ]
  return (
    <svg viewBox="0 0 120 40" className={className} fill="none" aria-hidden="true">
      {birds.map((b, i) => (
        <path
          key={i}
          d={`M${b.x - 5} ${b.y + 3} L${b.x} ${b.y} L${b.x + 5} ${b.y + 3}`}
          stroke="var(--amber)"
          strokeWidth={b.lead ? 1.8 : 1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={b.lead ? 1 : 0.55}
        />
      ))}
    </svg>
  )
}

// ── Feature card ──────────────────────────────────────────────────────────────

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.FC<{ className?: string }>
  title: string
  body: string
}) {
  return (
    <div className="border border-line rounded-md bg-card p-6 space-y-3">
      <div className="h-8 w-8 rounded bg-brand-50 border border-brand-100 flex items-center justify-center">
        <Icon className="h-4 w-4 text-brand-600" />
      </div>
      <h3 className="text-[15px] font-semibold text-ink tracking-tight">{title}</h3>
      <p className="text-[13px] text-stone leading-relaxed">{body}</p>
    </div>
  )
}

// ── Step row ──────────────────────────────────────────────────────────────────

function Step({
  number,
  title,
  body,
}: {
  number: string
  title: string
  body: string
}) {
  return (
    <div className="flex gap-5">
      <div className="shrink-0 h-8 w-8 rounded-md border border-line bg-paper-2 flex items-center justify-center text-[13px] font-bold text-stone fg-data">
        {number}
      </div>
      <div className="space-y-1 pt-0.5">
        <p className="text-[15px] font-semibold text-ink">{title}</p>
        <p className="text-[13px] text-stone leading-relaxed">{body}</p>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper">

      {/* Nav */}
      <header className="border-b border-line bg-paper/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image src="/goose_job_logo.png" alt="GooseJobs" width={28} height={28} className="object-contain" />
            <span className="text-[15px] font-bold tracking-tight text-ink">GooseJobs</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-[13px] text-stone hover:text-ink transition-colors font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="h-8 px-3.5 rounded-md text-[13px] font-semibold border border-stone/30 hover:border-ink/40 text-stone hover:text-ink transition-colors flex items-center"
            >
              Register
            </Link>
            <Link
              href="/demo"
              className="h-8 px-3.5 rounded-md text-[13px] font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors flex items-center"
            >
              Request demo
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse 120% 60% at 50% 0%, #5c3410 0%, #30190b 40%, #221409 70%, #1e1912 100%)'
        }}
      >
        {/* Amber glow */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none glow-idle"
          style={{ background: "radial-gradient(70% 45% at 50% 5%, rgba(232,147,58,0.22), transparent 68%)" }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-5 pt-20 pb-24 text-center">
          <GooseFormation className="w-24 h-8 mx-auto mb-6 opacity-80" />

          <p className="fg-label text-brand-400/80 mb-4">AI-powered job search</p>

          <h1 className="text-[36px] md:text-[52px] font-extrabold tracking-tight text-leather-ink leading-[1.08] text-balance">
            Your whole job hunt,<br />in formation.
          </h1>

          <p className="text-[16px] text-leather-ink-soft/80 mt-5 max-w-xl mx-auto leading-relaxed text-balance">
            Upload your resume once. GooseJobs scans job boards, ranks every match against
            your actual profile, and drafts tailored documents for each application.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-9">
            <Link
              href="/demo"
              className="w-full sm:w-auto flex items-center justify-center gap-2 h-11 px-6 rounded-md bg-amber text-[#13100a] font-bold text-[14px] hover:bg-brand-300 transition-colors"
            >
              <Zap className="h-4 w-4 shrink-0" />
              Request demo access
            </Link>
            <Link
              href="/enter"
              className="w-full sm:w-auto flex items-center justify-center gap-2 h-11 px-6 rounded-md border border-leather-line text-leather-ink-soft text-[14px] font-semibold hover:border-leather-ink/40 hover:text-leather-ink transition-colors"
            >
              Enter access code <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            {[
              "AI-ranked matches",
              "Tailored cover letters",
              "Application pipeline",
              "Interview prep",
            ].map(label => (
              <span
                key={label}
                className="flex items-center gap-1.5 text-[12px] text-leather-ink-soft/60"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-400/70 shrink-0" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-5 py-20">
        <div className="max-w-lg">
          <p className="fg-label text-brand-600 mb-3">How it works</p>
          <h2 className="text-[26px] font-bold tracking-tight text-ink">
            From resume to ranked pipeline in minutes
          </h2>
          <p className="text-[14px] text-stone mt-3 leading-relaxed">
            No manual searching. No copy-paste cover letters. GooseJobs handles the
            repetitive parts so you can focus on the conversations that matter.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-8">
          <Step
            number="01"
            title="Upload your resume"
            body="One PDF. GooseJobs parses your skills, experience, and seniority — no form filling required."
          />
          <Step
            number="02"
            title="AI hunts the market"
            body="The goose scans 20+ job boards, scores every listing against your profile, and surfaces the strongest matches first."
          />
          <Step
            number="03"
            title="Apply with tailored documents"
            body="For each role, generate a targeted cover letter and resume bullet suggestions — then track every application through to offer."
          />
        </div>
      </section>

      {/* Feature highlights */}
      <section className="border-t border-line bg-paper-2/50">
        <div className="max-w-5xl mx-auto px-5 py-20">
          <p className="fg-label text-brand-600 mb-3">Features</p>
          <h2 className="text-[26px] font-bold tracking-tight text-ink mb-10">
            Everything the job hunt needs
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard
              icon={Search}
              title="Semantic job search"
              body="FAISS + SentenceTransformers rank jobs by actual resume fit — not just keyword overlap."
            />
            <FeatureCard
              icon={FileText}
              title="AI document copilot"
              body="Tailored cover letters and resume suggestions generated for each specific role in seconds."
            />
            <FeatureCard
              icon={BarChart2}
              title="Application pipeline"
              body="Kanban board + list view tracks every job from saved → applied → interview → offer."
            />
            <FeatureCard
              icon={Star}
              title="Match scoring"
              body="Strong / Good / Fair tiers with a visual score bar — know at a glance which roles to prioritise."
            />
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section
        className="border-t border-line"
        style={{ background: 'linear-gradient(135deg, #1a1510 0%, #221a0f 100%)' }}
      >
        <div className="max-w-5xl mx-auto px-5 py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <GooseFormation className="w-16 h-5 mb-4 opacity-60" />
            <h2 className="text-[24px] font-bold tracking-tight text-leather-ink">
              See it in action.
            </h2>
            <p className="text-[14px] text-leather-ink-soft/70 mt-2 max-w-sm leading-relaxed">
              A pre-loaded workspace with 15 ranked jobs, AI-generated documents,
              and a full application pipeline — available on request.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/demo"
              className="flex items-center justify-center gap-2 h-11 px-6 rounded-md bg-amber text-[#13100a] font-bold text-[14px] hover:bg-brand-300 transition-colors"
            >
              <Zap className="h-4 w-4 shrink-0" />
              Request demo access
            </Link>
            <Link
              href="/enter"
              className="flex items-center justify-center gap-2 h-11 px-6 rounded-md border border-leather-line text-leather-ink-soft text-[14px] font-semibold hover:border-amber/50 hover:text-leather-ink transition-colors"
            >
              Enter access code
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="max-w-5xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/goose_job_logo.png" alt="" width={20} height={20} className="object-contain opacity-60" />
            <span className="text-[12px] text-stone">GooseJobs</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/demo" className="text-[12px] text-stone hover:text-ink transition-colors">
              Live demo
            </Link>
            <Link href="/enter" className="text-[12px] text-stone hover:text-ink transition-colors">
              Sign in
            </Link>
          </div>
          <p className="text-[11px] text-stone/50">
            Built with Next.js · FastAPI · FAISS · SentenceTransformers
          </p>
        </div>
      </footer>

    </div>
  )
}
