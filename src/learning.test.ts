// @vitest-environment jsdom
import {it,expect,afterEach} from 'vitest';
import {loadProgress,trainingSummary,learningGroups} from './learning';
afterEach(()=>localStorage.clear());
it('学习分类完整不重复，推荐优先错题再未答，完成后不编造薄弱点',()=>{expect(learningGroups.flatMap(g=>g.ids).sort((a,b)=>a-b)).toEqual(Array.from({length:20},(_,i)=>i));const s=trainingSummary({wrong:[13],answered:{0:true,13:false}});expect(s.recommendation).toEqual([13,1,2,3]);expect(s.correct).toBe(1);expect(trainingSummary({wrong:[],answered:Object.fromEntries(Array.from({length:20},(_,id)=>[id,true]))}).recommendation).toEqual([])});
it('损坏和越界学习记录被过滤，不影响统计',()=>{localStorage.setItem('holdem-progress',JSON.stringify({answered:{0:true,1:false,88:true,2:'yes'},wrong:[1,1,-1,'3',30]}));expect(loadProgress()).toEqual({answered:{0:true,1:false},wrong:[1]});localStorage.setItem('holdem-progress','null');expect(loadProgress().wrong).toEqual([])});
import {loadDrillSession} from './drillSession';
it('忽略非法续练数据和其他明确指定题组，不覆盖错题本',()=>{const s={queue:[5,13],i:1,choice:null,done:false,roundAnswers:{5:true},mode:'target',sourceKey:'[5,13]'};localStorage.setItem('holdem-drill-session',JSON.stringify(s));expect(loadDrillSession('all')?.i).toBe(1);expect(loadDrillSession('[0]')).toBeNull();localStorage.setItem('holdem-drill-session',JSON.stringify({...s,i:40}));expect(loadDrillSession('all')).toBeNull()});
