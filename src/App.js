import React from "react";
import "./App.css";
import voicings from "./voicings";
import heatmap from "./heatmap";
import semitoneDistance from "./semitoneDistance";
import polygonDistance from "./polygonDistance";
import _ from "lodash";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import { grahamScan2 } from "@thi.ng/geom-hull";
import { sutherlandHodgeman } from "@thi.ng/geom-clip";

function getPixelRatio(context) {
  var backingStore =
    context.backingStorePixelRatio ||
    context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio ||
    1;

  return (window.devicePixelRatio || 1) / backingStore;
}

const note = (string, fret) => {
  let tuning = [40, 45, 50, 55, 59, 64];
  return (tuning[5 - string] + fret) % 12;
};

const noteName = (string, fret) => {
  return ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][
    note(string, fret)
  ];
};

const Fretboard = ({ chord, previousChord, onClickFret = () => {} }) => {
  let ref = useRef();

  let notesInChord = _.chain(chord)
    .get("notes")
    .filter(([string, fret]) =>
      _.includes(chord.quality, note(5 - string, fret))
    )
    .value();

  const fretPosition = (string, fret) => {
    let canvas = ref.current;
    let context = canvas.getContext("2d");
    let ratio = getPixelRatio(context);
    let width = getComputedStyle(canvas)
      .getPropertyValue("width")
      .slice(0, -2);
    let height = width * 0.2;
    return {
      x: (fret + 1) * (width * ratio / 19),
      y: (string + 1) * (height * ratio / 7)
    };
  };

  let h = heatmap(
    _.chain(chord.voicings)
      .thru(
        voicings =>
          previousChord
            ? _.chain(voicings)
                // .sortBy(polygonDistance(previousChord, fretPosition))
                .thru(voicings => {
                  let semitoneDistancer = semitoneDistance(previousChord);
                  let polygonDistancer = polygonDistance(
                    previousChord,
                    fretPosition
                  );
                  console.log(_.groupBy(voicings, semitoneDistancer));
                  return voicings.sort((a, b) => {
                    let distanceA = semitoneDistancer(a);
                    let distanceB = semitoneDistancer(b);
                    if (distanceA == distanceB) {
                      return polygonDistancer(a) - polygonDistancer(b);
                    } else {
                      return distanceB - distanceA;
                    }
                  });
                })
                // .sortBy(semitoneDistance(previousChord))
                // .sortBy(polygonDistance(previousChord, fretPosition))
                .value()
            : voicings
      )
      .filter(voicing => {
        return _.every(notesInChord, note =>
          _.chain(voicing)
            .map(note => note.toString())
            .includes(note.toString())
            .value()
        );
      })
      .thru(voicings => (_.size(voicings) == 1 ? [] : voicings))
      .value(),
    !_.isEmpty(_.get(previousChord, "notes"))
  );

  const fretWidth = () => {
    let canvas = ref.current;
    let context = canvas.getContext("2d");
    let ratio = getPixelRatio(context);
    let width = getComputedStyle(canvas)
      .getPropertyValue("width")
      .slice(0, -2);
    return width * ratio / 19;
  };

  const fretHeight = () => {
    let canvas = ref.current;
    let context = canvas.getContext("2d");
    let ratio = getPixelRatio(context);
    let width = getComputedStyle(canvas)
      .getPropertyValue("width")
      .slice(0, -2);
    let height = width * 0.2;
    return height * ratio / 7;
  };

  useEffect(() => {
    let canvas = ref.current;
    let context = canvas.getContext("2d");
    let ratio = getPixelRatio(context);
    let width = getComputedStyle(canvas)
      .getPropertyValue("width")
      .slice(0, -2);
    let height = width * 0.2;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    context.lineWidth = 4;
    context.lineCap = "square";
    context.strokeStyle = "#eee";

    // Draw strings
    _.chain(6)
      .range()
      .map(string => {
        let { x: fromX, y: fromY } = fretPosition(string, 0);
        let { x: toX, y: toY } = fretPosition(string, 17);
        context.beginPath();
        context.moveTo(fromX, fromY);
        context.lineTo(toX, toY);
        context.stroke();
      })
      .value();

    // Draw frets
    _.chain(18)
      .range()
      .map(fret => {
        let { x: fromX, y: fromY } = fretPosition(0, fret);
        let { x: toX, y: toY } = fretPosition(5, fret);
        context.beginPath();
        context.moveTo(fromX, fromY);
        context.lineTo(toX, toY);
        context.stroke();
      })
      .value();

    // Draw quality
    context.fillStyle = "#ccc";
    context.textAlign = "left";
    context.textBaseline = "top";
    context.font = "bold 18px sans-serif";
    context.fillText(chord.name, fretWidth(), 0);

    // Draw heatmap
    _.chain(h)
      .map((value, key) => {
        let [string, fret] = JSON.parse(`[${key}]`);
        string = 5 - string;
        let { x, y } = fretPosition(string, fret);
        context.fillStyle = `rgba(0,100,255,${value})`;
        context.beginPath();
        context.rect(
          x - fretWidth() / 2,
          y - fretHeight() / 2,
          fretWidth(),
          fretHeight()
        );
        context.fill();
      })
      .value();

    const note = (string, fret) => {
      let tuning = [40, 45, 50, 55, 59, 64];
      let note = (tuning[5 - string] + fret) % 12;
      return ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][
        note
      ];
    };

    const drawSolid = (string, fret) => {
      let { x, y } = fretPosition(string, fret);
      let offset = fretHeight() / 2 * 0.75;
      context.fillStyle = "#333";
      context.beginPath();
      context.arc(x, y, offset, 0, 2 * Math.PI, true);
      context.fill();
      context.fillStyle = "#FFF";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = "bold 18px sans-serif";
      context.fillText(noteName(string, fret), x, y);
    };

    const drawHollow = (string, fret) => {
      let { x, y } = fretPosition(string, fret);
      context.strokeStyle = "#333";
      context.beginPath();
      context.arc(x, y, fretHeight() / 2 * 0.75, 0, 2 * Math.PI, true);
      context.stroke();
    };

    const drawX = (string, fret) => {
      let { x, y } = fretPosition(string, fret);
      let offset = fretHeight() / 2 * 0.5;
      context.strokeStyle = "#333";
      context.beginPath();
      context.moveTo(x - offset, y + offset);
      context.lineTo(x + offset, y - offset);
      context.stroke();
      context.beginPath();
      context.moveTo(x - offset, y - offset);
      context.lineTo(x + offset, y + offset);
      context.stroke();
    };

    const drawSquare = (string, fret) => {
      let { x, y } = fretPosition(string, fret);
      let offset = fretHeight() / 2 * 0.66;
      context.strokeStyle = "#333";
      context.beginPath();
      context.rect(x - offset, y - offset, offset * 2, offset * 2);
      context.stroke();
    };

    // // Draw convex hull
    // let sortedNotes = grahamScan2(
    //   _.chain(chord.notes)
    //     .map(([string, fret]) => {
    //       let { x, y } = fretPosition(5 - string, fret);
    //       return [x, y];
    //     })
    //     .value()
    // );
    // let [firstString, firstFret] = _.first(sortedNotes) || [0, 0];
    // context.fillStyle = "rgba(255,0,0,0.25)";
    // context.beginPath();
    // context.moveTo(firstString, firstFret);
    // _.map(sortedNotes, ([x, y]) => {
    //   context.lineTo(x, y);
    // });
    // context.fill();

    // // Draw previous convex hull
    // if (previousChord) {
    //   let sortedPreviousNotes = grahamScan2(
    //     _.chain(previousChord.notes)
    //       .map(([string, fret]) => {
    //         let { x, y } = fretPosition(5 - string, fret);
    //         return [x, y];
    //       })
    //       .value()
    //   );
    //   let [fx, fy] = _.first(sortedPreviousNotes) || [0, 0];
    //   context.fillStyle = "rgba(255,128,0,0.25)";
    //   context.beginPath();
    //   context.moveTo(fx, fy);
    //   _.map(sortedPreviousNotes, ([x, y]) => {
    //     context.lineTo(x, y);
    //   });
    //   context.fill();
    // }

    // // Draw intersection
    // if (previousChord) {
    //   let sortedNotes = grahamScan2(
    //     _.chain(chord.notes)
    //       .map(([string, fret]) => {
    //         let { x, y } = fretPosition(5 - string, fret);
    //         return [x, y];
    //       })
    //       .value()
    //   );
    //   let sortedPreviousNotes = grahamScan2(
    //     _.chain(previousChord.notes)
    //       .map(([string, fret]) => {
    //         let { x, y } = fretPosition(5 - string, fret);
    //         return [x, y];
    //       })
    //       .value()
    //   );
    //   if (!_.isEmpty(sortedNotes) && !_.isEmpty(sortedPreviousNotes)) {
    //     let points = sutherlandHodgeman(sortedNotes, sortedPreviousNotes);
    //     let [fx, fy] = _.first(points) || [0, 0];
    //     context.strokeStyle = "tomato";
    //     context.beginPath();
    //     context.moveTo(fx, fy);
    //     _.map(points, ([x, y]) => {
    //       context.lineTo(x, y);
    //     });
    //     context.lineTo(fx, fy);
    //     context.stroke();
    //   }
    // }

    // Draw notes
    _.chain(chord)
      .get("notes")
      .map(([string, fret]) => {
        string = 5 - string;
        switch (chord.labels[[5 - string, fret]]) {
          case 1:
            drawHollow(string, fret);
            break;
          case 2:
            drawSquare(string, fret);
            break;
          case 3:
            drawX(string, fret);
            break;
          default:
            drawSolid(string, fret);
            break;
        }
      })
      .value();
  });

  const onClick = e => {
    let canvas = ref.current;
    let context = canvas.getContext("2d");
    let ratio = getPixelRatio(context);
    let x = e.nativeEvent.offsetX * ratio;
    let y = e.nativeEvent.offsetY * ratio;
    let fret = Math.floor((x - fretWidth() / 2) / fretWidth());
    let string = 5 - Math.floor((y - fretHeight() / 2) / fretHeight());
    if (fret >= 0 && fret < 18 && string >= 0 && string < 6) {
      onClickFret({ string, fret });
    }
  };

  return (
    <div className="fretboard">
      <canvas ref={ref} onClick={onClick} />
    </div>
  );
};

const Fretboards = ({ chords: initialChords }) => {
  let [chords, setChords] = useState(initialChords);
  return _.map(chords, (chord, i) => {
    return (
      <Fretboard
        chord={chord}
        previousChord={i == 0 ? undefined : chords[i - 1]}
        onClickFret={({ string, fret }) => {
          chord = _.cloneDeep(chord);
          if (_.isUndefined(chord.labels[[string, fret]])) {
            chord.labels[[string, fret]] = -1;
            chord.notes.push([string, fret]);
          }
          chord.labels[[string, fret]]++;
          if (chord.labels[[string, fret]] > 3) {
            delete chord.labels[[string, fret]];
            _.remove(chord.notes, note => _.isEqual(note, [string, fret]));
          }
          chords[i] = chord;
          setChords(_.map(chords, _.identity));
        }}
      />
    );
  });
};

function App() {
  return (
    <div>
      <div
        style={{
          width: "fit-content",
          margin: "2em auto"
        }}
      >
        <Fretboards
          chords={[
            {
              name: "Cmaj7 (C E G B)",
              quality: [0, 4, 7, 11],
              voicings: voicings([0, 4, 7, 11]),
              notes: [],
              labels: {}
            },
            {
              name: "Fmaj7 (F A C E)",
              quality: [5, 9, 0, 4],
              voicings: voicings([5, 9, 0, 4]),
              notes: [],
              labels: {}
            }
          ]}
        />
      </div>
    </div>
  );
}

export default App;
