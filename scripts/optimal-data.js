const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const levels=require('../utils/levels');
if(process.argv[2]==='input') {
  const rows=[String(levels.length)];
  for(const level of levels)rows.push([level.colors,level.board.length,...level.board.flatMap(t=>[t.length,...t])].join(' '));
  fs.writeFileSync(path.join(__dirname,'optimal-input.txt'),rows.join('\n')+'\n');
} else if(process.argv[2]==='apply') {
  const rows=fs.readFileSync(path.join(__dirname,'optimal-output.txt'),'utf8').trim().split('\n');
  if(rows.length!==levels.length)throw Error('Incomplete optimal solver results');
  for(const row of rows){const values=row.trim().split(/\s+/).map(Number);const [level,minSteps]=values;const solution=[];for(let i=2;i<values.length;i+=2)solution.push([values[i],values[i+1]]);if(solution.length!==minSteps)throw Error('Invalid solution');Object.assign(levels[level-1],{minSteps,solution});}
  fs.writeFileSync(path.join(root,'utils/levels.js'),'// 100 levels with offline-proven optimal solutions.\nmodule.exports = '+JSON.stringify(levels,null,2)+';\n');
  console.log('Applied 100 proven minimum move counts and optimal solutions.');
} else throw Error('Usage: node scripts/optimal-data.js input|apply');
