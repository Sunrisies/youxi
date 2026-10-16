// Offline IDDFS: admissible run-count lower bound + full legal move search.
// No node/time cutoff: a result is returned only after all shorter depths fail.
const e=require('../utils/engine');
const canonical=b=>b.map(t=>t.join('')).sort().join('|');
const lower=b=>b.reduce((sum,t)=>sum+t.filter((c,i)=>!i||c!==t[i-1]).length,0)-new Set(b.flat()).size;
function solveExact(board,upper) {
  for(let depth=lower(board);depth<=upper;depth++) {
    const seen=new Map();
    function visit(current,left,trail) {
      if(e.won(current))return trail;
      if(left<=0||left<lower(current))return null;
      const key=canonical(current);
      if((seen.get(key)??-1)>=left)return null;
      seen.set(key,left);
      const moves=e.legalMoves(current).sort((a,b)=>lower(a.next)-lower(b.next));
      for(const m of moves) {
        const result=visit(m.next,left-1,trail.concat([[m.from,m.to]]));
        if(result)return result;
      }
      return null;
    }
    const solution=visit(board,depth,[]);
    if(solution)return solution;
  }
  throw Error('No solution within verified upper bound');
}
module.exports={solveExact};
