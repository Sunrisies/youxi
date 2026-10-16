const CAPACITY = 4;
const clone = board => board.map(tube => tube.slice());
const key = board => JSON.stringify(board);
const complete = tube => tube.length === CAPACITY && tube.every(c => c === tube[0]);
function run(tube) {
  let n = 0;
  for (let i = tube.length - 1; i >= 0 && tube[i] === tube[tube.length - 1]; i--) n++;
  return n;
}
function canMove(board, from, to) {
  const a = board[from], b = board[to];
  return from !== to && !!a && !!b && a.length > 0 && !complete(a) && b.length < CAPACITY && (!b.length || b[b.length - 1] === a[a.length - 1]);
}
function move(board, from, to) {
  if (!canMove(board, from, to)) return null;
  const next = clone(board), count = Math.min(run(next[from]), CAPACITY - next[to].length);
  next[to].push(...next[from].splice(next[from].length - count, count));
  return next;
}
const won = board => board.every(t => !t.length || complete(t));
// Load authored, fully mixed boards with offline-verified solutions.
function makeLevel(level) {
  const spec = require('./levels')[level - 1];
  if (!spec) throw new RangeError('Invalid level');
  const board = clone(spec.board), path = [clone(board)];
  let current = board;
  for (const [from,to] of spec.solution) {
    current = move(current,from,to);
    if (!current) throw new Error('Invalid level solution');
    path.push(current);
  }
  return {board,colors:spec.colors,spare:spec.spare,label:spec.label,rest:spec.rest,boss:spec.boss,minSteps:spec.minSteps,path};
}
function legalMoves(board) {
  const result = [];
  for (let a = 0; a < board.length; a++) for (let b = 0; b < board.length; b++) {
    const next = move(board, a, b);
    if (next) result.push({from:a, to:b, next});
  }
  return result;
}
function hint(board, path) {
  const moves = legalMoves(board);
  const index = path.findIndex(b => key(b) === key(board));
  if (index >= 0 && index + 1 < path.length) {
    const exact = moves.find(m => key(m.next) === key(path[index + 1]));
    if (exact) return exact;
  }
  return moves.sort((a,b) => score(b) - score(a))[0] || null;
  function score(m) {
    return (complete(m.next[m.to]) ? 100 : 0) + (board[m.to].length ? 15 : 0) + (!m.next[m.from].length ? 8 : 0) - (!board[m.to].length && run(board[m.from]) === board[m.from].length ? 30 : 0);
  }
}
function validBoard(board, colors, spare = 2) {
  if (!Array.isArray(board) || board.length !== colors + spare) return false;
  const counts = Array(colors).fill(0);
  for (const tube of board) {
    if (!Array.isArray(tube) || tube.length > 4) return false;
    for (const c of tube) { if (!Number.isInteger(c) || c < 0 || c >= colors) return false; counts[c]++; }
  }
  return counts.every(n => n === 4);
}
module.exports = {clone,key,complete,canMove,move,won,makeLevel,legalMoves,hint,validBoard};
