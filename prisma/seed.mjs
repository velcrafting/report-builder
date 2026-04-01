/**
 * Seed file for local dev database.
 *
 * Creates representative data across all models so every route and
 * repository helper has something to work with immediately after a
 * `prisma migrate reset`.
 *
 * Run via:  node prisma/seed.mjs
 * Or via:   npm run db:seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database…");

  // ── Users ────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Alice Admin",
      role: "admin",
      isWhitelisted: true,
    },
  });

  const editor = await prisma.user.upsert({
    where: { email: "editor@example.com" },
    update: {},
    create: {
      email: "editor@example.com",
      name: "Bob Editor",
      role: "editor",
      isWhitelisted: true,
    },
  });

  const approver = await prisma.user.upsert({
    where: { email: "approver@example.com" },
    update: {},
    create: {
      email: "approver@example.com",
      name: "Carol Approver",
      role: "approver",
      isWhitelisted: true,
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: "viewer@example.com" },
    update: {},
    create: {
      email: "viewer@example.com",
      name: "Dave Viewer",
      role: "viewer",
      isWhitelisted: true,
    },
  });

  console.log("  ✓ Users");

  // ── Periods ──────────────────────────────────────────────────────────
  const prevPeriod = await prisma.period.create({
    data: {
      cadence: "monthly",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-01-31"),
      label: "January 2026",
    },
  });

  const currentPeriod = await prisma.period.create({
    data: {
      cadence: "monthly",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-02-28"),
      label: "February 2026",
      comparisonPeriodId: prevPeriod.id,
    },
  });

  const quarterlyPeriod = await prisma.period.create({
    data: {
      cadence: "quarterly",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-03-31"),
      label: "Q1 2026",
    },
  });

  console.log("  ✓ Periods");

  // ── Field Registry ───────────────────────────────────────────────────
  const fieldRegistryEntries = [
    // Finance section
    {
      section: "finance",
      sourceColumnName: "Revenue",
      internalKey: "finance_revenue",
      displayLabel: "Revenue",
      fieldType: "currency",
      fieldRole: "kpi",
      widgetEligible: true,
    },
    {
      section: "finance",
      sourceColumnName: "Expenses",
      internalKey: "finance_expenses",
      displayLabel: "Expenses",
      fieldType: "currency",
      fieldRole: "kpi",
      widgetEligible: true,
    },
    {
      section: "finance",
      sourceColumnName: "Net Income",
      internalKey: "finance_net_income",
      displayLabel: "Net Income",
      fieldType: "currency",
      fieldRole: "kpi",
      widgetEligible: true,
    },
    {
      section: "finance",
      sourceColumnName: "Margin %",
      internalKey: "finance_margin_pct",
      displayLabel: "Margin %",
      fieldType: "percent",
      fieldRole: "metric",
      widgetEligible: true,
    },
    // Operations section
    {
      section: "operations",
      sourceColumnName: "Headcount",
      internalKey: "ops_headcount",
      displayLabel: "Headcount",
      fieldType: "number",
      fieldRole: "kpi",
      widgetEligible: true,
    },
    {
      section: "operations",
      sourceColumnName: "Projects Active",
      internalKey: "ops_projects_active",
      displayLabel: "Active Projects",
      fieldType: "number",
      fieldRole: "metric",
      widgetEligible: true,
    },
    {
      section: "operations",
      sourceColumnName: "On-Time Rate",
      internalKey: "ops_on_time_rate",
      displayLabel: "On-Time Delivery Rate",
      fieldType: "percent",
      fieldRole: "kpi",
      widgetEligible: true,
    },
    // Customers section
    {
      section: "customers",
      sourceColumnName: "New Customers",
      internalKey: "cust_new",
      displayLabel: "New Customers",
      fieldType: "number",
      fieldRole: "kpi",
      widgetEligible: true,
    },
    {
      section: "customers",
      sourceColumnName: "Churn Rate",
      internalKey: "cust_churn_rate",
      displayLabel: "Churn Rate",
      fieldType: "percent",
      fieldRole: "metric",
      widgetEligible: true,
    },
    {
      section: "customers",
      sourceColumnName: "NPS Score",
      internalKey: "cust_nps",
      displayLabel: "NPS Score",
      fieldType: "number",
      fieldRole: "kpi",
      widgetEligible: true,
    },
  ];

  await prisma.fieldRegistryEntry.createMany({ data: fieldRegistryEntries });

  console.log("  ✓ Field Registry");

  // ── Import Batches ───────────────────────────────────────────────────
  const financeImport = await prisma.importBatch.create({
    data: {
      section: "finance",
      periodId: currentPeriod.id,
      kind: "primary",
      filename: "finance_feb2026.csv",
      uploadedByUserId: editor.id,
      status: "normalized",
      notes: "Monthly finance export from accounting system",
    },
  });

  const opsImport = await prisma.importBatch.create({
    data: {
      section: "operations",
      periodId: currentPeriod.id,
      kind: "primary",
      filename: "operations_feb2026.csv",
      uploadedByUserId: editor.id,
      status: "mapped",
    },
  });

  // Raw rows for finance import
  await prisma.rawImportRow.createMany({
    data: [
      {
        importBatchId: financeImport.id,
        rowIndex: 0,
        rawJson: JSON.stringify({ Revenue: "1250000", Expenses: "980000", "Net Income": "270000", "Margin %": "21.6" }),
      },
      {
        importBatchId: financeImport.id,
        rowIndex: 1,
        rawJson: JSON.stringify({ Revenue: "980000", Expenses: "850000", "Net Income": "130000", "Margin %": "13.3" }),
      },
    ],
  });

  // Normalized records
  await prisma.normalizedRecord.createMany({
    data: [
      {
        section: "finance",
        periodId: currentPeriod.id,
        importBatchId: financeImport.id,
        sourceRowId: "row_0",
        normalizedJson: JSON.stringify({
          finance_revenue: 1250000,
          finance_expenses: 980000,
          finance_net_income: 270000,
          finance_margin_pct: 21.6,
        }),
      },
    ],
  });

  console.log("  ✓ Import Batches + Raw Rows + Normalized Records");

  // ── Report Drafts + Widget Instances ─────────────────────────────────
  const financeDraft = await prisma.reportDraft.create({
    data: {
      section: "finance",
      periodId: currentPeriod.id,
      createdByUserId: editor.id,
      status: "draft",
      title: "Finance Report – February 2026",
      summary: "Revenue grew 4.2% MoM. Net income constrained by one-time infrastructure costs.",
    },
  });

  await prisma.widgetInstance.createMany({
    data: [
      {
        reportDraftId: financeDraft.id,
        widgetType: "kpi-card",
        zoneKey: "header",
        size: "small",
        configJson: JSON.stringify({
          label: "Revenue",
          value: 1250000,
          format: "currency",
          comparison: { value: 1200000, label: "Jan 2026" },
        }),
        sortOrder: 0,
        includeInRollup: true,
      },
      {
        reportDraftId: financeDraft.id,
        widgetType: "kpi-card",
        zoneKey: "header",
        size: "small",
        configJson: JSON.stringify({
          label: "Net Income",
          value: 270000,
          format: "currency",
          comparison: { value: 310000, label: "Jan 2026" },
        }),
        sortOrder: 1,
        includeInRollup: true,
      },
      {
        reportDraftId: financeDraft.id,
        widgetType: "bar-chart",
        zoneKey: "main",
        size: "large",
        configJson: JSON.stringify({
          title: "Revenue vs Expenses",
          values: [
            { label: "Revenue", value: 1250000 },
            { label: "Expenses", value: 980000 },
          ],
        }),
        sortOrder: 2,
        includeInRollup: false,
      },
      {
        reportDraftId: financeDraft.id,
        widgetType: "narrative",
        zoneKey: "main",
        size: "medium",
        configJson: JSON.stringify({
          body: "One-time infrastructure costs of $42K reduced net income compared to January. Excluding these, net income would be $312K, up 0.6% MoM.",
        }),
        sortOrder: 3,
        includeInRollup: false,
      },
    ],
  });

  const opsDraft = await prisma.reportDraft.create({
    data: {
      section: "operations",
      periodId: currentPeriod.id,
      createdByUserId: editor.id,
      status: "in_review",
      title: "Operations Report – February 2026",
      summary: "Headcount stable. On-time delivery dipped 3 points due to supplier delays.",
    },
  });

  await prisma.widgetInstance.createMany({
    data: [
      {
        reportDraftId: opsDraft.id,
        widgetType: "kpi-card",
        zoneKey: "header",
        size: "small",
        configJson: JSON.stringify({ label: "Headcount", value: 142, format: "number" }),
        sortOrder: 0,
        includeInRollup: true,
      },
      {
        reportDraftId: opsDraft.id,
        widgetType: "kpi-card",
        zoneKey: "header",
        size: "small",
        configJson: JSON.stringify({ label: "On-Time Rate", value: 87, format: "percent" }),
        sortOrder: 1,
        includeInRollup: true,
      },
    ],
  });

  // January draft (previous period)
  const financeDraftJan = await prisma.reportDraft.create({
    data: {
      section: "finance",
      periodId: prevPeriod.id,
      createdByUserId: editor.id,
      status: "draft",
      title: "Finance Report – January 2026",
      summary: "Strong start to the year. Revenue ahead of Q4 2025 run rate.",
    },
  });

  await prisma.widgetInstance.create({
    data: {
      reportDraftId: financeDraftJan.id,
      widgetType: "kpi-card",
      zoneKey: "header",
      size: "small",
      configJson: JSON.stringify({ label: "Revenue", value: 1200000, format: "currency" }),
      sortOrder: 0,
      includeInRollup: true,
    },
  });

  console.log("  ✓ Report Drafts + Widget Instances");

  // ── Output Versions ──────────────────────────────────────────────────
  const approvedOutput = await prisma.outputVersion.create({
    data: {
      section: "finance",
      periodId: prevPeriod.id,
      versionNumber: 1,
      state: "approved",
      basedOnReportDraftId: financeDraftJan.id,
      snapshotJson: JSON.stringify({
        title: "Finance Report – January 2026",
        summary: "Strong start to the year. Revenue ahead of Q4 2025 run rate.",
        widgets: [{ widgetType: "kpi-card", zoneKey: "header", configJson: { label: "Revenue", value: 1200000, format: "currency" } }],
      }),
      approvedByUserId: approver.id,
      approvedAt: new Date("2026-02-05T10:00:00Z"),
    },
  });

  const draftOutput = await prisma.outputVersion.create({
    data: {
      section: "finance",
      periodId: currentPeriod.id,
      versionNumber: 1,
      state: "draft",
      basedOnReportDraftId: financeDraft.id,
      snapshotJson: JSON.stringify({
        title: "Finance Report – February 2026",
        summary: "Revenue grew 4.2% MoM.",
        widgets: [],
      }),
    },
  });

  console.log("  ✓ Output Versions");

  // ── Share Links ──────────────────────────────────────────────────────
  await prisma.shareLink.create({
    data: {
      outputVersionId: approvedOutput.id,
      token: "share_jan2026_finance_abc123",
      createdByUserId: admin.id,
      active: true,
      expiresAt: new Date("2027-01-01T00:00:00Z"),
    },
  });

  console.log("  ✓ Share Links");

  // ── Insight Annotations ──────────────────────────────────────────────
  await prisma.insightAnnotation.createMany({
    data: [
      {
        section: "finance",
        periodId: currentPeriod.id,
        title: "Infrastructure cost spike",
        body: "One-time $42K infrastructure spend reduced net income. Not expected to recur in March.",
        classification: "risk",
        priority: "high",
        promotedToRollup: true,
        createdByUserId: editor.id,
      },
      {
        section: "operations",
        periodId: currentPeriod.id,
        title: "Supplier delay – logistics partner",
        body: "Primary logistics partner had a 3-day delay window mid-February. On-time rate affected. SLA review scheduled.",
        classification: "blocker",
        priority: "high",
        promotedToRollup: false,
        createdByUserId: editor.id,
      },
      {
        section: "finance",
        periodId: currentPeriod.id,
        title: "Revenue growth ahead of target",
        body: "February revenue hit $1.25M vs $1.18M plan. Pipeline remains strong heading into March.",
        classification: "highlight",
        priority: "medium",
        promotedToRollup: true,
        createdByUserId: editor.id,
      },
    ],
  });

  console.log("  ✓ Insight Annotations");

  // ── Rollup Versions ──────────────────────────────────────────────────
  await prisma.rollupVersion.create({
    data: {
      periodId: prevPeriod.id,
      title: "Executive Rollup – January 2026",
      sourceOutputIdsJson: JSON.stringify([approvedOutput.id]),
      snapshotJson: JSON.stringify({
        highlights: ["Finance revenue $1.2M, ahead of run rate"],
        risks: [],
        widgets: [],
      }),
      state: "approved",
      createdByUserId: admin.id,
      approvedByUserId: approver.id,
    },
  });

  await prisma.rollupVersion.create({
    data: {
      periodId: currentPeriod.id,
      title: "Executive Rollup – February 2026",
      sourceOutputIdsJson: JSON.stringify([draftOutput.id]),
      snapshotJson: JSON.stringify({
        highlights: [],
        risks: [],
        widgets: [],
      }),
      state: "draft",
      createdByUserId: admin.id,
    },
  });

  console.log("  ✓ Rollup Versions");

  console.log("\nSeed complete.");
  console.log(`  Users:               4 (admin, editor, approver, viewer)`);
  console.log(`  Periods:             3 (Jan 2026, Feb 2026, Q1 2026)`);
  console.log(`  Field Registry:      ${fieldRegistryEntries.length} entries across finance/operations/customers`);
  console.log(`  Import Batches:      2 (finance normalized, ops mapped)`);
  console.log(`  Report Drafts:       3 (finance jan, finance feb, ops feb)`);
  console.log(`  Output Versions:     2 (1 approved, 1 draft)`);
  console.log(`  Share Links:         1`);
  console.log(`  Insight Annotations: 3`);
  console.log(`  Rollup Versions:     2 (1 approved, 1 draft)`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
