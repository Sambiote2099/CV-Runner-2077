import { z } from "zod"

// Defined locally to avoid importing @prisma/client into the browser bundle.
// Any client component that imports this schema would otherwise pull in
// @prisma/client which is server-only.
const attributeCategories = [
  "CERTIFICATION",
  "DOMAIN_KNOWLEDGE",
  "PERSONAL_INFORMATION",
  "SOFT_SKILLS",
] as const

const attributeTypes = [
  "STRING",
  "TEXT",
  "IMAGE",
  "NUMERIC",
  "DATE",
  "PERIOD",
  "BOOLEAN",
  "ONE_OF_MANY",
] as const

export const attributeFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(attributeCategories),
  type: z.enum(attributeTypes),
  options: z.string(),
  description: z.string(),
}).refine(
  (data) => data.type !== "ONE_OF_MANY" || data.options.trim().length > 0,
  { message: "At least one option is required for dropdown type", path: ["options"] }
)

export type AttributeFormData = z.infer<typeof attributeFormSchema>