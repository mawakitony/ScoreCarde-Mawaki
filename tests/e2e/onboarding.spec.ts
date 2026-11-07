import { test } from "@playwright/test"
import { e2eIsolatedAllowed, e2eIsolatedBlockReason } from "../../lib/env"
import { loadE2eEnvFiles } from "./helpers/load-env"

loadE2eEnvFiles()
const ready = e2eIsolatedAllowed()

test.skip(
  true,
  `BLOCKED: Live signup/onboarding E2E requires isolated Supabase + mail confirm. ${ready ? "Isolation ready — wire full flow next." : e2eIsolatedBlockReason() ?? "E2E isolation not ready"}`,
)
test("onboarding creates an organization", async () => {})
