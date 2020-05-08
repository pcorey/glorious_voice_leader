import "lodash.combinations";
import _ from "lodash";
import { qualities } from "./qualities";

export default (
  notes,
  quality,
  allowPartialQualities,
  sharps,
  maxDifference = 0
) => {
  return _.chain(notes)
    .map(note => {
      return {
        root:
          _.get(quality, `noteNames.${note}`) ||
          (sharps
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
              ])[note],
        notes: _.chain(notes)
          .map(n => (n + 12 - note) % 12)
          .sortBy(_.identity)
          .value()
      };
    })
    .flatMap(({ root, notes }) => {
      return _.map(qualities)
        .filter(quality => allowPartialQualities || _.isEmpty(quality.missing))
        .filter(({ quality, name, degrees }) => {
          return (
            _.union(_.difference(quality, notes), _.difference(notes, quality))
              .length === maxDifference
          );
        })
        .map(quality => {
          return {
            root,
            quality
          };
        });
    })
    .reject(result => {
      return _.chain(result.quality)
        .omit("value")
        .isEqual(_.omit(quality, "value"))
        .value();
    })
    .reject(({ quality }) => _.isUndefined(quality))
    .sortBy(({ quality }) => _.size(quality.degrees))
    .uniqWith(_.isEqual)
    .value();
};
