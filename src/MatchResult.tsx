import React from 'react';
import type { MatchReport } from './match';

export function MatchResult({ report }: { report: MatchReport }) {
  const hero = report.standings.find(p => p.id === 0)!;
  const disputed = report.standings.some(p => p.points === null);
  return <section className="match-result" aria-label="比赛最终结果">
    <div className="result-heading"><span className="eyebrow">比赛已结束 · FINAL RESULTS</span>
      <h2>{report.reason === 'finished-survivor' ? '只剩一位选手，提前结束' : '60 分钟到点，最后一手已结算'}</h2>
      <p>本场共 {report.hand} 手 · 比赛用时 {Math.floor(report.elapsed / 60)}:{String(Math.floor(report.elapsed % 60)).padStart(2, '0')} · 已完成全部派奖</p>
    </div>
    <div className="result-hero"><strong>你{hero.tied ? '并列' : ''}第 {hero.rank} 名</strong>
      <span>{hero.chips} 筹码 · {hero.points === null ? '积分待确认' : `${hero.points} 积分`}</span>
    </div>
    <div className="review-scroll"><table><caption>最终排名 · 按结算后的筹码排序</caption>
      <thead><tr><th>名次</th><th>选手</th><th>最终筹码</th><th>积分</th></tr></thead>
      <tbody>{report.standings.map(p => <tr key={p.id} className={p.id === 0 ? 'your-result' : ''}>
        <td>{p.tied ? '并列 ' : ''}{p.rank}</td><td>{p.name}{p.id === 0 ? '（你）' : ''}</td><td>{p.chips}</td>
        <td>{p.points === null ? '待确认' : p.points}</td>
      </tr>)}</tbody></table></div>
    <p className="note">前三名积分为 30、20、10，其余为 0。{disputed && '涉及前三的并列积分尚未分配，不能据此累计正式积分。'}同筹码按并列展示，采用 1、2、2、4 的占位方式；官方并列排名和积分处理仍待确认。</p>
    <p className="assumption">训练假设：无前注；到点完成当前手后结算。按最终筹码排名，不按淘汰先后排名。</p>
  </section>;
}
