import _ from "lodash";

const smoother = 1;

export default (voicings, scale) => {
  let heatmap = _.chain(voicings)
    .reduce((heatmap, voicing, i) => {
      _.forEach(voicing, ([string, fret]) => {
        if (!heatmap[[string, fret]]) {
          heatmap[[string, fret]] = 0;
        }
        heatmap[[string, fret]] += 1 / ((scale ? i + 1 : 1) * smoother);
      });
      return heatmap;
    }, {})
    .value();

  let max =
    2 *
    _.chain(heatmap)
      .values()
      .max()
      .value();

  return _.chain(heatmap)
    .mapValues(heat => heat / max)
    .value();
};
