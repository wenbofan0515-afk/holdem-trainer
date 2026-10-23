// @vitest-environment jsdom
import React, {act} from 'react';
import {createRoot, Root} from 'react-dom/client';
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {Game} from './Game';
import {initialTable,applyAction,legalActions} from './engine';
import * as engine from './engine';
import type {TableState} from './engine';
let root:Root,el:HTMLDivElement;
async function mount(t:TableState){localStorage.setItem('holdem-table',JSON.stringify(t));await act(async()=>{root.render(<Game back={()=>{}}/>)});}
async function click(text:string){const b=[...el.querySelectorAll('button')].find(b=>b.textContent?.includes(text));expect(b).toBeTruthy();await act(async()=>{b!.click()});}
async function confirm(){await act(async()=>{(el.querySelector('input[type=checkbox]') as HTMLInputElement).click()});}
async function tick(ms:number){await act(async()=>{vi.advanceTimersByTime(ms)});}
function stored(){return JSON.parse(localStorage.getItem('holdem-table')!) as TableState;}
function ended(t:TableState){while(!t.handOver)t=applyAction(t,t.actor,legalActions(t).includes('check')?'check':'call');return t;}
beforeEach(()=>{vi.useFakeTimers();localStorage.clear();(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;el=document.createElement('div');document.body.append(el);root=createRoot(el)});
afterEach(async()=>{await act(async()=>root.unmount());el.remove();vi.restoreAllMocks();vi.useRealTimers()});
describe('整场比赛实际界面',()=>{
 it('自动接下一手、暂停与刷新不重复扣盲',async()=>{await mount(ended(initialTable()));await confirm();await act(async()=>{(el.querySelectorAll('input[type=checkbox]')[0] as HTMLInputElement).click()});await click('开始 / 继续');await tick(2100);expect(stored().hand).toBe(2);await click('暂停学习');const before=stored();await tick(10000);expect(stored()).toEqual(before);await act(async()=>root.unmount());root=createRoot(el);await mount(before);await tick(5000);expect(stored()).toEqual(before);expect(el.textContent).toContain('已暂停')});
 it('到点显示最后一手，结算前无结果，结束后停止自动发牌',async()=>{const t=initialTable();t.elapsed=3599;t.actor=0;t.players.slice(1).forEach(p=>p.folded=true);await mount(t);await confirm();await click('开始 / 继续');await tick(1250);expect(el.textContent).toContain('最后一手进行中');expect(el.querySelector('[aria-label="比赛最终结果"]')).toBeNull();await click('跟注补');expect(el.textContent).toContain('60 分钟到点，最后一手已结算');expect(el.textContent).toContain('最终排名');const end=stored();await tick(10000);expect(stored()).toEqual(end);expect((el.querySelector('.next-hand') as HTMLButtonElement).disabled).toBe(true);expect(JSON.parse(localStorage.getItem('holdem-match-results')!)).toHaveLength(1)});
 it('恢复已结束比赛直接显示结果，并列积分不分配',async()=>{const t=ended(initialTable());t.elapsed=3600;t.players.forEach(p=>p.chips=1000);await mount(t);expect(el.textContent).toContain('积分待确认');expect(el.querySelectorAll('.match-result tbody tr')).toHaveLength(9);expect(el.textContent).toContain('并列第 1 名');await tick(5000);expect(stored().hand).toBe(t.hand)});
});

describe('新手逐步操作与四轮下注',()=>{
 it('从确认、开局、四轮下注到复盘和下一手均可通过界面完成',async()=>{
  vi.spyOn(engine,'computerAction').mockImplementation(t=>({action:legalActions(t).includes('check')?'check':'call'}));
  await mount(initialTable(456));
  expect(el.querySelector('[aria-label="下一步指引"]')?.textContent).toContain('先勾选');
  expect([...el.querySelectorAll('button')].find(b=>b.textContent==='开始 / 继续')?.disabled).toBe(true);
  await confirm();await click('开始 / 继续');
  // Manual continuation is the learning default.
  expect((el.querySelectorAll('input[type=checkbox]')[0] as HTMLInputElement).checked).toBe(false);
  const streets=new Set<string>();let actions=0;
  for(let n=0;n<100&&!stored().handOver;n++){
   const t=stored();streets.add(t.street);
   if(t.actor===0){expect(el.textContent).toContain('轮到你 · 请选择一个操作');await click(legalActions(t).includes('check')?'过牌 · 免费':'跟注补');actions++;}
   else {expect(el.textContent).toContain('电脑会自动行动');await tick(500);}
   expect(stored().pot+stored().players.reduce((sum,p)=>sum+p.chips,0)).toBe(9000);
  }
  expect([...streets]).toEqual(['preflop','flop','turn','river']);expect(actions).toBe(4);
  expect(stored().handOver).toBe(true);expect(el.textContent).toContain('本手结束 · 已完成派奖');expect(el.querySelector('[aria-label="复盘速览"]')).toBeTruthy();expect(el.querySelector('[aria-label="本手即时复盘"]')?.contains(document.activeElement)).toBe(true);expect(el.textContent).toContain('主池');
  expect(el.querySelectorAll('.review tbody tr')).toHaveLength(4);
  await click('继续下一手');expect(stored().hand).toBe(2);expect(stored().handOver).toBe(false);
 });
 it('非法加注禁用提交，跟注和弃牌仍可选择',async()=>{
  const t=initialTable();t.actor=0;await mount(t);await confirm();await click('开始 / 继续');
  const input=el.querySelector('input[type=number]') as HTMLInputElement;
  await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,'1');input.dispatchEvent(new Event('input',{bubbles:true}));});
  expect(el.textContent).toContain('请输入范围内的整数');
  expect([...el.querySelectorAll('button')].find(b=>b.textContent?.startsWith('加注到'))?.disabled).toBe(true);
  expect([...el.querySelectorAll('button')].find(b=>b.textContent?.startsWith('跟注补'))?.disabled).toBe(false);
 });
});

describe('六种合法动作逐项验收',()=>{
 for(const action of ['fold','call','raise','allin','check','bet'] as const){
  it(`${action} 通过真实按钮写入动作记录且守恒`,async()=>{
   let t=initialTable(456);
   while(t.actor!==0)t=applyAction(t,t.actor,legalActions(t).includes('check')?'check':'call');
   if(action==='check'||action==='bet'){
    while(t.street==='preflop')t=applyAction(t,t.actor,legalActions(t).includes('check')?'check':'call');
    while(t.actor!==0)t=applyAction(t,t.actor,'check');
   }
   await mount(t);await confirm();await click('开始 / 继续');
   const labels={fold:'弃牌 ·',call:'跟注补',raise:'加注到',allin:'全下 ',check:'过牌 ·',bet:'下注到'};
   await click(labels[action]);if(action==='allin'){expect(stored().decisions.length).toBe(t.decisions.length);await click('确认全下 1000');}
   const after=stored();const ds=after.decisions.filter(d=>d.player===0);const d=ds[ds.length-1];
   expect(d?.action).toBe(action);expect(after.pot+after.players.reduce((n,p)=>n+p.chips,0)).toBe(9000);
   expect(after.decisions.length).toBe(t.decisions.length+1);
   if(action==='fold')expect(after.players[0].folded).toBe(true);
   if(action==='allin')expect(after.players[0].chips).toBe(0);
  });
 }
});

describe('操作减负与防误触',()=>{
 it('快捷金额只填值，全下取消不扣钱，确认才执行',async()=>{
  let t=initialTable(456);while(t.actor!==0)t=applyAction(t,t.actor,legalActions(t).includes('check')?'check':'call');
  await mount(t);await confirm();await click('开始 / 继续');const before=stored();
  await click('半池 ·');expect(stored().decisions).toEqual(before.decisions);
  expect((el.querySelector('input[type=number]') as HTMLInputElement).value).toBe('105');
  expect(el.textContent).toContain('操作后剩余 895');
  await click('全下 1000');await click('取消全下');expect(stored().players[0].chips).toBe(1000);
  await click('全下 1000');await click('确认全下 1000');expect(stored().players[0].chips).toBe(0);
 });
});


describe('集中行动区',()=>{
 it('轮到自己聚焦行动区，牌面与按钮在同一区域，结算仅一个下一手入口',async()=>{
  let t=initialTable(456);while(t.actor!==0)t=applyAction(t,t.actor,legalActions(t).includes('check')?'check':'call');
  await mount(t);await confirm();await click('开始 / 继续');
  const panel=el.querySelector('[aria-label="我的行动区"]')!;
  expect(panel.classList.contains('your-turn')).toBe(true);expect(document.activeElement).toBe(panel);
  expect(panel.querySelectorAll('.decision-cards .card')).toHaveLength(2);
  expect(panel.textContent).toContain('跟齐需补');expect(panel.querySelector('details.bet-settings')?.hasAttribute('open')).toBe(false);
  expect(panel.compareDocumentPosition(el.querySelector('.table')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  await act(async()=>root.unmount());root=createRoot(el);await mount(ended(initialTable(456)));
  expect([...el.querySelectorAll('button')].filter(b=>b.textContent?.includes('继续下一手（'))).toHaveLength(1);
 });
 it('跟注需投入全部筹码时也须确认，取消不扣筹码',async()=>{
  let t=initialTable(456);while(t.actor!==0)t=applyAction(t,t.actor,legalActions(t).includes('check')?'check':'call');
  t.players[0].chips=10;await mount(t);await confirm();await click('开始 / 继续');const before=stored();
  await click('跟注补');expect(stored()).toEqual(before);expect(el.textContent).toContain('确认投入全部 10');
  await click('取消全下');expect(stored()).toEqual(before);
  await click('跟注补');await click('确认全下 10');expect(stored().players[0].allIn).toBe(true);expect(stored().players[0].chips).toBe(0);
 });
});

describe('引导、反馈与重点复盘',()=>{
 it('引导跟随确认和开局，跳过持久化且可以重新开启',async()=>{
  let t=initialTable(456);while(t.actor!==0)t=applyAction(t,t.actor,legalActions(t).includes('check')?'check':'call');
  await mount(t);expect(el.querySelector('[aria-label="首手学习引导"]')?.textContent).toContain('1/5');
  await confirm();expect(el.querySelector('[aria-label="首手学习引导"]')?.textContent).toContain('2/5');
  await click('开始 / 继续');expect(el.querySelector('[aria-label="首手学习引导"]')?.textContent).toContain('3/5');
  await click('跟注补');expect(el.querySelector('[aria-label="操作已提交"]')?.textContent).toContain('本次投入 20');
  expect(el.querySelector('[aria-label="操作已提交"]')?.textContent).toContain('无需重复点击');
  await click('跳过引导');expect(localStorage.getItem('holdem-guide-complete')).toBe('1');expect(el.querySelector('[aria-label="首手学习引导"]')).toBeNull();
  await click('重新查看引导');expect(el.querySelector('[aria-label="首手学习引导"]')).toBeTruthy();
 });
 it('结束显示重点复盘并支持完成引导，下一手清除上手操作反馈',async()=>{
  await mount(ended(initialTable(456)));await confirm();
  expect(el.querySelector('[aria-label="首手学习引导"]')?.textContent).toContain('5/5');
  expect(el.querySelector('[aria-label="关键决策复盘"] article')).toBeTruthy();
  await click('完成引导');await click('继续下一手');
  expect(el.querySelector('[aria-label="我的行动区"] [aria-label="操作已提交"]')).toBeNull();
 });
});
