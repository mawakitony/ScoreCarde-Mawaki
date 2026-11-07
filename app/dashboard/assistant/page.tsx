import { AssistantView } from "@/components/assistant/assistant-view"
import { activeAiProvider } from "@/lib/ai/provider"
import { ensureMembership } from "@/lib/data/membership"
import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "Assistant IA" }

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ scorecard?: string }>
}) {
  const membership = await ensureMembership()
  if (!membership) return null
  const params = await searchParams
  const provider = activeAiProvider()
  let pageContext: { route?: string; scorecardId?: string; scorecardName?: string; scorecardSlug?: string } | undefined
  if (params.scorecard) {
    const supabase = await createClient()
    const { data } = await supabase
      .from("scorecards")
      .select("id, name, slug")
      .eq("id", params.scorecard)
      .eq("organization_id", membership.organization.id)
      .maybeSingle()
    if (data) {
      pageContext = {
        route: `/dashboard/scorecards/${data.id}/builder`,
        scorecardId: data.id,
        scorecardName: data.name,
        scorecardSlug: data.slug,
      }
    }
  }

  return <AssistantView configured={provider.configured} pageContext={pageContext} />
}
