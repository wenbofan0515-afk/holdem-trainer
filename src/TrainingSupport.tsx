import React from 'react';
import {Decision,TableState,actionName,streetName} from './engine';

export function decisionTakeaways(decisions:Decision[]){
 const mine=decisions.filter(d=>d.player===0);
 const priority=(d:Decision)=>d.action==='allin'?4:d.action==='call'?3:['raise','bet'].includes(d.action)?2:d.action==='fold'?1:0;
 return mine.map((d,index)=>({d,index})).sort((a,b)=>priority(b.d)-priority(a.d)||b.d.paid-a.d.paid||a.index-b.index).slice(0,2).map(({d,index})=>{
  const title=`第 ${index+1} 次 · ${streetName(d.street)} · ${actionName(d.action)}，投入 ${d.paid}`;
  if(d.action==='call'){
   const pot=d.eligiblePotBefore??d.potBefore,threshold=d.paid/(pot+d.paid)*100;
   return {title,kind:'数学核对',body:`当时可争夺底池 ${pot}，补 ${d.paid}，单次跟注所需权益为 ${d.paid} ÷ (${pot} + ${d.paid}) = ${threshold.toFixed(1)}%。下次先比较跟注成本与估计权益；此值不是实际胜率，未计后续下注。`};
  }
  if(d.action==='allin')return {title,kind:'条件性建议',body:'全下会用剩余筹码争夺相应底池。下次先确认可争夺的主池／边池、有效筹码和剩余比赛时间；没有对手范围与权益估计，不能断言这次全下划算或错误。'};
  if(d.action==='bet'||d.action==='raise')return {title,kind:'条件性建议',body:`这次本轮累计到 ${d.target}，实际新增 ${d.paid}。下次先想清楚：希望较弱牌跟注，还是希望更强牌弃牌？再结合对手范围与位置决定金额，不能按最终输赢判断。`};
  if(d.action==='fold')return {title,kind:'规则回顾',body:`当时跟齐需补 ${d.toCall}，你选择弃牌，本手不再投入也不再争夺底池。下次比较未来需付出的成本与牌力，不因之前已投入而勉强跟注；事后发出的牌不能证明弃牌错误。`};
  return {title,kind:'规则回顾',body:'当时无需补筹码，你选择免费过牌。下次注意：若同轮后续有人下注，仍需重新跟、加或弃；过牌不保证免费看到下一张。'};
 });
}
export function KeyDecisions({t}:{t:TableState}){
 const tips=decisionTakeaways(t.decisions);
 return <section className="key-decisions" aria-label="关键决策复盘"><h3>这手记住 {tips.length?`${tips.length} 个重点`:'这一点'}</h3>{tips.length?tips.map((tip,k)=><article key={k}><span className="tip-kind">{tip.kind}</span><b>{tip.title}</b><p>{tip.body}</p></article>):<p>本手没有你的主动决策，盲注或观战不算主动操作。</p>}<small>仅依据你当时的操作与公开下注条件，不读取对手隐藏底牌，不给未经求解的“最优操作”评分。</small></section>;
}
export function ActionFeedback({t,running}:{t:TableState;running:boolean}){
 const mine=t.decisions.filter(d=>d.player===0),d=mine[mine.length-1];
 if(!d)return null;
 return <section className="action-feedback" aria-label="操作已提交" role="status" aria-live="polite"><b>已提交：{streetName(d.street)} · {actionName(d.action)} · 本次投入 {d.paid}</b><p>{['raise','bet','allin'].includes(d.action)?`本轮累计到 ${d.target}。`:d.action==='fold'?'已退出本手，之前投入不退。':d.action==='check'?'免费过牌，没有增加投入。':'已补跟注差额。'} {t.handOver?'本手已结算，请看即时复盘。':!running?'当前已暂停，点击“开始 / 继续”恢复。':t.actor===0?'再次轮到你，请按最新价格选择。':`接下来由${t.players[t.actor]?.name}行动；电脑自动继续，无需重复点击。`}</p></section>;
}
export function FirstHandGuide({t,confirmed,running,onDismiss}:{t:TableState;confirmed:boolean;running:boolean;onDismiss:()=>void}){
 const step=!confirmed?0:!running&&!t.handOver?1:t.handOver?4:t.decisions.some(d=>d.player===0)?3:2;
 const labels=['确认规则','启动牌局','选择操作','跟随各轮','查看复盘'];
 const explanations=['先阅读下方训练假设，勾选“我已理解并接受”。','点击“开始 / 继续”，电脑会自动行动；暂停时比赛时钟停止。','等到“轮到你行动”，看底牌、公共牌和需补筹码，再选择一个合法操作。','每次只提交一个动作，电脑自动接续；新一轮或再次被加注时，还会轮到你。','先看筹码变化和关键决策，再点击“继续下一手”。若全弃或全下，可能提前进入复盘。'];
 return <aside className="first-guide" aria-label="首手学习引导"><div><b>首手引导 · {step+1}/5 · {labels[step]}</b><button onClick={onDismiss}>{step===4?'完成引导':'跳过引导'}</button></div><ol>{labels.map((label,k)=><li key={label} aria-current={step===k?'step':undefined}>{k+1}. {label}</li>)}</ol><p>{explanations[step]}</p><small>引导不代替你操作；可随时跳过，之后也可重新开启。</small></aside>;
}
