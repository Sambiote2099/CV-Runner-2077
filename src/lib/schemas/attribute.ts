import { z } from "zod"
import { AttributeCategory, AttributeType } from "@prisma/client"

export const attributeFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.nativeEnum(AttributeCategory),
  type: z.nativeEnum(AttributeType),
  // Comma-separated string in the form; we split it into an array before saving.
  // Only meaningful when type is ONE_OF_MANY.
  options: z.string(),
}).refine(
  (data) => data.type !== "ONE_OF_MANY" || data.options.trim().length > 0,
  { message: "At least one option is required for dropdown type", path: ["options"] }
)

export type AttributeFormData = z.infer<typeof attributeFormSchema>