// Independent verification using the JavaScript rules, not the C++ move code.
const assert=require('node:assert/strict');
const e=require('../utils/engine');
const levels=require('../utils/levels');
const canonical=b=>b.map(t=>t.join('')).sort().join('|');
const lower=b=>b.reduce((sum,t)=>sum+t.filter((c,i)=>!i||c!==t[i-1]).length,0)-new Set(b.flat()).size;
function shorterExists(board,limit) {
  const seen=new Map();
  function visit(b,left) {
    if(e.won(b))return true;
    if(left<=0||left<lower(b))return false;
    const key=canonical(b);
    if((seen.get(key)??-1)>=left)return false;
    seen.set(key,left);
    for(const m of e.legalMoves(b))if(visit(m.next,left-1))return true;
    return false;
  }
  return visit(board,limit);
}
for(let i=0;i<levels.length;i++) {
  const spec=levels[i], level=e.makeLevel(i+1);
  assert(Number.isInteger(spec.minSteps)&&spec.minSteps>0);
  assert.equal(level.path.length-1,spec.minSteps);
  assert(e.won(level.path[level.path.length-1]));
  assert.equal(shorterExists(spec.board,spec.minSteps-1),false,`Level ${i+1} must have no shorter solution`);
}
console.log('All 100 minimum move counts independently proven with JavaScript rules; optimal solutions reach victory.');
