import { z } from "zod"
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/password-reset"

export const loginSchema = z.object({
  email: z.string().trim().email("Indiquez un email valide."),
  password: z.string().min(PASSWORD_MIN_LENGTH, `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`),
})

export const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, "Indiquez votre nom.").max(80),
})

export const magicLinkSchema = z.object({
  email: z.string().trim().email("Indiquez un email valide."),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Indiquez un email valide."),
})

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`),
    confirmPassword: z.string().min(1, "Confirmez le mot de passe."),
    mfaCode: z.string().trim().optional(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Les deux mots de passe doivent être identiques.",
    path: ["confirmPassword"],
  })
  .refine((value) => !value.mfaCode || /^\d{6}$/.test(value.mfaCode), {
    message: "Le code MFA doit contenir 6 chiffres.",
    path: ["mfaCode"],
  })

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Indiquez votre nom.").max(80),
})

export const inviteSchema = z.object({
  email: z.string().trim().email("Indiquez un email valide."),
  role: z.enum(["admin", "member"]),
})
