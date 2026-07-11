import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Proposal, ProposalContent } from "@/lib/supabase/types";

const INK = "#1c1a17";
const INK_SOFT = "#6b6560";
const BRAND = "#202d4a";
const BRAND_DARK = "#141c30";
const GOLD = "#a9813f";
const PAPER = "#faf8f4";

const styles = StyleSheet.create({
  page: { padding: 44, fontSize: 11, fontFamily: "Helvetica", color: INK, backgroundColor: "#ffffff" },
  eyebrow: { fontSize: 8.5, textTransform: "uppercase", color: BRAND, letterSpacing: 1.4, fontFamily: "Helvetica-Bold" },
  title: { fontSize: 26, fontFamily: "Times-Italic", marginTop: 6, marginBottom: 4, color: INK },
  headerRule: { borderBottomWidth: 1, borderBottomColor: "#e5e1da", paddingBottom: 16, marginBottom: 18 },
  statusPill: {
    fontSize: 8,
    textTransform: "uppercase",
    color: BRAND,
    backgroundColor: "#eef1f7",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    fontFamily: "Helvetica-Bold",
  },
  painPointsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 20 },
  painPoint: {
    fontSize: 8.5,
    backgroundColor: "#f5ecd9",
    color: GOLD,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 10,
    fontFamily: "Helvetica-Bold",
  },
  section: { marginBottom: 16, flexDirection: "row", gap: 12 },
  sectionIndex: { width: 24, fontSize: 13, fontFamily: "Times-Italic", color: GOLD },
  sectionBody: { flex: 1, borderLeftWidth: 1.5, borderLeftColor: "#dbe1ee", paddingLeft: 12 },
  sectionLabel: { fontSize: 8.5, textTransform: "uppercase", color: BRAND, letterSpacing: 1.2, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  sectionText: { fontSize: 11, lineHeight: 1.6, fontFamily: "Times-Roman", color: INK },
  chartsRow: { flexDirection: "row", gap: 14, marginTop: 10 },
  chartBox: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: PAPER, border: "1pt solid #e5e1da" },
  chartLabel: { fontSize: 8.5, textTransform: "uppercase", color: BRAND, letterSpacing: 1, marginBottom: 8, fontFamily: "Helvetica-Bold" },
  barRow: { marginBottom: 7 },
  barLabelRow: { flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: INK_SOFT },
  barTrack: { height: 5, backgroundColor: "#e5e1da", borderRadius: 3, marginTop: 2 },
  barFill: { height: 5, backgroundColor: GOLD, borderRadius: 3 },
  barTrackSm: { height: 4, backgroundColor: "#e5e1da", borderRadius: 2, marginTop: 2 },
  realFiguresBox: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#ecfdf5",
    border: "1pt solid #a7f3d0",
    marginTop: 10,
  },
  realFiguresLabel: { fontSize: 8.5, textTransform: "uppercase", color: "#065f46", marginBottom: 8, letterSpacing: 1.2, fontFamily: "Helvetica-Bold" },
  statRow: { flexDirection: "row", gap: 10, marginBottom: 6 },
  statCard: { backgroundColor: "#ffffff", borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  statCardLabel: { fontSize: 7, textTransform: "uppercase", color: INK_SOFT, letterSpacing: 0.8 },
  statCardValue: { fontSize: 12, fontFamily: "Times-Bold", color: INK, marginTop: 2 },
  scenarioLabel: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#065f46", marginTop: 6 },
  scenarioRow: { fontSize: 8.5, color: "#374151", marginTop: 2 },
  footer: { marginTop: 26, fontSize: 7.5, color: "#a3a3a3", textAlign: "center", textTransform: "uppercase", letterSpacing: 1 },
});

const SECTIONS: { key: keyof ProposalContent["proposal_sections"]; label: string; index: string }[] = [
  { key: "opening_story", label: "Your Life's Journey", index: "01" },
  { key: "problem_bridge", label: "The Challenge", index: "02" },
  { key: "solution_reveal", label: "The Solution", index: "03" },
  { key: "benefit_breakdown", label: "What You Get", index: "04" },
  { key: "dream_outcome", label: "Your Future", index: "05" },
  { key: "call_to_action", label: "Next Step", index: "06" },
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
        <View style={styles.headerRule}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View>
              <Text style={styles.eyebrow}>Proposal for {content.client_name}</Text>
              <Text style={styles.title}>{content.product_matched}</Text>
            </View>
            <Text style={styles.statusPill}>{proposal.status}</Text>
          </View>
        </View>

        {content.pain_points.length > 0 && (
          <View style={styles.painPointsRow}>
            {content.pain_points.map((p, i) => (
              <Text key={i} style={styles.painPoint}>
                {p}
              </Text>
            ))}
          </View>
        )}

        {SECTIONS.map(({ key, label, index }) => (
          <View key={key} style={styles.section} wrap={false}>
            <Text style={styles.sectionIndex}>{index}</Text>
            <View style={styles.sectionBody}>
              <Text style={styles.sectionLabel}>{label}</Text>
              <Text style={styles.sectionText}>{content.proposal_sections[key]}</Text>
            </View>
          </View>
        ))}

        {content.real_figures && (
          <View style={styles.realFiguresBox} wrap={false}>
            <Text style={styles.realFiguresLabel}>Your Actual Policy Numbers (from your uploaded illustration)</Text>
            <View style={styles.statRow}>
              {content.real_figures.premium !== null && (
                <View style={styles.statCard}>
                  <Text style={styles.statCardLabel}>Premium</Text>
                  <Text style={styles.statCardValue}>
                    {content.real_figures.currency ?? ""} {content.real_figures.premium.toLocaleString()}
                    {content.real_figures.premium_term_years !== null
                      ? ` / yr x ${content.real_figures.premium_term_years}yrs`
                      : ""}
                  </Text>
                </View>
              )}
              {content.real_figures.sum_assured !== null && (
                <View style={styles.statCard}>
                  <Text style={styles.statCardLabel}>Sum Assured</Text>
                  <Text style={styles.statCardValue}>
                    {content.real_figures.currency ?? ""} {content.real_figures.sum_assured.toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
            {content.real_figures.scenarios.map((scenario, i) => (
              <View key={i}>
                <Text style={styles.scenarioLabel}>{scenario.label}</Text>
                <Text style={styles.scenarioRow}>
                  {scenario.rows
                    .map((row) => `Yr ${row.year}: ${content.real_figures!.currency ?? ""} ${row.value.toLocaleString()}`)
                    .join("   ")}
                </Text>
              </View>
            ))}
            {content.real_figures.extraction_status === "partial" && (
              <Text style={{ fontSize: 8, color: "#b45309", marginTop: 6 }}>
                Some figures weren&apos;t found in the uploaded document — please check the original illustration.
              </Text>
            )}
          </View>
        )}

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
                        style={[styles.barFill, { width: `${Math.min(100, Math.max(0, point.value))}%`, backgroundColor: BRAND_DARK }]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <Text style={styles.footer}>Status: {proposal.status} · Generated by fcprop</Text>
      </Page>
    </Document>
  );
}
