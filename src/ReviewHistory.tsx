import React,{useState} from 'react';
import {TableState} from './engine';
const key=(t:TableState)=>`${t.seed}-${t.hand}`;
export function ReviewHistory({reviews,renderReview}:{reviews:TableState[];renderReview:(t:TableState)=>React.ReactNode}){
 const [selected,setSelected]=useState(''),entries=reviews.slice().reverse(),current=entries.find(t=>key(t)===selected)??entries[0];
 if(!current)return null;
 return <details className="review-history"><summary>历史复盘（本机保留最近 20 手）</summary><p>选择一手再查看，避免多份牌面和行动按钮混在一起。当前比赛不受影响。</p><label>选择历史牌局<select aria-label="选择历史牌局" value={key(current)} onChange={e=>setSelected(e.target.value)}>{entries.map(t=><option key={key(t)} value={key(t)}>比赛 {t.seed} · 第 {t.hand} 手 · 你的净变化 {t.players[0].chips-t.players[0].startChips}</option>)}</select></label><div key={key(current)}>{renderReview(current)}</div></details>
}
