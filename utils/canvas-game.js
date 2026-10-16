const definition = require('./controller');
const {bindInput} = require('./input');
const {starText,TWO_STAR_EXTRA} = require('./rating');
const PALETTE = [ ['#ffb5c1','#ed7a92'], ['#ffeaa0','#ebbb46'], ['#b5e4f7','#6bb9e5'], ['#caeaa9','#83bd6d'], ['#e2c8f5','#ad87cf'], ['#ffd3a9','#e8a071'], ['#9ae4d5','#44aa9b'], ['#d5b9a9','#a17d69'] ];

class CanvasGame {
  constructor(api) {
    this.api = api;
    this.canvas = api.createCanvas();
    this.ctx = this.canvas.getContext('2d');
    this.page = {...definition, data:JSON.parse(JSON.stringify(definition.data))};
    this.page.setData = patch => {Object.assign(this.page.data,patch); this.draw();};
    this.resize();
    this.page.onLoad();
    this.unbindInput = bindInput(api,(x,y)=>this.tap(x,y));
    api.onHide(() => this.page.onHide());
    api.onShow(() => this.draw());
    if (api.onWindowResize) api.onWindowResize(() => this.resize());
  }
  resize() {
    const info = this.api.getWindowInfo ? this.api.getWindowInfo() : this.api.getSystemInfoSync();
    this.width = info.windowWidth;
    this.height = info.windowHeight;
    this.dpr = Math.min(info.pixelRatio || 1,3);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.scale = this.width / 375;
    this.h = this.height / this.scale;
    let menu;
    try {menu = this.api.getMenuButtonBoundingClientRect();} catch (_) {}
    this.safeTop = Math.max(14, (menu && menu.bottom > 0 ? menu.bottom + 10 : (info.statusBarHeight || 24) + 32) / this.scale);
    this.bottom = info.safeArea ? Math.max(0, this.height - info.safeArea.bottom) / this.scale : 12;
    this.draw();
  }
  round(x,y,w,h,r,fill,stroke) {
    const c = this.ctx; r = Math.min(r,w/2,h/2);
    c.beginPath(); c.moveTo(x+r,y); c.lineTo(x+w-r,y); c.quadraticCurveTo(x+w,y,x+w,y+r);
    c.lineTo(x+w,y+h-r); c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    c.lineTo(x+r,y+h); c.quadraticCurveTo(x,y+h,x,y+h-r); c.lineTo(x,y+r); c.quadraticCurveTo(x,y,x+r,y);
    c.closePath(); if(fill) {c.fillStyle=fill;c.fill();} if(stroke) {c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}
  }
  gradient(x,y,w,h,colors) {
    const g = this.ctx.createLinearGradient(x,y,x+w,y+h);
    colors.forEach((color,i) => g.addColorStop(i/(colors.length-1),color));return g;
  }
  text(value,x,y,size=14,color='#82634b',weight='normal') {
    const c = this.ctx; c.font=`${weight} ${size}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(String(value),x,y);
  }
  button(label,x,y,w,h,colors,action,size=16) {
    this.round(x,y+3,w,h,22,'#bca47c33');
    this.round(x,y,w,h,22,this.gradient(x,y,w,h,colors),'#fff9ec');
    this.text(label,x+w/2,y+h/2,size,'#466a52','bold');
    this.hits.push({x,y,w,h,action,label});
  }
  draw() {
    this.renderScene();
    if(typeof this.api.onDraw==='function')this.api.onDraw(this.hits||[],this.scale);
  }
  renderScene() {
    if (!this.ctx) return;
    const c=this.ctx,d=this.page.data;
    c.setTransform(this.dpr*this.scale,0,0,this.dpr*this.scale,0,0);
    c.clearRect(0,0,375,this.h); this.hits=[];
    c.fillStyle=this.gradient(0,0,375,this.h,['#fff8e9','#f5eddd','#f2edda']);c.fillRect(0,0,375,this.h);
    this.leaves();
    if (d.levelsOpen) {this.drawLevels(d);return;}
    const top=this.safeTop;
    this.text('♥  ✦  ◆',187.5,top+7,22,'#e9ad66');
    this.text('糖果收纳所',187.5,top+43,35,'#578e70','bold');
    this.text(`${d.stageLabel || '把小小的杂乱，整理成好心情'}${d.best ? ' · 最佳 '+d.best+' 步' : ''}`,187.5,top+75,11,'#aa9479');
    this.round(105,top+95,165,34,18,this.gradient(105,top+95,165,34,['#fffaed','#eee0c9']),'#fffcf5');
    this.text(`第 ${String(d.level).padStart(2,'0')} 关`,187.5,top+112,17,'#86624c','bold');
    this.text(`已收纳 ${d.finished} / ${d.colors} · ${d.steps} 步 · 最少 ${d.minimum || '—'} 步`,187.5,top+149,11,'#739173');
    const footerY=this.h-this.bottom-82;
    const dense=d.tubes && d.tubes.length>8;
    const boardTop=top+(dense?160:173);
    const cols=d.colors > 4 ? 4 : 3;
    const rows=Math.max(2,Math.ceil((d.tubes || []).length/cols)), gap=cols === 4 ? 14 : 23;
    const tw=cols === 4 ? 67 : 75;
    const th=Math.max(60,Math.min(180,(footerY-boardTop-21*rows)/rows));
    const pitchY=th+21;
    if (d.tubes) d.tubes.forEach((tube,i) => {
      const row=Math.floor(i/cols),count=Math.min(cols,d.tubes.length-row*cols);
      const total=count*tw+(count-1)*gap;
      const x=(375-total)/2+(i%cols)*(tw+gap),y=boardTop+row*pitchY;
      this.tube(tube,x,y,tw,th,d);
      this.hits.push({x,y:y-8,w:tw,h:th+13,tube:i,action:()=>this.page.tapTube({currentTarget:{dataset:{index:i}}})});
      this.text(i+1,x+tw/2,y+th+11,10,'#b49f85');
    });
    const status=String(d.status || '');
    this.text(status,187.5,footerY,Math.min(12,315/Math.max(1,status.length)),'#927559');
    const by=footerY+22;
    this.button('↶ 撤销',22,by,102,42,['#d9f2d4','#acd7b1'],()=>this.page.undo());
    this.button('☀ 提示',136,by,102,42,['#fff1b7','#f7d57b'],()=>this.page.hint());
    this.button('⟳ 重开',250,by,102,42,['#c8ecf8','#94cee9'],()=>this.page.restart());
    this.button('?',20,top+92,34,34,['#f9eedc','#eadbc4'],()=>this.page.openSettings(),17);
    this.button('选关',286,top+92,66,34,['#e1efda','#c0dcba'],()=>this.page.openLevels(),13);
    if (d.victory || d.settings) this.modal(d);
  }
  leaves() {
    const c=this.ctx;
    [[-8,18,.7],[365,28,-.6],[-8,this.h-20,-.8],[363,this.h-12,.8]].forEach(([x,y,angle])=>{
      c.save();c.translate(x,y);c.rotate(angle);
      for(let i=0;i<3;i++) {c.save();c.translate(i*9,i*15);c.rotate(i*.6);c.beginPath();c.moveTo(0,0);c.bezierCurveTo(5,-38,32,-32,29,-5);c.bezierCurveTo(20,8,3,10,0,0);c.fillStyle=i%2?'#afc79088':'#86ab7577';c.fill();c.restore();}
      c.restore();
    });
  }
  drawLevels(d) {
    const top=this.safeTop;
    this.text('我的收纳旅程',187.5,top+20,27,'#578e70','bold');
    const done=Object.keys(d.records).length;
    this.text(`已通关 ${done} / ${d.total} · 继续挑战第 ${d.unlocked} 关`,187.5,top+58,12,'#9b8068');
    const first=d.levelPage*20+1, last=Math.min(d.total,first+19);
    this.text(`第 ${String(first).padStart(2,'0')} — ${last} 关`,187.5,top+90,16,'#80634d','bold');
    const gridTop=top+120;
    const cellH=Math.min(78,(this.h-this.bottom-gridTop-105)/4-10);
    for(let i=0;i<20;i++) {
      const level=first+i;if(level>d.total)break;
      const x=22+(i%5)*68,y=gridTop+Math.floor(i/5)*(cellH+10),w=59;
      const record=d.records[level],locked=level>d.unlocked,current=level===d.level;
      const colors=locked?['#ece6db','#e4ddce']:record?['#e4efd5','#c6dfb9']:['#fff5de','#f2e2bf'];
      this.round(x,y,w,cellH,13,this.gradient(x,y,w,cellH,colors),current?'#6b9f76':'#fffaf0');
      this.text(level,x+w/2,y+cellH*.26,20,locked?'#b8ac99':'#65835e','bold');
      this.text(starText(record ? record.stars : 0),x+w/2,y+cellH*.55,13,record?'#c79936':'#c2b7a3');
      const note=locked?'未解锁':record?`${record.best} 步 ✓`:current?'进行中':'待挑战';
      this.text(note,x+w/2,y+cellH*.81,9,locked?'#b8ac99':'#8a795f');
      if(!locked)this.hits.push({x,y,w,h:cellH,level,action:()=>this.page.selectLevel(level)});
    }
    const y=this.h-this.bottom-80;
    if(d.levelPage>0)this.button('← 上页',22,y,88,37,['#fff5de','#edddbd'],()=>this.page.changeLevelPage(-1),13);
    if(last<d.total)this.button('下页 →',265,y,88,37,['#fff5de','#edddbd'],()=>this.page.changeLevelPage(1),13);
    this.text(`${d.levelPage+1} / ${Math.ceil(d.total/20)}`,187.5,y+18,12,'#9b8269');
    this.button('返回游戏',122,y+47,131,30,['#d9edcf','#bcdab3'],()=>this.page.closeLevels(),13);
  }
  tube(t,x,y,w,h,d) {
    const selected=d.selected===t.index, target=d.hintTo===t.index;
    if (selected) y-=5;
    const c=this.ctx;
    c.save();c.shadowColor=selected?'#78b48b':t.done?'#eca3af':'#ae967844';c.shadowBlur=selected||t.done?17:8;c.shadowOffsetY=3;
    this.round(x,y,w,h,18,this.gradient(x,y,w,h,['#ffffffb0','#e8dcc133','#ffffff90']),selected?'#70b48a':target?'#dbb657':t.done?'#efa7b3':'#cbb99e');
    c.restore();
    this.round(x+3,y+3,w-6,h-6,15,null,'#fffdf4');
    const sh=(h-18)/4;
    t.slots.forEach((slot,i)=>{
      const sy=y+h-9-(i+1)*sh;
      this.round(x+8,sy+2,w-16,sh-4,10,'#bba9800c');
      if(slot.empty)return;
      const colors=PALETTE[slot.color];
      this.round(x+10,sy+3,w-20,sh-6,12,this.gradient(x+10,sy,w-20,sh,colors),'#ffffff99');
      this.round(x+16,sy+6,13,3,2,'#ffffff88');
      this.text(slot.symbol,x+w/2,sy+sh/2+1,Math.min(24,sh*.67),'#ffffffb0','bold');
    });
    if(t.done) {this.round(x+w-14,y-10,24,24,12,'#e991a2','#fff7e9');this.text('✓',x+w-2,y+2,17,'white','bold');}
    if(target) this.text('↓',x+w/2,y-17,22,'#bf983e','bold');
  }
  modal(d) {
    const c=this.ctx;
    this.hits=[]; // Background controls must never receive touches through a dialog.
    c.fillStyle='#624b3766';c.fillRect(0,0,375,this.h);
    const y=Math.max(this.safeTop,(this.h-330)/2);
    this.round(26,y,323,330,25,'#fff9ed','#fffdf4');
    if(d.settings) {
      this.text('收纳指南',187.5,y+39,23,'#58886b','bold');
      ['先点来源盒，再点空盒或顶部同色的盒子。','每盒装满四颗同色糖果后锁定。','最少步数通关得三星。',`超过最少步数不多于${TWO_STAR_EXTRA}步得两星。`,'其余通关得一星，可重玩刷新成绩。'].forEach((text,i)=>this.text(text,187.5,y+85+i*25,12,'#9a8168'));
      this.button('继续收纳',70,y+222,235,44,['#d4eccd','#acd5af'],()=>this.page.closeSettings());
    } else {
      this.text(starText(d.stars),187.5,y+40,35,'#d6a642');
      this.text(d.level===d.total?'百关收纳完成！':'收纳完成！',187.5,y+88,26,'#58886b','bold');
      this.text(`本次 ${d.steps} 步 · 最佳 ${d.best || d.steps} 步`,187.5,y+126,15,'#779567','bold');
      this.text(`最少 ${d.minimum} 步 · 已通关 ${Object.keys(d.records).length} / ${d.total}`,187.5,y+151,12,'#9a8168');
      this.button(d.level===d.total?'从第一关重玩':'下一关 →',70,y+175,235,44,['#d4eccd','#acd5af'],()=>d.level===d.total?this.page.replay():this.page.next());
      this.button('查看关卡',100,y+233,175,34,['#fff6e6','#f4e7cf'],()=>this.page.openLevels(),13);
      if(this.page.history.length) {
        this.button('撤销一步',70,y+280,110,30,['#fff6e6','#f4e7cf'],()=>this.page.undo(),12);
        this.button('重玩本关',195,y+280,110,30,['#fff6e6','#f4e7cf'],()=>this.page.restart(),12);
      } else this.button('重玩本关',100,y+280,175,30,['#fff6e6','#f4e7cf'],()=>this.page.restart(),12);
    }
  }
  tap(x,y) {
    if(!Number.isFinite(x)||!Number.isFinite(y))return;
    x/=this.scale;y/=this.scale;
    const hit=this.hits.slice().reverse().find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);
    if(hit)hit.action();
  }
}
function startGame(api) {return new CanvasGame(api || wx);}
module.exports={CanvasGame,startGame};
