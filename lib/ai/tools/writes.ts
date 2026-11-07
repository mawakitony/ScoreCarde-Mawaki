import {
  createQuestion,
  createQuestionCategory,
  createQuestionOption,
  createScoringCategory,
  saveLanding,
  saveSetup,
  updateQuestion,
  updateQuestionCategory,
  updateQuestionOption,
  updateScoringCategory,
} from "@/actions/builder"
import { createScorecard } from "@/actions/scorecards"
import { assignTagToLeads, changeLeadsStatus, createLeadTag } from "@/actions/leads"
import { AGENT_LIMITS } from "@/lib/ai/agent/limits"
import { toolArgsSchemas } from "@/lib/ai/agent/schemas"
import { slugify } from "@/lib/format"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { QuestionType } from "@/lib/validators/builder"

async function compensateArchive(scorecardId: string, organizationId: string) {
  const admin = createAdminClient()
  await admin
    .from("scorecards")
    .update({ status: "archived" })
    .eq("id", scorecardId)
    .eq("organization_id", organizationId)
    .eq("status", "draft")
}

function normalizeResultRanges(
  ranges: {
    minPercent: number
    maxPercent: number
    label: string
    title?: string
    description?: string
    badge?: string
    recommendationTitle?: string
    recommendationBody?: string
    ctaLabel?: string
    ctaUrl?: string
  }[],
) {
  if (ranges.length === 0) return []
  const sorted = [...ranges]
    .map((range, index) => {
      const min = Math.min(100, Math.max(0, Number(range.minPercent) || 0))
      const max = Math.min(100, Math.max(0, Number(range.maxPercent) || 0))
      const label = (range.label?.trim() || `Resultat ${index + 1}`).slice(0, 80)
      const title = (range.title?.trim() || label).slice(0, 180)
      return {
        ...range,
        label: label.length >= 2 ? label : `Resultat ${index + 1}`,
        title: title.length >= 2 ? title : `Resultat ${index + 1}`,
        minPercent: Math.min(min, max),
        maxPercent: Math.max(min, max),
      }
    })
    .sort((a, b) => a.minPercent - b.minPercent || a.maxPercent - b.maxPercent)

  // Rebuild contiguous exclusive ranges covering 0..100.
  const count = sorted.length
  return sorted.map((range, index) => {
    const minPercent = index === 0 ? 0 : Math.ceil((100 * index) / count)
    const maxPercent = index === count - 1 ? 100 : Math.ceil((100 * (index + 1)) / count) - 1
    return {
      ...range,
      minPercent,
      maxPercent: Math.max(minPercent, maxPercent),
    }
  })
}

async function replaceResultRanges(
  scorecardId: string,
  ranges: Parameters<typeof normalizeResultRanges>[0],
) {
  const admin = createAdminClient()
  const normalized = normalizeResultRanges(ranges)
  const { error: deleteError } = await admin.from("result_ranges").delete().eq("scorecard_id", scorecardId)
  if (deleteError) throw new Error(deleteError.message || "Suppression des plages impossible.")

  const ids: string[] = []
  for (let index = 0; index < normalized.length; index += 1) {
    const range = normalized[index]
    if (!range) continue
    const { data, error } = await admin
      .from("result_ranges")
      .insert({
        scorecard_id: scorecardId,
        min_percent: range.minPercent,
        max_percent: range.maxPercent,
        label: range.label,
        title: range.title || range.label,
        description: range.description?.trim() || null,
        badge: range.badge?.trim() || null,
        position: index,
      })
      .select("id")
      .single()
    if (error || !data) throw new Error(error?.message || "Création de plage impossible.")
    ids.push(data.id)
    const ctaUrl = range.ctaUrl && /^https?:\/\//i.test(range.ctaUrl) ? range.ctaUrl : null
    const { error: recoError } = await admin.from("result_recommendations").insert({
      result_range_id: data.id,
      title: (range.recommendationTitle || range.title || range.label).slice(0, 160) || range.label,
      body: range.recommendationBody?.trim() || null,
      cta_label: range.ctaLabel?.trim() || null,
      cta_url: ctaUrl,
      position: 0,
    })
    if (recoError) throw new Error(recoError.message || "Création de recommandation impossible.")
  }
  return ids
}

async function ensureTagId(organizationId: string, tagId?: string, tagName?: string) {
  const supabase = await createClient()
  if (tagId) {
    const { data } = await supabase.from("lead_tags").select("id").eq("id", tagId).eq("organization_id", organizationId).maybeSingle()
    return data?.id ?? null
  }
  if (!tagName) return null
  const { data: existing } = await supabase.from("lead_tags").select("id").eq("organization_id", organizationId).ilike("name", tagName).maybeSingle()
  if (existing) return existing.id
  const created = await createLeadTag(tagName, "#6E92F2")
  if ("error" in created && created.error) return null
  const { data } = await supabase.from("lead_tags").select("id").eq("organization_id", organizationId).ilike("name", tagName).maybeSingle()
  return data?.id ?? null
}

async function fillQuestion(
  scorecardId: string,
  questionId: string,
  question: {
    title: string
    description?: string
    type: QuestionType
    isRequired: boolean
    isScored: boolean
    questionCategoryId?: string | null
    scoringCategoryId?: string | null
    options: { label: string; value?: string; score: number }[]
  },
) {
  const updated = await updateQuestion(scorecardId, questionId, {
    title: question.title,
    description: question.description ?? "",
    type: question.type,
    questionCategoryId: question.questionCategoryId ?? null,
    scoringCategoryId: question.scoringCategoryId ?? null,
    isRequired: question.isRequired,
    isScored: question.isScored,
    settings: question.type === "scale_10"
      ? { scaleFrom: 1, scaleTo: 10, scoreFrom: 0, scoreTo: 100 }
      : { scaleFrom: 1, scaleTo: 5, scoreFrom: 0, scoreTo: 100 },
  })
  if ("error" in updated && updated.error) return updated.error
  const options = "data" in updated ? updated.data?.options ?? [] : []
  for (let index = 0; index < question.options.length; index += 1) {
    const option = question.options[index]
    let optionId: string | undefined = options[index]?.id
    if (!optionId) {
      const created = await createQuestionOption(scorecardId, questionId)
      if ("error" in created && created.error) return created.error
      optionId = created.data?.id
    }
    if (!optionId) continue
    const baseValue = slugify(option.value || option.label || `option-${index + 1}`) || `option-${index + 1}`
    const saved = await updateQuestionOption(scorecardId, optionId, {
      label: option.label?.trim() || `Option ${index + 1}`,
      value: `${baseValue}-${index + 1}`.slice(0, 80),
      score: Number.isFinite(option.score) ? option.score : 0,
    })
    if ("error" in saved && saved.error) return saved.error
  }
  return null
}

/**
 * Compensation strategy for create_scorecard_draft:
 * There is no SQL transaction across builder actions.
 * On failure after the scorecard row exists, the draft is archived
 * (status=archived) so it is not left as a usable incomplete draft.
 * Hard delete is avoided (redirecting action) and is not an AI tool.
 */
export async function runWriteTool(
  tool: keyof typeof toolArgsSchemas,
  rawArgs: unknown,
  organizationId: string,
): Promise<{ ok: true; result: unknown; affected?: number; resourceType?: string; resourceId?: string } | { ok: false; error: string }> {
  if (tool === "create_scorecard_draft") {
    const args = toolArgsSchemas.create_scorecard_draft.parse(rawArgs)
    if (args.questions.length > AGENT_LIMITS.maxQuestionsGenerated) {
      return { ok: false, error: `Maximum ${AGENT_LIMITS.maxQuestionsGenerated} questions par demande.` }
    }
    const slug = args.slug || `${slugify(args.name)}-${Date.now().toString(36)}`.slice(0, 80)
    const created = await createScorecard({
      name: args.name,
      slug,
      description: args.description,
      language: args.language,
      category: args.category,
      status: "draft",
      primaryColor: "#071039",
      secondaryColor: "#6E92F2",
      logoUrl: "",
      coverImageUrl: "",
      estimatedMinutes: Math.min(60, Math.max(3, Math.ceil(args.questions.length / 3) || 5)),
      privacyText: "",
      seoTitle: "",
      seoDescription: "",
      ogTitle: "",
      ogDescription: "",
      ogImageUrl: "",
    })
    if (created.error || !created.id) return { ok: false, error: created.error ?? "Création impossible." }
    const scorecardId = created.id
    try {
      // E2E compensation probe: fail after the draft row exists so compensateArchive runs.
      if (/E2E-AI-COMPENSATION-FAIL/i.test(args.name)) {
        throw new Error("Compensation probe: échec volontaire après création du brouillon.")
      }
      await saveSetup(scorecardId, {
        name: args.name,
        slug,
        description: args.description,
        publicDescription: args.description,
        language: args.language,
        category: args.category,
        status: "draft",
        primaryColor: "#071039",
        secondaryColor: "#6E92F2",
        logoUrl: "",
        coverImageUrl: "",
        estimatedMinutes: Math.min(60, Math.max(3, Math.ceil(args.questions.length / 3) || 5)),
      })
      await saveLanding(scorecardId, {
        eyebrow: "",
        title: args.landingTitle || args.name,
        subtitle: args.landingSubtitle || args.description,
        description: args.description,
        heroImageUrl: "",
        ctaLabel: args.ctaText || "Commencer",
        estimatedTimeLabel: "",
        showEstimatedTime: true,
        showQuestionCount: true,
        showPrivacy: false,
        privacyText: "",
        benefits: [],
        testimonial: { quote: "", author: "", role: "" },
        landingTheme: "classic",
        highlightText: "",
        secondaryCtaLabel: "",
        trustLabel: "",
        backgroundColor: "",
        accentColor: "",
        demoStats: [],
      })

      const questionCategoryIds = new Map<string, string>()
      for (const category of args.questionCategories) {
        const row = await createQuestionCategory(scorecardId)
        if ("error" in row && row.error) throw new Error(row.error)
        const id = row.data?.id
        if (!id) throw new Error("Catégorie introuvable.")
        const saved = await updateQuestionCategory(scorecardId, id, {
          name: category.name,
          description: category.description ?? "",
          icon: "",
          weight: category.weight && category.weight > 0 ? category.weight : 1,
        })
        if ("error" in saved && saved.error) throw new Error(saved.error)
        questionCategoryIds.set(category.name.toLowerCase(), id)
      }

      const scoringCategoryIds = new Map<string, string>()
      for (const category of args.scoringCategories) {
        const row = await createScoringCategory(scorecardId)
        if ("error" in row && row.error) throw new Error(row.error)
        const id = row.data?.id
        if (!id) throw new Error("Catégorie de scoring introuvable.")
        const saved = await updateScoringCategory(scorecardId, id, {
          name: category.name,
          description: category.description ?? "",
          weight: category.weight && category.weight > 0 ? category.weight : 1,
          maxScore: category.maxScore && category.maxScore > 0 ? category.maxScore : 100,
        })
        if ("error" in saved && saved.error) throw new Error(saved.error)
        scoringCategoryIds.set(category.name.toLowerCase(), id)
      }

      await replaceResultRanges(scorecardId, args.resultRanges)

      for (const question of args.questions) {
        const createdQuestion = await createQuestion(scorecardId, question.type)
        if ("error" in createdQuestion && createdQuestion.error) throw new Error(createdQuestion.error)
        const questionId = createdQuestion.data?.id
        if (!questionId) throw new Error("Question introuvable.")
        const fail = await fillQuestion(scorecardId, questionId, {
          ...question,
          questionCategoryId: question.questionCategoryName
            ? questionCategoryIds.get(question.questionCategoryName.toLowerCase()) ?? null
            : null,
          scoringCategoryId: question.scoringCategoryName
            ? scoringCategoryIds.get(question.scoringCategoryName.toLowerCase()) ?? null
            : null,
        })
        if (fail) throw new Error(fail)
      }

      return {
        ok: true,
        result: {
          scorecardId,
          slug,
          questions: args.questions.length,
          categories: args.questionCategories.length,
          scoringCategories: args.scoringCategories.length,
          ranges: args.resultRanges.length,
          href: `/dashboard/scorecards/${scorecardId}/builder`,
        },
        affected: 1 + args.questions.length,
        resourceType: "scorecard",
        resourceId: scorecardId,
      }
    } catch (error) {
      await compensateArchive(scorecardId, organizationId)
      return {
        ok: false,
        error: error instanceof Error ? error.message : "La création a échoué. Le brouillon incomplet a été archivé.",
      }
    }
  }

  if (tool === "update_scorecard_draft") {
    const args = toolArgsSchemas.update_scorecard_draft.parse(rawArgs)
    if (args.name || args.description) {
      const supabase = await createClient()
      const { data } = await supabase.from("scorecards").select("name, slug, description, language, category, primary_color, secondary_color, logo_url, cover_image_url, estimated_minutes").eq("id", args.scorecardId).eq("organization_id", organizationId).maybeSingle()
      if (!data) return { ok: false, error: "Scorecard introuvable." }
      const saved = await saveSetup(args.scorecardId, {
        name: args.name ?? data.name,
        slug: data.slug,
        description: args.description ?? data.description ?? "",
        publicDescription: args.description ?? data.description ?? "",
        language: (data.language as "fr" | "en") || "fr",
        category: data.category,
        status: "draft",
        primaryColor: data.primary_color || "#071039",
        secondaryColor: data.secondary_color || "#6E92F2",
        logoUrl: data.logo_url ?? "",
        coverImageUrl: data.cover_image_url ?? "",
        estimatedMinutes: data.estimated_minutes ?? 5,
      })
      if ("error" in saved && saved.error) return { ok: false, error: saved.error }
    }
    if (args.landingTitle || args.landingSubtitle || args.ctaText) {
      const saved = await saveLanding(args.scorecardId, {
        eyebrow: "",
        title: args.landingTitle || "Évaluation",
        subtitle: args.landingSubtitle || "",
        description: "",
        heroImageUrl: "",
        ctaLabel: args.ctaText || "Commencer",
        estimatedTimeLabel: "",
        showEstimatedTime: true,
        showQuestionCount: true,
        showPrivacy: false,
        privacyText: "",
        benefits: [],
        testimonial: { quote: "", author: "", role: "" },
        landingTheme: "classic",
        highlightText: "",
        secondaryCtaLabel: "",
        trustLabel: "",
        backgroundColor: "",
        accentColor: "",
        demoStats: [],
      })
      if ("error" in saved && saved.error) return { ok: false, error: saved.error }
    }
    return { ok: true, result: { scorecardId: args.scorecardId }, resourceType: "scorecard", resourceId: args.scorecardId, affected: 1 }
  }

  if (tool === "add_questions") {
    const args = toolArgsSchemas.add_questions.parse(rawArgs)
    if (args.questions.length > AGENT_LIMITS.maxQuestionsGenerated) {
      return { ok: false, error: `Maximum ${AGENT_LIMITS.maxQuestionsGenerated} questions par demande.` }
    }
    const ids: string[] = []
    for (const question of args.questions) {
      const created = await createQuestion(args.scorecardId, question.type)
      if ("error" in created && created.error) return { ok: false, error: created.error }
      const questionId = created.data?.id
      if (!questionId) return { ok: false, error: "Question introuvable." }
      const fail = await fillQuestion(args.scorecardId, questionId, {
        ...question,
        questionCategoryId: null,
        scoringCategoryId: null,
      })
      if (fail) return { ok: false, error: fail }
      ids.push(questionId)
    }
    return { ok: true, result: { questionIds: ids }, affected: ids.length, resourceType: "scorecard", resourceId: args.scorecardId }
  }

  if (tool === "update_question") {
    const args = toolArgsSchemas.update_question.parse(rawArgs)
    const supabase = await createClient()
    const { data } = await supabase.from("questions").select("title, description, type, is_required, is_scored, question_category_id, scoring_category_id, settings").eq("id", args.questionId).eq("scorecard_id", args.scorecardId).maybeSingle()
    if (!data) return { ok: false, error: "Question introuvable." }
    const saved = await updateQuestion(args.scorecardId, args.questionId, {
      title: args.title ?? data.title,
      description: args.description ?? data.description ?? "",
      type: data.type as QuestionType,
      questionCategoryId: data.question_category_id,
      scoringCategoryId: data.scoring_category_id,
      isRequired: args.isRequired ?? data.is_required,
      isScored: args.isScored ?? data.is_scored,
      settings: data.settings && typeof data.settings === "object" && !Array.isArray(data.settings)
        ? {
          scaleFrom: Number((data.settings as { scaleFrom?: number }).scaleFrom ?? 1),
          scaleTo: Number((data.settings as { scaleTo?: number }).scaleTo ?? 5),
          scoreFrom: Number((data.settings as { scoreFrom?: number }).scoreFrom ?? 0),
          scoreTo: Number((data.settings as { scoreTo?: number }).scoreTo ?? 100),
        }
        : { scaleFrom: 1, scaleTo: 5, scoreFrom: 0, scoreTo: 100 },
    })
    if ("error" in saved && saved.error) return { ok: false, error: saved.error }
    return { ok: true, result: { questionId: args.questionId }, affected: 1, resourceType: "question", resourceId: args.questionId }
  }

  if (tool === "create_question_categories") {
    const args = toolArgsSchemas.create_question_categories.parse(rawArgs)
    const ids: string[] = []
    for (const category of args.categories) {
      const row = await createQuestionCategory(args.scorecardId)
      if ("error" in row && row.error) return { ok: false, error: row.error }
      const id = row.data?.id
      if (!id) return { ok: false, error: "Catégorie introuvable." }
      const saved = await updateQuestionCategory(args.scorecardId, id, {
        name: category.name,
        description: category.description ?? "",
        icon: "",
        weight: category.weight ?? 1,
      })
      if ("error" in saved && saved.error) return { ok: false, error: saved.error }
      ids.push(id)
    }
    return { ok: true, result: { categoryIds: ids }, affected: ids.length, resourceType: "scorecard", resourceId: args.scorecardId }
  }

  if (tool === "configure_scoring") {
    const args = toolArgsSchemas.configure_scoring.parse(rawArgs)
    const ids: string[] = []
    for (const category of args.categories) {
      const row = await createScoringCategory(args.scorecardId)
      if ("error" in row && row.error) return { ok: false, error: row.error }
      const id = row.data?.id
      if (!id) return { ok: false, error: "Catégorie de scoring introuvable." }
      const saved = await updateScoringCategory(args.scorecardId, id, {
        name: category.name,
        description: category.description ?? "",
        weight: category.weight,
        maxScore: category.maxScore,
      })
      if ("error" in saved && saved.error) return { ok: false, error: saved.error }
      ids.push(id)
    }
    return { ok: true, result: { scoringCategoryIds: ids }, affected: ids.length, resourceType: "scorecard", resourceId: args.scorecardId }
  }

  if (tool === "create_result_ranges") {
    const args = toolArgsSchemas.create_result_ranges.parse(rawArgs)
    try {
      const ids = await replaceResultRanges(args.scorecardId, args.ranges)
      return { ok: true, result: { rangeIds: ids }, affected: ids.length, resourceType: "scorecard", resourceId: args.scorecardId }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Création des plages impossible." }
    }
  }

  if (tool === "add_lead_tag") {
    const args = toolArgsSchemas.add_lead_tag.parse(rawArgs)
    const created = await createLeadTag(args.name, args.color)
    if ("error" in created && created.error) return { ok: false, error: created.error }
    return { ok: true, result: { name: args.name }, affected: 1, resourceType: "lead_tag" }
  }

  if (tool === "assign_lead_tag") {
    const args = toolArgsSchemas.assign_lead_tag.parse(rawArgs)
    if (args.leadIds.length > AGENT_LIMITS.maxLeadsPerMutation) {
      return { ok: false, error: `Maximum ${AGENT_LIMITS.maxLeadsPerMutation} leads par confirmation.` }
    }
    const tagId = await ensureTagId(organizationId, args.tagId, args.tagName)
    if (!tagId) return { ok: false, error: "Tag introuvable." }
    const assigned = await assignTagToLeads(args.leadIds, tagId)
    if ("error" in assigned && assigned.error) return { ok: false, error: assigned.error }
    return { ok: true, result: { tagId, leadIds: args.leadIds }, affected: args.leadIds.length, resourceType: "lead" }
  }

  if (tool === "change_lead_status") {
    const args = toolArgsSchemas.change_lead_status.parse(rawArgs)
    if (args.leadIds.length > AGENT_LIMITS.maxLeadsPerMutation) {
      return { ok: false, error: `Maximum ${AGENT_LIMITS.maxLeadsPerMutation} leads par confirmation.` }
    }
    const changed = await changeLeadsStatus(args.leadIds, args.status)
    if ("error" in changed && changed.error) return { ok: false, error: changed.error }
    return { ok: true, result: { status: args.status, leadIds: args.leadIds }, affected: args.leadIds.length, resourceType: "lead" }
  }

  return { ok: false, error: "Tool d'écriture inconnu." }
}
