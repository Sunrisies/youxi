// Normalize touch and desktop mouse input without assuming one event shape.
function pointFrom(event) {
  if (!event) return null;
  const p=(event.changedTouches && event.changedTouches[0]) || (event.touches && event.touches[0]) || event;
  for(const [x,y] of [['clientX','clientY'],['pageX','pageY'],['x','y']]) {
    if(Number.isFinite(p[x]) && Number.isFinite(p[y]))return {x:p[x],y:p[y]};
  }
  return null;
}
function bindInput(api,onTap) {
  let active=false,last=null;
  const dispatch=(event,source)=>{
    const p=pointFrom(event);if(!p)return;
    const now=Date.now();
    // Some desktop runtimes emit a synthetic touch and a mouse-up for one click.
    if(last && source!==last.source && now-last.time<350 && Math.abs(p.x-last.x)<4 && Math.abs(p.y-last.y)<4)return;
    last={...p,source,time:now};onTap(p.x,p.y);
  };
  const start=event=>{if(!pointFrom(event))return;active=true;dispatch(event,'touch');};
  const end=event=>{if(active){active=false;return;}dispatch(event,'touch');};
  const cancel=()=>{active=false;};
  const mouse=event=>{if(event && event.button !== undefined && event.button !== 0)return;dispatch(event,'mouse');};
  if(typeof api.onTouchStart==='function')api.onTouchStart(start);
  if(typeof api.onTouchEnd==='function')api.onTouchEnd(end);
  if(typeof api.onTouchCancel==='function')api.onTouchCancel(cancel);
  if(typeof api.onMouseUp==='function')api.onMouseUp(mouse);
  return ()=>{
    for(const [name,handler] of [['offTouchStart',start],['offTouchEnd',end],['offTouchCancel',cancel],['offMouseUp',mouse]])if(typeof api[name]==='function')api[name](handler);
  };
}
module.exports={pointFrom,bindInput};
