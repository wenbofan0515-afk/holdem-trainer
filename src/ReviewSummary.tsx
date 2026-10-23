import React from 'react';
import {TableState,bestFive,rankLabel,cardText} from './engine';
import {Card} from './ui';
export function ReviewSummary({t}:{t:TableState}){
 const me=t.players[0],delta=me.chips-me.startChips;
 const contenders=t.players.filter(p=>!p.folded&&p.cards.length===2);
 const winners=new Set(t.pots?.flatMap(p=>p.awards.map(a=>a.player))??[]);
 const cardPanel=(p:TableState["players"][number])=>{const best=bestFive([...p.cards,...t.board]);return <article key={p.id}><h3>{p.name} · {rankLabel([...p.cards,...t.board])}</h3><p>底牌 {p.cards.map(cardText).join(' ')} · 最佳5张如下</p><div className="best-five">{best.map((c,k)=><span key={k} className={p.cards.some(x=>x.rank===c.rank&&x.suit===c.suit)?'from-hand':'from-board'}><Card c={c}/><small>{p.cards.some(x=>x.rank===c.rank&&x.suit===c.suit)?'底牌':'公共牌'}</small></span>)}</div></article>};
 const primary=contenders.filter(p=>p.id===0||winners.has(p.id)),others=contenders.filter(p=>p.id!==0&&!winners.has(p.id));
 return <section className="review-summary" aria-label="复盘速览"><span className="eyebrow">本手已结算 · 立即复盘</span><h2>{me.cards.length===0?'本手观战':delta>0?'本手筹码增加':delta<0?'本手筹码减少':'本手筹码持平'} <strong>{delta>0?'+':''}{delta}</strong></h2><p>{me.startChips} → {me.chips} 筹码 · 你的 {t.decisions.filter(d=>d.player===0).length} 次决策已记录。看完复盘，再点击“继续下一手”。</p>
 {contenders.length>1?<><div className="showdown-grid">{primary.map(cardPanel)}</div>{others.length>0&&<details><summary>查看其余 {others.length} 位摊牌玩家</summary><div className="showdown-grid">{others.map(cardPanel)}</div></details>}</>:<p>其他玩家均已弃牌，最后未弃牌的玩家直接获胜，无需比较牌型。</p>}

 {me.folded&&<p>你已弃牌；未参与摊牌，不将你的最终假想牌力作为决策对错依据。</p>}
 <h3>底池分配</h3>{t.pots?.length?<div className="pot-breakdown">{t.pots.map((p,k)=><article key={k}><b>{k===0?'主池':`边池 ${k}`} · {p.amount} 筹码</b><p>可争夺：{p.eligible.map(id=>t.players[id].name).join('、')}</p><p>派奖：{p.awards.map(a=>`${t.players[a.player].name} +${a.amount}`).join('、')}</p></article>)}</div>:<p>这份旧存档未记录分池明细，下方保留原始派奖记录；新牌局会显示完整分配。</p>}
 <p className="note">金色边框为底牌，绿色边框为公共牌；同等最强的5张组合可能不唯一。下方按行动顺序列出各阶段决策，收益不等于决策质量。</p></section>
}
