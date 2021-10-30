import "lodash.product";
import _ from "lodash";
import clipNotes from "./clipNotes.js";

const note = (string, fret, tuning) => {
  return tuning[string] + fret;
};

export default (previousChord, tuning, clipper = clipNotes) => {
  if (_.isEmpty(previousChord.notes)) {
    return () => 0;
  }

  let previousNotes = _.chain(previousChord.notes)
    .map(([string, fret]) => note(string, fret, tuning))
    .sort()
    .value();

  return voicing => {
    if (_.isEmpty(previousChord.notes)) {
      return 0;
    }

    let notes = _.chain(voicing)
      .map(([string, fret]) => note(string, fret, tuning))
      .sort()
      .value();

    let { sum } = clipper(previousNotes, notes);

    return sum;
  };
};
