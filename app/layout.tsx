import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import { AppProviders } from "@/components/providers"
import { getAppUrl } from "@/lib/env"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: {
    default: "WOLOYEM Score",
    template: "%s · WOLOYEM Score",
  },
  description:
    "Scorecards, CRM et collaboration multi-entreprises. Essai de 14 jours, puis abonnement par organisation.",
  openGraph: {
    title: "WOLOYEM Score",
    description: "Transformez vos questionnaires en clients et en décisions.",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${poppins.variable} h-full antialiased`}>
      <body className={`${poppins.className} min-h-full bg-background text-foreground`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
