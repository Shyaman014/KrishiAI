export interface ImageValidationResult {
  isValid: boolean
  error?: string
  width?: number
  height?: number
  fileSizeFormatted?: string
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const MIN_DIMENSION = 150 // 150x150 pixels minimum to ensure adequate foliage detail
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Validates file size, MIME type, decoding integrity, and dimensions.
 */
export async function validateCropImage(file: File): Promise<ImageValidationResult> {
  // 1. File size check
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `The selected photo (${formatFileSize(file.size)}) exceeds the 10 MB limit. Please select a smaller image.`,
    }
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: 'The selected file is empty (0 bytes). Please choose a valid crop photo.',
    }
  }

  // 2. MIME type check
  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      isValid: false,
      error: 'Unsupported image format. Please upload JPEG, PNG, or WebP leaf photographs.',
    }
  }

  // 3. Decoding & Dimensions check
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const width = img.naturalWidth
      const height = img.naturalHeight

      if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
        resolve({
          isValid: false,
          width,
          height,
          error: `Image resolution (${width}x${height}px) is too low for disease diagnostic analysis. Please capture a closer photo of at least 150x150px.`,
        })
        return
      }

      resolve({
        isValid: true,
        width,
        height,
        fileSizeFormatted: formatFileSize(file.size),
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve({
        isValid: false,
        error: 'Unable to decode image. The file may be damaged or not a valid picture.',
      })
    }

    img.src = objectUrl
  })
}

