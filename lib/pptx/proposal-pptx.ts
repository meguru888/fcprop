import PptxGenJS from "pptxgenjs";
import type { FcProfile, Proposal, ProposalContent } from "@/lib/supabase/types";
import { formatSgd } from "@/lib/format";

const INK = "1C1A17";
const INK_SOFT = "6B6560";
const BRAND = "202D4A";
const GOLD = "A9813F";
const ROSE = "E07A5F";
const EMERALD = "059669";
const PAPER = "FAF8F4";
const WHITE = "FFFFFF";

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

const SLIDE_W = 10;
const MARGIN_X = 0.45;
const CONTENT_W = SLIDE_W - MARGIN_X * 2;

export function buildProposalPptx(
  proposal: Proposal,
  content: ProposalContent,
  fcProfile?: FcProfile | null,
): PptxGenJS {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "fcprop";
  pptx.title = `Proposal for ${content.client_name}`;

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

  // --- Title slide ---
  const title = pptx.addSlide();
  title.background = { color: PAPER };
  title.addText(`PROPOSAL FOR ${content.client_name.toUpperCase()}`, {
    x: MARGIN_X,
    y: 1.7,
    w: CONTENT_W,
    h: 0.4,
    fontSize: 12,
    bold: true,
    color: BRAND,
    charSpacing: 2,
  });
  if (!isGenericProduct(content.product_matched)) {
    title.addText(content.product_matched, {
      x: MARGIN_X,
      y: 2.1,
      w: CONTENT_W,
      h: 1,
      fontSize: 36,
      italic: true,
      color: INK,
      fontFace: "Georgia",
    });
  }
  title.addText(proposal.status.toUpperCase(), {
    x: MARGIN_X,
    y: 3.3,
    w: 2,
    h: 0.4,
    fontSize: 11,
    bold: true,
    color: BRAND,
    fill: { color: "EEF1F7" },
    align: "center",
    valign: "middle",
  });
  if (fcProfile?.name && fcProfile.company_name) {
    const titleLines = (fcProfile.title_credentials ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    title.addText(
      [
        { text: fcProfile.name, options: { bold: true, color: INK, breakLine: true } },
        ...titleLines.map((line) => ({ text: line, options: { color: INK_SOFT, breakLine: true } })),
        { text: `Representing ${fcProfile.company_name}`, options: { italic: true, color: BRAND } },
      ],
      {
        x: MARGIN_X,
        y: 3.85,
        w: CONTENT_W,
        h: 0.6,
        fontSize: 10,
        lineSpacing: 13,
      },
    );
  }
  title.addText(
    SECTIONS.map((s, i) => `${s.index}  ${s.label}`).join("      "),
    {
      x: MARGIN_X,
      y: 4.9,
      w: CONTENT_W,
      h: 0.4,
      fontSize: 9,
      color: INK_SOFT,
      charSpacing: 1,
    }
  );

  // --- Section slides ---
  for (const { key, label, index } of SECTIONS) {
    const slide = pptx.addSlide();
    slide.background = { color: WHITE };

    slide.addText(
      [
        { text: `${index}   `, options: { italic: true, color: GOLD, fontSize: 20, fontFace: "Georgia" } },
        { text: label.toUpperCase(), options: { bold: true, color: BRAND, fontSize: 14, charSpacing: 1.5 } },
      ],
      { x: MARGIN_X, y: 0.35, w: CONTENT_W, h: 0.45 }
    );

    slide.addText(content.proposal_sections[key], {
      x: MARGIN_X,
      y: 0.9,
      w: CONTENT_W,
      h: 1.9,
      fontSize: 13,
      color: INK,
      fontFace: "Georgia",
      valign: "top",
      fit: "shrink",
      lineSpacing: 18,
    });

    if (key === "opening_story" && snapshotStats.length > 0) {
      const boxW = CONTENT_W / snapshotStats.length - 0.15;
      snapshotStats.forEach((s, i) => {
        const x = MARGIN_X + i * (boxW + 0.2);
        slide.addShape("roundRect", {
          x,
          y: 3.0,
          w: boxW,
          h: 0.8,
          fill: { color: "F7F5F1" },
          line: { type: "none" },
          rectRadius: 0.06,
        });
        slide.addText(s.label.toUpperCase(), {
          x,
          y: 3.08,
          w: boxW,
          h: 0.25,
          fontSize: 8,
          color: INK_SOFT,
          align: "left",
          inset: 0.12,
        });
        slide.addText(s.value, {
          x,
          y: 3.3,
          w: boxW,
          h: 0.4,
          fontSize: 14,
          bold: true,
          color: INK,
          align: "left",
          inset: 0.12,
          fontFace: "Georgia",
        });
      });
    }

    if (key === "problem_bridge" && content.pain_points.length > 0) {
      slide.addText(content.pain_points.map((p) => ({ text: `  ${p}  `, options: { breakLine: false } })), {
        x: MARGIN_X,
        y: 3.0,
        w: CONTENT_W,
        h: 0.7,
        fontSize: 9,
        bold: true,
        color: GOLD,
        fill: { color: "F5ECD9" },
        align: "left",
        valign: "top",
        fit: "shrink",
      });
    }

    if (key === "problem_bridge" && beforeAfter.length > 0) {
      addBarChart(pptx, slide, beforeAfter.map((b) => ({ label: b.label, value: b.before })), {
        y: 3.85,
        color: ROSE,
        title: "Where you stand today",
      });
    }

    if (key === "solution_reveal" && beforeAfter.length > 0) {
      addBarChart(pptx, slide, beforeAfter.map((b) => ({ label: b.label, value: b.after })), {
        y: 3.0,
        color: EMERALD,
        title: `Where ${displayProduct(content.product_matched)} gets you`,
      });
    }

    if (key === "benefit_breakdown" && content.real_figures) {
      const rf = content.real_figures;
      const cards: { label: string; value: string }[] = [];
      if (rf.premium !== null) {
        cards.push({
          label: "Premium",
          value: `${formatSgd(rf.premium)}${rf.premium_term_years !== null ? ` / yr x ${rf.premium_term_years}yrs` : ""}`,
        });
      }
      if (rf.sum_assured !== null) cards.push({ label: "Sum Assured", value: formatSgd(rf.sum_assured) });
      cards.forEach((c, i) => {
        const x = MARGIN_X + i * 2.6;
        slide.addShape("roundRect", { x, y: 3.0, w: 2.4, h: 0.7, fill: { color: WHITE }, line: { color: "A7F3D0" }, rectRadius: 0.06 });
        slide.addText(c.label.toUpperCase(), { x, y: 3.06, w: 2.4, h: 0.22, fontSize: 7.5, color: INK_SOFT, inset: 0.12 });
        slide.addText(c.value, { x, y: 3.26, w: 2.4, h: 0.4, fontSize: 12, bold: true, color: INK, inset: 0.12, fontFace: "Georgia" });
      });
      let scenarioY = 3.9;
      rf.scenarios.slice(0, 2).forEach((scenario) => {
        slide.addText(scenario.label, { x: MARGIN_X, y: scenarioY, w: CONTENT_W, h: 0.25, fontSize: 9.5, bold: true, color: "065F46" });
        slide.addText(scenario.rows.map((r) => `Yr ${r.year}: ${formatSgd(r.value)}`).join("    "), {
          x: MARGIN_X,
          y: scenarioY + 0.25,
          w: CONTENT_W,
          h: 0.25,
          fontSize: 9,
          color: "374151",
        });
        scenarioY += 0.55;
      });
    }

    if (key === "dream_outcome" && ageJourney.length > 0) {
      addAgeJourney(slide, ageJourney);
    } else if (key === "dream_outcome" && ageJourney.length === 0 && benefitTimeline.length > 0) {
      addBarChart(pptx, slide, benefitTimeline.map((p) => ({ label: `Year ${p.year}`, value: p.value })), {
        y: 3.0,
        color: BRAND,
        title: "Your Protection Value Over Time",
      });
    }

    if (key === "call_to_action") {
      const boxW = CONTENT_W / NEXT_STEPS.length - 0.15;
      NEXT_STEPS.forEach((step, i) => {
        const x = MARGIN_X + i * (boxW + 0.2);
        slide.addShape("roundRect", { x, y: 3.0, w: boxW, h: 0.7, fill: { color: "EEF1F7" }, line: { type: "none" }, rectRadius: 0.06 });
        slide.addText(
          [
            { text: `${i + 1}  `, options: { italic: true, color: GOLD, fontSize: 12, fontFace: "Georgia" } },
            { text: step, options: { bold: true, color: BRAND, fontSize: 11 } },
          ],
          { x, y: 3.0, w: boxW, h: 0.7, valign: "middle", align: "center" }
        );
      });
    }

    slide.addText(`${content.client_name}  ·  Page ${SECTIONS.findIndex((s) => s.key === key) + 2} of 7`, {
      x: MARGIN_X,
      y: 5.28,
      w: CONTENT_W,
      h: 0.25,
      fontSize: 7,
      color: INK_SOFT,
      align: "right",
    });
  }

  return pptx;
}

function addBarChart(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide,
  rows: { label: string; value: number }[],
  opts: { y: number; color: string; title: string }
) {
  slide.addText(opts.title.toUpperCase(), {
    x: MARGIN_X,
    y: opts.y,
    w: CONTENT_W,
    h: 0.25,
    fontSize: 9,
    bold: true,
    color: opts.color,
    charSpacing: 1,
  });
  slide.addChart(
    pptx.ChartType.bar,
    [
      {
        name: opts.title,
        labels: rows.map((r) => r.label),
        values: rows.map((r) => Math.round(Math.min(100, Math.max(0, r.value)))),
      },
    ],
    {
      x: MARGIN_X,
      y: opts.y + 0.3,
      w: CONTENT_W,
      h: 1.6,
      barDir: "bar",
      chartColors: [opts.color],
      showLegend: false,
      showValue: true,
      dataLabelPosition: "outEnd",
      dataLabelFontSize: 8,
      catAxisLabelFontSize: 8,
      valAxisHidden: true,
      valAxisMaxVal: 100,
      valAxisMinVal: 0,
      barGapWidthPct: 40,
    }
  );
}

function addAgeJourney(
  slide: PptxGenJS.Slide,
  ageJourney: { age: number; before?: { event: string; cost: number }[]; after?: { protectionValue?: number; wealthValue?: number } }[]
) {
  const cardY = 2.45;
  const headerH = 0.32;
  const bodyTop = cardY + headerH;
  const legendY = bodyTop + 0.08;
  const beforeY = legendY + 0.19;

  const maxBeforeItems = Math.max(1, ...ageJourney.map((p) => p.before?.length ?? 0));
  const beforeFontScale = maxBeforeItems > 1 ? 0.75 : 1;
  const beforeCardH = maxBeforeItems === 1 ? 0.46 : 0.16 + maxBeforeItems * 0.26;
  const circleY = beforeY + beforeCardH + 0.04;
  const circleSize = 0.26;
  const captionY = circleY + circleSize + 0.03;
  const afterY = captionY + 0.15;
  const afterH = 0.44;
  const bottomLegendY = afterY + afterH + 0.06;
  const cardBottomY = bottomLegendY + 0.14 + 0.06;

  // Outer premium card background + border, drawn first so it sits behind all content.
  slide.addShape("roundRect", {
    x: MARGIN_X,
    y: cardY,
    w: CONTENT_W,
    h: cardBottomY - cardY,
    fill: { color: WHITE },
    line: { color: "E5E1DA", width: 0.75 },
    rectRadius: 0.06,
  });
  slide.addShape("rect", { x: MARGIN_X, y: cardY, w: CONTENT_W, h: headerH, fill: { color: PAPER }, line: { type: "none" } });
  slide.addShape("line", { x: MARGIN_X, y: cardY + headerH, w: CONTENT_W, h: 0, line: { color: "EFEAE2", width: 0.75 } });

  slide.addText("Your Future Life Journey", {
    x: MARGIN_X + 0.14,
    y: cardY,
    w: CONTENT_W * 0.6,
    h: headerH,
    fontSize: 11,
    italic: true,
    color: INK,
    valign: "middle",
    fontFace: "Georgia",
  });
  const badgeW = 1.55;
  slide.addShape("roundRect", {
    x: MARGIN_X + CONTENT_W - badgeW - 0.14,
    y: cardY + (headerH - 0.2) / 2,
    w: badgeW,
    h: 0.2,
    fill: { color: "EEF1F7" },
    line: { type: "none" },
    rectRadius: 0.1,
  });
  slide.addText("WITH PLAN IN PLACE", {
    x: MARGIN_X + CONTENT_W - badgeW - 0.14,
    y: cardY + (headerH - 0.2) / 2,
    w: badgeW,
    h: 0.2,
    fontSize: 6,
    bold: true,
    color: "2B3B60",
    align: "center",
    valign: "middle",
    charSpacing: 0.5,
  });

  slide.addText(
    [
      { text: "●  ", options: { fontSize: 8, color: "E11D48" } },
      { text: "COST IF NOTHING CHANGES", options: { fontSize: 8, bold: true, color: "B3402D", charSpacing: 0.5 } },
    ],
    { x: MARGIN_X + 0.14, y: legendY, w: CONTENT_W - 0.28, h: 0.16 }
  );

  const colW = (CONTENT_W - 0.2) / ageJourney.length;
  ageJourney.forEach((p, i) => {
    const x = MARGIN_X + 0.1 + i * colW;
    const cardW = colW - 0.1;

    if (p.before) {
      slide.addShape("roundRect", { x, y: beforeY, w: cardW, h: beforeCardH, fill: { color: "FDF1F0" }, line: { color: "F9DAD6", width: 0.5 }, rectRadius: 0.05 });
      const beforeLines = p.before.flatMap((item, j) => [
        {
          text: formatSgd(item.cost),
          options: { bold: true, fontSize: 7.5 * beforeFontScale, color: "B3402D", breakLine: true, ...(j > 0 ? { paraSpaceBefore: 3 } : {}) },
        },
        { text: item.event, options: { fontSize: 5 * beforeFontScale, color: "B3402D", breakLine: true } },
      ]);
      slide.addText(beforeLines, { x, y: beforeY, w: cardW, h: beforeCardH, align: "center", valign: "middle", inset: 0.04 });
    }

    slide.addShape("ellipse", { x: x + cardW / 2 - circleSize / 2, y: circleY, w: circleSize, h: circleSize, fill: { color: BRAND }, line: { color: WHITE, width: 1.5 } });
    slide.addText(String(p.age), { x: x + cardW / 2 - circleSize / 2, y: circleY, w: circleSize, h: circleSize, fontSize: 8, bold: true, color: WHITE, align: "center", valign: "middle", fontFace: "Georgia" });
    slide.addText(`${p.age} years old`, { x, y: captionY, w: cardW, h: 0.14, fontSize: 6, color: INK_SOFT, align: "center" });

    const afterLines: { text: string; options: Record<string, unknown> }[] = [];
    if (p.after?.protectionValue !== undefined) {
      afterLines.push(
        { text: formatSgd(p.after.protectionValue), options: { bold: true, fontSize: 7.5, color: "065F46", breakLine: true } },
        { text: "Protection value", options: { fontSize: 5, color: "065F46", breakLine: true } }
      );
    }
    if (p.after?.wealthValue !== undefined) {
      afterLines.push(
        { text: formatSgd(p.after.wealthValue), options: { bold: true, fontSize: 7.5, color: "065F46", breakLine: true } },
        { text: "Wealth accumulation", options: { fontSize: 5, color: "065F46" } }
      );
    }
    if (afterLines.length > 0) {
      slide.addShape("roundRect", { x, y: afterY, w: cardW, h: afterH, fill: { color: "EFFAF4" }, line: { color: "CDEEE0", width: 0.5 }, rectRadius: 0.05 });
      slide.addText(afterLines, { x, y: afterY, w: cardW, h: afterH, align: "center", valign: "middle", inset: 0.04 });
    }
  });

  slide.addText(
    [
      { text: "●  ", options: { fontSize: 8, color: "059669" } },
      { text: "WITH THIS PLAN IN PLACE", options: { fontSize: 8, bold: true, color: "065F46", charSpacing: 0.5 } },
    ],
    { x: MARGIN_X + 0.14, y: bottomLegendY, w: CONTENT_W - 0.28, h: 0.16 }
  );
}
