import _ from "lodash";

let lydian = [0, 2, 4, 6, 7, 9, 11];

const transpose = intervals =>
  _.map(intervals, interval => (interval - _.first(intervals) + 12) % 12);

const stackThirds = intervals =>
  _.chain(intervals)
    .size()
    .range()
    .map(i => intervals[(i * 2) % _.size(intervals)])
    .value();

const toChords = intervals =>
  _.chain(_.range(3, _.size(intervals) + 1))
    .map(n => _.take(intervals, n))
    .value();

export const qualities = _.chain(lydian)
  .size()
  .range()
  .map(mode => _.concat(_.drop(lydian, mode), _.take(lydian, mode)))
  .map(transpose)
  .map(stackThirds)
  .flatMap(toChords)
  .tap(console.log)
  .value();
