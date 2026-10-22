import { describe, it, expect } from 'vitest';
import { initialTable, applyAction, legalActions, startHand, computerAction } from './engine';
import type { TableState } from './engine';
import { advanceClock, matchStatus, matchFinished, standings, matchReport, rememberReport, MatchClock } from './match';
function finish(t: TableState) {
  for (let n = 0; !t.handOver && n < 200; n++) {
    t = applyAction(t, t.actor, legalActions(t).includes('check') ? 'check' : 'call');
  }
  expect(t.handOver).toBe(true); return t;
}
function result(chips: number[]) {
  const t = finish(initialTable());
  t.elapsed = 3600;
  t.players.forEach((p, i) => p.chips = chips[i]);
  return t;
}
describe('完整比赛与积分', () => {
  it('中途到点不立即排名，必须先完成最后一手', () => {
    let t = initialTable(); t.elapsed = 3599;
    t = advanceClock(t, 2);
    expect(t.elapsed).toBe(3600); expect(matchStatus(t)).toBe('last-hand');
    expect(matchReport(t)).toBeNull();
    t = finish(t);
    expect(matchStatus(t)).toBe('finished-time');
    expect(startHand(t)).toEqual(t);
    expect(matchReport(t)?.standings.reduce((s, p) => s + p.chips, 0)).toBe(9000);
  });
  it('在两手之间到点直接结束，不再扣盲', () => {
    const t = finish(initialTable()); t.elapsed = 3599.9;
    const end = advanceClock(t, .2);
    expect(matchFinished(end)).toBe(true);
    expect(startHand(end)).toEqual(end);
    expect(end.pot).toBe(0);
  });
  it('独立的前三名为30/20/10，其余为0', () => {
    const rows = standings(result([3000, 2000, 1500, 1000, 600, 400, 250, 150, 100]));
    expect(rows.map(p => p.points)).toEqual([30, 20, 10, 0, 0, 0, 0, 0, 0]);
    expect(rows.map(p => p.rank)).toEqual([1,2,3,4,5,6,7,8,9]);
  });
  it('并列第二不分争议积分且跳过第三，排序不靠座位分胜负', () => {
    const rows = standings(result([3000, 2000, 2000, 1000, 400, 250, 150, 100, 100]));
    expect(rows.slice(0,4).map(p => [p.rank,p.points])).toEqual([[1,30],[2,null],[2,null],[4,0]]);
    expect(rows.slice(-2).map(p => [p.rank,p.points])).toEqual([[8,0],[8,0]]);
  });
  it('并列跨越第三名边界与全员平局均不擅自分配积分', () => {
    expect(standings(result([4000,2000,1000,1000,400,250,150,100,100])).slice(2,4).every(p => p.points === null)).toBe(true);
    expect(standings(result(Array(9).fill(1000))).every(p => p.rank === 1 && p.points === null)).toBe(true);
  });
  it('只剩一人提前结束，旧存档无需新增字段也能识别', () => {
    const t = result([9000,0,0,0,0,0,0,0,0]); t.elapsed = 120;
    const restored = JSON.parse(JSON.stringify(t));
    expect(matchStatus(restored)).toBe('finished-survivor');
    expect(advanceClock(restored,1000)).toEqual(restored);
    expect(startHand(restored)).toEqual(restored);
    expect(matchReport(restored)?.standings[0].points).toBe(30);
  });
  it('结果刷新后不重复累计，保留最近10场', () => {
    const report = matchReport(result([3000,2000,1500,1000,600,400,250,150,100]))!;
    const once = rememberReport([],report);
    expect(rememberReport(JSON.parse(JSON.stringify(once)),report)).toHaveLength(1);
    let all = once;
    for(let seed=10;seed<25;seed++) all=rememberReport(all,{...report,id:String(seed),seed});
    expect(all).toHaveLength(10); expect(all[0].seed).toBe(15);
  });
  it('固定种子完整赛程至到点，升盲、续局、筹码守恒和终止', () => {
    for (const seed of [11,22,33]) {
      let t = initialTable(seed), steps=0;
      while (!matchFinished(t)) {
        expect(++steps).toBeLessThan(1500);
        t = advanceClock(t,10);
        if (t.handOver) t = startHand(t);
        else { const c=computerAction(t); t=applyAction(t,t.actor,c.action,c.amount); }
        expect(t.pot+t.players.reduce((s,p)=>s+p.chips,0)).toBe(9000);
      }
      expect(t.pot).toBe(0); expect(t.hand).toBeGreaterThan(1);
      expect(startHand(t)).toEqual(t);
      expect(matchReport(t)).not.toBeNull();
    }
  });
});
describe('实际时间、暂停、倍速和后台', () => {
  it('后台延迟按实际经过时间补计，倍速同时推进升盲', () => {
    let now=0; const clock = new MatchClock(()=>now); clock.start(5);
    let t=initialTable(); now=120000; t=clock.tick(t);
    expect(t.elapsed).toBe(600); t=finish(t); expect(startHand(t).handBig).toBe(40);
    now=240000; t=clock.tick(t); expect(t.elapsed).toBe(1200);
  });
  it('暂停不计时，关闭页面恢复也不计离线时间', () => {
    let now=0; let t=initialTable();const c=new MatchClock(()=>now); c.start(1);
    now=10000;t=c.pause(t); expect(t.elapsed).toBe(10);
    now=100000;t=c.tick(t);expect(t.elapsed).toBe(10);
    const restored=JSON.parse(JSON.stringify(t));const fresh=new MatchClock(()=>now);
    now=200000;expect(fresh.tick(restored).elapsed).toBe(10);
    fresh.start(5);now=201000;expect(fresh.tick(restored).elapsed).toBe(15);
  });
  it('切倍速不回溯，负时间和到点后都不继续累计', () => {
    let now=0; const c=new MatchClock(()=>now);let t=initialTable();c.start(1);
    now=1000;t=c.pause(t);c.start(5);now=2000;t=c.tick(t);expect(t.elapsed).toBe(6);
    expect(advanceClock(t,-20)).toBe(t);
    t.elapsed=3599;now=3000;t=c.tick(t);expect(t.elapsed).toBe(3600);
    now=9000;expect(c.tick(t).elapsed).toBe(3600);
  });
});
