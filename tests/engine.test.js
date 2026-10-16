const assert = require('node:assert/strict');
const e = require('../utils/engine');
const {TOTAL_LEVELS,profile} = require('../utils/level-plan');
const all = require('../utils/levels');
assert.equal(all.length,TOTAL_LEVELS);
const unique = new Set();
for (let level = 1; level <= TOTAL_LEVELS; level++) {
  const {board, colors, spare, path} = e.makeLevel(level);
  assert(e.validBoard(board, colors, spare));
  assert.equal(board.filter(t=>!t.length).length,profile(level).spare);
  assert(board.filter(t=>t.length).every(t=>t.length===4 && !e.complete(t)),'Start with full mixed boxes');
  assert.equal(colors,profile(level).colors);
  const identity=board.map(t=>t.join('')).sort().join('|');
  assert(!unique.has(identity),'Campaign boards must be distinct');unique.add(identity);
  assert(!e.won(board), `Level ${level} should need play`);
  assert.deepEqual(board, e.makeLevel(level).board);
  for (let i = 0; i < path.length - 1; i++) {
    const hint = e.hint(path[i], path.slice(i));
    assert(hint, `Level ${level} step ${i} has a hint`);
    assert.deepEqual(hint.next, path[i + 1], `Level ${level} reverse path is legally solvable`);
  }
  assert(e.won(path[path.length - 1]));
}
assert.throws(()=>e.makeLevel(0));assert.throws(()=>e.makeLevel(101));
console.log('100 unique campaign levels: color counts, spare capacity and every reference solution passed.');
const board = [[0,1,1],[1,1],[],[2,2,2,2]];
const before = e.clone(board);
assert.deepEqual(e.move(board,0,1),[[0],[1,1,1,1],[],[2,2,2,2]]);
assert.deepEqual(board,before,'Moves must not mutate history');
assert.equal(e.move(board,0,3),null);
assert.equal(e.move(board,3,2),null,'Completed boxes stay locked');
assert.equal(e.move(board,0,0),null);
assert.equal(e.move(board,2,0),null);
assert.equal(e.move([[0,1],[2],[]],0,1),null);
assert.deepEqual(e.move([[0,1,1],[1,1,1]],0,1),[[0,1],[1,1,1,1]]);
assert.equal(e.validBoard([[0,0,0,9],[],[]],1),false);
console.log('Engine checks passed.');
