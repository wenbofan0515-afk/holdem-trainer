import React from 'react';
import {loadProgress,trainingSummary,learningGroups} from './learning';
export function LearningPanel({onPractice}:{onPractice:(ids:number[])=>void}){
 const p=loadProgress(),s=trainingSummary(p);
 return <section className="learning-panel" aria-label="学习记录与下一步"><h2>下一次练什么</h2><p>已答 {s.answered} / 20 · 最近作答正确 {s.correct} 题 · 待重练 {p.wrong.length} 题</p><p>{s.reason}。记录仅保存在本机；题目表现不等于实战胜率。</p>{s.recommendation.length>0&&<button onClick={()=>onPractice(s.recommendation)}>开始推荐练习（{s.recommendation.length} 题）</button>}<div className="learning-groups">{learningGroups.map(g=>{const answered=g.ids.filter(id=>p.answered[id]!==undefined),correct=answered.filter(id=>p.answered[id]);return <article key={g.name}><h3>{g.name}</h3><p>已练 {answered.length} / {g.ids.length} · 最近正确 {correct.length}</p><button onClick={()=>onPractice(g.ids)}>练习这一类</button></article>})}</div></section>
}
