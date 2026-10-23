import solver from 'pokersolver';
export type Suit='s'|'h'|'d'|'c'; export type Card={rank:string;suit:Suit};
export const ranks=['2','3','4','5','6','7','8','9','T','J','Q','K','A']; export const suits:Suit[]=['s','h','d','c'];
export const suitName:Record<Suit,string>={s:'♠',h:'♥',d:'♦',c:'♣'};
export const blinds=(elapsed:number)=>elapsed<600?{small:10,big:20}:elapsed<1200?{small:20,big:40}:elapsed<1800?{small:40,big:80}:{small:50,big:100};
export function makeDeck(){return suits.flatMap(s=>ranks.map(rank=>({rank,suit:s} as Card)))}
export function shuffle<T>(a:T[],seed=Date.now()){const b=[...a];let x=seed>>>0;for(let i=b.length-1;i>0;i--){x=(Math.imul(x,1664525)+1013904223)>>>0;const j=x%(i+1);[b[i],b[j]]=[b[j],b[i]]}return b}
export function cardText(c:Card){return `${c.rank==='T'?'10':c.rank}${suitName[c.suit]}`}
export type Action='fold'|'check'|'call'|'bet'|'raise'|'allin';
export type Player={id:number;name:string;chips:number;cards:Card[];folded:boolean;allIn:boolean;style:'tight'|'loose';bet:number;total:number;startChips:number};
export type Decision={street:string;player:number;action:Action;paid:number;toCall:number;potBefore:number;eligiblePotBefore:number;target:number;board:Card[]};
export type TableState={version:2;players:Player[];board:Card[];pot:number;street:'preflop'|'flop'|'turn'|'river'|'showdown';button:number;smallSeat:number;bigSeat:number;actor:number;currentBet:number;minRaise:number;handBig:number;elapsed:number;log:string[];deck:Card[];acted:number[];actedAt:Record<number,number>;handOver:boolean;hand:number;seed:number;decisions:Decision[];result:string[];pots?:{amount:number;eligible:number[];awards:{player:number;amount:number}[]}[]};
function next(t:TableState,p:number,eligible:(p:Player)=>boolean){for(let i=1;i<=t.players.length;i++){const q=(p+i)%t.players.length;if(eligible(t.players[q]))return q}return -1}
const active=(p:Player)=>!p.folded&&!p.allIn;
export function initialTable(seed=7):TableState{
 const players:Player[]=Array.from({length:9},(_,i)=>({id:i,name:i===0?'你':`电脑 ${i}`,chips:1000,cards:[],folded:false,allIn:false,style:i%3===0?'loose':'tight',bet:0,total:0,startChips:1000}));
 return startHand({version:2,players,board:[],pot:0,street:'preflop',button:0,smallSeat:1,bigSeat:2,actor:3,currentBet:0,minRaise:20,handBig:20,elapsed:0,log:[],deck:[],acted:[],actedAt:{},handOver:true,hand:0,seed,decisions:[],result:[]},false);
}
function pay(t:TableState,p:number,amount:number){const v=t.players[p];const n=Math.min(amount,v.chips);v.chips-=n;v.bet+=n;v.total+=n;t.pot+=n;v.allIn=v.chips===0;return n}
export function startHand(t:TableState,rotate=true):TableState{
 const n=structuredClone(t);if(!n.handOver||n.players.filter(p=>p.chips>0).length<2||n.elapsed>=3600)return n;
 if(rotate)n.button=next(n,n.button,p=>p.chips>0);n.hand++;n.handOver=false;n.street='preflop';n.board=[];n.pot=0;n.decisions=[];n.result=[];n.pots=[];n.acted=[];n.actedAt={};n.log=[`第 ${n.hand} 手开始`];n.deck=shuffle(makeDeck(),n.seed+n.hand);
 for(const p of n.players){p.startChips=p.chips;p.bet=0;p.total=0;p.folded=p.chips===0;p.allIn=false;p.cards=p.folded?[]:n.deck.splice(0,2)}
 const b=blinds(n.elapsed);n.handBig=b.big;n.minRaise=b.big;n.currentBet=b.big;
 n.smallSeat=n.players.filter(p=>!p.folded).length===2?n.button:next(n,n.button,p=>!p.folded);n.bigSeat=next(n,n.smallSeat,p=>!p.folded);
 n.log.push(`${n.players[n.smallSeat].name} 小盲 ${pay(n,n.smallSeat,b.small)}`,`${n.players[n.bigSeat].name} 大盲 ${pay(n,n.bigSeat,b.big)}`);
 n.actor=next(n,n.bigSeat,active);advance(n,n.bigSeat);return n;
}
export function actionInfo(t:TableState,p=t.actor){const v=t.players[p];return {toCall:Math.max(0,t.currentBet-v.bet),minTo:t.currentBet+t.minRaise,maxTo:v.bet+v.chips,canRaise:t.actedAt[p]===undefined||t.currentBet-t.actedAt[p]>=t.minRaise}}
export function legalActions(t:TableState,p=t.actor):Action[]{
 if(t.handOver||p!==t.actor||!t.players[p]||!active(t.players[p]))return [];
 const i=actionInfo(t,p),a:Action[]=['fold'];a.push(i.toCall?'call':'check');
 const others=t.players.some(v=>v.id!==p&&active(v));
 if(others&&i.canRaise&&i.maxTo>=i.minTo)a.push(t.currentBet?'raise':'bet');
 if(i.maxTo<=t.currentBet||(others&&i.canRaise))a.push('allin');return a;
}
function settle(t:TableState){
 // Return the unique unmatched contribution before constructing pots.
 const sorted=[...t.players].sort((a,b)=>b.total-a.total);if(sorted[0].total>sorted[1].total){const v=sorted[0],refund=v.total-sorted[1].total;v.total-=refund;v.chips+=refund;t.pot-=refund;t.log.push(`${v.name} 未被跟注的 ${refund} 退回`)}
 const live=t.players.filter(p=>!p.folded);const solved=new Map<number,any>();if(live.length>1){while(t.board.length<5)t.board.push(t.deck.shift()!);for(const p of live)solved.set(p.id,solver.Hand.solve([...p.cards,...t.board].map(c=>c.rank+c.suit)))}
 t.pots=[];
 const levels=[...new Set(t.players.map(p=>p.total).filter(Boolean))].sort((a,b)=>a-b);let last=0;
 for(const level of levels){const contributors=t.players.filter(p=>p.total>=level);const amount=(level-last)*contributors.length;last=level;const eligible=live.filter(p=>p.total>=level);if(!eligible.length)throw new Error('底池无合资格玩家');
 const hands=eligible.map(p=>solved.get(p.id));const winning=live.length===1?eligible:eligible.filter(p=>solver.Hand.winners(hands).includes(solved.get(p.id)));
 const order=winning.sort((a,b)=>((a.id-t.button+9)%9||9)-((b.id-t.button+9)%9||9));const share=Math.floor(amount/order.length);let odd=amount%order.length;const awards:{player:number;amount:number}[]=[];
 for(const p of order){const gain=share+(odd-->0?1:0);p.chips+=gain;awards.push({player:p.id,amount:gain});t.result.push(`${p.name} 获得 ${gain}${live.length>1?'（'+rankLabel([...p.cards,...t.board])+'）':''}`)}
 t.pots.push({amount,eligible:eligible.map(p=>p.id),awards});
 }
 t.pot=0;t.handOver=true;t.street='showdown';t.actor=-1;t.log.push(...t.result,'本手已结算；筹码已派奖。');
}
function advance(t:TableState,from:number){
 if(t.players.filter(p=>!p.folded).length===1){settle(t);return}
 const movers=t.players.filter(active);
 const needs=(p:Player)=>active(p)&&(p.bet<t.currentBet||!t.acted.includes(p.id));
 if(movers.length<=1&&!movers.some(p=>p.bet<t.currentBet)){settle(t);return}
 if(t.players.some(needs)){t.actor=next(t,from,needs);return}
 if(t.street==='river'){settle(t);return}
 t.street=t.street==='preflop'?'flop':t.street==='flop'?'turn':'river';t.deck.shift();t.board.push(...t.deck.splice(0,t.street==='flop'?3:1));t.currentBet=0;t.minRaise=t.handBig;t.acted=[];t.actedAt={};for(const p of t.players)p.bet=0;t.log.push(`进入${streetName(t.street)}`);t.actor=next(t,t.button,active);
}
export function applyAction(t:TableState,p:number,a:Action,amount=0):TableState{
 if(!legalActions(t,p).includes(a))throw new Error('当前操作不合法');const n=structuredClone(t),v=n.players[p],info=actionInfo(t,p);let paid=0;
 if(a==='fold')v.folded=true;
 else if(a!=='check'){let target=a==='call'?Math.min(info.maxTo,n.currentBet):a==='allin'?info.maxTo:amount;
 if((a==='raise'||a==='bet')&&(!Number.isInteger(target)||target<info.minTo||target>info.maxTo))throw new Error(`加注目标应为 ${info.minTo}–${info.maxTo}`);
 paid=pay(n,p,target-v.bet);if(v.bet>n.currentBet){const increase=v.bet-n.currentBet;if(increase>=n.minRaise){n.minRaise=increase;n.acted=[]}n.currentBet=v.bet}}
 n.acted=[...new Set([...n.acted,p])];n.actedAt[p]=n.currentBet;
 n.decisions.push({street:t.street,player:p,action:a,paid,toCall:info.toCall,potBefore:t.pot,eligiblePotBefore:t.players.reduce((sum,q)=>sum+Math.min(q.total,t.players[p].total+paid),0),target:v.bet,board:structuredClone(t.board)});
 n.log.push(`${v.name} ${actionName(a)}${paid?`，投入 ${paid}（本轮累计 ${v.bet}）`:''}`);advance(n,p);return n;
}
export const actionName=(a:Action)=>({fold:'弃牌',check:'过牌',call:'跟注',bet:'下注',raise:'加注',allin:'全下'})[a];
export const streetName=(s:string)=>({preflop:'翻牌前',flop:'翻牌',turn:'转牌',river:'河牌',showdown:'摊牌'}[s]||s);
export function rankLabel(cards:Card[]){if(cards.length<5)return '尚未成牌';const h=solver.Hand.solve(cards.map(c=>c.rank+c.suit));return ['','高牌','一对','两对','三条','顺子','同花','葫芦','四条','同花顺'][h.rank]||h.descr}
export function computerAction(t:TableState):{action:Action;amount?:number}{const p=t.players[t.actor],acts=legalActions(t),i=actionInfo(t);const strength=p.cards.reduce((a,c)=>a+ranks.indexOf(c.rank),0);const raise=acts.includes('raise')?'raise':'bet';if(acts.includes(raise)&&strength>=21&&t.currentBet<t.handBig*6&&i.toCall<t.handBig*3)return {action:raise,amount:i.minTo};if(acts.includes('check'))return {action:'check'};return {action:i.toCall<=t.handBig*2||strength>=16||p.style==='loose'?'call':'fold'}}
export const drills=[
 ['规则','有人下注后，你不能做什么？',['过牌','跟注','加注','弃牌'],0,'有人下注且你未跟齐时，必须跟、加或弃。'],
 ['概率','翻牌后有 9 张有效同花补牌，下一张约多少？',['9.0%','19.1%','35.0%','50.0%'],1,'9 ÷ 47 ≈ 19.1%。'],
 ['赔率','底池 100，对手下注 50，跟注后的最低胜率？',['16.7%','25.0%','33.3%','50.0%'],1,'跟注 50 ÷ 跟后底池 200 = 25.0%。'],
 ['短筹码','100/50 封顶时，筹码 600 约等于几个大盲？',['3','6','10','12'],1,'600 ÷ 100 = 6 个大盲。'],
 ['末段','临近结束且明显领先第三名；没有强牌或明确优势时，更合理的是？',['边缘牌拼大底池','减少边缘大额对抗','每手全下','完全不看牌'],1,'在这个前提下减少边缘大额对抗。不是每手弃牌；仍要考虑盲注、位置、差距与剩余时间。'],
 ['盲注','小盲已投入10，大盲20，无人加注，小盲跟齐还需多少？',['10','20','30','0'],0,'只补差额：20 − 10 = 10。'],
 ['加注','本轮最高投入40，最近一次完整加注幅度20，最小加注到多少？',['50','60','80','100'],1,'最低目标为40 + 20 = 60，金额指本轮累计投入。'],
 ['加注','最高投入100，最近完整加注幅度60，有人短额全下到130。已在100行动过的玩家是否仅因此重新获得加注权？',['是','否','必定只能弃牌','必须全下'],1,'仅增加30不足完整加注60，不会仅因此向已行动且未面对累计完整加注的玩家重新开放加注。'],
 ['牌型','A、2、3、4、5组成什么？',['A高顺子','5高顺子','只有高牌','同花'],1,'A可作最小牌，A2345是5高顺子；不能组成QKA23。'],
 ['牌型','双方都一对A，一方踢脚K、9、5，另一方Q、J、10，谁赢？',['前者','后者','平局','比较花色'],0,'从最高踢脚逐张比较，K胜Q，不比较三张点数之和。'],
 ['牌型','公共牌是A K Q J 10且不同花，双方均不能组成同花，如何结算？',['庄家赢','比较底牌','平分可争夺底池','黑桃多者赢'],2,'双方都可使用公共牌组成A高顺子；余数筹码按牌桌规则处理，边池分别结算。'],
 ['概率','翻牌有9张有效补牌，两张都能看完且不折损，至少命中一次约多少？',['19.1%','35.0%','38.3%','50.0%'],1,'1 − (38/47 × 37/46) ≈ 35.0%。不等于最终赢牌概率，也不保证免费看到河牌。'],
 ['概率','转牌后有8张有效顺子补牌，河牌命中约多少？',['8.0%','17.4%','32.0%','34.8%'],1,'8 ÷ 46 ≈ 17.4%；假设补牌有效，未知牌中没有额外信息。'],
 ['赔率','当前可争夺底池已含对手下注共150，你需补50，一次跟注的最低权益？',['20.0%','25.0%','33.3%','50.0%'],1,'50 ÷ (150 + 50) = 25.0%。忽略后续下注与抽水；实际权益仍需估计。'],
 ['边池','你总共全下100，两人各投入300，三人无其他投入，你最多争夺多少？',['100','300','600','700'],1,'主池为100 × 3 = 300，另外400属于其他两人的边池。'],
 ['规则','河牌你过牌后，对手下注，你还需要行动吗？',['不需要','需要重新跟、加或弃','必须跟注','直接摊牌'],1,'过牌不代表此轮永远免费；面对后续下注必须重新决策。'],
 ['规则','你加注到200，但所有对手最终最多只投入120，未被跟注的80怎么办？',['全部归底池','退回你','给大盲','平分'],1,'未被任何人匹配的80退回你，不作为可赢取的底池。'],
 ['比赛','9人每人1000，无增购，发牌前全桌总筹码多少？',['8000','9000','10000','随盲注增加'],1,'9 × 1000 = 9000。盲注和派奖只转移筹码，不创造筹码。'],
 ['比赛','正在一手中达到10分钟，下一级40/20何时生效？',['立刻补扣','下一手开始','必须等20分钟','永不生效'],1,'本训练器新盲注从下一手生效，不在进行中的一手中途改价。'],
 ['比赛','60分钟已到但当前手未结束，按已确认训练假设怎么办？',['直接没收底池','完成当前手再排名','再打10手','按底牌排名'],1,'完成当前手并派奖后按筹码排名，不再发新手；这是训练假设，官方规则待确认。']
] as const;

export function bestFive(cards:Card[]):Card[]{if(cards.length<5)return [];const hand=solver.Hand.solve(cards.map(c=>c.rank+c.suit));return hand.cards.slice(0,5).map((c:any)=>({rank:c.value==='1'?'A':c.value==='10'?'T':c.value,suit:c.suit}));}
