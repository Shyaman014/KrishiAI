import { z } from 'zod'

export const cropCategories = [
  'Cereals',
  'Vegetables',
  'Fruits',
  'Oilseeds',
  'Pulses',
  'Cash Crops',
  'Other',
] as const

export const growthStages = [
  'sowing',
  'vegetative',
  'flowering',
  'fruiting',
  'harvesting',
] as const

export const uploadScanSchema = z.object({
  cropName: z
    .string()
    .trim()
    .max(100, 'Crop name cannot exceed 100 characters')
    .optional()
    .default('Unspecified Crop'),
  cropCategory: z.enum(cropCategories).optional().default('Other'),
  growthStage: z.enum(growthStages).optional().default('vegetative'),
  fieldLocation: z
    .string()
    .trim()
    .max(150, 'Field location cannot exceed 150 characters')
    .optional()
    .default(''),
  additionalObservations: z
    .string()
    .trim()
    .max(1000, 'Observations cannot exceed 1000 characters')
    .optional()
    .default(''),
})

export type UploadScanInput = z.infer<typeof uploadScanSchema>

