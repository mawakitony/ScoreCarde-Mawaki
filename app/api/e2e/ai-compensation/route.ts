import { NextResponse } from "next/server"
import { ensureMembership } from "@/lib/data/membership"
import { runWriteTool } from "@/lib/ai/tools/writes"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" && process.env.E2E_AI_COMPENSATION !== "1") {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })
  }
  const expected = process.env.E2E_AI_SECRET || "local-e2e-compensation"
  if (request.headers.get("x-e2e-secret") !== expected) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
  }

  const membership = await ensureMembership()
  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ ok: false, error: "Owner session required" }, { status: 401 })
  }

  const name = "E2E-AI-COMPENSATION-FAIL"
  const result = await runWriteTool(
    "create_scorecard_draft",
    {
      name,
      description: "Compensation probe",
      language: "fr",
      category: "Assessment",
      questions: [
        {
          title: "Probe Q1",
          type: "single_choice",
          isRequired: true,
          isScored: true,
          options: [
            { label: "Oui", score: 10 },
            { label: "Non", score: 0 },
          ],
        },
        {
          title: "Probe Q2",
          type: "single_choice",
          isRequired: true,
          isScored: true,
          options: [
            { label: "A", score: 5 },
            { label: "B", score: 1 },
          ],
        },
      ],
      questionCategories: [{ name: "Probe cat" }],
      scoringCategories: [{ name: "Probe score", weight: 1, maxScore: 100 }],
      resultRanges: [{ minPercent: 0, maxPercent: 100, label: "All" }],
    },
    membership.organization.id,
  )

  const admin = createAdminClient()
  const { data: cards } = await admin
    .from("scorecards")
    .select("id,name,status")
    .eq("organization_id", membership.organization.id)
    .ilike("name", `%${name}%`)
    .order("created_at", { ascending: false })
    .limit(5)

  const archived = (cards || []).filter((card) => card.status === "archived")
  const draftLeft = (cards || []).filter((card) => card.status === "draft")

  return NextResponse.json({
    ok: true,
    toolOk: result.ok,
    toolError: result.ok ? null : result.error,
    compensated: archived.length >= 1 && draftLeft.length === 0,
    cards: cards || [],
  })
}
