// @vitest-environment jsdom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {it,expect} from 'vitest';
import {HandReplay} from './HandReplay';
import {initialTable,applyAction,legalActions} from './engine';
it('回放不提前显示未来公牌，导航有限，跳至结算且不修改牌局',async()=>{
 (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
 let t=initialTable(42);while(!t.handOver)t=applyAction(t,t.actor,legalActions(t).includes('check')?'check':'call');
 const original=JSON.stringify(t),el=document.createElement('div'),root=createRoot(el);
 await act(async()=>root.render(<HandReplay t={t}/>));
 expect(el.textContent).toContain('尚未发公共牌');expect(el.querySelectorAll('.replay-cards')[1].querySelectorAll('.card')).toHaveLength(0);
 async function click(label:string){const button=[...el.querySelectorAll('button')].find(b=>b.textContent===label)!;await act(async()=>button.click())}
 expect((el.querySelector('button') as HTMLButtonElement).disabled).toBe(true);
 await click('翻牌');expect(el.querySelectorAll('.replay-cards')[1].querySelectorAll('.card')).toHaveLength(3);
 await click('查看结算');expect(el.textContent).toContain('派奖完成');expect(el.querySelectorAll('.replay-cards')[1].querySelectorAll('.card')).toHaveLength(5);
 expect([...el.querySelectorAll('button')].find(b=>b.textContent==='下一步')!.disabled).toBe(true);
 await click('上一步');expect(el.textContent).not.toContain('派奖完成');expect(JSON.stringify(t)).toBe(original);
 await act(async()=>root.unmount());
});
