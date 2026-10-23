// @vitest-environment jsdom
import {it,expect,afterEach} from 'vitest';
import {loadProgress,trainingSummary,learningGroups} from './learning';
afterEach(()=>localStorage.clear());
it('学习分类完整不重复，推荐优先错题再未答，完成后不编造薄弱点',()=>{expect(learningGroups.flatMap(g=>g.ids).sort((a,b)=>a-b)).toEqual(Array.from({length:20},(_,i)=>i));const s=trainingSummary({wrong:[13],answered:{0:true,13:false}});expect(s.recommendation).toEqual([13,1,2,3]);expect(s.correct).toBe(1);expect(trainingSummary({wrong:[],answered:Object.fromEntries(Array.from({length:20},(_,id)=>[id,true]))}).recommendation).toEqual([])});
it('损坏和越界学习记录被过滤，不影响统计',()=>{localStorage.setItem('holdem-progress',JSON.stringify({answered:{0:true,1:false,88:true,2:'yes'},wrong:[1,1,-1,'3',30]}));expect(loadProgress()).toEqual({answered:{0:true,1:false},wrong:[1]});localStorage.setItem('holdem-progress','null');expect(loadProgress().wrong).toEqual([])});
