/**
 * doc-export.ts
 * Client-side helpers for generating Overleaf-ready LaTeX source and
 * triggering file downloads (PDF via @react-pdf, .tex via Blob).
 *
 * Nothing here talks to the backend — all pure string manipulation.
 */

import type { ResumeDocument } from "@/types/copilot-job"

// ── LaTeX character escaping ─────────────────────────────────────────────────

/**
 * Escape a string so it is safe to embed inside LaTeX source.
 * Handles the 10 LaTeX special characters + common unicode punctuation.
 */
export function escapeLatex(s: string | undefined | null): string {
  if (!s) return ""
  return s
    // Must come first: backslash → textbackslash
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
    // Unicode punctuation → ASCII equivalents
    .replace(/[–—]/g, "--")   // en/em dash
    .replace(/[‘’]/g, "'")    // curly single quotes
    .replace(/[“”]/g, '"')    // curly double quotes
    .replace(/…/g, "...")          // ellipsis
    .replace(/ /g, " ")           // non-breaking space
}

// ── LaTeX templates ──────────────────────────────────────────────────────────

/**
 * Build an Overleaf-ready .tex résumé from a ResumeDocument.
 * Uses only standard packages (geometry, enumitem, titlesec, hyperref, xcolor).
 */
export function buildResumeTex(doc: ResumeDocument): string {
  const e = escapeLatex

  // Header contact line
  const contactParts: string[] = []
  if (doc.email)    contactParts.push(e(doc.email))
  if (doc.phone)    contactParts.push(e(doc.phone))
  if (doc.location) contactParts.push(e(doc.location))
  ;(doc.links ?? []).forEach(l => contactParts.push(`\\href{${l.url}}{${e(l.label)}}`))

  // Experience section
  const expSection = (doc.experience ?? []).map(ex => `
\\subsection*{${e(ex.role)} \\hfill {\\normalfont\\small ${e(ex.start)} -- ${e(ex.end)}}}
{\\itshape ${e(ex.company)}${ex.location ? `, ${e(ex.location)}` : ""}}
\\begin{itemize}
${(ex.bullets ?? []).map(b => `  \\item ${e(b)}`).join("\n")}
\\end{itemize}`).join("\n")

  // Education section
  const eduSection = (doc.education ?? []).map(ed => `
\\subsection*{${e(ed.degree)} \\hfill {\\normalfont\\small ${e(ed.start ?? "")}${ed.end ? ` -- ${e(ed.end)}` : ""}}}
{\\itshape ${e(ed.school)}${ed.location ? `, ${e(ed.location)}` : ""}}`).join("\n")

  // Projects section (optional)
  const projSection = (doc.projects ?? []).length > 0 ? `
\\section*{Projects}
${(doc.projects ?? []).map(p => `
\\subsection*{${e(p.name)}${p.url ? ` --- \\href{${p.url}}{link}` : ""}}
${p.description ? e(p.description) : ""}`).join("\n")}` : ""

  // Skills
  const skillsLine = (doc.skills ?? []).map(e).join(", ")

  return `\\documentclass[10pt,a4paper]{article}
\\usepackage[margin=1.8cm]{geometry}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage[hidelinks]{hyperref}
\\usepackage{xcolor}
\\usepackage{parskip}

\\setlength{\\parindent}{0pt}
\\setlist[itemize]{noitemsep, topsep=2pt, leftmargin=1.2em}
\\titleformat{\\section}{\\large\\bfseries\\color[HTML]{1a1a2e}}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{8pt}{4pt}
\\titleformat{\\subsection}{\\normalsize\\bfseries}{}{0em}{}
\\titlespacing{\\subsection}{0pt}{6pt}{2pt}

\\begin{document}

% ── Header ──────────────────────────────────────────────────────────────────
{\\centering
  {\\LARGE\\bfseries ${e(doc.name)}}\\\\[4pt]
  ${doc.title ? `{\\large\\color[HTML]{555555} ${e(doc.title)}}\\\\[6pt]` : ""}
  ${contactParts.join(" $\\cdot$ ")}
\\par}

\\medskip

% ── Summary ─────────────────────────────────────────────────────────────────
${doc.summary ? `\\section*{Summary}
${e(doc.summary)}` : ""}

% ── Skills ──────────────────────────────────────────────────────────────────
${skillsLine ? `\\section*{Skills}
${skillsLine}` : ""}

% ── Experience ──────────────────────────────────────────────────────────────
${(doc.experience ?? []).length > 0 ? `\\section*{Experience}
${expSection}` : ""}

% ── Education ───────────────────────────────────────────────────────────────
${(doc.education ?? []).length > 0 ? `\\section*{Education}
${eduSection}` : ""}
${projSection}

\\end{document}
`
}

/**
 * Build an Overleaf-ready .tex cover letter.
 * @param body   The full cover letter text (may contain \n newlines).
 * @param meta   Optional sender/recipient metadata for the header.
 */
export function buildCoverLetterTex(
  body: string,
  meta?: { name?: string; company?: string; jobTitle?: string }
): string {
  const e = escapeLatex
  const paragraphs = body
    .split(/\n{2,}/)
    .map(p => p.replace(/\n/g, " ").trim())
    .filter(Boolean)
    .map(e)
    .join("\n\n")

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  })

  return `\\documentclass[11pt,a4paper]{letter}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage[hidelinks]{hyperref}
\\usepackage{parskip}

\\begin{document}

\\begin{letter}{${meta?.company ? e(meta.company) : "Hiring Manager"}}

\\date{${today}}
\\opening{Dear Hiring Manager,}

${paragraphs}

\\closing{Sincerely,}

${meta?.name ? e(meta.name) : ""}

\\end{letter}
\\end{document}
`
}

// ── Download helpers ─────────────────────────────────────────────────────────

/** Trigger a browser file download from any Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}

/** Trigger a browser file download from a plain string (e.g. LaTeX source). */
export function downloadText(
  text: string,
  filename: string,
  mime = "text/plain;charset=utf-8"
): void {
  downloadBlob(new Blob([text], { type: mime }), filename)
}

/** Sanitise a string for use in a filename (strip LaTeX-unsafe chars, collapse spaces). */
export function safeFilename(...parts: (string | undefined | null)[]): string {
  return parts
    .filter(Boolean)
    .join("-")
    .replace(/[^a-zA-Z0-9\-_ ]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 60)
}
