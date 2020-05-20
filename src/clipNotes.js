import "lodash.product";
import _ from "lodash";

const chunk = (list, n) => {
  return _.chain(_.size(list) - n + 1)
    .range()
    .reduce((chunks, i) => {
      chunks.push(
        _.chain(list)
          .clone()
          .drop(i)
          .take(n)
          .value()
      );
      return chunks;
    }, [])
    .value();
};

export default (previousNotes, notes) => {
  let currentBigger = _.size(notes) >= _.size(previousNotes);

  let [bigger, smaller] = currentBigger
    ? [notes, previousNotes]
    : [previousNotes, notes];

  return _.chain(bigger)
    .thru(bigger => chunk(bigger, _.size(smaller)))
    .map(chunk => {
      return {
        sum: _.chain(chunk)
          .zip(smaller)
          .map(([a, b]) => Math.abs(a - b))
          .sum()
          .value(),
        current: currentBigger ? chunk : notes,
        previous: currentBigger ? previousNotes : chunk
      };
    })
    .minBy("sum")
    .value();
};
