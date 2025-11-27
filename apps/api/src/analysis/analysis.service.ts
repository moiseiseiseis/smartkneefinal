// src/analysis/analysis.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import {
  GlobalAnalysis,
  PatientAnalysis,
  PatientFrequencyPoint,
  PatientRomTrendPoint,
  RomStats,
  DurationStats,
  SessionAnalysis,
} from './analysis.types';

@Injectable()
export class AnalysisService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- UTILIDADES PRIVADAS ----------

  private formatDate(date: Date): string {
    // YYYY-MM-DD en UTC
    return date.toISOString().slice(0, 10);
  }

  private computeRomStats(values: number[]): RomStats {
    if (!values.length) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }
    let min = values[0];
    let max = values[0];
    let sum = 0;

    for (const v of values) {
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
    }

    return {
      avg: sum / values.length,
      min,
      max,
      count: values.length,
    };
  }

  private computeDurationStats(values: number[]): DurationStats {
    if (!values.length) {
      return { avg: 0, min: 0, max: 0, total: 0 };
    }
    let min = values[0];
    let max = values[0];
    let sum = 0;

    for (const v of values) {
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
    }

    return {
      avg: sum / values.length,
      min,
      max,
      total: sum,
    };
  }

  private computePercentileFromSorted(sortedValues: number[], target: number): number {
    if (!sortedValues.length) {
      return 0;
    }

    let countLessOrEqual = 0;
    for (const v of sortedValues) {
      if (v <= target) countLessOrEqual++;
    }

    let p = (countLessOrEqual / sortedValues.length) * 100;
    if (p < 0) p = 0;
    if (p > 100) p = 100;
    return p;
  }

  // ---------- 1) GLOBAL ANALYSIS ----------

  async getGlobalAnalysis(): Promise<GlobalAnalysis> {
    const [totalPatients, totalSessions, sessions] = await Promise.all([
      this.prisma.patient.count(),
      this.prisma.session.count(),
      this.prisma.session.findMany({
        select: {
          id: true,
          patientId: true,
          startedAt: true,
          romMaxDeg: true,
          durationSecs: true,
          exerciseId: true,
          phaseLabel: true,
          sessionType: true,
        },
      }),
    ]);

    const romValuesByExercise: Record<string, number[]> = {};
    const sessionsPerDay: Record<string, number> = {};
    const sessionsByPhase: Record<string, number> = {};
    const sessionsByType: Record<string, number> = {};
    const sessionsByExerciseAndPhase: Record<string, Record<string, number>> = {};

    for (const s of sessions) {
      const dayKey = this.formatDate(s.startedAt);

      // sesiones por día
      sessionsPerDay[dayKey] = (sessionsPerDay[dayKey] || 0) + 1;

      // por fase (null → "Sin fase")
      const phaseKey = s.phaseLabel ?? 'Sin fase';
      sessionsByPhase[phaseKey] = (sessionsByPhase[phaseKey] || 0) + 1;

      // por tipo (null → "Sin tipo")
      const typeKey = s.sessionType ?? 'Sin tipo';
      sessionsByType[typeKey] = (sessionsByType[typeKey] || 0) + 1;

      // nested: ejercicio + fase
      const exerciseKeyNested = s.exerciseId ?? 'Sin ejercicio';
      if (!sessionsByExerciseAndPhase[exerciseKeyNested]) {
        sessionsByExerciseAndPhase[exerciseKeyNested] = {};
      }
      const phaseMap = sessionsByExerciseAndPhase[exerciseKeyNested];
      phaseMap[phaseKey] = (phaseMap[phaseKey] || 0) + 1;

      // ROM por ejercicio: solo si hay exerciseId y romMaxDeg
      if (s.exerciseId && s.romMaxDeg != null) {
        if (!romValuesByExercise[s.exerciseId]) {
          romValuesByExercise[s.exerciseId] = [];
        }
        romValuesByExercise[s.exerciseId].push(s.romMaxDeg);
      }
    }

    const romByExercise: Record<string, RomStats> = {};
    for (const [exerciseId, values] of Object.entries(romValuesByExercise)) {
      romByExercise[exerciseId] = this.computeRomStats(values);
    }

    const result: GlobalAnalysis = {
      totalPatients,
      totalSessions,
      romByExercise,
      sessionsPerDay,
      sessionsByPhase,
      sessionsByType,
      sessionsByExerciseAndPhase,
    };

    return result;
  }

  // ---------- 2) PATIENT ANALYSIS ----------

  async getPatientAnalysis(patientId: string): Promise<PatientAnalysis> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const sessions = await this.prisma.session.findMany({
      where: { patientId },
      orderBy: { startedAt: 'asc' },
    });

    const totalSessions = sessions.length;

    if (!totalSessions) {
      // paciente sin sesiones: estructura vacía pero coherente
      return {
        patientId,
        totalSessions: 0,
        avgRom: null,
        romByExercise: {},
        romTrend: [],
        sessionDurationStats: null,
        frequencyByDay: [],
        sessionsByPhase: {},
        sessionsByType: {},
      };
    }

    const romValues: number[] = [];
    const romValuesByExercise: Record<string, number[]> = {};

    const durationValues: number[] = [];

    const romTrend: PatientRomTrendPoint[] = [];
    const frequencyByDayMap: Record<string, number> = {};
    const sessionsByPhase: Record<string, number> = {};
    const sessionsByType: Record<string, number> = {};

    for (const s of sessions) {
      const dayKey = this.formatDate(s.startedAt);

      // frecuencia por día
      frequencyByDayMap[dayKey] = (frequencyByDayMap[dayKey] || 0) + 1;

      // fases
      const phaseKey = s.phaseLabel ?? 'Sin fase';
      sessionsByPhase[phaseKey] = (sessionsByPhase[phaseKey] || 0) + 1;

      // tipo
      const typeKey = s.sessionType ?? 'Sin tipo';
      sessionsByType[typeKey] = (sessionsByType[typeKey] || 0) + 1;

      // duración
      if (s.durationSecs != null) {
        durationValues.push(s.durationSecs);
      }

      // ROM y tendencias
      if (s.romMaxDeg != null) {
        romValues.push(s.romMaxDeg);

        if (s.exerciseId) {
          if (!romValuesByExercise[s.exerciseId]) {
            romValuesByExercise[s.exerciseId] = [];
          }
          romValuesByExercise[s.exerciseId].push(s.romMaxDeg);
        }

        romTrend.push({
          date: dayKey,
          rom: s.romMaxDeg,
          sessionId: s.id,
        });
      }
    }

    const avgRom = romValues.length ? this.computeRomStats(romValues).avg : null;

    const romByExercise: Record<string, RomStats> = {};
    for (const [exerciseId, values] of Object.entries(romValuesByExercise)) {
      romByExercise[exerciseId] = this.computeRomStats(values);
    }

    const frequencyByDay: PatientFrequencyPoint[] = Object.entries(frequencyByDayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, sessionsCount]) => ({ date, sessionsCount }));

    romTrend.sort((a, b) => a.date.localeCompare(b.date));

    const sessionDurationStats = durationValues.length
      ? this.computeDurationStats(durationValues)
      : null;

    const result: PatientAnalysis = {
      patientId,
      totalSessions,
      avgRom,
      romByExercise,
      romTrend,
      sessionDurationStats,
      frequencyByDay,
      sessionsByPhase,
      sessionsByType,
    };

    return result;
  }

  // ---------- 3) SESSION ANALYSIS ----------

  async getSessionAnalysis(sessionId: string): Promise<SessionAnalysis> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (!session.exerciseId) {
      throw new BadRequestException(
        'Session has no exerciseId set, cannot analyze this session.',
      );
    }

    if (session.romMaxDeg == null) {
      throw new BadRequestException(
        'Session has no romMaxDeg set, cannot analyze this session.',
      );
    }

    const rom = session.romMaxDeg;
    const exerciseId = session.exerciseId;

    const [patientExerciseSessions, globalExerciseSessions] = await Promise.all([
      this.prisma.session.findMany({
        where: {
          patientId: session.patientId,
          exerciseId,
          romMaxDeg: { not: null },
        },
        select: { romMaxDeg: true },
      }),
      this.prisma.session.findMany({
        where: {
          exerciseId,
          romMaxDeg: { not: null },
        },
        select: { romMaxDeg: true },
      }),
    ]);

    const patientRomValues = patientExerciseSessions
      .map((s) => s.romMaxDeg as number)
      .sort((a, b) => a - b);

    const globalRomValues = globalExerciseSessions
      .map((s) => s.romMaxDeg as number)
      .sort((a, b) => a - b);

    const patientExerciseAvgRom = patientRomValues.length
      ? this.computeRomStats(patientRomValues).avg
      : null;

    const globalExerciseAvgRom = globalRomValues.length
      ? this.computeRomStats(globalRomValues).avg
      : null;

    const percentilePatientExercise = patientRomValues.length
      ? this.computePercentileFromSorted(patientRomValues, rom)
      : 0;

    const percentileGlobalExercise = globalRomValues.length
      ? this.computePercentileFromSorted(globalRomValues, rom)
      : 0;

    const abovePatientAvg =
      patientExerciseAvgRom !== null ? rom >= patientExerciseAvgRom : false;

    const aboveGlobalAvg =
      globalExerciseAvgRom !== null ? rom >= globalExerciseAvgRom : false;

    const clinicalFlags: string[] = [];

    if (globalExerciseAvgRom !== null) {
      if (rom <= globalExerciseAvgRom - 10) {
        clinicalFlags.push(
          'ROM notablemente por debajo del promedio global para este ejercicio.',
        );
      } else if (rom >= globalExerciseAvgRom + 10) {
        clinicalFlags.push(
          'ROM notablemente por encima del promedio global para este ejercicio.',
        );
      }
    }

    if (percentileGlobalExercise <= 25) {
      clinicalFlags.push('Sesión en el cuartil inferior global (≤25%).');
    }

    if (percentileGlobalExercise >= 75) {
      clinicalFlags.push('Sesión en el cuartil superior global (≥75%).');
    }

    const result: SessionAnalysis = {
      sessionId: session.id,
      patientId: session.patientId,
      exerciseId,
      rom,
      durationSecs: session.durationSecs ?? 0,
      percentilePatientExercise,
      percentileGlobalExercise,
      abovePatientAvg,
      aboveGlobalAvg,
      patientExerciseAvgRom,
      globalExerciseAvgRom,
      clinicalFlags,
    };

    return result;
  }
}
