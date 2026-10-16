const {startGame}=require('../../utils/canvas-game');
const {pointFrom}=require('../../utils/input');
// Small-program Canvas 2D host. The game itself is shared with game.js.
Page({
  data:{loading:true,error:'',targets:[],revision:0},
  onReady() {
    this._disposed=false;
    wx.createSelectorQuery().in(this).select('#gameCanvas').fields({node:true,size:true}).exec(results=>{
      if(this._disposed)return;
      const result=results && results[0];
      if(!result || !result.node) {this.setData({loading:false,error:'游戏画布初始化失败，请重新编译或更新基础库。'});return;}
      this._canvasSize=result;
      const api=Object.create(wx);
      api.createCanvas=()=>result.node;
      api.onTouchStart=fn=>{this._touchStart=fn;};
      api.onTouchEnd=fn=>{this._touchEnd=fn;};
      api.onTouchCancel=fn=>{this._touchCancel=fn;};
      api.offTouchStart=()=>{this._touchStart=null;};
      api.offTouchEnd=()=>{this._touchEnd=null;};
      api.offTouchCancel=()=>{this._touchCancel=null;};
      // Canvas bindtouch events are the small-program input source.
      api.onMouseUp=undefined;
      api.onHide=fn=>{this._hide=fn;};
      api.onShow=fn=>{this._show=fn;};
      api.onWindowResize=fn=>{this._resize=fn;};
      api.onDraw=(hits,scale)=>{
        this._revision=(this._revision||0)+1;
        this.setData({revision:this._revision,targets:hits.map((hit,id)=>({id,left:hit.x*scale,top:hit.y*scale,width:hit.w*scale,height:hit.h*scale,label:hit.label||(hit.tube!==undefined?`${hit.tube+1}号糖果盒`:`第${hit.level}关`)}))});
      };
      api.getWindowInfo=()=>{
        const info=wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
        return {...info,windowWidth:this._canvasSize.width,windowHeight:this._canvasSize.height};
      };
      try {this.game=startGame(api);this.setData({loading:false});}
      catch(error){console.error('[candy-sort] Canvas startup failed',error);this.setData({loading:false,error:'游戏启动失败：'+error.message});}
    });
  },
  touchStart(event) {this._touchHandled=!!pointFrom(event);if(this._touchStart)this._touchStart(event);},
  touchEnd(event) {this._touchHandled=this._touchHandled||!!pointFrom(event);if(this._touchEnd)this._touchEnd(event);},
  touchCancel(event) {this._touchHandled=false;if(this._touchCancel)this._touchCancel(event);},
  tap(event) {
    if(this._touchHandled){this._touchHandled=false;return;}
    const point=pointFrom(event && event.detail);
    if(this.game&&point)this.game.tap(point.x,point.y);
  },
  activate(event) {
    if(!this.game||Number(event.currentTarget.dataset.revision)!==this._revision)return;
    const hit=this.game.hits[Number(event.currentTarget.dataset.hit)];
    if(hit)hit.action();
  },
  onHide() {if(this._hide)this._hide();},
  onShow() {if(this._show)this._show();},
  onResize() {
    if(this._resize) {
      wx.createSelectorQuery().in(this).select('#gameCanvas').fields({size:true}).exec(results=>{
        if(this._disposed||!this.game||!results[0])return;
        this._canvasSize=results[0];
        this._resize();
      });
    }
  },
  onUnload() {
    this._disposed=true;
    if(this.game){this.game.page.onUnload();this.game.unbindInput();}
  }
});
