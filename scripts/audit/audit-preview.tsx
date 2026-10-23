import React from 'react';import{createRoot}from'react-dom/client';import{Game}from'./Game';import{initialTable,applyAction,legalActions}from'./engine';import'./styles.css';
const scenario=new URLSearchParams(location.search).get('action')||'call';let t=initialTable(456);
while(t.actor!==0)t=applyAction(t,t.actor,legalActions(t).includes('check')?'check':'call');
if(['check','bet'].includes(scenario)){while(t.street==='preflop')t=applyAction(t,t.actor,legalActions(t).includes('check')?'check':'call');while(t.actor!==0)t=applyAction(t,t.actor,'check');}
localStorage.clear();localStorage.setItem('holdem-table',JSON.stringify(t));
const log=document.createElement('pre');log.id='audit-log';document.body.append(log);
document.addEventListener('click',e=>{const el=(e.target as HTMLElement).closest('button,input,summary,a');if(!el)return;const name=el.textContent||el.getAttribute('aria-label')||el.tagName;const start=performance.now();requestAnimationFrame(()=>requestAnimationFrame(()=>{log.textContent+=JSON.stringify({operation:name,paintMs:Math.round((performance.now()-start)*10)/10})+'\n';}));},true);
createRoot(document.getElementById('root')!).render(<div className="app"><Game back={()=>{}}/></div>);
