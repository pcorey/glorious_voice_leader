import "lodash.multicombinations";
import "lodash.product";
import _ from "lodash";

const findNoteOnFretboard = (
  frets,
  strings,
  tuning,
  minCapo,
  maxCapo
) => note => {
  const is_note = ([string, fret]) => {
    let note_to_test = tuning[string] + fret;
    return note_to_test === note || note_to_test % 12 === note;
  };

  return _.chain(_.product(_.range(strings), _.range(minCapo, maxCapo + 1)))
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
  // notesInChord,
  tuning,
  allowOpen,
  frets = 18,
  maxReach = 5,
  min = 0,
  max = frets,
  notesInVoicing
) => {
  if (_.isEmpty(notes)) {
    return [];
  }
  if (_.isUndefined(notesInVoicing)) {
    notesInVoicing = _.size(notes);
  }
  let strings = _.size(tuning);
  // let minCapo = allowOpen
  //   ? 0
  //   : _.chain(notesInChord)
  //       .maxBy(_.last)
  //       .thru(_.last)
  //       .defaultTo(0)
  //       .subtract(maxReach)
  //       .thru(fret => _.max([fret, min]))
  //       .value();
  // let maxCapo = _.chain(notesInChord)
  //   .minBy(_.last)
  //   .thru(_.last)
  //   .defaultTo(frets)
  //   .add(maxReach)
  //   .thru(fret => _.min([fret, max]))
  //   .value();

  // console.log(`Generating voicings between frets ${minCapo} and ${maxCapo}.`);

  let diff = notesInVoicing - _.size(notes);

  return _.chain(notes)
    .multicombinations(diff)
    .flatMap(extraNotes =>
      _.chain(notes)
        .concat(extraNotes)
        // .map(findNoteOnFretboard(frets, strings, tuning, minCapo, maxCapo))
        .map(findNoteOnFretboard(frets, strings, tuning, min, frets))
        .thru(notesOnFretboard => _.product.apply(null, notesOnFretboard))
        .reject(hasDoubledStrings)
        .reject(hasUnplayableStretch(maxReach, allowOpen, min))
        .value()
    )
    .value();
};
