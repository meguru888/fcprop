import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import type { FcProfile, Proposal, ProposalContent } from "@/lib/supabase/types";
import { formatSgd } from "@/lib/format";

const INK = "1c1a17";
const INK_SOFT = "6b6560";
const BRAND = "202d4a";
const GOLD = "a9813f";
const ROSE = "e07a5f";
const ROSE_TRACK = "fbe4dd";
const EMERALD = "059669";
const EMERALD_TRACK = "d5f2e3";
const TRACK = "e5e1da";

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

function noBorderCell(children: Paragraph[], opts: { width?: number; shading?: string } = {}) {
  return new TableCell({
    children,
    width: opts.width !== undefined ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.shading ? { type: ShadingType.CLEAR, fill: opts.shading } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
  });
}

function barChart(rows: { label: string; value: number }[], color: string, track: string) {
  const elements: (Paragraph | Table)[] = [];
  rows.forEach((row) => {
    const pct = Math.round(Math.min(100, Math.max(0, row.value)));
    elements.push(
      new Paragraph({
        spacing: { before: 120, after: 40 },
        tabStops: [{ type: "right", position: 9000 }],
        children: [
          new TextRun({ text: row.label, size: 18, color: INK_SOFT }),
          new TextRun({ text: `\t${pct}%`, size: 18, bold: true, color: color }),
        ],
      })
    );
    elements.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            height: { value: 60, rule: "exact" },
            children: [
              noBorderCell([new Paragraph("")], { width: pct, shading: color }),
              noBorderCell([new Paragraph("")], { width: 100 - pct, shading: track }),
            ],
          }),
        ],
      })
    );
  });
  return elements;
}

function statChips(stats: { label: string; value: string }[]) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: stats.map(
          (s) =>
            new TableCell({
              width: { size: Math.floor(100 / stats.length), type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, fill: "f7f5f1" },
              margins: { top: 100, bottom: 100, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: s.label.toUpperCase(), size: 13, color: INK_SOFT })],
                }),
                new Paragraph({
                  spacing: { before: 40 },
                  children: [new TextRun({ text: s.value, size: 22, bold: true, color: INK })],
                }),
              ],
            })
        ),
      }),
    ],
  });
}

function tagsParagraph(tags: string[]) {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    children: tags.map(
      (t, i) =>
        new TextRun({
          text: `${t}${i < tags.length - 1 ? "   •   " : ""}`,
          size: 18,
          bold: true,
          color: GOLD,
        })
    ),
  });
}

export function buildProposalDocx(
  proposal: Proposal,
  content: ProposalContent,
  fcProfile?: FcProfile | null,
): Document {
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

  const body: (Paragraph | Table)[] = [];

  body.push(
    new Paragraph({
      children: [new TextRun({ text: `Proposal for ${content.client_name}`, size: 18, bold: true, color: BRAND })],
    })
  );
  if (!isGenericProduct(content.product_matched)) {
    body.push(
      new Paragraph({
        spacing: { before: 80, after: 200 },
        children: [new TextRun({ text: content.product_matched, size: 40, italics: true, color: INK })],
      })
    );
  } else {
    body.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
  }
  body.push(
    new Paragraph({
      spacing: { after: fcProfile?.name && fcProfile.company_name ? 40 : 200 },
      children: [
        new TextRun({ text: `Status: ${proposal.status.toUpperCase()}`, size: 16, bold: true, color: INK_SOFT }),
      ],
    })
  );
  if (fcProfile?.name && fcProfile.company_name) {
    const titleLines = (fcProfile.title_credentials ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    body.push(
      new Paragraph({
        spacing: { after: 20 },
        children: [new TextRun({ text: fcProfile.name, size: 16, bold: true, color: INK })],
      })
    );
    for (const line of titleLines) {
      body.push(
        new Paragraph({
          spacing: { after: 20 },
          children: [new TextRun({ text: line, size: 16, color: INK_SOFT })],
        })
      );
    }
    body.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({ text: `Representing ${fcProfile.company_name}`, size: 16, italics: true, color: BRAND }),
        ],
      })
    );
  }

  for (const { key, label, index } of SECTIONS) {
    body.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 320, after: 100 },
        children: [
          new TextRun({ text: `${index}  `, italics: true, color: GOLD, size: 22 }),
          new TextRun({ text: label.toUpperCase(), bold: true, color: BRAND, size: 18 }),
        ],
      })
    );
    body.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: content.proposal_sections[key], size: 22, color: INK })],
      })
    );

    if (key === "opening_story" && snapshotStats.length > 0) {
      body.push(statChips(snapshotStats));
    }

    if (key === "problem_bridge" && content.pain_points.length > 0) {
      body.push(tagsParagraph(content.pain_points));
    }

    if (key === "problem_bridge" && beforeAfter.length > 0) {
      body.push(
        new Paragraph({
          spacing: { before: 120 },
          children: [new TextRun({ text: "WHERE YOU STAND TODAY", bold: true, size: 15, color: ROSE })],
        })
      );
      body.push(...barChart(beforeAfter.map((b) => ({ label: b.label, value: b.before })), ROSE, ROSE_TRACK));
    }

    if (key === "solution_reveal" && beforeAfter.length > 0) {
      body.push(
        new Paragraph({
          spacing: { before: 120 },
          children: [
            new TextRun({
              text: `WHERE ${displayProduct(content.product_matched).toUpperCase()} GETS YOU`,
              bold: true,
              size: 15,
              color: EMERALD,
            }),
          ],
        })
      );
      body.push(...barChart(beforeAfter.map((b) => ({ label: b.label, value: b.after })), EMERALD, EMERALD_TRACK));
    }

    if (key === "benefit_breakdown" && content.real_figures) {
      const rf = content.real_figures;
      body.push(
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [
            new TextRun({
              text: "YOUR ACTUAL POLICY NUMBERS (FROM BENEFIT ILLUSTRATION)",
              bold: true,
              size: 15,
              color: "065f46",
            }),
          ],
        })
      );
      const statCells: { label: string; value: string }[] = [];
      if (rf.premium !== null) {
        statCells.push({
          label: "Premium",
          value: `${formatSgd(rf.premium)}${rf.premium_term_years !== null ? ` / yr x ${rf.premium_term_years}yrs` : ""}`,
        });
      }
      if (rf.sum_assured !== null) statCells.push({ label: "Sum Assured", value: formatSgd(rf.sum_assured) });
      if (statCells.length > 0) body.push(statChips(statCells));
      rf.scenarios.forEach((scenario) => {
        body.push(
          new Paragraph({
            spacing: { before: 100 },
            children: [new TextRun({ text: scenario.label, bold: true, size: 17, color: "065f46" })],
          })
        );
        body.push(
          new Paragraph({
            children: [
              new TextRun({
                text: scenario.rows.map((r) => `Yr ${r.year}: ${formatSgd(r.value)}`).join("   "),
                size: 17,
                color: "374151",
              }),
            ],
          })
        );
      });
      if (rf.extraction_status === "partial") {
        body.push(
          new Paragraph({
            spacing: { before: 100 },
            children: [
              new TextRun({
                text: "Some figures weren't found in the uploaded document — please check the original illustration.",
                italics: true,
                size: 16,
                color: "b45309",
              }),
            ],
          })
        );
      }
    }

    if (key === "dream_outcome" && ageJourney.length > 0) {
      body.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  shading: { type: ShadingType.CLEAR, fill: "faf8f4" },
                  margins: { top: 90, bottom: 90, left: 120, right: 120 },
                  verticalAlign: VerticalAlign.CENTER,
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 2, color: "e5e1da" },
                    bottom: { style: BorderStyle.SINGLE, size: 2, color: "e5e1da" },
                    left: { style: BorderStyle.SINGLE, size: 2, color: "e5e1da" },
                    right: { style: BorderStyle.SINGLE, size: 2, color: "e5e1da" },
                  },
                  children: [
                    new Paragraph({
                      tabStops: [{ type: "right", position: 9350 }],
                      children: [
                        new TextRun({ text: "Your Future Life Journey", italics: true, size: 20, color: INK }),
                        new TextRun({ text: "\tWITH PLAN IN PLACE", bold: true, size: 12, color: "2b3b60" }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );
      body.push(
        new Paragraph({
          spacing: { before: 140, after: 60 },
          children: [
            new TextRun({ text: "●  ", size: 13, color: "e11d48" }),
            new TextRun({ text: "COST IF NOTHING CHANGES", bold: true, size: 13, color: "b3402d" }),
          ],
        })
      );
      const colWidth = Math.floor(100 / ageJourney.length);
      body.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: ageJourney.map((p) =>
                noBorderCell(
                  p.before
                    ? p.before.flatMap((item, j) => [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          spacing: { before: j > 0 ? 100 : 0 },
                          border: j > 0 ? { top: { style: BorderStyle.SINGLE, size: 2, color: "f3d4d0" } } : undefined,
                          children: [new TextRun({ text: formatSgd(item.cost), bold: true, size: 16, color: "b3402d" })],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [new TextRun({ text: item.event, size: 12, color: "b3402d" })],
                        }),
                      ])
                    : [new Paragraph("")],
                  { width: colWidth, shading: p.before ? "fdf1f0" : undefined }
                )
              ),
            }),
            new TableRow({
              children: ageJourney.map(
                (p) =>
                  new TableCell({
                    width: { size: colWidth, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 100, bottom: 100 },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 4, color: "e5e1da" },
                    },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 60 },
                        children: [new TextRun({ text: `${p.age}`, bold: true, size: 18, color: "ffffff", shading: { type: ShadingType.CLEAR, fill: BRAND } })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 40 },
                        children: [new TextRun({ text: "years old", size: 11, color: INK_SOFT })],
                      }),
                    ],
                  })
              ),
            }),
            new TableRow({
              children: ageJourney.map((p) => {
                const cellChildren: Paragraph[] = [];
                if (p.after?.protectionValue !== undefined) {
                  cellChildren.push(
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: formatSgd(p.after.protectionValue), bold: true, size: 16, color: "065f46" })],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "Protection value", size: 12, color: "065f46" })],
                    })
                  );
                }
                if (p.after?.wealthValue !== undefined) {
                  cellChildren.push(
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: cellChildren.length > 0 ? 60 : 0 },
                      border: cellChildren.length > 0 ? { top: { style: BorderStyle.SINGLE, size: 2, color: "cdeee0" } } : undefined,
                      children: [new TextRun({ text: formatSgd(p.after.wealthValue), bold: true, size: 16, color: "065f46" })],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "Wealth accumulation", size: 12, color: "065f46" })],
                    })
                  );
                }
                if (cellChildren.length === 0) cellChildren.push(new Paragraph(""));
                return noBorderCell(cellChildren, { width: colWidth, shading: p.after ? "effaf4" : undefined });
              }),
            }),
          ],
        })
      );
      body.push(
        new Paragraph({
          spacing: { before: 140 },
          children: [
            new TextRun({ text: "●  ", size: 13, color: "059669" }),
            new TextRun({ text: "WITH THIS PLAN IN PLACE", bold: true, size: 13, color: "065f46" }),
          ],
        })
      );
    } else if (key === "dream_outcome" && ageJourney.length === 0 && benefitTimeline.length > 0) {
      body.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [new TextRun({ text: "YOUR PROTECTION VALUE OVER TIME", bold: true, size: 15, color: BRAND })],
        })
      );
      body.push(...barChart(benefitTimeline.map((p) => ({ label: `Year ${p.year}`, value: p.value })), BRAND, TRACK));
    }

    if (key === "call_to_action") {
      body.push(
        new Paragraph({
          spacing: { before: 120 },
          children: NEXT_STEPS.flatMap((step, i) => [
            new TextRun({ text: `${i + 1}. ${step}`, bold: true, size: 18, color: BRAND }),
            ...(i < NEXT_STEPS.length - 1 ? [new TextRun({ text: "   →   ", size: 18, color: "c7ccd6" })] : []),
          ]),
        })
      );
    }
  }

  return new Document({
    sections: [{ children: body }],
  });
}
