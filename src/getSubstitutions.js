import "lodash.combinations";
import _ from "lodash";
import clipNotes from "./clipNotes";
import semitoneDistance from "./semitoneDistance";
import { qualities } from "./qualities";
import { substitutions } from "./substitutions";

const getQuality = notes => {
  let pitches = _.chain(notes)
    .map(n => n % 12)
    .sortBy(_.identity)
    .value();
  return _.chain(12)
    .range()
    .flatMap(root => {
      return _.chain(qualities)
        .map(quality => {
          return {
            root,
            quality
          };
        })
        .value();
    })
    .filter(({ root, quality }) =>
      _.chain(quality)
        .get("quality")
        .map(a => (a + root) % 12)
        .sortBy(_.identity)
        .isEqual(pitches)
        .value()
    )
    .value();
};

export default (
  notes,
  tuning,
  selectedRoot,
  selectedQuality,
  allowPartialQualities,
  sharps,
  previousChord,
  nextChord
) => {
  let currentDistance = previousChord
    ? semitoneDistance(previousChord, tuning)(notes)
    : undefined;
  let playedNotes = notes;
  let previousNotes = _.chain(_.get(previousChord, "notes"))
    .map(([string, fret]) => tuning[string] + fret)
    .sort()
    .value();
  let currentNotes = _.chain(playedNotes)
    .map(([string, fret]) => tuning[string] + fret)
    .sort()
    .value();
  let playedNotesWeCareAbout = clipNotes(previousNotes, currentNotes);
  let deltas = _.chain(playedNotesWeCareAbout)
    .thru(({ previous, current }) => _.zip(previous, current))
    .map(([previous, current]) => {
      let delta = Math.min(5, Math.abs(previous - current) + 1);
      return _.range((previous < current ? -1 : 1) * delta);
    })
    .thru(deltas => _.product(...deltas))
    .value();
  let { current, previous } = playedNotesWeCareAbout;
  return _.chain(deltas)
    .map(deltas =>
      _.chain(current)
        .zip(deltas)
        .map(([a, b]) => a + b)
        .value()
    )
    .flatMap(current => {
      return _.map(getQuality(current), ({ root, quality }) => {
        return {
          root: (sharps
            ? ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
            : [
                "C",
                "Db",
                "D",
                "Eb",
                "E",
                "F",
                "Gb",
                "G",
                "Ab",
                "A",
                "Bb",
                "B"
              ])[root],
          quality,
          current,
          score:
            currentDistance -
            _.chain(current)
              .zip(previous)
              .map(([a, b]) => Math.abs(a - b))
              .sum()
              .value()
        };
      });
    })
    .reject(result => {
      return _.chain(result.quality)
        .pick("name")
        .isEqual(_.pick(selectedQuality, "name"))
        .value();
    })
    .map(sub => {
      return {
        ...sub,
        substitutions: _.chain(substitutions)
          .filter(substitution =>
            substitution.test(
              current,
              sub.current,
              sub.root,
              sub.quality,
              selectedRoot,
              selectedQuality,
              nextChord
            )
          )
          .map("id")
          .value()
      };
    })
    .reject(({ substitutions }) => _.isEmpty(substitutions))
    .reject(({ quality: { quality } }) => _.isUndefined(quality))
    .sortBy("score")
    .reverse()
    .uniqWith(_.isEqual)
    .value();
};
