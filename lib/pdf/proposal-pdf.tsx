import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { FcProfile, Proposal, ProposalContent } from "@/lib/supabase/types";
import { formatSgd } from "@/lib/format";

const INK = "#1c1a17";
const INK_SOFT = "#6b6560";
const BRAND = "#202d4a";
const BRAND_DARK = "#141c30";
const GOLD = "#a9813f";
const PAPER = "#faf8f4";
const ROSE = "#e07a5f";
const EMERALD = "#059669";

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
  preparedByName: { fontSize: 9, color: INK, fontFamily: "Helvetica-Bold", marginTop: 5, textAlign: "right" },
  preparedByLine: { fontSize: 8, color: INK_SOFT, textAlign: "right" },
  preparedByCompany: { fontSize: 8, color: BRAND, fontFamily: "Helvetica-Oblique", marginTop: 2, textAlign: "right" },
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
  flowRow: { flexDirection: "row", marginBottom: 16 },
  flowNode: { flex: 1, alignItems: "center" },
  flowLineRow: { flexDirection: "row", alignItems: "center", width: "100%" },
  flowLine: { height: 1, flex: 1, backgroundColor: "#dbe1ee" },
  flowLineTransparent: { height: 1, flex: 1, backgroundColor: "transparent" },
  flowCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#9db0d1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  flowCircleText: { fontSize: 7.5, fontFamily: "Times-Italic", color: BRAND },
  flowLabel: { fontSize: 5.5, textTransform: "uppercase", color: INK_SOFT, marginTop: 4, textAlign: "center", fontFamily: "Helvetica-Bold" },
  section: { marginBottom: 16, flexDirection: "row", gap: 12 },
  sectionIndex: { width: 24, fontSize: 13, fontFamily: "Times-Italic", color: GOLD },
  sectionBody: { flex: 1, borderLeftWidth: 1.5, borderLeftColor: "#dbe1ee", paddingLeft: 12 },
  sectionLabel: { fontSize: 8.5, textTransform: "uppercase", color: BRAND, letterSpacing: 1.2, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  sectionText: { fontSize: 11, lineHeight: 1.6, fontFamily: "Times-Roman", color: INK },
  snapshotRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  snapshotCard: { backgroundColor: "#f7f5f1", borderRadius: 5, paddingVertical: 5, paddingHorizontal: 8 },
  snapshotLabel: { fontSize: 6.5, textTransform: "uppercase", color: INK_SOFT },
  snapshotValue: { fontSize: 9, fontFamily: "Times-Bold", color: INK, marginTop: 1 },
  subBox: { padding: 10, borderRadius: 6, marginTop: 8 },
  subBoxLabel: { fontSize: 7.5, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  barRow: { marginBottom: 7 },
  barLabelRow: { flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: INK_SOFT },
  barTrack: { height: 5, backgroundColor: "#e5e1da", borderRadius: 3, marginTop: 2 },
  barFill: { height: 5, backgroundColor: GOLD, borderRadius: 3 },
  barTrackSm: { height: 4, backgroundColor: "#e5e1da", borderRadius: 2, marginTop: 2 },
  barFillSm: { height: 4, borderRadius: 2 },
  realFiguresBox: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#ecfdf5",
    border: "1pt solid #a7f3d0",
    marginTop: 8,
  },
  realFiguresLabel: { fontSize: 8.5, textTransform: "uppercase", color: "#065f46", marginBottom: 8, letterSpacing: 1.2, fontFamily: "Helvetica-Bold" },
  statRow: { flexDirection: "row", gap: 10, marginBottom: 6 },
  statCard: { backgroundColor: "#ffffff", borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  statCardLabel: { fontSize: 7, textTransform: "uppercase", color: INK_SOFT, letterSpacing: 0.8 },
  statCardValue: { fontSize: 12, fontFamily: "Times-Bold", color: INK, marginTop: 2 },
  scenarioLabel: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#065f46", marginTop: 6 },
  scenarioRow: { fontSize: 8.5, color: "#374151", marginTop: 2 },
  timelineBox: { borderRadius: 12, backgroundColor: "#ffffff", border: "1pt solid #e5e1da", marginTop: 8, overflow: "hidden" },
  timelineHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: PAPER,
    borderBottom: "1pt solid #efeae2",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  timelineLabel: { fontSize: 11, fontFamily: "Times-Italic", color: INK },
  timelineBadge: {
    fontSize: 6.5,
    textTransform: "uppercase",
    color: BRAND,
    backgroundColor: "#eef1f7",
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.4,
  },
  timelineBody: { padding: 12 },
  stepsRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  stepChip: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#eef1f7", borderRadius: 5, paddingVertical: 5, paddingHorizontal: 7 },
  stepNum: { fontSize: 8, fontFamily: "Times-Italic", color: GOLD },
  stepText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: BRAND },
  stepArrow: { fontSize: 8, color: "#c7ccd6", marginHorizontal: 3 },
  timelineLegendRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  timelineLegendDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#b3402d" },
  timelineLegendDotAfter: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#065f46" },
  timelineLegendBefore: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#b3402d", textTransform: "uppercase", letterSpacing: 0.6 },
  timelineLegendAfter: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#065f46", textTransform: "uppercase", letterSpacing: 0.6 },
  timelineJourneyRow: { flexDirection: "row", alignItems: "flex-end" },
  timelineNode: { flex: 1, alignItems: "center" },
  timelineBeforeCard: {
    backgroundColor: "#fdf1f0",
    borderRadius: 9,
    padding: 6,
    marginBottom: 8,
    minHeight: 34,
    width: "94%",
    justifyContent: "center",
  },
  timelineBeforeCost: { fontSize: 7.5, fontFamily: "Times-Bold", color: "#b3402d", textAlign: "center" },
  timelineBeforeEvent: { fontSize: 5.5, color: "#b3402d", textAlign: "center", marginTop: 1 },
  timelineBeforeItem: { borderTop: "0.5pt solid #f3d4d0", paddingTop: 4, marginTop: 4 },
  timelineAxisRow: { flexDirection: "row", alignItems: "center", width: "100%" },
  timelineAxisLine: { height: 1, flex: 1, backgroundColor: "#e5e1da" },
  timelineAxisLineTransparent: { height: 1, flex: 1, backgroundColor: "transparent" },
  timelineAgeCaption: { fontSize: 5.5, fontFamily: "Helvetica-Bold", color: INK_SOFT, textAlign: "center", marginTop: 4 },
  timelineCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND,
  },
  timelineAgeText: { fontSize: 7.5, fontFamily: "Times-Bold", color: "#ffffff" },
  timelineAfterCard: {
    backgroundColor: "#effaf4",
    borderRadius: 9,
    padding: 6,
    marginTop: 8,
    minHeight: 40,
    width: "94%",
    justifyContent: "center",
  },
  timelineAfterValue: { fontSize: 7.5, fontFamily: "Times-Bold", color: "#065f46", textAlign: "center" },
  timelineAfterLabel: { fontSize: 5.5, color: "#065f46", textAlign: "center", marginTop: 1 },
});

const GENERIC_PRODUCT_LABEL = "the recommended solution";
const LEGACY_GENERIC_LABELS = new Set(["Uploaded benefit illustration", GENERIC_PRODUCT_LABEL]);
const isGenericProduct = (value: string) => LEGACY_GENERIC_LABELS.has(value);
const displayProduct = (value: string) => (isGenericProduct(value) ? GENERIC_PRODUCT_LABEL : value);

const SECTIONS: { key: keyof ProposalContent["proposal_sections"]; label: string; index: string }[] = [
  { key: "opening_story", label: "Your Life's Journey", index: "01" },
  { key: "problem_bridge", label: "The Problems/Obstacles", index: "02" },
  { key: "solution_reveal", label: "The Solution", index: "03" },
  { key: "benefit_breakdown", label: "What You Get", index: "04" },
  { key: "dream_outcome", label: "Your Future", index: "05" },
  { key: "call_to_action", label: "Next Step", index: "06" },
];

const NEXT_STEPS = ["Review together", "Confirm the plan", "You're protected"];

export function ProposalPdfDocument({
  proposal,
  content,
  fcProfile,
}: {
  proposal: Proposal;
  content: ProposalContent;
  fcProfile?: FcProfile | null;
}) {
  const beforeAfter = content.charts?.before_after ?? [];
  const benefitTimeline = content.charts?.benefit_timeline ?? [];
  const riskEvents = content.risk_events ?? [];

  type AgePoint = {
    age: number;
    before?: { event: string; cost: number }[];
    after?: { protectionValue?: number; wealthValue?: number };
  };
  const sumAssured = content.real_figures?.sum_assured ?? null;
  const scenario = content.real_figures?.scenarios?.[0];

  const ageJourneyMap = new Map<number, AgePoint>();
  for (const r of riskEvents) {
    const existing = ageJourneyMap.get(r.age);
    if (existing) {
      existing.before = [...(existing.before ?? []), { event: r.event, cost: r.cost }];
    } else {
      ageJourneyMap.set(r.age, { age: r.age, before: [{ event: r.event, cost: r.cost }] });
    }
  }
  if (content.client_age !== null && scenario) {
    for (const row of scenario.rows) {
      const age = content.client_age + row.year;
      const existing = ageJourneyMap.get(age);
      if (existing) {
        existing.after = { ...(existing.after ?? {}), wealthValue: row.value };
      } else {
        ageJourneyMap.set(age, { age, after: { wealthValue: row.value } });
      }
    }
  }
  if (sumAssured !== null) {
    for (const point of ageJourneyMap.values()) {
      if (point.before) point.after = { ...(point.after ?? {}), protectionValue: sumAssured };
    }
  }
  const ageJourney: AgePoint[] = Array.from(ageJourneyMap.values())
    .sort((a, b) => a.age - b.age)
    .slice(0, 6);

  const snapshotStats = [
    content.client_age !== null ? { label: "Age", value: String(content.client_age) } : null,
    content.pain_points.length > 0 ? { label: "Concerns flagged", value: String(content.pain_points.length) } : null,
    !isGenericProduct(content.product_matched) ? { label: "Reviewing", value: content.product_matched } : null,
  ].filter((s): s is { label: string; value: string } => s !== null);

  return (
    <Document title={`Proposal for ${content.client_name}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRule}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View>
              <Text style={styles.eyebrow}>Proposal for {content.client_name}</Text>
              {!isGenericProduct(content.product_matched) && (
                <Text style={styles.title}>{content.product_matched}</Text>
              )}
            </View>
            <View>
              <Text style={styles.statusPill}>{proposal.status}</Text>
              {fcProfile?.name && fcProfile.company_name && (
                <View>
                  <Text style={styles.preparedByName}>{fcProfile.name}</Text>
                  {(fcProfile.title_credentials ?? "")
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line, i) => (
                      <Text key={i} style={styles.preparedByLine}>
                        {line}
                      </Text>
                    ))}
                  <Text style={styles.preparedByCompany}>Representing {fcProfile.company_name}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.flowRow} wrap={false}>
          {SECTIONS.map(({ key, label, index }, i) => (
            <View key={key} style={styles.flowNode}>
              <View style={styles.flowLineRow}>
                <View style={i === 0 ? styles.flowLineTransparent : styles.flowLine} />
                <View style={styles.flowCircle}>
                  <Text style={styles.flowCircleText}>{index}</Text>
                </View>
                <View style={i === SECTIONS.length - 1 ? styles.flowLineTransparent : styles.flowLine} />
              </View>
              <Text style={styles.flowLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {SECTIONS.map(({ key, label, index }) => (
          <View key={key} style={styles.section} wrap={false}>
            <Text style={styles.sectionIndex}>{index}</Text>
            <View style={styles.sectionBody}>
              <Text style={styles.sectionLabel}>{label}</Text>
              <Text style={styles.sectionText}>{content.proposal_sections[key]}</Text>

              {key === "opening_story" && snapshotStats.length > 0 && (
                <View style={styles.snapshotRow}>
                  {snapshotStats.map((s, i) => (
                    <View key={i} style={styles.snapshotCard}>
                      <Text style={styles.snapshotLabel}>{s.label}</Text>
                      <Text style={styles.snapshotValue}>{s.value}</Text>
                    </View>
                  ))}
                </View>
              )}

              {key === "problem_bridge" && content.pain_points.length > 0 && (
                <View style={[styles.painPointsRow, { marginBottom: 0, marginTop: 8 }]}>
                  {content.pain_points.map((p, i) => (
                    <Text key={i} style={styles.painPoint}>
                      {p}
                    </Text>
                  ))}
                </View>
              )}

              {key === "problem_bridge" && beforeAfter.length > 0 && (
                <View style={[styles.subBox, { backgroundColor: "#fff1f0", border: "1pt solid #fecdd3" }]}>
                  <Text style={[styles.subBoxLabel, { color: "#b3402d" }]}>Where you stand today</Text>
                  {beforeAfter.map((bar, i) => (
                    <View key={i} style={styles.barRow}>
                      <View style={styles.barLabelRow}>
                        <Text>{bar.label}</Text>
                        <Text>{Math.round(Math.min(100, Math.max(0, bar.before)))}%</Text>
                      </View>
                      <View style={styles.barTrackSm}>
                        <View
                          style={[styles.barFillSm, { width: `${Math.min(100, Math.max(0, bar.before))}%`, backgroundColor: ROSE }]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {key === "solution_reveal" && beforeAfter.length > 0 && (
                <View style={[styles.subBox, { backgroundColor: "#ecfdf5", border: "1pt solid #a7f3d0" }]}>
                  <Text style={[styles.subBoxLabel, { color: "#065f46" }]}>
                    Where {displayProduct(content.product_matched)} gets you
                  </Text>
                  {beforeAfter.map((bar, i) => (
                    <View key={i} style={styles.barRow}>
                      <View style={styles.barLabelRow}>
                        <Text>{bar.label}</Text>
                        <Text>{Math.round(Math.min(100, Math.max(0, bar.after)))}%</Text>
                      </View>
                      <View style={styles.barTrackSm}>
                        <View
                          style={[styles.barFillSm, { width: `${Math.min(100, Math.max(0, bar.after))}%`, backgroundColor: EMERALD }]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {key === "benefit_breakdown" && content.real_figures && (
                <View style={styles.realFiguresBox}>
                  <Text style={styles.realFiguresLabel}>Your Actual Policy Numbers (from benefit illustration)</Text>
                  <View style={styles.statRow}>
                    {content.real_figures.premium !== null && (
                      <View style={styles.statCard}>
                        <Text style={styles.statCardLabel}>Premium</Text>
                        <Text style={styles.statCardValue}>
                          {formatSgd(content.real_figures.premium)}
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
                          {formatSgd(content.real_figures.sum_assured)}
                        </Text>
                      </View>
                    )}
                  </View>
                  {content.real_figures.scenarios.map((scenario, i) => (
                    <View key={i}>
                      <Text style={styles.scenarioLabel}>{scenario.label}</Text>
                      <Text style={styles.scenarioRow}>
                        {scenario.rows
                          .map((row) => `Yr ${row.year}: ${formatSgd(row.value)}`)
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

              {key === "dream_outcome" && ageJourney.length > 0 && (
                <View style={styles.timelineBox}>
                  <View style={styles.timelineHeaderRow}>
                    <Text style={styles.timelineLabel}>Your Future Life Journey</Text>
                    <Text style={styles.timelineBadge}>With plan in place</Text>
                  </View>
                  <View style={styles.timelineBody}>
                    <View style={styles.timelineLegendRow}>
                      <View style={styles.timelineLegendDot} />
                      <Text style={styles.timelineLegendBefore}>Cost if nothing changes</Text>
                    </View>
                    <View style={styles.timelineJourneyRow}>
                      {ageJourney.map((point, i) => (
                        <View key={i} style={styles.timelineNode}>
                          <View style={point.before ? styles.timelineBeforeCard : { minHeight: 34 }}>
                            {point.before?.map((item, j) => (
                              <View key={j} style={j > 0 ? styles.timelineBeforeItem : undefined}>
                                <Text style={styles.timelineBeforeCost}>{formatSgd(item.cost)}</Text>
                                <Text style={styles.timelineBeforeEvent}>{item.event}</Text>
                              </View>
                            ))}
                          </View>
                          <View style={styles.timelineAxisRow}>
                            <View style={i === 0 ? styles.timelineAxisLineTransparent : styles.timelineAxisLine} />
                            <View style={styles.timelineCircle}>
                              <Text style={styles.timelineAgeText}>{point.age}</Text>
                            </View>
                            <View style={i === ageJourney.length - 1 ? styles.timelineAxisLineTransparent : styles.timelineAxisLine} />
                          </View>
                          <Text style={styles.timelineAgeCaption}>{point.age} years old</Text>
                          <View style={point.after ? styles.timelineAfterCard : { minHeight: 30 }}>
                            {point.after?.protectionValue !== undefined && (
                              <>
                                <Text style={styles.timelineAfterValue}>{formatSgd(point.after.protectionValue)}</Text>
                                <Text style={styles.timelineAfterLabel}>Protection value</Text>
                              </>
                            )}
                            {point.after?.wealthValue !== undefined && (
                              <>
                                <Text style={[styles.timelineAfterValue, { marginTop: 3 }]}>
                                  {formatSgd(point.after.wealthValue)}
                                </Text>
                                <Text style={styles.timelineAfterLabel}>Wealth accumulation</Text>
                              </>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                    <View style={[styles.timelineLegendRow, { marginTop: 8, marginBottom: 0 }]}>
                      <View style={styles.timelineLegendDotAfter} />
                      <Text style={styles.timelineLegendAfter}>With this plan in place</Text>
                    </View>
                  </View>
                </View>
              )}

              {key === "dream_outcome" && ageJourney.length === 0 && benefitTimeline.length > 0 && (
                <View style={[styles.timelineBox, { padding: 12 }]}>
                  <Text style={styles.timelineLabel}>Your Protection Value Over Time</Text>
                  {benefitTimeline.map((point, i) => (
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

              {key === "call_to_action" && (
                <View style={styles.stepsRow}>
                  {NEXT_STEPS.map((step, i) => (
                    <View key={i} style={{ flexDirection: "row", flex: 1, alignItems: "center" }}>
                      <View style={styles.stepChip}>
                        <Text style={styles.stepNum}>{i + 1}</Text>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                      {i < NEXT_STEPS.length - 1 && <Text style={styles.stepArrow}>{"->"}</Text>}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}
      </Page>
    </Document>
  );
}
