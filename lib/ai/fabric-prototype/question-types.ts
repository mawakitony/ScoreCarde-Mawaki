/** Question types actually supported by the Scorecard Builder. */
export const FABRIC_QUESTION_TYPES = [
  "single_choice",
  "multiple_choice",
  "yes_no",
  "scale_5",
  "scale_10",
  "short_text",
  "long_text",
  "number",
  "email",
  "phone",
  "country",
  "dropdown",
] as const

export type FabricQuestionType = (typeof FABRIC_QUESTION_TYPES)[number]
