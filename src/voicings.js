import "lodash.product";
import _ from "lodash";

const findNoteOnFretboard = (frets, strings, tuning, capo) => note => {
  const is_note = ([string, fret]) => {
    let note_to_test = tuning[string] + fret;
    return note_to_test === note || note_to_test % 12 === note;
  };

  return _.chain(
    _.product(
      _.range(strings),
      _.chain(frets - capo)
        .range()
        .map(fret => fret + capo)
        .value()
    )
  )
    .filter(is_note)
    .value();
};

const hasDoubledStrings = chord => {
  return (
    _.size(chord) !==
    _.chain(chord)
      .map(_.first)
      .uniq()
      .size()
      .value()
  );
};

const hasUnplayableStretch = (maxReach, allowOpen) => chord => {
  let filteredChord = _.reject(
    chord,
    ([string, fret]) => fret === 0 && allowOpen
  );
  let [_1, min] = _.minBy(filteredChord, ([string, fret]) => fret);
  let [_2, max] = _.maxBy(filteredChord, ([string, fret]) => fret);
  return max - min > maxReach;
};

export default (
  notes,
  tuning,
  allowOpen,
  frets = 18,
  maxReach = 5,
  capo = 0
) => {
  let strings = _.size(tuning);
  return _.chain(notes)
    .map(findNoteOnFretboard(frets, strings, tuning, capo))
    .thru(notesOnFretboard => _.product.apply(null, notesOnFretboard))
    .reject(hasDoubledStrings)
    .reject(hasUnplayableStretch(maxReach, allowOpen))
    .value();
};
