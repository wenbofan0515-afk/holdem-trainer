import {drills} from './engine';
export type Progress={wrong:number[];answered:Record<string,boolean>};
export function loadProgress():Progress{
 try{const p=JSON.parse(localStorage.getItem('holdem-progress')||'{}');const answered:Record<string,boolean>={};if(p?.answered&&typeof p.answered==='object')for(const [id,value] of Object.entries(p.answered)){const n=Number(id);if(Number.isInteger(n)&&String(n)===id&&n>=0&&n<drills.length&&typeof value==='boolean')answered[id]=value}return {wrong:Array.isArray(p?.wrong)?[...new Set<number>(p.wrong.filter((n:unknown):n is number=>typeof n==='number'&&Number.isInteger(n)&&n>=0&&n<drills.length))]:[],answered}}catch{return {wrong:[],answered:{}}}
}
export const learningGroups=[{name:'操作规则',ids:[0,5,6,7,14,15,16]},{name:'概率与赔率',ids:[1,2,11,12,13]},{name:'牌型比较',ids:[8,9,10]},{name:'比赛与筹码',ids:[3,4,17,18,19]}];
export function trainingSummary(p:Progress){
 const remaining=drills.map((_,id)=>id).filter(id=>p.answered[id]===undefined),wrong=[...p.wrong].sort((a,b)=>a-b);
 return {answered:Object.keys(p.answered).length,correct:Object.values(p.answered).filter(Boolean).length,remaining,
  recommendation:[...new Set([...wrong,...remaining])].slice(0,4),reason:wrong.length?'先巩固当前错题，再补未练内容':remaining.length?'继续未作答知识点':'20 题均已作答，当前没有待重练错题'};
}
