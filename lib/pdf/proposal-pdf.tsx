import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Proposal, ProposalContent } from "@/lib/supabase/types";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica", color: "#171717" },
  eyebrow: { fontSize: 9, textTransform: "uppercase", color: "#737373", letterSpacing: 1 },
  title: { fontSize: 20, fontWeight: 700, marginTop: 4, marginBottom: 12 },
  painPointsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 },
  painPoint: {
    fontSize: 9,
    backgroundColor: "#f5f5f5",
    color: "#404040",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  section: { marginBottom: 14, padding: 12, borderRadius: 6, backgroundColor: "#fafafa" },
  sectionLabel: { fontSize: 9, textTransform: "uppercase", color: "#737373", marginBottom: 4 },
  sectionBody: { fontSize: 11, lineHeight: 1.5 },
  chartsRow: { flexDirection: "row", gap: 16, marginTop: 8 },
  chartBox: { flex: 1, padding: 10, border: "1pt solid #e5e5e5", borderRadius: 6 },
  chartLabel: { fontSize: 9, textTransform: "uppercase", color: "#737373", marginBottom: 6 },
  barRow: { marginBottom: 6 },
  barLabelRow: { flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: "#525252" },
  barTrack: { height: 5, backgroundColor: "#e5e5e5", borderRadius: 3, marginTop: 2 },
  barFill: { height: 5, backgroundColor: "#d97706", borderRadius: 3 },
  barTrackSm: { height: 4, backgroundColor: "#e5e5e5", borderRadius: 2, marginTop: 2 },
});

const SECTIONS: { key: keyof ProposalContent["proposal_sections"]; label: string }[] = [
  { key: "opening_story", label: "Opening Story" },
  { key: "problem_bridge", label: "The Challenge" },
  { key: "solution_reveal", label: "The Solution" },
  { key: "benefit_breakdown", label: "What You Get" },
  { key: "dream_outcome", label: "Your Future" },
  { key: "call_to_action", label: "Next Step" },
];

export function ProposalPdfDocument({
  proposal,
  content,
}: {
  proposal: Proposal;
  content: ProposalContent;
}) {
  return (
    <Document title={`Proposal for ${content.client_name}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Proposal for {content.client_name}</Text>
        <Text style={styles.title}>{content.product_matched}</Text>

        {content.pain_points.length > 0 && (
          <View style={styles.painPointsRow}>
            {content.pain_points.map((p, i) => (
              <Text key={i} style={styles.painPoint}>
                {p}
              </Text>
            ))}
          </View>
        )}

        {SECTIONS.map(({ key, label }) => (
          <View key={key} style={styles.section} wrap={false}>
            <Text style={styles.sectionLabel}>{label}</Text>
            <Text style={styles.sectionBody}>{content.proposal_sections[key]}</Text>
          </View>
        ))}

        {(content.charts?.before_after?.length || content.charts?.benefit_timeline?.length) && (
          <View style={styles.chartsRow} wrap={false}>
            {content.charts?.before_after && content.charts.before_after.length > 0 && (
              <View style={styles.chartBox}>
                <Text style={styles.chartLabel}>Before &amp; After (illustrative)</Text>
                {content.charts.before_after.map((bar, i) => (
                  <View key={i} style={styles.barRow}>
                    <View style={styles.barLabelRow}>
                      <Text>{bar.label}</Text>
                      <Text>{bar.before} {"->"} {bar.after}</Text>
                    </View>
                    <View style={styles.barTrackSm}>
                      <View style={[styles.barFill, { width: `${Math.min(100, Math.max(0, bar.before))}%` }]} />
                    </View>
                    <View style={styles.barTrackSm}>
                      <View
                        style={[styles.barFill, { width: `${Math.min(100, Math.max(0, bar.after))}%`, backgroundColor: "#059669" }]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
            {content.charts?.benefit_timeline && content.charts.benefit_timeline.length > 0 && (
              <View style={styles.chartBox}>
                <Text style={styles.chartLabel}>Benefit Timeline (illustrative)</Text>
                {content.charts.benefit_timeline.map((point, i) => (
                  <View key={i} style={styles.barRow}>
                    <View style={styles.barLabelRow}>
                      <Text>Year {point.year}</Text>
                      <Text>{point.value}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View
                        style={[styles.barFill, { width: `${Math.min(100, Math.max(0, point.value))}%`, backgroundColor: "#059669" }]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <Text style={{ marginTop: 20, fontSize: 8, color: "#a3a3a3" }}>
          Status: {proposal.status} · Generated by fcprop
        </Text>
      </Page>
    </Document>
  );
}
