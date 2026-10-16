const TWO_STAR_EXTRA = 5;
function starsFor(steps,minimum) {
  if (!Number.isInteger(steps) || !Number.isInteger(minimum) || minimum < 1 || steps < minimum) return 0;
  if (steps === minimum) return 3;
  return steps <= minimum + TWO_STAR_EXTRA ? 2 : 1;
}
const starText = stars => '★'.repeat(stars) + '☆'.repeat(3-stars);
module.exports = {TWO_STAR_EXTRA,starsFor,starText};
