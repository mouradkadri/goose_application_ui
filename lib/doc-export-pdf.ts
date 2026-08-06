/**
 * doc-export-pdf.ts
 * Lazy wrapper around @react-pdf/renderer so the heavy library
 * is NOT included in the initial bundle.
 * Call these async fns only from click handlers.
 */
import type { ResumeDocument } from "@/types/copilot-job"
import type { CoverLetterMeta } from "@/components/pdf/CoverLetterPdf"
import { createElement } from "react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyReactElement = any

export async function renderResumePdf(doc: ResumeDocument): Promise<Blob> {
  const [{ pdf }, { default: ResumePdf }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/pdf/ResumePdf"),
  ])
  return pdf(createElement(ResumePdf, { doc }) as AnyReactElement).toBlob()
}

export async function renderCoverLetterPdf(
  body: string,
  meta?: CoverLetterMeta
): Promise<Blob> {
  const [{ pdf }, { default: CoverLetterPdf }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/pdf/CoverLetterPdf"),
  ])
  return pdf(createElement(CoverLetterPdf, { body, meta }) as AnyReactElement).toBlob()
}
