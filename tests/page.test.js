const assert = require('node:assert/strict');
const engine = require('../utils/engine');
let definition, stored;
global.Page = value => {definition = value;};
global.wx = {
  getWindowInfo:() => ({statusBarHeight:24}),
  getStorageSync:() => stored,
  setStorageSync:(_,value) => {stored = JSON.parse(JSON.stringify(value));},
  vibrateShort() {throw new Error('Vibration must never be called');},
  showModal: options => options.success({confirm:true})
};
definition = require('../utils/controller');
function createPage() {
  const page = {...definition,data:JSON.parse(JSON.stringify(definition.data)),setData(patch) {Object.assign(this.data,patch);}};
  page.onLoad(); return page;
}
const page = createPage();
const initial = engine.clone(page.board);
const h = engine.hint(page.board,page.levelInfo.path);
page.tapTube({currentTarget:{dataset:{index:h.from}}});
page.tapTube({currentTarget:{dataset:{index:h.to}}});
assert.equal(page.data.steps,1);
assert.deepEqual(page.board,h.next);
page.undo();
assert.equal(page.data.steps,0);
assert.deepEqual(page.board,initial);
page.hint();
assert.equal(page.data.selected,h.from);
assert.equal(page.data.hintTo,h.to);
for (let i = 0; i < page.levelInfo.path.length - 1; i++) {
  const next = engine.hint(page.board,page.levelInfo.path.slice(i));
  page.setData({selected:-1});
  page.tapTube({currentTarget:{dataset:{index:next.from}}});
  page.tapTube({currentTarget:{dataset:{index:next.to}}});
}
assert.equal(page.data.victory,true);
const restored = createPage();
assert.equal(restored.data.victory,true);
assert.deepEqual(restored.board,page.board);
restored.next(); assert.equal(restored.data.level,2);
assert.equal(restored.data.victory,false);
restored.restart(); assert.equal(restored.data.steps,0);
restored.setData({unlocked:7}); restored.start(7); restored.save();
const hardRestored = createPage();
assert.equal(hardRestored.data.level,7);
assert.deepEqual(hardRestored.board,restored.board,'Level progress must restore');
assert.equal(Object.hasOwn(stored,'vibration'),false,'Removed preference must not be stored');
stored = {level:500,board:'broken'};
const corrupt = createPage();
assert.equal(corrupt.data.level,1);
assert(engine.validBoard(corrupt.board,4));
page.onUnload(); restored.onUnload(); hardRestored.onUnload(); corrupt.onUnload();
console.log('Page checks passed: touch moves, undo, hints, victory, next level, restart, persistence and corrupt saves.');
