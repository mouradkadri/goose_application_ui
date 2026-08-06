/**
 * CoverLetterPdf.tsx
 * @react-pdf/renderer template for a polished A4 cover letter.
 * Imported ONLY via dynamic import (see doc-export-pdf.ts).
 */
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const NAVY  = "#1a1a2e"
const MUTED = "#6b7280"
const RULE  = "#e5e7eb"
const WHITE = "#ffffff"

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10.5,
    color: "#111827",
    paddingTop: 52,
    paddingBottom: 52,
    paddingHorizontal: 60,
    lineHeight: 1.6,
    backgroundColor: WHITE,
  },
  header: { marginBottom: 28, borderBottomWidth: 1, borderBottomColor: RULE, paddingBottom: 14 },
  name:   { fontSize: 18, fontFamily: "Helvetica-Bold", color: NAVY, marginBottom: 3 },
  meta:   { fontSize: 9, color: MUTED },
  date:   { fontSize: 9, color: MUTED, marginBottom: 18, textAlign: "right" },
  salutation: { fontSize: 10.5, marginBottom: 16, fontFamily: "Helvetica-Bold" },
  body:   { fontSize: 10.5, color: "#374151", lineHeight: 1.65, marginBottom: 14 },
  closing: { fontSize: 10.5, marginTop: 20, marginBottom: 32 },
  sigName: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: NAVY },
})

export interface CoverLetterMeta {
  name?: string
  email?: string
  phone?: string
  company?: string
  jobTitle?: string
}

interface Props {
  body: string
  meta?: CoverLetterMeta
}

export default function CoverLetterPdf({ body, meta }: Props) {
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  })

  // Split body into paragraphs (double newline or single newline-only blocks)
  const paragraphs = body
    .split(/\n{2,}/)
    .map(p => p.replace(/\n/g, " ").trim())
    .filter(Boolean)

  const contactLine = [meta?.email, meta?.phone].filter(Boolean).join("  ·  ")

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Sender header */}
        {(meta?.name || contactLine) && (
          <View style={styles.header}>
            {meta?.name && <Text style={styles.name}>{meta.name}</Text>}
            {contactLine && <Text style={styles.meta}>{contactLine}</Text>}
          </View>
        )}

        <Text style={styles.date}>{today}</Text>

        <Text style={styles.salutation}>
          {meta?.company
            ? `Dear ${meta.company} Hiring Team,`
            : "Dear Hiring Manager,"}
        </Text>

        {paragraphs.map((p, i) => (
          <Text key={i} style={styles.body}>{p}</Text>
        ))}

        <Text style={styles.closing}>Sincerely,</Text>
        {meta?.name && <Text style={styles.sigName}>{meta.name}</Text>}

      </Page>
    </Document>
  )
}
