import React,{useEffect,useState} from 'react';
import {drills} from './engine';
import {Page} from './ui';
import {loadDrillSession} from './drillSession';
import {loadProgress} from './learning';
export {loadProgress} from './learning';
export type {Progress} from './learning';
export function Drill({back,initialIds,sourceLabel,returnLabel='上一页'}:{back:()=>void;initialIds?:number[];sourceLabel?:string;returnLabel?:string}){
 const sourceKey=initialIds?.length?JSON.stringify(initialIds):'all';
 const [resume,setResume]=useState(()=>loadDrillSession(sourceKey));
 const [progress,setProgress]=useState(loadProgress),[mode,setMode]=useState<'all'|'wrong'|'target'>(initialIds?.length?'target':'all');
 const [i,setI]=useState(0),[choice,setChoice]=useState<number|null>(null),[done,setDone]=useState(false);
 const [roundAnswers,setRoundAnswers]=useState<Record<string,boolean>>({});
 const [queue,setQueue]=useState(()=>initialIds?.length?[...new Set(initialIds)].filter(id=>Number.isInteger(id)&&id>=0&&id<drills.length):drills.map((_,j)=>j));
 const id=queue[i],q=drills[id],correct=Object.values(roundAnswers).filter(Boolean).length,roundWrong=queue.filter(id=>roundAnswers[id]===false);
 useEffect(()=>{if(!resume)localStorage.setItem('holdem-drill-session',JSON.stringify({queue,i,choice,done,roundAnswers,mode,sourceKey}))},[queue,i,choice,done,roundAnswers,mode,sourceKey,resume]);
 function reset(ids:number[],nextMode:typeof mode){setResume(null);setMode(nextMode);setQueue(ids);setI(0);setChoice(null);setDone(false);setRoundAnswers({})}
 function begin(wrong:boolean){reset(wrong?[...progress.wrong]:drills.map((_,j)=>j),wrong?'wrong':'all')}
 function answer(j:number){if(choice!==null||!q)return;setChoice(j);const correct=j===q[3];setRoundAnswers(old=>({...old,[id]:correct}));const p={wrong:correct?progress.wrong.filter(n=>n!==id):[...new Set([...progress.wrong,id])],answered:{...progress.answered,[id]:correct}};setProgress(p);localStorage.setItem('holdem-progress',JSON.stringify(p));}
 return <Page title="针对练" back={back}>
  {sourceLabel&&<p className="note">{sourceLabel} · 点击“返回”回到{returnLabel}。</p>}
  <div className="drill-toolbar"><button onClick={()=>begin(false)}>全部 {drills.length} 题</button><button disabled={!progress.wrong.length} onClick={()=>begin(true)}>重练错题（{progress.wrong.length}）</button><span>已答 {Object.keys(progress.answered).length} / {drills.length} · 作答后立即保存</span></div>
  {resume?<section className="question" aria-label="恢复练习"><h2>有一组未完成练习</h2><p>上次停在第 {resume.i+1} / {resume.queue.length} 题，已提交的答案会保留。</p><button onClick={()=>{setQueue(resume.queue);setI(resume.i);setChoice(resume.choice);setDone(false);setRoundAnswers(resume.roundAnswers);setMode(resume.mode);setResume(null)}}>继续上次练习</button><button onClick={()=>setResume(null)}>从本组重新开始</button></section>:done?<section className="question" aria-label="本组练习结果"><h2>本组练习完成</h2><p>本组答对 {correct} / {queue.length} · 正确率 {queue.length?(correct/queue.length*100).toFixed(1):'0.0'}%</p><p>当前还有 {progress.wrong.length} 道错题。答对重练题后会移出错题本；本组得分只反映这次作答。</p><div className="drill-toolbar"><button onClick={()=>reset(queue,mode)}>再练一组</button>{roundWrong.length>0&&<button onClick={()=>reset(roundWrong,'target')}>重练本组错题（{roundWrong.length}）</button>}<button onClick={back}>返回{returnLabel}</button></div></section>:q?<>
   <div className="progress">{mode==='wrong'?'错题重练':mode==='target'?'本手知识巩固':'核心练习'} · 第 {i+1} / {queue.length} 题</div>
   <progress className="drill-progress" aria-label="本组完成进度" max={queue.length} value={Object.keys(roundAnswers).length}/>
   <div className="question"><span>{q[0]}</span><h2>{q[1]}</h2><div className="options">{q[2].map((x,j)=><button className={choice!==null?(j===q[3]?'correct':choice===j?'wrong':''):''} disabled={choice!==null} onClick={()=>answer(j)} key={x}>{x}</button>)}</div>{choice!==null&&<div className={`feedback ${choice===q[3]?'good':'bad'}`} role="status"><b>{choice===q[3]?'判断正确':'已加入错题本'}</b><p>正确答案：{q[2][q[3]]}</p><p>{q[4]}</p><button onClick={()=>{if(i+1===queue.length)setDone(true);else{setI(i+1);setChoice(null)}}}>{i+1===queue.length?'查看本组结果':'下一题'}</button></div>}</div>
  </>:<section className="question"><h2>本组没有可用题目</h2><p>请选择全部题目或返回上一页。</p><button onClick={()=>begin(false)}>开始全部题目</button></section>}
 </Page>
}
