import "lodash.product";
import _ from "lodash";

const find_note_on_fretboard = (frets, strings, tuning) => note => {
  const is_note = ([string, fret]) => {
    let note_to_test = tuning[string] + fret;
    return note_to_test === note || note_to_test % 12 === note;
  };

  return _.chain(_.product(_.range(strings), _.range(frets)))
    .filter(is_note)
    .value();
};

const has_doubled_strings = chord => {
  return (
    _.size(chord) !==
    _.chain(chord)
      .map(_.first)
      .uniq()
      .size()
      .value()
  );
};

const has_unplayable_stretch = max_reach => chord => {
  let [_1, min] = _.minBy(chord, ([string, fret]) => fret);
  let [_2, max] = _.maxBy(chord, ([string, fret]) => fret);
  return max - min > max_reach;
};

const flatten_chord = strings => chord =>
  _.reduce(
    chord,
    (chord, [string, fret]) => {
      chord[string] = fret;
      return chord;
    },
    _.chain(strings)
      .range()
      .map(() => undefined)
      .value()
  );

export default (
  notes,
  options = {
    frets: 18,
    max_reach: 5,
    strings: 6,
    tuning: [40, 45, 50, 55, 59, 64]
  }
) => {
  let { frets, max_reach, strings, tuning } = options;

  return (
    _.chain(notes)
      .map(find_note_on_fretboard(frets, strings, tuning))
      .thru(notes_on_fretboard => _.product.apply(null, notes_on_fretboard))
      .reject(has_doubled_strings)
      .reject(has_unplayable_stretch(max_reach))
      // .map(flatten_chord(strings))
      .value()
  );
};
