const TOTAL_LEVELS = 100;
function profile(level) {
  if (!Number.isInteger(level) || level < 1 || level > TOTAL_LEVELS) throw new RangeError('Invalid level');
  const stage = level <= 10 ? 0 : level <= 40 ? 1 : level <= 70 ? 2 : 3;
  const rest = level > 10 && level % 10 === 5;
  const boss = level % 10 === 0;
  let colors;
  if (stage === 0) colors = level <= 3 ? 4 : level <= 7 ? 5 : 6;
  else if (stage === 1) colors = level <= 20 ? 6 : 7;
  else if (stage === 2) colors = level <= 50 ? 6 : 7;
  else colors = level <= 80 ? 7 : 8;
  if (rest) colors = Math.max(5, colors - 1);
  const spare = stage < 2 || rest ? 2 : 1;
  return {colors,spare,stage,rest,boss,label:rest?'轻松关':boss?'挑战关':['熟悉收纳','交错整理','空间挑战','收纳大师'][stage]};
}
module.exports = {TOTAL_LEVELS,profile};
