import "lodash.combinations";
import _ from "lodash";
import { qualities } from "./qualities";

export default (notes, sharps) => {
  let qualityMap = _.chain(qualities)
    .keyBy("quality")
    .mapValues(a => a.name)
    .value();
  const noteNames = sharps
    ? ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    : ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
  return _.chain(notes)
    .map(root => {
      return {
        root,
        notes: _.chain(notes)
          .map(note => (note + 12 - root) % 12)
          .sortBy(_.identity)
          .value()
      };
    })
    .tap(console.log)
    .map(({ root, notes }) => {
      if (qualityMap[notes]) {
        return noteNames[root] + qualityMap[notes];
      }
      return undefined;
    })
    .tap(console.log)
    .reject(_.isUndefined)
    .sortBy(_.size)
    .value();
};
