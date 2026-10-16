// Run the actual entry with a JS-only loader matching the reported WeChat
// resolution rule. Intentionally does NOT use Node's JSON module support.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname,'..');
const cache = new Map();
let saved, touches;
const context = new Proxy({}, {get(target,key) {
  if(key==='createLinearGradient') return () => ({addColorStop() {}});
  return target[key] || (() => {});
},set(target,key,value) {target[key]=value;return true;}});
const wx = {
  createCanvas:() => ({getContext:() => context}),
  getWindowInfo:() => ({windowWidth:375,windowHeight:667,pixelRatio:2,statusBarHeight:20,safeArea:{bottom:647}}),
  getMenuButtonBoundingClientRect:() => ({bottom:55}),
  getStorageSync:() => saved,
  setStorageSync:(_,value) => {saved=JSON.parse(JSON.stringify(value));},
  showModal:options => options.success({confirm:true}),
  onTouchEnd:fn => {touches=fn;},onHide() {},onShow() {},onWindowResize() {}
  // No vibration API: any call is a test failure.
};
function load(filename) {
  if (!filename.endsWith('.js')) filename += '.js';
  if(cache.has(filename))return cache.get(filename).exports;
  if(!fs.existsSync(filename))throw new Error(`WeChat module not defined: ${path.relative(root,filename)}`);
  const module={exports:{}};cache.set(filename,module);
  const sandbox={module,exports:module.exports,wx,console,setTimeout:()=>1,clearTimeout() {},
    require:request=>{
      assert(request.startsWith('.'),'Runtime dependencies must be project modules');
      return load(path.resolve(path.dirname(filename),request));
    }
  };
  vm.runInNewContext(fs.readFileSync(filename,'utf8'),sandbox,{filename,timeout:3000});
  return module.exports;
}
load(path.join(root,'game.js'));
assert.equal(typeof touches,'function','Actual game entry must finish booting');
const {startGame}=load(path.join(root,'utils/canvas-game.js'));
const e=load(path.join(root,'utils/engine.js'));
const game=startGame(wx);
for(let level=1;level<=100;level++) {
  assert.equal(game.page.data.level,level);
  const {path:solution}=game.page.levelInfo;
  for(let step=0;step<solution.length-1;step++) {
    const h=e.hint(game.page.board,solution.slice(step));
    assert(h);
    // Use rendered touch targets rather than calling the move function.
    for(const index of [h.from,h.to]) {
      const hit=game.hits[index];
      touches({changedTouches:[{clientX:(hit.x+hit.w/2)*game.scale,clientY:(hit.y+hit.h/2)*game.scale}]});
    }
  }
  assert(game.page.data.victory,`Level ${level} must finish through canvas touches`);
  game.page.save();
  assert(game.page.data.records[level]);
  assert.equal(game.page.data.steps,game.page.data.minimum);
  assert.equal(game.page.data.stars,3,`Optimal play on level ${level} earns three stars`);
  assert.equal(game.page.data.records[level].stars,3);
  if(level<100) {
    const next=game.hits.find(b=>b.label==='下一关 →');assert(next);
    touches({changedTouches:[{clientX:(next.x+next.w/2)*game.scale,clientY:(next.y+next.h/2)*game.scale}]});
  }
}
assert.equal(saved.level,100);
assert.equal(Object.keys(saved.records).length,100);
const restored=startGame(wx);
assert(restored.page.data.victory);
assert.equal(restored.page.data.level,100);
assert.equal(restored.page.data.records[100].clears,1,'Restoring victory must not count it twice');
const replayCurrent=restored.hits.find(b=>b.label==='重玩本关');assert(replayCurrent);
touches({changedTouches:[{clientX:(replayCurrent.x+replayCurrent.w/2)*restored.scale,clientY:(replayCurrent.y+replayCurrent.h/2)*restored.scale}]});
assert.equal(restored.page.data.level,100);assert(!restored.page.data.victory);
assert(restored.page.data.records[100],'Replaying the current level preserves its best');
restored.page.replay();assert.equal(restored.page.data.level,1);
console.log('JS-only WeChat loader: actual entry boots; all 100 levels win through touches and next-level buttons; 100 records, final save restore and replay pass.');
