import _ from "lodash";

export default (voicings, reducer) => {
  let heatmap = _.chain(voicings)
    .reduce((heatmap, voicing, i) => {
      _.forEach(voicing, ([string, fret]) => {
        if (!heatmap[[string, fret]]) {
          heatmap[[string, fret]] = 0;
        }
        heatmap[[string, fret]] = reducer(heatmap[[string, fret]], {
          string,
          fret,
          voicing,
          i
        });
      });
      return heatmap;
    }, {})
    .value();

  // let max =
  //   2 *
  //   _.chain(heatmap)
  //     .values()
  //     .max()
  //     .value();

  // return _.chain(heatmap)
  //   .mapValues(heat => heat / max)
  //   .value();

  return heatmap;
};
