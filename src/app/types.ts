export interface AppState {
  situation: string;
  currentWisdoms: string[];
  selectedIndex: number;
  wisdomHistory: string[];
  isLoading: boolean;
  hasStarted: boolean;
  temperature: number;
  sessionId: string;
  reservoirActive: boolean;
}

export interface GenerateRequest {
  situation: string;
  previous_wisdoms: string[];
  action: 'initial' | 'more' | 'less';
  temperature: number;
  session_id: string;
  count: number;
}

export interface GenerateResponse {
  wisdoms: string[];
  selected_index: number;
  temperature_used: number;
  reservoir_active: boolean;
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
