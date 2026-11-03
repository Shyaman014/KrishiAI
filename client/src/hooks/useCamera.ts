import { useState, useRef, useCallback, useEffect } from 'react'

export interface CameraDevice {
  deviceId: string
  label: string
}

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>
  isStreaming: boolean
  isLoading: boolean
  error: string | null
  facingMode: 'environment' | 'user'
  devices: CameraDevice[]
  hasMultipleCameras: boolean
  startCamera: (preferredFacingMode?: 'environment' | 'user') => Promise<void>
  stopCamera: () => void
  toggleFacingMode: () => Promise<void>
  capturePhoto: () => Promise<{ file: File; previewUrl: string } | null>
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [devices, setDevices] = useState<CameraDevice[]>([])

  // Safely stop all active tracks
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch {
          // Ignore track stop errors
        }
      })
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsStreaming(false)
    setIsLoading(false)
  }, [])

  // Enumerate video devices
  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = allDevices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1}`,
        }))
      setDevices(videoInputs)
    } catch {
      // Non-critical: Ignore device listing failures
    }
  }, [])

  // Request camera access and attach stream to video element
  const startCamera = useCallback(
    async (preferredFacingMode?: 'environment' | 'user') => {
      setError(null)
      setIsLoading(true)

      // Stop any existing stream before starting a new one
      stopCamera()

      // Check environment support
      if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
        setError('Camera access requires a secure HTTPS connection.')
        setIsLoading(false)
        return
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera capture is not supported on this browser. Please upload from your gallery instead.')
        setIsLoading(false)
        return
      }

      const targetFacing = preferredFacingMode || facingMode

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
        },
        audio: false,
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          // Play video when ready
          await videoRef.current.play().catch(() => {
            // Autoplay policy might pause until user interaction
          })
        }

        setFacingMode(targetFacing)
        setIsStreaming(true)
        await refreshDevices()
      } catch (err: unknown) {
        const errorObj = err as Error
        if (errorObj.name === 'NotAllowedError' || errorObj.name === 'PermissionDeniedError') {
          setError('Camera permission was denied. Please allow camera access in your browser settings to take live leaf photos.')
        } else if (errorObj.name === 'NotFoundError' || errorObj.name === 'DevicesNotFoundError') {
          setError('No camera device was detected on your device. Please use gallery upload.')
        } else if (errorObj.name === 'NotReadableError' || errorObj.name === 'TrackStartError') {
          setError('The camera is currently being used by another application. Please close other camera apps and retry.')
        } else {
          setError(`Unable to start camera: ${errorObj.message || 'Unknown camera error'}`)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [facingMode, refreshDevices, stopCamera],
  )

  // Toggle between environment (back) and user (front) cameras
  const toggleFacingMode = useCallback(async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(nextMode)
    if (isStreaming) {
      await startCamera(nextMode)
    }
  }, [facingMode, isStreaming, startCamera])

  // Capture current video frame to high-resolution JPEG
  const capturePhoto = useCallback(async (): Promise<{ file: File; previewUrl: string } | null> => {
    const video = videoRef.current
    if (!video || !isStreaming || video.videoWidth === 0 || video.videoHeight === 0) {
      return null
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // Mirror image if front facing camera for natural orientation
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null)
            return
          }

          const filename = `crop_scan_${Date.now()}.jpg`
          const file = new File([blob], filename, { type: 'image/jpeg' })
          const previewUrl = URL.createObjectURL(blob)

          resolve({ file, previewUrl })
        },
        'image/jpeg',
        0.92,
      )
    })
  }, [facingMode, isStreaming])

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return {
    videoRef,
    isStreaming,
    isLoading,
    error,
    facingMode,
    devices,
    hasMultipleCameras: devices.length > 1,
    startCamera,
    stopCamera,
    toggleFacingMode,
    capturePhoto,
  }
}

