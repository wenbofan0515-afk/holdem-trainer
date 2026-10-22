import type { TableState } from './engine';

export const MATCH_SECONDS = 3600;
export type MatchStatus = 'playing' | 'last-hand' | 'finished-time' | 'finished-survivor';
export type Standing = { id: number; name: string; chips: number; rank: number; tied: boolean; points: number | null };
export type MatchReport = { id: string; seed: number; hand: number; elapsed: number; reason: MatchStatus; standings: Standing[] };

export function matchStatus(t: TableState): MatchStatus {
  if (t.handOver && t.players.filter(p => p.chips > 0).length <= 1) return 'finished-survivor';
  if (t.elapsed >= MATCH_SECONDS) return t.handOver ? 'finished-time' : 'last-hand';
  return 'playing';
}

export function matchFinished(t: TableState) {
  return matchStatus(t).startsWith('finished-');
}

export function advanceClock(t: TableState, seconds: number, speed = 1): TableState {
  if (matchFinished(t) || !Number.isFinite(seconds) || seconds <= 0) return t;
  const elapsed = Math.min(MATCH_SECONDS, t.elapsed + seconds * speed);
  return elapsed === t.elapsed ? t : { ...t, elapsed };
}

// Final chip ranking follows the agreed time-limited training rule. Tied places
// consume positions (1, 2, 2, 4). Disputed top-three points remain unassigned.
export function standings(t: TableState): Standing[] {
  return [...t.players].sort((a, b) => b.chips - a.chips || a.id - b.id).map(p => {
    const rank = 1 + t.players.filter(q => q.chips > p.chips).length;
    const tied = t.players.filter(q => q.chips === p.chips).length > 1;
    return { id: p.id, name: p.name, chips: p.chips, rank, tied,
      points: tied && rank <= 3 ? null : [30, 20, 10][rank - 1] ?? 0 };
  });
}

export function matchReport(t: TableState): MatchReport | null {
  if (!matchFinished(t)) return null;
  return { id: String(t.seed), seed: t.seed, hand: t.hand, elapsed: t.elapsed,
    reason: matchStatus(t), standings: standings(t) };
}

export function rememberReport(reports: MatchReport[], report: MatchReport): MatchReport[] {
  return [...reports.filter(r => r.id !== report.id), report].slice(-10);
}

// No wall-clock timestamp is persisted: a reload/closed page resumes paused.
// Reading accumulated wall time also handles throttled background intervals.
export class MatchClock {
  private last: number | null = null;
  private speed = 1;
  constructor(private now = () => Date.now()) {}
  start(speed: number) { this.speed = speed; this.last = this.now(); }
  tick(t: TableState): TableState {
    if (this.last === null) return t;
    const now = this.now();
    const seconds = Math.max(0, (now - this.last) / 1000);
    this.last = now;
    return advanceClock(t, seconds, this.speed);
  }
  stop() {
    const seconds = this.last === null ? 0 : Math.max(0, (this.now() - this.last) / 1000) * this.speed;
    this.last = null;
    return seconds;
  }
  pause(t: TableState) { return advanceClock(t, this.stop()); }
}
