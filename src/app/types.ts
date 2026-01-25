export interface AppState {
  situation: string;
  currentWisdom: string | null;
  wisdomHistory: string[];
  isLoading: boolean;
  hasStarted: boolean;
  temperature: number;
  topP: number;
  sessionId: string;
}

export interface GenerateRequest {
  situation: string;
  previous_wisdoms: string[];
  action: 'initial' | 'more' | 'less';
  temperature: number;
  top_p: number;
  session_id: string;
}

export interface GenerateResponse {
  wisdom: string;
  temperature_used: number;
  top_p_used: number;
}

export interface LogRequest {
  session_id: string;
  action: 'export' | 'cooldown' | 'reset';
  data: Record<string, unknown>;
}

export const DEFAULT_TEMP = 0.7;
export const DEFAULT_TOP_P = 0.9;
export const MIN_TEMP = 0.3;
export const MAX_TEMP = 1.3;
export const MIN_TOP_P = 0.7;
export const MAX_TOP_P = 1.0;
export const MAX_CHARS = 280;
