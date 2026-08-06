/**
 * ResumePdf.tsx
 * @react-pdf/renderer template for a polished A4 résumé.
 * Imported ONLY via dynamic import (see doc-export-pdf.ts) to stay
 * out of the initial bundle.
 */
import {
  Document, Page, Text, View, StyleSheet, Link,
} from "@react-pdf/renderer"
import type { ResumeDocument } from "@/types/copilot-job"

// ── Colour palette ────────────────────────────────────────────────────────────
const NAVY   = "#1a1a2e"
const INDIGO = "#4f46e5"
const MUTED  = "#6b7280"
const RULE   = "#e5e7eb"
const WHITE  = "#ffffff"

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: "#111827",
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 44,
    lineHeight: 1.45,
    backgroundColor: WHITE,
  },
  // Header
  header: { alignItems: "center", marginBottom: 12 },
  name:   { fontSize: 22, fontFamily: "Helvetica-Bold", color: NAVY, marginBottom: 3 },
  jobTitle: { fontSize: 11, color: INDIGO, marginBottom: 5 },
  contactLine: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 4 },
  contactItem: { fontSize: 8.5, color: MUTED },
  contactDot:  { fontSize: 8.5, color: MUTED, marginHorizontal: 3 },
  // Sections
  section: { marginBottom: 10 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderBottomWidth: 0.8,
    borderBottomColor: RULE,
    paddingBottom: 2,
    marginBottom: 5,
  },
  // Summary
  summary: { fontSize: 9.5, color: "#374151", lineHeight: 1.5 },
  // Skills
  skillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  skillPill: {
    backgroundColor: "#f3f4f6",
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 8.5,
    color: "#374151",
  },
  // Experience
  expHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  expRole:   { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111827" },
  expDates:  { fontSize: 8.5, color: MUTED },
  expCompany:{ fontSize: 9, color: MUTED, fontFamily: "Helvetica-Oblique", marginBottom: 3 },
  bullet: {
    flexDirection: "row",
    marginBottom: 2,
    paddingLeft: 8,
  },
  bulletDot:  { width: 10, color: INDIGO, fontSize: 9 },
  bulletText: { flex: 1, fontSize: 9, color: "#374151", lineHeight: 1.4 },
  // Education
  eduHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  eduDegree: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#111827" },
  eduDates:  { fontSize: 8.5, color: MUTED },
  eduSchool: { fontSize: 9, color: MUTED, fontFamily: "Helvetica-Oblique" },
  // Projects
  projName:  { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: INDIGO, marginBottom: 1 },
  projDesc:  { fontSize: 9, color: "#374151" },
  expItem:   { marginBottom: 7 },
  eduItem:   { marginBottom: 6 },
  projItem:  { marginBottom: 6 },
})

interface Props { doc: ResumeDocument }

export default function ResumePdf({ doc }: Props) {
  const contactItems: React.ReactNode[] = []
  if (doc.email)    contactItems.push(<Text key="email" style={styles.contactItem}>{doc.email}</Text>)
  if (doc.phone)    contactItems.push(<Text key="phone" style={styles.contactItem}>{doc.phone}</Text>)
  if (doc.location) contactItems.push(<Text key="loc" style={styles.contactItem}>{doc.location}</Text>)
  ;(doc.links ?? []).forEach((l, i) => contactItems.push(
    <Link key={`link-${i}`} src={l.url} style={{ ...styles.contactItem, color: INDIGO }}>{l.label}</Link>
  ))

  // Interleave with dots
  const contactRow: React.ReactNode[] = []
  contactItems.forEach((item, i) => {
    contactRow.push(item)
    if (i < contactItems.length - 1) contactRow.push(<Text key={`dot-${i}`} style={styles.contactDot}>·</Text>)
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{doc.name}</Text>
          {doc.title && <Text style={styles.jobTitle}>{doc.title}</Text>}
          {contactRow.length > 0 && (
            <View style={styles.contactLine}>{contactRow}</View>
          )}
        </View>

        {/* Summary */}
        {doc.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.summary}>{doc.summary}</Text>
          </View>
        )}

        {/* Skills */}
        {(doc.skills ?? []).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsWrap}>
              {doc.skills!.map((s, i) => (
                <Text key={i} style={styles.skillPill}>{s}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Experience */}
        {(doc.experience ?? []).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {doc.experience!.map((ex, i) => (
              <View key={i} style={styles.expItem}>
                <View style={styles.expHeader}>
                  <Text style={styles.expRole}>{ex.role}</Text>
                  <Text style={styles.expDates}>{ex.start} – {ex.end}</Text>
                </View>
                <Text style={styles.expCompany}>
                  {ex.company}{ex.location ? ` · ${ex.location}` : ""}
                </Text>
                {(ex.bullets ?? []).map((b, j) => (
                  <View key={j} style={styles.bullet}>
                    <Text style={styles.bulletDot}>▸</Text>
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {(doc.education ?? []).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {doc.education!.map((ed, i) => (
              <View key={i} style={styles.eduItem}>
                <View style={styles.eduHeader}>
                  <Text style={styles.eduDegree}>{ed.degree}</Text>
                  {(ed.start || ed.end) && (
                    <Text style={styles.eduDates}>{ed.start}{ed.end ? ` – ${ed.end}` : ""}</Text>
                  )}
                </View>
                <Text style={styles.eduSchool}>
                  {ed.school}{ed.location ? ` · ${ed.location}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {(doc.projects ?? []).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {doc.projects!.map((p, i) => (
              <View key={i} style={styles.projItem}>
                {p.url
                  ? <Link src={p.url} style={{ ...styles.projName }}>{p.name}</Link>
                  : <Text style={styles.projName}>{p.name}</Text>
                }
                {p.description && <Text style={styles.projDesc}>{p.description}</Text>}
              </View>
            ))}
          </View>
        )}

      </Page>
    </Document>
  )
}
