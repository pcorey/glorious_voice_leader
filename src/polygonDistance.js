import "lodash.product";
import _ from "lodash";
import { grahamScan2 } from "@thi.ng/geom-hull";
import { sutherlandHodgeman } from "@thi.ng/geom-clip";
import { polyArea2 } from "@thi.ng/geom-poly-utils";

const area = points => {};

export default (previousChord, fretPosition) => {
  let previousNotes = _.chain(previousChord.notes)
    // .filter(([string, fret]) => !previousChord.labels[[string, fret]])
    .map(([string, fret]) => {
      let { x, y } = fretPosition(5 - string, fret);
      return [x, y];
    })
    .thru(grahamScan2)
    .value();

  if (_.isEmpty(previousNotes)) {
    return () => 0;
  }

  return voicing => {
    if (_.isEmpty(previousChord.notes)) {
      return 0;
    }

    let notes = _.chain(voicing)
      .map(([string, fret]) => {
        let { x, y } = fretPosition(5 - string, fret);
        return [x, y];
      })
      .thru(grahamScan2)
      .value();

    // Centerpoint distance sorting:
    let previousNotesAverage = _.chain(previousNotes)
      .reduce(([tx, ty], [x, y]) => [tx + x, ty + y], [0, 0])
      .thru(([x, y]) => [x / _.size(previousNotes), y / _.size(previousNotes)])
      .value();

    let notesAverage = _.chain(notes)
      .reduce(([tx, ty], [x, y]) => [tx + x, ty + y], [0, 0])
      .thru(([x, y]) => [x / _.size(notes), y / _.size(notes)])
      .value();

    let distance = Math.sqrt(
      Math.pow(previousNotesAverage[0] - notesAverage[0], 2) +
        Math.pow(previousNotesAverage[1] - notesAverage[1], 2)
    );

    return distance;

    // // Overlap sorting:
    // let clippedPolygon = sutherlandHodgeman(notes, previousNotes);

    // let area = Math.abs(polyArea2(clippedPolygon)) / Math.abs(polyArea2(notes));
    // return 1 / Math.max(0.0000001, area);
  };
};
