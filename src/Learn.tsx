import React,{useState} from 'react';
import {Card as PlayingCard,rankLabel,bestFive} from './engine';
import {Card,Page} from './ui';
const hole=[{rank:'A',suit:'s'},{rank:'K',suit:'s'}] as PlayingCard[];
const board=[{rank:'J',suit:'s'},{rank:'T',suit:'s'},{rank:'2',suit:'c'},{rank:'3',suit:'d'},{rank:'Q',suit:'s'}] as PlayingCard[];
const steps=[
 {title:'盲注与底牌',n:0,text:'小盲10、大盲20先投入，再发每人两张底牌。盲注是强制下注，计入本轮已投入。',condition:'9人桌示意；以下各轮价格用于独立讲解，不连续计算筹码。',actions:['小盲先付10','大盲先付20']},
 {title:'翻牌前',n:0,text:'9人桌从大盲左侧先行动。轮到小盲时，假设无人加注，已付10只需补10；大盲若未被加注可过牌。',condition:'以小盲为例：最高投入20、已投入10、最近完整加注20。',actions:['跟注补10','最小加注到40','弃牌']},
 {title:'翻牌',n:3,text:'一次翻出3张公共牌。新一轮从庄家左侧仍在局中的玩家开始。各轮已投入归零，之前付过钱不代表现在必须跟。',condition:'示例：无人下注，跟齐需补0，本手大盲20。',actions:['过牌 · 免费','下注至少20']},
 {title:'转牌',n:4,text:'再发1张公共牌并重新下注。若你先过牌，后面有人下注，仍需重新选择跟、加或弃。',condition:'示例：对手先下注40，你本轮投入0，最近完整下注40。',actions:['跟注补40','最小加注到80','弃牌']},
 {title:'河牌',n:5,text:'最后1张公共牌发出后再下注一次。没有后续公共牌，不能再用听牌命中概率代替当前摊牌权益。',condition:'示例：无人下注，仍可免费过牌或主动下注。',actions:['过牌 · 免费','下注至少20']},
 {title:'摊牌与派奖',n:5,text:'从底牌和公共牌共7张中选最强5张，可用0、1或2张底牌。只剩一人未弃牌时提前获胜，不必发完公共牌。',condition:'本例你的A♠ K♠与公共牌Q♠ J♠ 10♠组成A高同花顺。花色本身不分大小，边池分别结算。',actions:['比较最强5张','按主池 / 边池资格派奖']}
];
export function Learn({back,onPractice}:{back:()=>void;onPractice?:(ids:number[])=>void}){
 const [step,setStep]=useState(0),s=steps[step];
 return <Page title="跟着学" back={back}><h2>用同一副牌，走完一手流程</h2><p>分步规则示意，不执行下注或比赛计时。每轮价格是独立的教学条件。</p><div className="lesson-steps" aria-label="教学步骤">{steps.map((x,k)=><button key={x.title} aria-current={step===k?'step':undefined} onClick={()=>setStep(k)}>{k+1}. {x.title}</button>)}</div><section className="lesson-panel" aria-live="polite"><span>第 {step+1} / {steps.length} 步</span><h2>{s.title}</h2><p>{s.text}</p><h3>你的底牌</h3><div className="replay-cards">{hole.map((c,k)=><Card c={c} key={k}/>)}</div><h3>公共牌 · {s.n} 张</h3><div className="replay-cards">{board.slice(0,s.n).map((c,k)=><Card c={c} key={k}/>)}{!s.n&&'尚未翻牌'}</div><p className="note">{s.condition}</p><div className="lesson-options">{s.actions.map(a=><span key={a}>{a}</span>)}</div>{step===5&&<><h3>你的最强5张 · {rankLabel([...hole,...board])}</h3><div className="replay-cards">{bestFive([...hole,...board]).map((c,k)=><Card c={c} key={k}/>)}</div><p>完整的下一手会轮转庄家和盲注；比赛到点后按已确认训练假设结算。</p>{onPractice&&<button onClick={()=>onPractice([5,6,15,13])}>练习这几个操作规则</button>}</>}</section><div className="replay-controls"><button disabled={step===0} onClick={()=>setStep(step-1)}>上一步教学</button><button disabled={step===steps.length-1} onClick={()=>setStep(step+1)}>下一步教学</button><button onClick={()=>setStep(0)}>从头重播</button></div></Page>
}
