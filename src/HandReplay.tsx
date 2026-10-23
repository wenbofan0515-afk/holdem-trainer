import React,{useState} from 'react';
import {TableState,actionName,streetName} from './engine';
import {Card} from './ui';
export function HandReplay({t}:{t:TableState}){
 const [step,setStep]=useState(0),count=t.decisions.length;
 const index=Math.min(step,count),d=t.decisions[index];
 const board=d?d.board:t.board,previous=index>0?t.decisions[index-1].board:[];
 const changed=board.length>previous.length;
 return <section className="hand-replay" aria-label="动作记录回放"><h3>逐步回放 · {d?`${index+1} / ${count} 次行动`:'最终结算'}</h3><p>只读查看记录，不重新下注。显示该动作前的公共牌及条件；不含盲注动画和历史思考耗时。</p>
 <div className="replay-seats" aria-label="本次行动者">{t.players.map(p=><span key={p.id} aria-current={d?.player===p.id?'true':undefined}>{p.name}{d?.player===p.id?' · 当前行动':''}</span>)}</div>
 <div className="replay-controls"><button disabled={index===0} onClick={()=>setStep(index-1)}>上一步</button><button disabled={index===count} onClick={()=>setStep(index+1)}>下一步</button><button disabled={index===count} onClick={()=>setStep(count)}>查看结算</button></div><div className="replay-controls">{['preflop','flop','turn','river'].map(s=>{const n=t.decisions.findIndex(x=>x.street===s);return <button key={s} aria-current={d?.street===s?'step':undefined} disabled={n<0} onClick={()=>setStep(n)}>{streetName(s)}</button>})}</div><p>你的底牌</p><div className="replay-cards">{t.players[0].cards.map((c,k)=><Card c={c} key={k}/>)}</div><p>公共牌 · {d?streetName(d.street):'结算'}{changed&&<strong className="new-street"> · 新增 {board.length-previous.length} 张（金色边框）</strong>}</p><div className="replay-cards">{board.length?board.map((c,k)=><div className={changed&&k>=previous.length?'new-board-card':''} key={k}><Card c={c}/></div>):'尚未发公共牌'}</div>{d?<div className={d.player===0?'replay-mine':'replay-action'} aria-live="polite"><h4>{t.players[d.player]?.name} · {actionName(d.action)}</h4><p>动作前底池 {d.potBefore} · 跟齐需补 {d.toCall}</p><p>本次投入 {d.paid} · 本轮累计到 {d.target}</p>{d.player===0&&<b>这是你的决策</b>}</div>:<div role="status"><h4>派奖完成</h4><p>{t.result.join('；')}</p><p>你的筹码 {t.players[0].startChips} → {t.players[0].chips}</p></div>}</section>
}
