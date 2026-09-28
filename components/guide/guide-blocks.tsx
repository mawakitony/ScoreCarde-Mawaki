import Link from "next/link"
import { GuideCallout, GuideConfig, GuideContrast, GuideRoles } from "@/components/guide/callouts"
import type { Block } from "@/lib/guide/types"
import { cn } from "@/lib/utils"

const emphasis = [
  "Restaurer la version publiée",
  "Modifications non publiées",
  "Télécharger le QR Code",
  "Créer à partir de ce modèle",
  "Anonymiser définitivement",
  "Partager via WhatsApp",
  "Partager par email",
  "Télécharger le modèle Excel",
  "Remplacer toutes les questions existantes",
  "Exporter vers Excel",
  "Importer des questions",
  "Nouvelle scorecard",
  "Créer la scorecard",
  "Create Scorecard",
  "Copier le lien",
  "Mode avancé",
  "Mode simple",
  "Force Result",
  "Maximum Result",
  "Scorecards",
  "Aperçu",
  "Preview",
  "Publier",
  "Partager",
  "Annuler",
  "Corbeille",
  "Restaurer",
  "Enable",
]

const emphasisPattern = new RegExp(`(${emphasis.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g")

function emphasize(text: string) {
  return text.split(emphasisPattern).map((part, index) => (
    emphasis.includes(part) ? <strong key={`${part}-${index}`} className="font-semibold text-foreground">{part}</strong> : <span key={`${part}-${index}`}>{part}</span>
  ))
}

function TableCell({ value, lead }: { value: string; lead?: boolean }) {
  const normalized = value.trim().toLowerCase()
  if (normalized === "oui" || normalized === "non") {
    return (
      <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", normalized === "oui" ? "bg-guide-tip text-guide-tip-title" : "bg-muted text-muted-foreground")}>
        {value}
      </span>
    )
  }
  return <span className={lead ? "font-medium" : undefined}>{emphasize(value)}</span>
}

export function GuideBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, index) => {
        if (block.type === "p") return <p key={index} className="text-sm leading-7 text-foreground/90">{emphasize(block.text)}</p>
        if (block.type === "list") {
          return (
            <ul key={index} className="list-disc space-y-2 pl-5 text-sm leading-7 text-foreground/90">
              {block.items.map((item) => <li key={item}>{emphasize(item)}</li>)}
            </ul>
          )
        }
        if (block.type === "callout") return <GuideCallout key={index} kind={block.kind} text={block.text} />
        if (block.type === "roles") return <GuideRoles key={index} roles={block.roles} />
        if (block.type === "config") return <GuideConfig key={index} text={block.text} />
        if (block.type === "compare") {
          return <GuideContrast key={index} leftTitle={block.leftTitle} left={block.left} rightTitle={block.rightTitle} right={block.right} />
        }
        if (block.type === "table") {
          return (
            <div key={index} className="max-w-full overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="bg-muted/80">
                  <tr>
                    {block.headers.map((header) => (
                      <th key={header} className="sticky top-16 bg-muted px-3 py-2.5 font-bold text-primary">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row) => (
                    <tr key={row[0]} className="border-t">
                      {row.map((cell, cellIndex) => (
                        <td key={cell} className="px-3 py-3 align-top leading-7">{<TableCell value={cell} lead={cellIndex === 0} />}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        if (block.type === "links") {
          return (
            <p key={index} className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {block.items.map((item) => (
                <Link key={item.href + item.label} href={item.href} className="font-medium text-primary underline decoration-brass/70 underline-offset-4">
                  {item.label}
                </Link>
              ))}
            </p>
          )
        }
        return (
          <div key={index} className="space-y-8">
            {block.items.map((item) => (
              <article key={item.name}>
                <h4 className="text-lg font-semibold text-primary">{item.name}</h4>
                <p className="mt-2 text-sm leading-7"><span className="font-medium text-muted-foreground">Utilisation. </span>{emphasize(item.use)}</p>
                <p className="mt-1 text-sm leading-7"><span className="font-medium text-muted-foreground">Exemple. </span>{emphasize(item.example)}</p>
                <p className="mt-1 text-sm leading-7"><span className="font-medium text-muted-foreground">Scoré / non scoré. </span>{emphasize(item.scored)}</p>
              </article>
            ))}
          </div>
        )
      })}
    </div>
  )
}
