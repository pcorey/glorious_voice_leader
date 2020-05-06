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

const hasUnplayableStretch = (maxReach, allowOpen, capo) => chord => {
  let filteredChord = _.reject(
    chord,
    ([string, fret]) => fret === capo && allowOpen
  );
  let [, min] = _.minBy(filteredChord, ([string, fret]) => fret);
  let [, max] = _.maxBy(filteredChord, ([string, fret]) => fret);
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
  if (_.isEmpty(notes)) {
    return [];
  }
  let strings = _.size(tuning);
  return _.chain(notes)
    .map(findNoteOnFretboard(frets, strings, tuning, capo))
    .thru(notesOnFretboard => _.product.apply(null, notesOnFretboard))
    .reject(hasDoubledStrings)
    .reject(hasUnplayableStretch(maxReach, allowOpen, capo))
    .value();
};
