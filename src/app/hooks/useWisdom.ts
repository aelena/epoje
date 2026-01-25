import { useCallback } from 'react'
import { GenerateRequest, GenerateResponse, LogRequest } from '../types'

const API_BASE = '/api'

export function useWisdom() {
  const generateWisdoms = useCallback(async (request: GenerateRequest): Promise<GenerateResponse> => {
    const response = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error('Failed to generate wisdoms')
    }

    return response.json()
  }, [])

  const logAction = useCallback(async (request: LogRequest): Promise<void> => {
    try {
      await fetch(`${API_BASE}/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })
    } catch {
      // Silently fail logging - non-critical
    }
  }, [])

  return { generateWisdoms, logAction }
}
