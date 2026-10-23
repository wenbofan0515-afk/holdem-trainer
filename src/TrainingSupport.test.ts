import {describe,it,expect} from 'vitest';
import {decisionTakeaways} from './TrainingSupport';
import type {Decision} from './engine';
const d=(action:Decision['action'],paid=0):Decision=>({player:0,street:'flop',action,paid,toCall:paid,potBefore:150,eligiblePotBefore:150,target:paid,board:[]});
describe('关键决策内容',()=>{
 it('最多两条，优先大额跟注并使用可争夺底池而非全部底池',()=>{
  const call={...d('call',50),potBefore:500};
  const tips=decisionTakeaways([d('check'),call,d('fold'),{...d('call',100),player:1}]);
  expect(tips).toHaveLength(2);expect(tips[0].kind).toBe('数学核对');expect(tips[0].body).toContain('25.0%');expect(tips[0].body).toContain('不是实际胜率');expect(tips[1].kind).toBe('规则回顾');
 });
 it('全下与加注只给条件性建议，不按输赢评分',()=>{
  const tips=decisionTakeaways([d('raise',60),d('allin',800),d('call',50)]);
  expect(tips[0].title).toContain('第 2 次');expect(tips[0].body).toContain('不能断言');expect(tips[1].kind).toBe('数学核对');
 });
 it('兼容旧记录缺少可争夺底池，无决策不编造操作',()=>{
  expect(decisionTakeaways([])).toEqual([]);
  expect(decisionTakeaways([{...d('call',50),eligiblePotBefore:undefined} as unknown as Decision])[0].body).toContain('25.0%');
 });
});
