import "semantic-ui-css/semantic.min.css";
import React from "react";
import _ from "lodash";
import heatmap from "./heatmap";
import pako from "pako";
import polygonDistance from "./polygonDistance";
import semitoneDistance from "./semitoneDistance";
import voicings from "./voicings";
import { Button } from "semantic-ui-react";
import { Checkbox } from "semantic-ui-react";
import { Dropdown } from "semantic-ui-react";
import { Icon } from "semantic-ui-react";
import { Label } from "semantic-ui-react";
import { Radio } from "semantic-ui-react";
import { Select } from "semantic-ui-react";
import { Slider } from "react-semantic-ui-range";
import { grahamScan2 } from "@thi.ng/geom-hull";
import { sutherlandHodgeman } from "@thi.ng/geom-clip";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";

const tunings = _.chain([
  {
    text: "Standard - EADGBE",
    value: JSON.stringify([40, 45, 50, 55, 59, 64])
  },
  { text: "Drop D - DADGBE", value: JSON.stringify([38, 45, 50, 55, 59, 64]) },
  { text: "DADGAD", value: JSON.stringify([38, 45, 50, 55, 60, 62]) },
  { text: "Ukulele (High G) - GBCD", value: JSON.stringify([67, 60, 64, 69]) },
  { text: "Ukulele (Low G) - GBCD", value: JSON.stringify([55, 60, 64, 69]) }
])
  .sortBy("text")
  .map(option => ({ key: JSON.stringify(option), ...option }))
  .value();

const qualities = _.chain([
  { text: "7", value: JSON.stringify([0, 4, 7, 10]) },
  // { text: "7b9 no 5", value: JSON.stringify([0, 4, 7, 10, 1]) },
  // { text: "7b9", value: JSON.stringify([0, 4, 7, 10, 1]) },
  // { text: "9 no 5", value: JSON.stringify([0, 4, 10, 2]) },
  // { text: "9", value: JSON.stringify([0, 4, 7, 10, 2]) },
  { text: "m7", value: JSON.stringify([0, 3, 7, 10]) },
  { text: "mM7", value: JSON.stringify([0, 3, 7, 11]) },
  { text: "m7b5", value: JSON.stringify([0, 3, 6, 10]) },
  // { text: "m7b9 no 5", value: JSON.stringify([0, 3, 10, 1]) },
  // { text: "m7b9", value: JSON.stringify([0, 3, 7, 10, 1]) },
  // { text: "m9 no 5", value: JSON.stringify([0, 3, 10, 2]) },
  // { text: "m9", value: JSON.stringify([0, 3, 7, 10, 2]) },
  { text: "maj7", value: JSON.stringify([0, 4, 7, 11]) },
  { text: "6", value: JSON.stringify([0, 4, 7, 9]) },
  // { text: "maj9 no 5", value: JSON.stringify([0, 4, 11, 2]) },
  // { text: "maj9", value: JSON.stringify([0, 4, 7, 11, 2]) },
  { text: "major", value: JSON.stringify([0, 4, 7]) },
  { text: "minor", value: JSON.stringify([0, 3, 7]) },
  { text: "dim", value: JSON.stringify([0, 3, 6]) },
  { text: "aug", value: JSON.stringify([0, 5, 7]) },
  { text: "sus2", value: JSON.stringify([0, 2, 7]) },
  { text: "sus4", value: JSON.stringify([0, 5, 7]) },
  { text: "add9", value: JSON.stringify([0, 4, 7, 2]) }
])
  .sortBy("text")
  .map(option => ({ key: JSON.stringify(option), ...option }))
  .value();

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

const note = (string, fret, tuning) => {
  return (tuning[_.size(tuning) - 1 - string] + fret) % 12;
};

const noteName = (string, fret, sharps, tuning) => {
  return (sharps
    ? ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    : ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"])[
    note(string, fret, tuning)
  ];
};

const Fretboard = React.memo(
  ({
    chord,
    onChangeQualities = () => {},
    onChangeRoot = () => {},
    onClickFret = () => {},
    onClickAdd = () => {},
    onClickRemove = () => {},
    previousChord,
    allowOpen,
    sharps,
    tuning,
    frets,
    maxReach,
    capo
  }) => {
    let ref = useRef();
    let strings = _.size(tuning);

    let notesInChord = _.chain(chord)
      .get("notes")
      .filter(([string, fret]) => {
        return _.chain(chord.qualities)
          .map(quality => _.map(quality, base => (base + chord.root) % 12))
          .flatten()
          .includes(note(_.size(tuning) - 1 - string, fret, tuning))
          .value();
      })
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
        x: (fret + 1) * ((width * ratio) / (frets + 1)),
        y: (string + 1) * ((height * ratio) / (strings + 1))
      };
    };

    let relevantVoicings = _.filter(chord.voicings, voicing => {
      return _.every(notesInChord, note =>
        _.chain(voicing)
          .map(note => note.toString())
          .includes(note.toString())
          .value()
      );
    });

    const f = x => (x * 2) / (x * 2 + 1);

    let h = _.chain(chord.voicings)
      .thru(voicings =>
        heatmap(voicings, (previous, { i, voicing }) => {
          let hasPreviousChord = !_.isEmpty(_.get(previousChord, "notes"));
          if (hasPreviousChord) {
            let distance = semitoneDistance(previousChord)(voicing) || 0.1;
            return _.max([previous || 0, 1 / distance]);
          } else {
            return (previous || 0) + 1;
          }
        })
      )
      .mapValues((value, key) => {
        let [string, fret] = JSON.parse(`[${key}]`);
        let inVoicing = _.chain(relevantVoicings)
          .some(voicing =>
            _.chain(voicing)
              .map(voicing => voicing.toString())
              .includes([string, fret].toString())
              .value()
          )
          .value();
        return inVoicing
          ? _.size(relevantVoicings) > 1 ||
            _.size(notesInChord) <
              _.chain(relevantVoicings)
                .first()
                .size()
            ? value
            : 0
          : 0;
      })
      .value();

    const fretWidth = () => {
      let canvas = ref.current;
      let context = canvas.getContext("2d");
      let ratio = getPixelRatio(context);
      let width = getComputedStyle(canvas)
        .getPropertyValue("width")
        .slice(0, -2);
      return (width * ratio) / (frets + 1);
    };

    const fretHeight = () => {
      let canvas = ref.current;
      let context = canvas.getContext("2d");
      let ratio = getPixelRatio(context);
      let width = getComputedStyle(canvas)
        .getPropertyValue("width")
        .slice(0, -2);
      let height = width * 0.2;
      return (height * ratio) / (strings + 1);
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
      _.chain(_.size(tuning))
        .range()
        .map(string => {
          let { x: fromX, y: fromY } = fretPosition(string, 0);
          let { x: toX, y: toY } = fretPosition(string, frets - 1);
          context.beginPath();
          context.moveTo(fromX, fromY);
          context.lineTo(toX, toY);
          context.stroke();
        })
        .value();

      // Draw frets
      _.chain(frets)
        .range()
        .map(fret => {
          let { x: fromX, y: fromY } = fretPosition(0, fret);
          let { x: toX, y: toY } = fretPosition(_.size(tuning) - 1, fret);
          context.beginPath();
          context.moveTo(fromX, fromY);
          context.lineTo(toX, toY);
          context.stroke();
        })
        .value();

      // Draw fret markers
      context.fillStyle = "#eee";
      _.chain([3, 5, 7, 9, 12, 15])
        .map(fret => {
          let double = fret === 12;
          let { x, y } = fretPosition(
            Math.floor((_.size(tuning) - 1) / 2),
            fret - 1
          );
          context.beginPath();
          if (!double) {
            context.arc(
              x + fretWidth() / 2,
              y + fretHeight() / 2,
              8,
              0,
              2 * Math.PI,
              true
            );
          } else {
            context.arc(
              x + fretWidth() / 2,
              y + fretHeight() / 2 - 10,
              8,
              0,
              2 * Math.PI,
              true
            );
            context.arc(
              x + fretWidth() / 2,
              y + fretHeight() / 2 + 10,
              8,
              0,
              2 * Math.PI,
              true
            );
          }
          context.fill();
        })
        .value();

      // Draw capo
      let { x: fromX, y: fromY } = fretPosition(-1, 0);
      let { x: toX, y: toY } = fretPosition(strings, capo - 1);
      context.fillStyle = "rgba(255,255,255,0.75)";
      context.beginPath();
      context.rect(fromX - 2, fromY, toX - 2, toY);
      context.fill();

      // // Draw quality
      // context.fillStyle = "#ccc";
      // context.textAlign = "left";
      // context.textBaseline = "top";
      // context.font = "bold 18px sans-serif";
      // context.fillText(chord.name, fretWidth(), 0);

      // // Draw chord tones
      // _.chain(chord.voicings)
      //   .flatten()
      //   .uniq()
      //   .map(([string, fret]) => {
      //     let { x, y } = fretPosition((_.size(tuning) - 1) - string, fret);
      //     let offset = fretHeight() / 2 * 0.75;
      //     context.fillStyle = "rgba(255,255,255,1)";
      //     context.beginPath();
      //     context.arc(x, y, offset, 0, 2 * Math.PI, true);
      //     context.fill();
      //     context.strokeStyle = "#fff";
      //     context.fillStyle = "#ccc";
      //     context.textAlign = "center";
      //     context.textBaseline = "middle";
      //     context.font = "bold 18px sans-serif";
      //     context.strokeText(noteName((_.size(tuning) - 1) - string, fret, sharps, tuning), x, y);
      //     context.fillText(noteName((_.size(tuning) - 1) - string, fret, sharps, tuning), x, y);
      //   })
      //   .value();

      // Draw heatmap
      _.chain(h)
        .map((value, key) => {
          let [string, fret] = JSON.parse(`[${key}]`);
          string = _.size(tuning) - 1 - string;
          let { x, y } = fretPosition(string, fret);
          // context.fillStyle = `rgba(255,170,0,${value})`;
          // context.fillStyle = `rgba(80,0,255,${value})`;
          context.fillStyle = `rgba(0,0,255,${value})`;
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

      const drawSolid = (string, fret) => {
        let { x, y } = fretPosition(string, fret);
        let offset = (fretHeight() / 2) * 0.75;
        context.fillStyle = "#333";
        context.beginPath();
        context.arc(x, y, offset, 0, 2 * Math.PI, true);
        context.fill();
        context.fillStyle = "#FFF";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "bold 18px sans-serif";
        context.fillText(noteName(string, fret, sharps, tuning), x, y);
      };

      const drawHollow = (string, fret) => {
        let { x, y } = fretPosition(string, fret);
        context.strokeStyle = "#333";
        context.beginPath();
        context.arc(x, y, (fretHeight() / 2) * 0.75, 0, 2 * Math.PI, true);
        context.stroke();
      };

      const drawTriangle = (string, fret) => {
        let { x, y } = fretPosition(string, fret);
        let offset = (fretHeight() / 2) * 0.5 * 1.41;
        let lift = 0;
        context.strokeStyle = "#333";
        context.beginPath();
        context.moveTo(x, y - offset + lift);
        context.lineTo(x + offset, y + offset + lift);
        context.moveTo(x, y - offset + lift);
        context.lineTo(x - offset, y + offset + lift);
        context.moveTo(x - offset, y + offset + lift);
        context.lineTo(x + offset, y + offset + lift);
        context.stroke();
      };

      const drawX = (string, fret) => {
        let { x, y } = fretPosition(string, fret);
        let offset = (fretHeight() / 2) * 0.5;
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
        let offset = (fretHeight() / 2) * 0.66;
        context.strokeStyle = "#333";
        context.beginPath();
        context.rect(x - offset, y - offset, offset * 2, offset * 2);
        context.stroke();
      };

      // Draw notes
      _.chain(chord)
        .get("notes")
        .map(([string, fret]) => {
          string = _.size(tuning) - 1 - string;
          switch (chord.labels[[_.size(tuning) - 1 - string, fret]]) {
            case 1:
              drawHollow(string, fret);
              break;
            case 2:
              drawX(string, fret);
              break;
            case 3:
              drawSquare(string, fret);
              break;
            case 4:
              drawTriangle(string, fret);
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
      let string =
        _.size(tuning) - 1 - Math.floor((y - fretHeight() / 2) / fretHeight());
      if (fret >= 0 && fret < frets && string >= 0 && string < _.size(tuning)) {
        onClickFret({ string, fret }, e);
      }
    };

    const keys = sharps
      ? [
          { text: "C", value: 0, key: "root-0" },
          { text: "C#", value: 1, key: "root-1" },
          { text: "D", value: 2, key: "root-2" },
          { text: "D#", value: 3, key: "root-3" },
          { text: "E", value: 4, key: "root-4" },
          { text: "F", value: 5, key: "root-5" },
          { text: "F#", value: 6, key: "root-6" },
          { text: "G", value: 7, key: "root-7" },
          { text: "G#", value: 8, key: "root-8" },
          { text: "A", value: 9, key: "root-9" },
          { text: "A#", value: 10, key: "root-10" },
          { text: "B", value: 11, key: "root-11" }
        ]
      : [
          { text: "C", value: 0, key: "root-0" },
          { text: "Db", value: 1, key: "root-1" },
          { text: "D", value: 2, key: "root-2" },
          { text: "Eb", value: 3, key: "root-3" },
          { text: "E", value: 4, key: "root-4" },
          { text: "F", value: 5, key: "root-5" },
          { text: "Gb", value: 6, key: "root-6" },
          { text: "G", value: 7, key: "root-7" },
          { text: "Ab", value: 8, key: "root-8" },
          { text: "A", value: 9, key: "root-9" },
          { text: "Bb", value: 10, key: "root-10" },
          { text: "B", value: 11, key: "root-11" }
        ];

    return (
      <div className="fretboard">
        <div style={{ margin: "1em 2em" }}>
          <Dropdown
            search
            placeholder="Root"
            selection
            options={keys}
            defaultValue={chord.root}
            onChange={onChangeRoot}
          />
          <Dropdown
            search
            placeholder="Qualities"
            multiple
            selection
            options={qualities}
            defaultValue={_.map(chord.qualities, quality =>
              JSON.stringify(quality)
            )}
            onChange={onChangeQualities}
          />
          <Button
            icon
            style={{
              float: "right",
              fontSize: "14px",
              backgroundColor: "#f8f8f8"
            }}
            onClick={onClickAdd}
          >
            <Icon name="add circle" />
          </Button>
          <Button
            icon
            style={{
              float: "right",
              fontSize: "14px",
              backgroundColor: "#f8f8f8"
            }}
            onClick={onClickRemove}
          >
            <Icon name="trash" />
          </Button>
        </div>
        <canvas ref={ref} onClick={onClick} />
      </div>
    );
  },
  _.isEqual
);

const Fretboards = React.memo(
  ({
    chords,
    setAndCacheChords,
    allowOpen,
    sharps,
    tuning,
    frets,
    maxReach,
    capo
  }) => {
    return (
      <div>
        {_.map(chords, (chord, i) => {
          return (
            <div key={chord.key} style={{ margin: "4em 0" }}>
              <Fretboard
                allowOpen={allowOpen}
                tuning={tuning}
                sharps={sharps}
                chord={chord}
                frets={frets}
                maxReach={maxReach}
                capo={capo}
                previousChord={i == 0 ? undefined : chords[i - 1]}
                onClickFret={({ string, fret }, e) => {
                  chord = _.cloneDeep(chord);
                  if (e.shiftKey) {
                    delete chord.labels[[string, fret]];
                    _.remove(chord.notes, note =>
                      _.isEqual(note, [string, fret])
                    );
                  } else {
                    if (_.isUndefined(chord.labels[[string, fret]])) {
                      chord.labels[[string, fret]] = -1;
                      chord.notes.push([string, fret]);
                    }
                    chord.labels[[string, fret]]++;
                    if (chord.labels[[string, fret]] > 4) {
                      delete chord.labels[[string, fret]];
                      _.remove(chord.notes, note =>
                        _.isEqual(note, [string, fret])
                      );
                    }
                  }
                  chords[i] = chord;
                  setAndCacheChords(_.map(chords, _.identity));
                }}
                onChangeRoot={(event, { value: root }) => {
                  chord = _.cloneDeep(chord);
                  chord.root = root;
                  chord.notes = [];
                  chord.labels = {};
                  chord.voicings = _.chain(chord.qualities)
                    .map(quality =>
                      _.map(quality, base => (base + chord.root) % 12)
                    )
                    .map(quality =>
                      voicings(
                        quality,
                        tuning,
                        allowOpen,
                        frets,
                        maxReach,
                        capo
                      )
                    )
                    .flatten()
                    .uniqWith(_.isEqual)
                    .value();
                  chords[i] = chord;
                  setAndCacheChords(_.map(chords, _.identity));
                }}
                onChangeQualities={(event, { value: qualities }) => {
                  chord = _.cloneDeep(chord);
                  chord.qualities = _.map(qualities, JSON.parse);
                  chord.notes = [];
                  chord.labels = {};
                  chord.voicings = _.chain(chord.qualities)
                    .map(quality =>
                      _.map(quality, base => (base + chord.root) % 12)
                    )
                    .map(quality =>
                      voicings(
                        quality,
                        tuning,
                        allowOpen,
                        frets,
                        maxReach,
                        capo
                      )
                    )
                    .flatten()
                    .uniqWith(_.isEqual)
                    .value();
                  chords[i] = chord;
                  setAndCacheChords(_.map(chords, _.identity));
                }}
                onClickAdd={() => {
                  setAndCacheChords(
                    _.flatten([
                      _.take(chords, i + 1),
                      {
                        key: Math.random(),
                        qualities: [],
                        notes: [],
                        labels: {},
                        voicings: []
                      },
                      _.drop(chords, i + 1)
                    ])
                  );
                }}
                onClickRemove={() => {
                  if (_.size(chords) > 1) {
                    _.pullAt(chords, i);
                    setAndCacheChords(_.map(chords, _.identity));
                  }
                }}
              />
            </div>
          );
        })}
      </div>
    );
  },
  _.isEqual
);

const parse = hash => {
  let initial = {
    sharps: false,
    allowOpen: false,
    tuning: [40, 45, 50, 55, 59, 64],
    frets: 18,
    maxReach: 5,
    capo: 0,
    chords: [
      {
        key: Math.random(),
        root: undefined,
        qualities: [],
        voicings: [],
        notes: [],
        labels: {}
      }
    ]
  };
  try {
    let parsed = !_.isEmpty(hash)
      ? JSON.parse(pako.inflate(atob(hash), { to: "string" }))
      : initial;
    if (_.isArray(parsed)) {
      return _.extend(initial, { chords: parsed });
    }
    return parsed;
  } catch (error) {
    console.error("Error parsing hash.", error);
    return initial;
  }
};

function App() {
  let urlParams = new URLSearchParams(window.location.search);
  let hash = window.location.hash.slice(1);
  let {
    allowOpen: initialAllowOpen,
    sharps: initialSharps,
    tuning: initialTuning,
    chords: initialChords,
    frets: initialFrets,
    maxReach: initialMaxReach,
    capo: initialCapo
  } = parse(hash);

  let [allowOpen, setAllowOpen] = useState(initialAllowOpen);
  let [sharps, setSharps] = useState(initialSharps);
  let [tuning, setTuning] = useState(initialTuning);
  let [chords, setChords] = useState(initialChords);
  let [settings, setSettings] = useState(false);
  let [frets, setFrets] = useState(initialFrets);
  let [maxReach, setMaxReach] = useState(initialMaxReach);
  let [capo, setCapo] = useState(initialCapo);

  _.map(chords, chord => {
    chord.voicings = _.chain(chord.qualities)
      .map(quality => _.map(quality, base => (base + chord.root) % 12))
      .map(quality =>
        voicings(quality, tuning, allowOpen, frets, maxReach, capo)
      )
      .flatten()
      .uniqWith(_.isEqual)
      .value();
  });

  const cache = data => {
    data = _.cloneDeep(data);
    _.chain(data.chords)
      .map(chord => _.omit(chord, ["voicings"]))
      .value();
    let state = _.chain(data)
      .thru(JSON.stringify)
      .thru(data => pako.deflate(data, { to: "string" }))
      .thru(btoa)
      .value();
    window.history.pushState(null, null, `#${state}`);
  };

  const setAndCacheChords = chords => {
    setChords(chords);
    cache({ allowOpen, sharps, tuning, chords, frets, maxReach, capo });
  };

  const onChangeTuning = (event, { value: tuning }) => {
    let chords = [
      {
        key: Math.random(),
        root: undefined,
        qualities: [],
        voicings: [],
        notes: [],
        labels: {}
      }
    ];
    setTuning(JSON.parse(tuning));
    setChords(chords);
    cache({ allowOpen, sharps, tuning, chords, frets, maxReach, capo });
  };

  const onChangeSharps = sharps => {
    setSharps(sharps);
    cache({ allowOpen, sharps, tuning, chords, frets, maxReach, capo });
  };

  const onChangeAllowOpen = allowOpen => {
    setAllowOpen(allowOpen);
    cache({ allowOpen, sharps, tuning, chords, frets, maxReach, capo });
  };

  const onChangeFrets = frets => {
    setFrets(frets);
    cache({ allowOpen, sharps, tuning, chords, frets, maxReach, capo });
  };

  const onChangeMaxReach = maxReach => {
    setMaxReach(maxReach);
    cache({ allowOpen, sharps, tuning, chords, frets, maxReach, capo });
  };

  const onChangeCapo = capo => {
    setCapo(capo);
    cache({ allowOpen, sharps, tuning, chords, frets, maxReach, capo });
  };

  return (
    <div>
      <div
        style={{
          width: "1000px",
          margin: "2em auto"
        }}
      >
        <div
          style={{
            margin: "0 2em 0 2em",
            display: "flex",
            alignItems: "flex-end"
          }}
        >
          <p
            style={{
              flex: "1",
              fontSize: "2em",
              textTransform: "uppercase",
              margin: "0"
            }}
          >
            <strong style={{ fontWeight: "100" }}>
              {urlParams.has("title")
                ? urlParams.get("title")
                : "Glorious Voice Leader"}
            </strong>
          </p>

          <div style={{}}>
            <Select
              placeholder="Tuning"
              options={tunings}
              defaultValue={JSON.stringify(tuning)}
              onChange={onChangeTuning}
            />
            <Button.Group>
              <Button
                style={{
                  backgroundColor: sharps
                    ? "rgb(248, 248, 248)"
                    : "rgb(208, 224, 241)"
                }}
                onClick={() => onChangeSharps(false)}
              >
                ♭
              </Button>
              <Button
                style={{
                  backgroundColor: sharps
                    ? "rgb(208, 224, 241)"
                    : "rgb(248, 248, 248)"
                }}
                onClick={() => onChangeSharps(true)}
              >
                ♯
              </Button>
            </Button.Group>
            <Button
              icon
              style={{
                marginLeft: "1rem",
                backgroundColor: !settings
                  ? "rgb(248, 248, 248)"
                  : "rgb(208, 224, 241)"
              }}
              onClick={() => setSettings(!settings)}
            >
              <Icon name="cog" />
            </Button>
          </div>
        </div>

        {settings && (
          <div
            style={{
              margin: "2rem",
              padding: "2rem",
              backgroundColor: "rgb(208, 224, 241, 0.5)"
            }}
          >
            <h2
              style={{
                fontSize: "1.6rem",
                fontWeight: "100",
                textTransform: "uppercase",
                margin: "0 0 2rem 0"
              }}
            >
              Settings:
            </h2>
            <Button.Group>
              <Button
                style={{
                  backgroundColor: !allowOpen
                    ? "rgb(208, 224, 241)"
                    : "rgb(248, 248, 248)"
                }}
                onClick={() => onChangeAllowOpen(false)}
              >
                Don't allow open strings in higher voicings
              </Button>
              <Button
                style={{
                  backgroundColor: !allowOpen
                    ? "rgb(248, 248, 248)"
                    : "rgb(208, 224, 241)"
                }}
                onClick={() => onChangeAllowOpen(true)}
              >
                Allow open strings in higher voicings
              </Button>
            </Button.Group>

            <h3>Frets: {frets}</h3>
            <Slider
              color="#888"
              discrete
              value={frets}
              settings={{ min: 12, max: 24, step: 1, onChange: onChangeFrets }}
            />

            <h3>Max Reach: {maxReach}</h3>
            <Slider
              color="#888"
              discrete
              value={maxReach}
              onChange={onChangeMaxReach}
              settings={{
                min: 0,
                max: 24,
                step: 1,
                onChange: onChangeMaxReach
              }}
            />

            <h3>Capo: {capo}</h3>
            <Slider
              color="#888"
              discrete
              value={capo}
              settings={{ min: 0, max: 24, step: 1, onChange: onChangeCapo }}
            />
          </div>
        )}

        <Fretboards
          allowOpen={allowOpen}
          chords={chords}
          sharps={sharps}
          tuning={tuning}
          setAndCacheChords={setAndCacheChords}
          frets={frets}
          maxReach={maxReach}
          capo={capo}
        />
        <div style={{ margin: "-2em 2em 0" }}>
          <p style={{}}>
            <strong>What is this thing?</strong> - Glorious Voice Leader helps
            you find guitar chord voicings that voice lead smoothly from one
            chord to the next.
          </p>
          <p style={{}}>
            <strong>Huh?</strong> - Start by picking a root note (like C) and
            quality (like maj7) for your first chord. Click on the fretboard to
            pick the four notes you'd like to start with. Next, add another
            chord. This time make it an Fmaj7. Glorious Voice Leader will darken
            the frets that are used by voicings with the best voice leading from
            the previous Cmaj7. Rinse and repeat! But don't actually rinse.
            Rinsing is bad for computers.{" "}
            <a href="http://www.petecorey.com/blog/2019/09/30/all-hail-glorious-voice-leader/">
              Check out this post
            </a>{" "}
            for a more in-depth rundown and an example progression!
          </p>
          <p style={{}}>
            <strong>What are all these squares and triangles?</strong> - You can
            mark frets with symbols other than solid circles to indicate that
            they should be played after the initial chord hit. This is helpful
            for laying out melodies around your chords. These markers are
            inspired by{" "}
            <a href="http://www.tedgreene.com/images/lessons/students/PaulVachon/HowToReadTedGreeneChordDiagrams.pdf">
              Ted Greene style chord charts
            </a>
            . Keep clicking, or shift click on the fret and they'll go away.
          </p>
          <p style={{}}>
            <strong>I don't like your recommendations!</strong> - I'm sorry you
            don't share my robot aesthetic. If you'd like a qualified human's
            opinions on chords and chord progressions, I highly recommend you
            pick up Ted Greene's{" "}
            <a href="https://amzn.to/2YQ8xYM">Chord Chemistry</a> and{" "}
            <a href="https://amzn.to/2YWgKur">Modern Chord Progressions</a>.
          </p>
          <p>
            <em>
              Made by <a href="https://twitter.com/petecorey">@petecorey</a>!
            </em>
          </p>
          {/*<p style={{}}>
            <strong>I still don't get it.</strong> - Check out a few tunes for
            some examples of how Glorious Voice Leader works and how you can use
            it to explore your fretboard.
            <ul>
              <li>
                <a href="#">Fly Me to the Moon</a>
              </li>
              <li>
                <a href="#">Autumn Leaves</a>
              </li>
              <li>
                <a href="#">Circle of Fourths in Diatonic 7th Chords</a>
              </li>
            </ul>
          </p>*/}
        </div>
      </div>
    </div>
  );
}

export default App;
