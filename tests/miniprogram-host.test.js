const assert=require('node:assert/strict');
const engine=require('../utils/engine');
let hostDefinition;
global.Page=p=>{hostDefinition=p;};
const context=new Proxy({}, {get(t,k){return k==='createLinearGradient'?()=>({addColorStop(){}}):t[k]||(()=>{});},set(t,k,v){t[k]=v;return true;}});
const node={getContext:()=>context};let size={width:390,height:844};
global.wx={
  getWindowInfo:()=>({windowWidth:size.width,windowHeight:size.height,pixelRatio:2,statusBarHeight:24,safeArea:{bottom:size.height-20}}),
  getMenuButtonBoundingClientRect:()=>({bottom:55}),getStorageSync:()=>null,setStorageSync(){},
  showModal:o=>o.success({confirm:true}),
  createSelectorQuery:()=>({in(){return this;},select(){return this;},fields(){return this;},exec(fn){fn([{node,...size}]);}})
};
require('../pages/game/game');
const host={...hostDefinition,data:JSON.parse(JSON.stringify(hostDefinition.data)),setData(update){Object.assign(this.data,update);}};
host.onReady();assert.equal(host.data.error,'');assert.equal(host.data.loading,false);assert(host.game);
function click(label){const t=host.data.targets.find(t=>t.label===label);assert(t);host.activate({currentTarget:{dataset:{hit:t.id,revision:host.data.revision}}});}
click('选关');assert(host.game.page.data.levelsOpen);click('返回游戏');
const h=engine.hint(host.game.page.board,host.game.page.levelInfo.path);
click(`${h.from+1}号糖果盒`);click(`${h.to+1}号糖果盒`);assert.equal(host.game.page.data.steps,1);
click('↶ 撤销');assert.equal(host.game.page.data.steps,0);
const oldRevision=host.data.revision;click('?');
assert(host.game.page.data.settings);
host.activate({currentTarget:{dataset:{hit:0,revision:oldRevision}}});assert(host.game.page.data.settings,'Stale taps cannot trigger replacement controls');
click('继续收纳');
// A normal Canvas touch emits start/end/tap; its action must only run once.
const select=host.game.hits.find(h=>h.label==='选关');
const point={x:(select.x+select.w/2)*host.game.scale,y:(select.y+select.h/2)*host.game.scale};
host.touchStart({touches:[point]});host.touchEnd({changedTouches:[point]});host.tap({detail:point});
assert(host.game.page.data.levelsOpen);click('返回游戏');
size={width:320,height:568};host.onResize();assert.equal(host.game.width,320);assert.equal(host.game.height,568);
host.onUnload();assert(host._disposed);
console.log('Small-program host: Canvas initialization, native button taps, candy moves, undo, stale-event guards, touch dedup and resize passed.');
