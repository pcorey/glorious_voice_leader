import _ from "lodash";
import getPixelRatio from "./getPixelRatio.js";

const drawChart = (
  canvas,
  context,
  tuning,
  width,
  fretHeight,
  fretWidth,
  chord,
  x,
  y
) => {
  let min =
    _.chain(chord.notes)
      .map(([string, fret]) => fret)
      .min()
      .value() || 0;

  let max =
    _.chain(chord.notes)
      .map(([string, fret]) => fret)
      .max()
      .value() || 0;

  let frets = Math.max(max - min + 2, 5);

  // let width = canvas.width;
  // let height = canvas.height;
  let height = (frets + 1) * fretHeight;

  // canvas.height = height;

  context.font =
    "28px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif";

  context.lineWidth = 2;
  context.lineCap = "square";
  context.strokeStyle = "#666";
  context.fillStyle = "#666";

  context.translate(x, y);

  let cx = Math.floor(width / 2);
  let cy = Math.floor(height / 2);

  let stringTop = Math.floor(cy - (fretHeight * (frets - 0.5)) / 2);
  let fretsLeft = Math.floor(cx - (fretWidth * (_.size(tuning) - 2)) / 2);

  // Draw frets:
  // for (let fret = 1; fret < Math.max(6, frets); fret++) {
  for (let fret = 1; fret < frets + 1; fret++) {
    context.beginPath();
    context.moveTo(fretsLeft, stringTop + fret * fretHeight);
    context.lineTo(
      fretsLeft + fretWidth * (_.size(tuning) - 1),
      stringTop + fret * fretHeight
    );
    context.stroke();
  }

  // Draw strings:
  context.beginPath();
  for (let string = 0; string < _.size(tuning); string++) {
    context.moveTo(fretsLeft + string * fretWidth, stringTop + fretHeight);
    context.lineTo(
      fretsLeft + string * fretWidth,
      stringTop + fretHeight * frets
    );
  }
  context.stroke();

  // Draw fret marker:
  context.fillStyle = "#666";
  context.strokeStyle = "#666";
  context.lineWidth = 2;

  let noteMap = _.chain(chord.notes)
    .reduce((map, v) => {
      map[v] = true;
      return map;
    }, {})
    .value();

  for (let fret = 0; fret < frets; fret++) {
    for (let string = 0; string < _.size(tuning); string++) {
      if (min === 0) {
        if (noteMap[[string, fret]]) {
          context.beginPath();
          context.arc(
            fretsLeft + string * fretWidth,
            Math.floor(stringTop + fret * fretHeight + fretHeight / 2),
            Math.floor(fretWidth / 1.5 - context.lineWidth),
            0,
            2 * Math.PI
          );
          if (fret === 0 && min === 0) {
            context.stroke();
          } else {
            context.fill();
          }
        }
      } else {
        if (noteMap[[string, fret + min - 1]]) {
          context.beginPath();
          context.arc(
            fretsLeft + string * fretWidth,
            Math.floor(stringTop + fret * fretHeight + fretHeight / 2),
            Math.floor(fretWidth / 1.5 - context.lineWidth),
            0,
            2 * Math.PI
          );
          if (fret === 0 && min === 0) {
            context.stroke();
          } else {
            context.fill();
          }
        }
      }
    }
  }

  // Draw chord name:
  context.font = `bold ${fretWidth}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "top";
  context.fillStyle = "#666";
  context.fillText(
    `${chord.root || ""}${_.get(chord, "quality.name", "...")}`,
    fretWidth + Math.floor((width - fretWidth) / 2),
    0
    // height
  );

  // Draw fret number:
  context.font = `bold ${fretWidth}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`;
  context.textAlign = "right";
  context.textBaseline = "middle";
  context.fillStyle = "#666";
  context.fillText(
    `${!min ? "" : min}`,
    fretWidth,
    stringTop + fretHeight * 1.5
  );

  context.translate(-x, -y);

  return height;
};

export default drawChart;
