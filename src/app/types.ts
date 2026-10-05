// One call to the oracle: up to 5 alternatives, one of them chosen
export interface OracleRound {
  wisdoms: string[];
  selectedIndex: number;
}

export interface AppState {
  situation: string;
  rounds: OracleRound[];  // oldest first; the last one is the live round
  wisdomHistory: string[];
  isLoading: boolean;
  hasStarted: boolean;
  temperature: number;
  sessionId: string;
  reservoirActive: boolean;
  error: string | null;
}

export interface GenerateRequest {
  situation: string;
  previous_wisdoms: string[];
  action: 'initial' | 'more' | 'less';
  temperature: number;
  session_id: string;
  count: number;
  reservoir_items?: ReservoirItem[];
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

export interface ReservoirItem {
  id: string;  // UUID, generated client-side (web app or extension)
  text: string;
  source_url?: string;
  source_title?: string;
  created_at: string;
}

// i18n (future): UI strings are inline English for now; ES planned, see README "Roadmap: Spanish"
export const DEFAULT_TEMP = 0.7;
export const MIN_TEMP = 0.3;
export const MAX_TEMP = 1.3;
export const MAX_CHARS = 280;
export const RESERVOIR_MIN_ACTIVE = 10;
