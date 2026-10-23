import {describe,it,expect} from 'vitest';
import {initialTable,applyAction,legalActions,actionInfo,startHand,blinds,rankLabel,computerAction,makeDeck,TableState} from './engine';
function invariant(t:TableState){expect(t.players.reduce((s,p)=>s+p.chips,0)+t.pot).toBe(9000);expect(t.players.every(p=>p.chips>=0)).toBe(true);const cards=[...t.players.flatMap(p=>p.cards),...t.board,...t.deck];expect(new Set(cards.map(c=>c.rank+c.suit)).size).toBe(cards.length)}
function finish(t:TableState,allin=false){let steps=0;while(!t.handOver){expect(++steps).toBeLessThan(200);const a=legalActions(t);t=applyAction(t,t.actor,allin&&a.includes('allin')?'allin':a.includes('check')?'check':'call');invariant(t)}return t}
describe('完整一手及连续牌局',()=>{
 it('扣盲、翻牌前行动和差额跟注',()=>{let t=initialTable();expect(t.pot).toBe(30);expect(t.actor).toBe(3);expect(t.players[1].chips).toBe(990);while(t.actor!==1)t=applyAction(t,t.actor,'call');expect(actionInfo(t).toCall).toBe(10);t=applyAction(t,1,'call');expect(t.players[1].chips).toBe(980);expect(t.actor).toBe(2);expect(legalActions(t)).toContain('check')});
 it('非法操作与不满额加注被拒绝',()=>{const t=initialTable();expect(()=>applyAction(t,0,'call')).toThrow();expect(()=>applyAction(t,3,'check')).toThrow();expect(()=>applyAction(t,3,'raise',39)).toThrow();expect(applyAction(t,3,'raise',60).minRaise).toBe(40)});
 it('四轮、摊牌、实际派奖和下一手',()=>{const t=finish(initialTable());expect(t.board).toHaveLength(5);expect(t.pot).toBe(0);expect(t.result.length).toBeGreaterThan(0);expect(new Set(t.decisions.map(d=>d.street)).size).toBe(4);const n=startHand(t);expect(n.button).toBe(1);expect(n.smallSeat).toBe(2);expect(n.bigSeat).toBe(3);expect(n.hand).toBe(2);invariant(n)});
 it('全弃时退回未跟注部分并派奖',()=>{let t=initialTable();while(!t.handOver)t=applyAction(t,t.actor,'fold');expect(t.players[2].chips).toBe(1010);expect(t.pot).toBe(0);invariant(t)});
 it('短额全下不重开已行动者加注',()=>{let t=initialTable();t=applyAction(t,3,'call');t.players[4].chips=25;t.players[5].chips+=975;t=applyAction(t,4,'allin');while(t.actor!==3)t=applyAction(t,t.actor,'call');expect(actionInfo(t).toCall).toBe(5);expect(legalActions(t)).not.toContain('raise');expect(legalActions(t)).not.toContain('allin')});
 it('多个短全下累计达到完整加注时重开',()=>{let t=initialTable();t=applyAction(t,3,'call');t.players[4].chips=25;t.players[5].chips=40;t.players[6].chips+=1935;t=applyAction(t,4,'allin');t=applyAction(t,5,'allin');while(t.actor!==3)t=applyAction(t,t.actor,'call');expect(legalActions(t)).toContain('raise')});
 it('不等额全下、边池和筹码守恒',()=>{let t=initialTable(17);t.players[3].chips=80;t.players[4].chips=180;t.players[5].chips+=1740;t=finish(t,true);expect(t.result.length).toBeGreaterThan(1);invariant(t)});
 it('A小顺、踢脚和平局使用牌型求解器',()=>{const c=(r:string,s='s')=>({rank:r,suit:s as 's'});expect(rankLabel(['A','2','3','4','5'].map((r,i)=>c(r,i%2?'h':'s')))).toBe('顺子');let t=initialTable();t.players.forEach(p=>{p.cards=[c('2','h'),c('3','d')];p.total=100;p.bet=100;p.chips=900;p.folded=false});t.pot=900;t.currentBet=100;t.street='river';t.board=['T','J','Q','K','A'].map(r=>c(r));const rest=makeDeck().filter(c=>!t.board.some(b=>b.rank===c.rank&&b.suit===c.suit));t.players.forEach(p=>p.cards=rest.splice(0,2));t.deck=rest;t.acted=[];t.actedAt={};t.actor=0;t=finish(t);expect(t.players.every(p=>p.chips===1000)).toBe(true)});
 it('固定种子连续模拟、恢复不重复扣盲',()=>{for(let seed=1;seed<=30;seed++){let t=initialTable(seed);for(let hand=0;hand<8;hand++){let steps=0;while(!t.handOver){expect(++steps).toBeLessThan(200);const d=computerAction(t);t=applyAction(t,t.actor,d.action,d.amount);invariant(t)}const restored=JSON.parse(JSON.stringify(t));expect(restored.pot).toBe(0);t=startHand(restored);invariant(t);if(t.handOver)break}}});
 it('双人庄家小盲先行动，翻牌后大盲先行动',()=>{let t=finish(initialTable());t.players.forEach(p=>p.chips=0);t.players[0].chips=4500;t.players[4].chips=4500;t=startHand(t);expect(t.smallSeat).toBe(t.button);expect(t.actor).toBe(t.button);t=applyAction(t,t.actor,'call');t=applyAction(t,t.actor,'check');expect(t.actor).toBe(t.bigSeat)});
 it('升盲下一手生效且到点不新开',()=>{expect([0,600,1200,1800].map(x=>blinds(x).big)).toEqual([20,40,80,100]);let t=initialTable();t.elapsed=600;expect(t.handBig).toBe(20);t=finish(t);expect(startHand(t).handBig).toBe(40);t.elapsed=3600;expect(startHand(t).hand).toBe(t.hand)});
});

import {bestFive} from './engine';
it('复盘最佳5张保留A小顺的真实A，且分池记录派奖守恒、下一手清空',()=>{
 const cards=[{rank:'A',suit:'s'},{rank:'2',suit:'h'},{rank:'3',suit:'d'},{rank:'4',suit:'c'},{rank:'5',suit:'s'},{rank:'K',suit:'h'},{rank:'Q',suit:'c'}] as any;
 const best=bestFive(cards);expect(best).toHaveLength(5);expect(best.some(c=>c.rank==='A')).toBe(true);expect(best.every(c=>cards.some((x:any)=>x.rank===c.rank&&x.suit===c.suit))).toBe(true);
 let t=initialTable(17);t.players[3].chips=80;t.players[4].chips=180;t.players[5].chips+=1740;t=finish(t,true);
 expect(t.pots!.length).toBeGreaterThan(1);for(const p of t.pots!){expect(p.awards.reduce((n,a)=>n+a.amount,0)).toBe(p.amount);expect(p.awards.every(a=>p.eligible.includes(a.player))).toBe(true)}
 expect(t.pots!.reduce((n,p)=>n+p.amount,0)).toBe(t.players.reduce((n,p)=>n+p.total,0));
 expect(startHand(t).pots).toEqual([]);
});

it('六张同花仅展示最强五张，剔除最低同花牌',()=>{
 const cards=[{rank:'A',suit:'s'},{rank:'Q',suit:'s'},{rank:'J',suit:'s'},{rank:'9',suit:'s'},{rank:'5',suit:'s'},{rank:'2',suit:'s'},{rank:'J',suit:'d'}] as any;
 const best=bestFive(cards);expect(best).toHaveLength(5);expect(best.map(c=>c.rank)).toEqual(['A','Q','J','9','5']);
});
