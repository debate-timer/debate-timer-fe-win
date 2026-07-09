import { UUID } from 'crypto';

// Types
export type Stance = 'PROS' | 'CONS' | 'NEUTRAL';
export type TimeBoxType = 'NORMAL' | 'TIME_BASED';

export interface TimeBoxInfo {
  stance: Stance;
  speechType: string;
  boxType: TimeBoxType;
  time: number | null;
  timePerTeam: number | null;
  timePerSpeaking: number | null;
  speaker: string | null;
  // 자유토론(TIME_BASED)에서 1회당 발언 시간(timePerSpeaking)을 초과해도
  // 타이머를 마이너스로 계속 흐르게 할지 여부 (기본 false)
  allowSpeakingOverflow?: boolean;
}

export interface DebateInfo {
  id: UUID;
  datetime: string;
  name: string;
  agenda: string;
  prosTeamName: string;
  consTeamName: string;
  warningBell: boolean;
  finishBell: boolean;
}

export interface DebateTable {
  id: number;
  name: string;
  agenda: string;
}

export interface DebateTableData {
  info: DebateInfo;
  table: TimeBoxInfo[];
}
