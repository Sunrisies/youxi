const assert = require('node:assert/strict');
const fs = require('node:fs');
const engine = require('../utils/engine');
const {startGame} = require('../utils/canvas-game');
const config = JSON.parse(fs.readFileSync('project.config.json','utf8'));
assert(['game','miniprogram'].includes(config.compileType));
assert.equal(JSON.parse(fs.readFileSync('game.json','utf8')).deviceOrientation,'portrait');
assert(fs.existsSync('game.js'));
let touch, touchStart, mouse, hide, show, resize;
let dimensions={windowWidth:375,windowHeight:667,pixelRatio:2,statusBarHeight:20,safeArea:{bottom:647}};
const context = new Proxy({}, {get(target,key) {
  if(key==='createLinearGradient') return () => ({addColorStop() {}});
  return target[key] || (() => {});
},set(target,key,value) {target[key]=value;return true;}});
global.wx = {
  createCanvas:() => ({getContext:() => context}),
  getWindowInfo:() => dimensions,
  getMenuButtonBoundingClientRect:() => ({bottom:55}),
  getStorageSync:() => null,setStorageSync() {},vibrateShort() {throw new Error('Vibration must never be called');},
  showModal:options => options.success({confirm:true}),
  onTouchEnd:fn => {touch=fn;},onHide:fn => {hide=fn;},onShow:fn => {show=fn;},onWindowResize:fn => {resize=fn;}
};
wx.onTouchStart=fn=>{touchStart=fn;};wx.onMouseUp=fn=>{mouse=fn;};
const game = startGame(wx);
assert.equal(game.canvas.width,750);
assert.equal(game.canvas.height,1334);
assert.equal(typeof touch,'function');
assert.equal(typeof touchStart,'function');assert.equal(typeof mouse,'function');
function tapBox(index) {
  // Boxes are registered before the four footer buttons.
  const box=game.hits[index];
  touch({changedTouches:[{clientX:(box.x+box.w/2)*game.scale,clientY:(box.y+box.h/2)*game.scale}]});
}
const hint=engine.hint(game.page.board,game.page.levelInfo.path);
tapBox(hint.from);tapBox(hint.to);
assert.deepEqual(game.page.board,hint.next);
assert.equal(game.page.data.steps,1);
game.page.openSettings();assert.equal(game.hits.length,1,'Guide blocks underlying board touches');
const close=game.hits[0];game.tap(close.x+10,close.y+10);
assert.equal(game.page.data.settings,false);
// Exercise desktop x/y events against actual rendered button targets.
const helpMouse=game.hits.find(b=>b.label==='?');
mouse({x:(helpMouse.x+helpMouse.w/2)*game.scale,y:(helpMouse.y+helpMouse.h/2)*game.scale,button:0});
assert(game.page.data.settings,'Desktop mouse x/y must open help');
const closeMouse=game.hits[0];
mouse({x:(closeMouse.x+closeMouse.w/2)*game.scale,y:(closeMouse.y+closeMouse.h/2)*game.scale,button:0});
assert(!game.page.data.settings);
const selector=game.hits.find(b=>b.label==='选关');
touchStart({touches:[{x:(selector.x+selector.w/2)*game.scale,y:(selector.y+selector.h/2)*game.scale}]});
touch({changedTouches:[]});assert(game.page.data.levelsOpen,'Touch-start-only x/y input must open selection');
game.page.closeLevels();
game.page.start(100);
assert.equal(game.page.data.tubes.length,9);
const boxes=game.hits.slice(0,9);
assert(boxes.every(b=>b.y>=0 && b.y+b.h<game.hits[9].y),'Board must fit above controls on a short screen');
game.page.start(10);
assert.equal(game.page.data.tubes.length,8);
assert(game.hits.slice(0,8).every(b=>b.y+b.h<game.hits[8].y),'Eight boxes must also fit');
for(const [width,height] of [[320,568],[375,667],[390,844],[430,932]]) {
  dimensions={windowWidth:width,windowHeight:height,pixelRatio:2,statusBarHeight:24,safeArea:{bottom:height-20}};
  resize();
  for(let level=1;level<=100;level++) {
    game.page.start(level);
    const count=game.page.data.tubes.length;
    const boxes=game.hits.slice(0,count), controls=game.hits.slice(count,count+3);
    assert.equal(game.hits.length,count+5,'Three footer controls, header help and level selection');
    for(const b of boxes) {
      assert(b.x>=0 && b.x+b.w<=375);
      assert(b.y+b.h<controls[0].y,`${width}x${height} level ${level}: board overlaps footer`);
      assert(b.h>=70,'Tube touch target must remain usable');
    }
    const help=game.hits[count+3];
    assert(help.y+help.h<boxes[0].y,'Help belongs in header');
    assert(controls.every(b=>b.y+b.h<game.h-game.bottom),'Footer respects safe area');
  }
  for(let page=0;page<5;page++) {
    game.page.setData({unlocked:100,levelsOpen:true,levelPage:page});
    const cards=game.hits.filter(b=>b.level);
    assert.equal(cards.length,20);
    assert(cards.every(b=>b.y+b.h<game.h-game.bottom-80),'Cards clear the pagination controls');
    assert(game.hits.every(b=>b.x>=0&&b.x+b.w<=375&&b.y>=0&&b.y+b.h<=game.h-game.bottom),'Selection targets fit in screen');
  }
  game.page.closeLevels();
}
resize();hide();show();
game.page.onUnload();
console.log('Canvas checks passed: touch controls, guide, lifecycle, 100 boards and 5 selection pages at 4 screen sizes.');
