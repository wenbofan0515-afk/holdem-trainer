import React from 'react';
import {cardText} from './engine';
export function Card({c,hidden=false}:{c:any;hidden?:boolean}){return <div className={`card ${hidden?'back':c.suit==='h'||c.suit==='d'?'red':''}`}>{hidden?'?':cardText(c)}</div>}
export function Page({title,back,children}:{title:string;back:()=>void;children:any}){return <><nav><button onClick={back}>← 返回</button><span>HOLD’EM LAB</span><b>{title}</b></nav><main className="page">{children}</main></>}
