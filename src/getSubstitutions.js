import "lodash.combinations";
import _ from "lodash";
import { qualities } from "./qualities";

export default (notes, quality, maxDifference = 0) => {
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
    .flatMap(({ root, notes }) => {
      return _.map(qualities)
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
        .isEqual(quality)
        .value();
    })
    .reject(({ quality }) => _.isUndefined(quality))
    .sortBy(({ quality }) => _.size(quality.degrees))
    .uniqWith(_.isEqual)
    .value();
};
