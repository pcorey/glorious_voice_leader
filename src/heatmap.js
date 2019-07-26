import _ from "lodash";

const smoother = 1;

export default (voicings, incrementer) => {
  let heatmap = _.chain(voicings)
    .reduce((heatmap, voicing, i) => {
      _.forEach(voicing, ([string, fret]) => {
        if (!heatmap[[string, fret]]) {
          heatmap[[string, fret]] = 0;
        }
        // heatmap[[string, fret]] += incrementer({ string, fret, voicing, i });
        heatmap[[string, fret]] = _.max([
          heatmap[[string, fret]] || 0,
          incrementer({ string, fret, voicing, i })
        ]);
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
