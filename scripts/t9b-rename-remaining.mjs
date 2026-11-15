import fs from "fs"
import path from "path"

const root = process.cwd()

/** @type {Array<[string, Array<[string | RegExp, string]>]>} */
const edits = [
  ["app/s/[slug]/page.tsx", [[">WOLOYEM<", ">Mawaki Score<"]]],
  ["app/s/[slug]/assessment/page.tsx", [[">WOLOYEM<", ">Mawaki Score<"]]],
  ["components/assessment/landing-view.tsx", [["\n            WOLOYEM\n", "\n            Mawaki Score\n"]]],
  ["components/assessment/assessment-flow.tsx", [[">WOLOYEM<", ">Mawaki Score<"]]],
  ["components/assessment/themes/digital-experience.tsx", [['const brand = "WOLOYEM"', 'const brand = "Mawaki Score"']]],
  [
    "app/login/page.tsx",
    [
      [
        "Ce compte n'est pas membre de WOLOYEM. Le premier compte devient propriétaire. Les suivants ont besoin d'une invitation.",
        "Ce compte n'est pas membre de l'équipe Mawaki Score. Le premier compte devient propriétaire. Les suivants ont besoin d'une invitation.",
      ],
    ],
  ],
  [
    "actions/auth.ts",
    [
      [
        "Ce compte n'est pas encore membre de WOLOYEM. Demandez une invitation à un administrateur.",
        "Ce compte n'est pas encore membre de l'équipe Mawaki Score. Demandez une invitation à un administrateur.",
      ],
      ["Membre ajouté à WOLOYEM.", "Membre ajouté à Mawaki Score."],
    ],
  ],
  ["app/dashboard/layout.tsx", [["Ouvrir WOLOYEM Platform Admin", "Ouvrir Mawaki Score Platform Admin"]]],
  ["components/platform/shell.tsx", [[">WOLOYEM<", ">Mawaki Score<"]]],
  ["app/dashboard/scorecards/page.tsx", [["modèle WOLOYEM.", "modèle Mawaki Score."]]],
  [
    "app/dashboard/templates/page.tsx",
    [["Les modèles WOLOYEM ne sont pas encore disponibles.", "Les modèles Mawaki Score ne sont pas encore disponibles."]],
  ],
  ["app/dashboard/settings/billing/page.tsx", [["Sans mention WOLOYEM", "Sans mention Mawaki Score"]]],
  ["lib/platform/ui.ts", [["Masquer la mention WOLOYEM", "Masquer la mention Mawaki Score"]]],
  [
    "lib/email/templates.ts",
    [
      ["WOLOYEM support opened a temporary access", "Mawaki Score support opened a temporary access"],
      ["Le support WOLOYEM a ouvert un accès temporaire", "Le support Mawaki Score a ouvert un accès temporaire"],
    ],
  ],
  [
    "lib/data/builder.ts",
    [
      [
        "J'accepte que WOLOYEM utilise mes informations afin de me communiquer mes résultats et les ressources correspondant à mon profil.",
        "J'accepte que Mawaki Score utilise mes informations afin de me communiquer mes résultats et les ressources correspondant à mon profil.",
      ],
    ],
  ],
  [
    "lib/assessment/flow.test.ts",
    [["J'accepte que WOLOYEM utilise mes informations.", "J'accepte que Mawaki Score utilise mes informations."]],
  ],
  [
    "lib/reports/queue.ts",
    [
      ['brandName: settings.brandName || "WOLOYEM"', 'brandName: settings.brandName || "Mawaki Score"'],
      ['sender: { name: settings.brandName || "WOLOYEM"', 'sender: { name: settings.brandName || "Mawaki Score"'],
      ['subject: "Votre rapport WOLOYEM"', 'subject: "Votre rapport Mawaki Score"'],
      ['brandName: text(row.brandName) || "WOLOYEM"', 'brandName: text(row.brandName) || "Mawaki Score"'],
    ],
  ],
  ["actions/reports.ts", [['|| "WOLOYEM"', '|| "Mawaki Score"']]],
  ["app/dashboard/settings/ai/page.tsx", [[': "WOLOYEM"', ': "Mawaki Score"']]],
  ["app/dashboard/settings/reports/page.tsx", [[': "WOLOYEM"', ': "Mawaki Score"']]],
  [
    "lib/reports/reports.test.ts",
    [
      ['brandName: "WOLOYEM"', 'brandName: "Mawaki Score"'],
      ["Cette évaluation WOLOYEM n'est pas une certification PMI.", "Cette évaluation Mawaki Score n'est pas une certification PMI."],
      ["WOLOYEM-Lead-Assessment-Internal.pdf", "mawaki-score-Lead-Assessment-Internal.pdf"],
    ],
  ],
  [
    "lib/reports/dto.ts",
    [
      ['return "WOLOYEM-Lead-Assessment-Internal.pdf"', 'return "mawaki-score-Lead-Assessment-Internal.pdf"'],
      ["return `WOLOYEM-${slug}-Assessment-Report.pdf`", "return `mawaki-score-${slug}-Assessment-Report.pdf`"],
    ],
  ],
  [
    "lib/importers/excel.ts",
    [['const TEMPLATE_NAME = "WOLOYEM-Score-Questionnaire-Template.xlsx"', 'const TEMPLATE_NAME = "mawaki-score-Questionnaire-Template.xlsx"']],
  ],
  ["lib/importers/export.ts", ["return { filename: `WOLOYEM-${slug}.xlsx`, bytes: Buffer.from(bytes) }", "return { filename: `mawaki-score-${slug}.xlsx`, bytes: Buffer.from(bytes) }"].map((s, i, a) => (i === 0 ? [a[0], a[1]] : null)).filter(Boolean)],
  ["lib/importers/import.test.ts", [["WOLOYEM-Score-Questionnaire-Template.xlsx", "mawaki-score-Questionnaire-Template.xlsx"]]],
  ["lib/share/scorecard.ts", [["woloyem-score-", "mawaki-score-"]]],
  ["lib/share/scorecard.test.ts", [["woloyem-score-", "mawaki-score-"]]],
  [
    "lib/guide/chapters/excel.ts",
    [
      ["Les feuilles du classeur WOLOYEM sont", "Les feuilles du classeur Mawaki Score sont"],
      ["Ce n'est pas le fichier Excel WOLOYEM.", "Ce n'est pas le fichier Excel Mawaki Score."],
      ["est lu comme un classeur WOLOYEM.", "est lu comme un classeur Mawaki Score."],
    ],
  ],
  ["app/dashboard/leads/export/route.ts", [['filename=\\"woloyem-leads.csv\\"', 'filename=\\"mawaki-score-leads.csv\\"']]],
  ["components/assistant/assistant-view.tsx", [["Copilote WOLOYEM", "Copilote Mawaki Score"]]],
  [
    "components/platform/mfa-client.tsx",
    [
      [
        'await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "WOLOYEM Platform" })',
        'await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Mawaki Score Admin", issuer: "Mawaki Score Admin" })',
      ],
    ],
  ],
]

// Fix the mangled export.ts entry above
edits[edits.findIndex(([f]) => f === "lib/importers/export.ts")] = [
  "lib/importers/export.ts",
  [["return { filename: `WOLOYEM-${slug}.xlsx`, bytes: Buffer.from(bytes) }", "return { filename: `mawaki-score-${slug}.xlsx`, bytes: Buffer.from(bytes) }"]],
]

let ok = 0
let miss = 0
for (const [rel, pairs] of edits) {
  const file = path.join(root, rel)
  let text = fs.readFileSync(file, "utf8")
  const before = text
  for (const [from, to] of pairs) {
    if (!text.includes(from)) {
      console.log("NO_MATCH", rel, JSON.stringify(from).slice(0, 80))
      miss++
      continue
    }
    text = text.split(from).join(to)
  }
  if (text !== before) {
    fs.writeFileSync(file, text)
    console.log("OK", rel)
    ok++
  }
}
console.log(`DONE ok=${ok} miss=${miss}`)
