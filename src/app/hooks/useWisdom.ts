import { GenerateRequest, GenerateResponse, LogRequest } from '../types';
import { useReservoir } from '../contexts/ReservoirContext';

// Relative by default: Vite proxies /api in dev, the API serves the app in prod
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export function useWisdom() {
  const { items } = useReservoir();

  const generateWisdoms = async (request: GenerateRequest): Promise<GenerateResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...request,
        reservoir_items: items.map(i => ({ text: i.text })),
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'The oracle is silent. Try again.');
    }

    return response.json();
  };

  const logAction = async (request: LogRequest): Promise<void> => {
    try {
      await fetch(`${API_BASE_URL}/api/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
    } catch {
      // Logging is best-effort
    }
  };

  return { generateWisdoms, logAction };
}
