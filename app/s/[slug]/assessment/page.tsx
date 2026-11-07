import { redirect } from "next/navigation"
import { AssessmentFlow } from "@/components/assessment/assessment-flow"
import { loadAssessmentScreen } from "@/lib/assessment/store"

export const metadata = { title: "Questionnaire", robots: { index: false, follow: false } }

export default async function AssessmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const screen = await loadAssessmentScreen(slug)
  if ("error" in screen) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-16">
        <p className="text-[12px] font-semibold tracking-[0.18em] text-[#1A3BB0] uppercase">WOLOYEM</p>
        <h1 className="font-display mt-4 text-3xl leading-tight sm:text-4xl">Session introuvable</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[#5e6d7e]">{screen.error}</p>
        <a
          className="mt-6 inline-flex h-11 w-fit items-center rounded-xl border border-[#d5dde6] bg-white px-4 text-[14px] font-semibold text-[#071039] transition-colors hover:bg-[#F5F7FA] focus-visible:ring-2 focus-visible:ring-[#2E5DE6]/35 focus-visible:outline-none"
          href={`/s/${slug}`}
        >
          Retour à la page
        </a>
      </main>
    )
  }
  if ("redirectTo" in screen) redirect(screen.redirectTo)

  return (
    <AssessmentFlow
      slug={slug}
      questions={screen.questions}
      initialAnswers={screen.answers}
      initialIndex={Math.min(screen.index, Math.max(screen.questions.length - 1, 0))}
      lead={screen.lead}
      needsLeadFirst={screen.needsLeadFirst}
      needsLeadBeforeResult={screen.needsLeadBeforeResult}
      primaryColor={screen.primaryColor}
      logoUrl={screen.logoUrl}
    />
  )
}
