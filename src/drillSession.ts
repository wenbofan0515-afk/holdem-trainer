import {drills} from './engine';
export type DrillSession={queue:number[];i:number;choice:number|null;done:boolean;roundAnswers:Record<string,boolean>;mode:'all'|'wrong'|'target';sourceKey:string};
export function loadDrillSession(sourceKey:string):DrillSession|null{
 try{
  const s=JSON.parse(localStorage.getItem('holdem-drill-session')||'null');
  if(!s||s.done!==false||!['all','wrong','target'].includes(s.mode)||typeof s.sourceKey!=='string'||(sourceKey!=='all'&&s.sourceKey!==sourceKey))return null;
  if(!Array.isArray(s.queue)||!s.queue.length||new Set(s.queue).size!==s.queue.length||!s.queue.every((id:unknown)=>typeof id==='number'&&Number.isInteger(id)&&id>=0&&id<drills.length))return null;
  if(!Number.isInteger(s.i)||s.i<0||s.i>=s.queue.length||!s.roundAnswers||typeof s.roundAnswers!=='object')return null;
  if(s.choice!==null&&(!Number.isInteger(s.choice)||s.choice<0||s.choice>=drills[s.queue[s.i]][2].length))return null;
  for(let j=0;j<s.i;j++)if(typeof s.roundAnswers[s.queue[j]]!=='boolean')return null;
  for(const [id,value] of Object.entries(s.roundAnswers))if(typeof value!=='boolean'||!s.queue.slice(0,s.i+(s.choice===null?0:1)).includes(Number(id)))return null;
  if(s.choice!==null&&s.roundAnswers[s.queue[s.i]]!==(s.choice===drills[s.queue[s.i]][3]))return null;
  return s;
 }catch{return null}
}
