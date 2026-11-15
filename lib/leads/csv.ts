/** Cells starting with = + - @ tab CR/LF (or spaces then formula) → prefix ' to block CSV injection. */
const FORMULA = /^(?:[\t\r\n]|[\t\r\n ]*[=+\-@])/

export function needsCsvNeutralization(value: string) {
  return FORMULA.test(value)
}

export function csvCell(value: string | number | boolean | null | undefined) {
  const raw = value === null || value === undefined ? "" : String(value)
  const safe = needsCsvNeutralization(raw) ? `'${raw}` : raw
  return `"${safe.replaceAll('"', '""')}"`
}

export function toCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]) {
  const lines = [headers, ...rows].map((row) => row.map((cell) => csvCell(cell)).join(","))
  return `\uFEFF${lines.join("\r\n")}`
}
