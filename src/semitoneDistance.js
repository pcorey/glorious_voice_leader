import "lodash.product";
import _ from "lodash";

const note = (string, fret) => {
  let tuning = [40, 45, 50, 55, 59, 64];
  return tuning[5 - string] + fret;
};

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

export default previousChord => {
  if (_.isEmpty(previousChord.notes)) {
    return () => 0;
  }

  let previousNotes = _.chain(previousChord.notes)
    .map(([string, fret]) => {
      if (!previousChord.labels[[string, fret]]) {
        return note(5 - string, fret);
      }
    })
    .reject(_.isUndefined)
    .sort()
    .value();

  return voicing => {
    if (_.isEmpty(previousChord.notes)) {
      return 0;
    }

    let notes = _.chain(voicing)
      .map(([string, fret]) => note(5 - string, fret))
      .sort()
      .value();

    let [bigger, smaller] =
      _.size(notes) >= _.size(previousNotes)
        ? [notes, previousNotes]
        : [previousNotes, notes];

    return _.chain(bigger)
      .thru(bigger => chunk(bigger, _.size(smaller)))
      .map(chunk =>
        _.chain(chunk)
          .zip(smaller)
          .map(([a, b]) => Math.abs(a - b))
          .sum()
          .value()
      )
      .min()
      .value();
  };
};