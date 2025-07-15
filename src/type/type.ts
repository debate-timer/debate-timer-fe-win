import { UUID } from 'crypto';

// Types
export type Stance = 'PROS' | 'CONS' | 'NEUTRAL';
export type TimeBasedStance = Exclude<Stance, 'NEUTRAL'>;
export type TimeBoxType = 'NORMAL' | 'TIME_BASED';

// Type converters
export const StanceToString: Record<Stance, string> = {
  PROS: '찬성',
  CONS: '반대',
  NEUTRAL: '중립',
};

export const TimeBoxTypeToString: Record<TimeBoxType, string> = {
  NORMAL: '일반 타이머',
  TIME_BASED: '자유토론 타이머',
};

// Interfaces
export interface User {
  id: string;
  name: string;
}

export interface TimeBoxInfo {
  stance: Stance;
  speechType: string;
  boxType: TimeBoxType;
  time: number | null;
  timePerTeam: number | null;
  timePerSpeaking: number | null;
  speaker: string | null;
}

export interface DebateTable {
  id: UUID;
  name: string;
  agenda: string;
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

export interface DebateTableData {
  info: DebateInfo;
  table: TimeBoxInfo[];
}
