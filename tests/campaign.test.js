const assert = require('node:assert/strict');
const engine = require('../utils/engine');
const definition = require('../utils/controller');
const storage = {};
global.wx = {
  getWindowInfo:()=>({statusBarHeight:24}),getStorageSync:key=>storage[key],
  setStorageSync:(key,value)=>{storage[key]=JSON.parse(JSON.stringify(value));},
  showModal:options=>options.success({confirm:true})
};
const pages=[];
function create() {
  const p={...definition,data:JSON.parse(JSON.stringify(definition.data)),setData(update){Object.assign(this.data,update);}};
  p.onLoad();pages.push(p);return p;
}
function play(p,from,to) {
  p.setData({selected:-1});
  p.tapTube({currentTarget:{dataset:{index:from}}});
  p.tapTube({currentTarget:{dataset:{index:to}}});
}
function finish(p) {
  // Tests start from a known initial board or an on-path draft.
  while(!p.data.victory) {
    const h=engine.hint(p.board,p.levelInfo.path);assert(h);play(p,h.from,h.to);
  }
}
const p=create();
p.openLevels();p.selectLevel(2);assert.equal(p.data.level,1,'Locked levels cannot be selected');
assert(p.data.levelsOpen);p.closeLevels();
finish(p);const best=p.data.steps;
assert.equal(p.data.unlocked,2);assert.equal(p.data.records[1].best,best);
assert.equal(p.data.records[1].clears,1);
p.undo();finish(p);assert.equal(p.data.records[1].clears,1,'Undo/re-win cannot inflate clears');
p.next();
const move=engine.hint(p.board,p.levelInfo.path);play(p,move.from,move.to);
const draft=engine.clone(p.board);
p.openLevels();p.selectLevel(1);assert(p.data.victory,'Previously won level remains reviewable');
p.openLevels();p.selectLevel(2);assert.deepEqual(p.board,draft);assert.equal(p.data.steps,1);
const restored=create();assert.deepEqual(restored.board,draft);assert.equal(restored.data.steps,1);
restored.openLevels();restored.selectLevel(1);restored.restart();
// Simulate four earlier moves to exercise a slower clear's score update.
restored.setData({steps:4});finish(restored);
assert.equal(restored.data.records[1].best,best);
assert.equal(restored.data.records[1].clears,2);
restored.data.records[1].best=999;restored.restart();finish(restored);
assert.equal(restored.data.records[1].best,best,'Better replay updates best');
restored.openLevels();restored.changeLevelPage(999);assert.equal(restored.data.levelPage,4);
restored.changeLevelPage(-999);assert.equal(restored.data.levelPage,0);
for(const page of pages)page.onUnload();
delete storage['candy-sort-v3'];storage['candy-sort-v2']={level:10,board:'legacy layout'};
const legacy=create();assert.equal(legacy.data.level,10);assert.equal(legacy.data.unlocked,10);
assert.equal(Object.keys(legacy.data.records).length,0,'Migration must not invent completed scores');
legacy.onUnload();
storage['candy-sort-v3']={level:101,unlocked:999,records:{1:{best:-1,clears:1}},drafts:{1:{signature:engine.key(engine.makeLevel(1).board),board:'broken',steps:3}}};
const corrupt=create();assert.equal(corrupt.data.level,1);assert.equal(corrupt.data.unlocked,1);assert.equal(corrupt.data.steps,0);corrupt.onUnload();
delete storage['candy-sort-v3'];delete storage['candy-sort-v2'];
const graded=create();
graded.setData({steps:6});finish(graded);
assert.equal(graded.data.stars,1);assert.equal(graded.data.records[1].stars,1);
graded.restart();graded.setData({steps:5});finish(graded);
assert.equal(graded.data.stars,2);assert.equal(graded.data.records[1].stars,2);
graded.restart();finish(graded);
assert.equal(graded.data.stars,3);assert.equal(graded.data.records[1].stars,3);
graded.restart();graded.setData({steps:9});finish(graded);
assert.equal(graded.data.stars,1);assert.equal(graded.data.records[1].stars,3,'Slower clears must not downgrade earned stars');
graded.save();
storage['candy-sort-v3'].records[1].stars=99;
const gradesRestored=create();
assert.equal(gradesRestored.data.records[1].stars,3,'Stored stars must be derived from best and minimum, not trusted blindly');
graded.onUnload();gradesRestored.onUnload();
console.log('Campaign checks passed: locks, unlocks, best scores, replay, draft switching, restore, migration and corrupt data.');
