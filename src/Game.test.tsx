// @vitest-environment jsdom
import React, {act} from 'react';
import {createRoot, Root} from 'react-dom/client';
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {Game} from './Game';
import {initialTable,applyAction,legalActions} from './engine';
import type {TableState} from './engine';
let root:Root,el:HTMLDivElement;
async function mount(t:TableState){localStorage.setItem('holdem-table',JSON.stringify(t));await act(async()=>{root.render(<Game back={()=>{}}/>)});}
async function click(text:string){const b=[...el.querySelectorAll('button')].find(b=>b.textContent?.includes(text));expect(b).toBeTruthy();await act(async()=>{b!.click()});}
async function confirm(){await act(async()=>{(el.querySelector('input[type=checkbox]') as HTMLInputElement).click()});}
async function tick(ms:number){await act(async()=>{vi.advanceTimersByTime(ms)});}
function stored(){return JSON.parse(localStorage.getItem('holdem-table')!) as TableState;}
function ended(t:TableState){while(!t.handOver)t=applyAction(t,t.actor,legalActions(t).includes('check')?'check':'call');return t;}
beforeEach(()=>{vi.useFakeTimers();localStorage.clear();(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;el=document.createElement('div');document.body.append(el);root=createRoot(el)});
afterEach(async()=>{await act(async()=>root.unmount());el.remove();vi.useRealTimers()});
describe('整场比赛实际界面',()=>{
 it('自动接下一手、暂停与刷新不重复扣盲',async()=>{await mount(ended(initialTable()));await confirm();await click('开始 / 继续');await tick(2100);expect(stored().hand).toBe(2);await click('暂停学习');const before=stored();await tick(10000);expect(stored()).toEqual(before);await act(async()=>root.unmount());root=createRoot(el);await mount(before);await tick(5000);expect(stored()).toEqual(before);expect(el.textContent).toContain('已暂停')});
 it('到点显示最后一手，结算前无结果，结束后停止自动发牌',async()=>{const t=initialTable();t.elapsed=3599;t.actor=0;t.players.slice(1).forEach(p=>p.folded=true);await mount(t);await confirm();await click('开始 / 继续');await tick(1250);expect(el.textContent).toContain('最后一手进行中');expect(el.querySelector('[aria-label="比赛最终结果"]')).toBeNull();await click('跟注补');expect(el.textContent).toContain('60 分钟到点，最后一手已结算');expect(el.textContent).toContain('最终排名');const end=stored();await tick(10000);expect(stored()).toEqual(end);expect((el.querySelector('.next-hand') as HTMLButtonElement).disabled).toBe(true);expect(JSON.parse(localStorage.getItem('holdem-match-results')!)).toHaveLength(1)});
 it('恢复已结束比赛直接显示结果，并列积分不分配',async()=>{const t=ended(initialTable());t.elapsed=3600;t.players.forEach(p=>p.chips=1000);await mount(t);expect(el.textContent).toContain('积分待确认');expect(el.querySelectorAll('.match-result tbody tr')).toHaveLength(9);expect(el.textContent).toContain('并列第 1 名');await tick(5000);expect(stored().hand).toBe(t.hand)});
});
