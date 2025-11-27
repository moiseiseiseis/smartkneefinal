// src/analysis/analysis.types.ts

export interface RomStats {
  avg: number;
  min: number;
  max: number;
  count?: number;
}

export interface DurationStats {
  avg: number;
  min: number;
  max: number;
  total?: number;
}

export interface GlobalAnalysis {
  totalPatients: number;
  totalSessions: number;
  romByExercise: Record<string, RomStats>;
  sessionsPerDay: Record<string, number>;              // YYYY-MM-DD → count
  sessionsByPhase: Record<string, number>;             // phaseLabel (o "Sin fase") → count
  sessionsByType?: Record<string, number>;             // sessionType (o "Sin tipo") → count
  sessionsByExerciseAndPhase?: Record<string, Record<string, number>>;
}

export interface PatientRomTrendPoint {
  date: string;       // YYYY-MM-DD
  rom: number;
  sessionId?: string;
}

export interface PatientFrequencyPoint {
  date: string;       // YYYY-MM-DD
  sessionsCount: number;
}

export interface PatientAnalysis {
  patientId: string;
  totalSessions: number;
  avgRom: number | null;
  romByExercise: Record<string, RomStats>;
  romTrend: PatientRomTrendPoint[];
  sessionDurationStats: DurationStats | null;
  frequencyByDay: PatientFrequencyPoint[];
  sessionsByPhase: Record<string, number>;
  sessionsByType?: Record<string, number>;
}

export interface SessionAnalysis {
  sessionId: string;
  patientId: string;
  exerciseId: string;
  rom: number;
  durationSecs: number;
  percentilePatientExercise: number;
  percentileGlobalExercise: number;
  abovePatientAvg: boolean;
  aboveGlobalAvg: boolean;
  patientExerciseAvgRom: number | null;
  globalExerciseAvgRom: number | null;
  clinicalFlags?: string[];
}
