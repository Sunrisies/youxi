const engine=require('./engine');
const {TOTAL_LEVELS}=require('./level-plan');
const {starsFor}=require('./rating');
const SYMBOLS=['♥','✦','●','◆','✿','☾','▲','✚'];
const STORE='candy-sort-v3';
const validLevel=n=>Number.isInteger(n)&&n>=1&&n<=TOTAL_LEVELS;
const validSteps=n=>Number.isInteger(n)&&n>=0&&n<=1000000;
const definition={
  data:{level:1,total:TOTAL_LEVELS,tubes:[],selected:-1,steps:0,minimum:0,stars:0,finished:0,colors:4,victory:false,settings:false,levelsOpen:false,levelPage:0,records:{},unlocked:1,best:null,stageLabel:'',status:'点一个糖果盒，再点目标盒子',top:30,boardClass:'',hintTo:-1,guide:true},
  onLoad(){
    try{const info=wx.getWindowInfo?wx.getWindowInfo():wx.getSystemInfoSync();this.setData({top:info.statusBarHeight||24});}catch(_){}
    let saved,legacy;
    try{saved=wx.getStorageSync(STORE);if(!saved)legacy=wx.getStorageSync('candy-sort-v2');}catch(_){}
    this.drafts={};const records={};let unlocked=1;
    if(saved&&saved.records&&typeof saved.records==='object')for(let level=1;level<=TOTAL_LEVELS;level++){
      const record=saved.records[level];
      if(record&&validSteps(record.best)&&record.best>0&&Number.isInteger(record.clears)&&record.clears>0){
        const stars=starsFor(record.best,engine.makeLevel(level).minSteps);if(!stars)continue;
        records[level]={best:record.best,clears:record.clears,stars};
        unlocked=Math.max(unlocked,Math.min(TOTAL_LEVELS,level+1));
      }
    }
    const source=saved||legacy;
    const level=source&&validLevel(source.level)?source.level:1;
    if(legacy)unlocked=Math.max(unlocked,level);
    if(saved&&validLevel(saved.unlocked))unlocked=Math.max(unlocked,saved.unlocked);
    if(saved&&saved.drafts&&typeof saved.drafts==='object')this.drafts=saved.drafts;
    this.setData({records,unlocked,guide:source?source.guide!==false:true});
    this.start(Math.min(level,unlocked),true);this.save();
  },
  onHide(){this.save();},
  onUnload(){clearTimeout(this.messageTimer);this.save();},
  start(level,restore=false){
    if(!validLevel(level))return;
    clearTimeout(this.messageTimer);this.levelInfo=engine.makeLevel(level);this.board=engine.clone(this.levelInfo.board);this.history=[];this.sessionRecorded=false;
    const draft=restore&&this.drafts&&this.drafts[level];let steps=0;
    if(draft&&draft.signature===engine.key(this.levelInfo.board)&&engine.validBoard(draft.board,this.levelInfo.colors,this.levelInfo.spare)&&validSteps(draft.steps)){
      this.board=engine.clone(draft.board);steps=draft.steps;this.sessionRecorded=engine.won(this.board)&&!!this.data.records[level];
    }
    this.setData({level,steps,minimum:this.levelInfo.minSteps,stars:0,selected:-1,hintTo:-1,victory:false,settings:false,levelsOpen:false,colors:this.levelInfo.colors,best:this.data.records[level]?this.data.records[level].best:null,stageLabel:this.levelInfo.label,status:'点一个糖果盒，再点目标盒子',boardClass:this.levelInfo.colors>4?'compact':''});this.render();
  },
  render(){
    const victory=engine.won(this.board);
    const tubes=this.board.map((tube,index)=>({index,done:engine.complete(tube),slots:Array.from({length:4},(_,i)=>({empty:i>=tube.length,color:tube[i],symbol:SYMBOLS[tube[i]]||''}))}));
    if(victory&&this.data.steps>0){
      const previous=this.data.records[this.data.level],best=previous?Math.min(previous.best,this.data.steps):this.data.steps;
      const records={...this.data.records,[this.data.level]:{best,stars:starsFor(best,this.levelInfo.minSteps),clears:previous?previous.clears+(this.sessionRecorded?0:1):1}};
      this.sessionRecorded=true;this.setData({records,best,unlocked:Math.max(this.data.unlocked,Math.min(TOTAL_LEVELS,this.data.level+1))});
    }
    this.setData({tubes,finished:this.board.filter(engine.complete).length,victory,stars:victory?starsFor(this.data.steps,this.levelInfo.minSteps):0});
  },
  tapTube(event){
    if(this.data.victory||this.data.settings||this.data.levelsOpen)return;
    const to=Number(event.currentTarget.dataset.index),from=this.data.selected;
    if(!Number.isInteger(to)||!this.board[to])return;
    if(from===to){this.setData({selected:-1,hintTo:-1});return;}
    if(from<0){this.select(to);return;}
    const next=engine.move(this.board,from,to);
    if(!next){this.say(engine.complete(this.board[to])?'这盒已经收纳完成啦':'只能放入空盒，或顶部同色的盒子');if(this.board[to].length&&!engine.complete(this.board[to]))this.select(to);return;}
    this.history.push(engine.clone(this.board));this.board=next;
    this.setData({selected:-1,hintTo:-1,steps:this.data.steps+1,guide:false});this.render();this.save();
    this.say(this.data.victory?'全部收纳完成，真治愈！':engine.complete(next[to])?'漂亮！又收好了一种颜色':'慢慢整理，也是一种放松');
  },
  select(index){if(!this.board[index])return;if(engine.complete(this.board[index])){this.say('这盒已经收纳完成啦');return;}if(!this.board[index].length){this.say('先选择有糖果的盒子');return;}this.setData({selected:index,hintTo:-1});},
  undo(){if(!this.history.length){this.say('还没有可以撤销的步骤');return;}this.board=this.history.pop();this.setData({steps:Math.max(0,this.data.steps-1),selected:-1,hintTo:-1});this.render();this.save();this.say('已退回上一步');},
  hint(){const h=engine.hint(this.board,this.levelInfo.path);if(!h){this.say('暂时无路可走，试试撤销或重开');return;}this.setData({selected:h.from,hintTo:h.to});this.say(`试试从 ${h.from+1} 号盒移到 ${h.to+1} 号盒`);},
  restart(){wx.showModal({title:'重新整理这一关？',content:'本关移动进度会重置，最佳记录会保留。',confirmText:'重新开始',confirmColor:'#558d70',success:r=>{if(r.confirm){this.start(this.data.level);this.save();}}});},
  next(){if(this.data.victory&&this.data.level<TOTAL_LEVELS){this.save();this.start(this.data.level+1,true);this.save();}},
  replay(){this.save();this.start(1);this.save();},
  openLevels(){this.save();this.setData({levelsOpen:true,settings:false,levelPage:Math.floor((this.data.level-1)/20)});},
  closeLevels(){this.setData({levelsOpen:false});},
  changeLevelPage(delta){this.setData({levelPage:Math.max(0,Math.min(Math.ceil(TOTAL_LEVELS/20)-1,this.data.levelPage+delta))});},
  selectLevel(level){if(!validLevel(level)||level>this.data.unlocked)return;if(level===this.data.level){this.closeLevels();return;}this.save();this.start(level,true);this.save();},
  openSettings(){this.setData({settings:true,levelsOpen:false});},closeSettings(){this.setData({settings:false});},noop(){},
  say(status){clearTimeout(this.messageTimer);this.setData({status});this.messageTimer=setTimeout(()=>this.setData({status:'点一个糖果盒，再点目标盒子'}),3500);},
  save(){if(!this.board)return;if(!this.drafts)this.drafts={};this.drafts[this.data.level]={board:engine.clone(this.board),steps:this.data.steps,signature:engine.key(this.levelInfo.board)};try{wx.setStorageSync(STORE,{level:this.data.level,records:this.data.records,unlocked:this.data.unlocked,drafts:this.drafts,guide:this.data.guide});}catch(_){} }
};
module.exports=definition;
