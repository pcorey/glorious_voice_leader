import "semantic-ui-css/semantic.min.css";
import React from "react";
import _ from "lodash";
import getHeatmap from "./heatmap";
import getPixelRatio from "./getPixelRatio";
import semitoneDistance from "./semitoneDistance";
import styled from "styled-components";
import { degreeToPitch } from "./qualities";
import { roots } from "./roots";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import { get as voicingsInCache } from "./voicingsCache";
import { get as substitutionsInCache } from "./substitutionsCache";

const fretSizeRatio = 1.5;
const lineWidth = 3;

const Canvas = styled.canvas`
  width: 100%;
  height: 100%;
  cursor: pointer;
`;

const Fretboard = ({
  horizontal = false,
  frets,
  setFretHeight,
  setFretWidth,
  onClickFret,
  tuning,
  chord,
  previousChord,
  allowOpen,
  sharps,
  maxReach,
  capo,
  getVoicings
}) => {
  let ref = useRef();

  let [loading, setLoading] = useState(false);
  let [voicings, setVoicings] = useState(undefined);

  useEffect(() => {
    const fetch = async () => {
      if (
        !voicingsInCache(
          JSON.stringify({
            quality: chord.quality,
            root: chord.root,
            tuning,
            allowOpen,
            frets,
            maxReach,
            capo
          })
        )
      ) {
        setLoading(true);
      }
      let voicings = await getVoicings({
        chord,
        tuning,
        allowOpen,
        frets,
        maxReach,
        capo
      });
      setVoicings(voicings);
      setLoading(false);
    };
    fetch();
  }, [capo, chord, tuning, allowOpen, frets, maxReach, getVoicings]);

  let notesInQualities = _.chain(chord.quality)
    .get("quality")
    .uniq()
    .map(note => (note + roots[chord.root]) % 12)
    .value();

  const note = (string, fret, tuning) => {
    return (tuning[string] + fret) % 12;
  };

  const getNoteNames = (root, quality) => {
    let notes =
      (root && root.includes("#")) || sharps
        ? ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
        : ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

    let letterIndex = _.findIndex(
      ["C", "D", "E", "F", "G", "A", "B"],
      letter => root && letter === root.substr(0, 1)
    );
    let letters = _.chain(["C", "D", "E", "F", "G", "A", "B"])
      .drop(letterIndex)
      .concat(_.take(["C", "D", "E", "F", "G", "A", "B"], letterIndex))
      .value();
    let scale = _.chain([0, 2, 4, 5, 7, 9, 11])
      .map(note => (note + roots[root]) % 12)
      .map((note, i) => {
        let letter = letters[i];
        let target = notes[note];
        let diff = Math.min(
          Math.abs(roots[target] - roots[letter]),
          Math.abs(roots[target] - roots[letter] + 12)
        );
        return (
          letter +
          _.chain(diff)
            .range()
            .map(_ => {
              if (
                diff === Math.abs(roots[target] - roots[letter]) &&
                roots[target] < roots[letter]
              ) {
                return "b";
              } else {
                return "#";
              }
            })
            .join("")
            .value()
        );
      })
      .value();

    _.chain(quality)
      .get("degrees")
      .map(degree => {
        let offset = parseInt(_.replace(degree, /#|b/, "")) - 1;
        let accidental = _.replace(degree, /[^#b]+/, "");
        let letter = scale[offset % _.size(scale)];
        notes[(degreeToPitch(degree) + roots[root]) % 12] = _.replace(
          `${letter}${accidental}`,
          /#b|b#/,
          ""
        );
        return degree;
      })
      .value();
    return notes;
  };

  let noteNames = getNoteNames(chord.root, chord.quality);

  const noteName = (string, fret, sharps, tuning, quality) => {
    if (!quality) {
      return (sharps
        ? ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
        : ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"])[
        (tuning[string] + fret) % 12
      ];
    }
    let index = (tuning[string] + fret) % 12;
    return noteNames[index]
      ? noteNames[index]
      : noteNames[(index + 1) % 12]
      ? (noteNames[(index + 1) % 12] + "b").replace(/#b|b#/g, "")
      : (noteNames[(index - 1 + 12) % 12] + "#").replace(/#b|b#/g, "");
  };

  const getWidth = canvas =>
    window
      .getComputedStyle(canvas)
      .getPropertyValue("width")
      .slice(0, -2);

  const getHeight = canvas =>
    window
      .getComputedStyle(canvas)
      .getPropertyValue("height")
      .slice(0, -2);

  const getFretHeight = (height, ratio) => (height * ratio - lineWidth) / frets;

  const getFretWidth = fretHeight => fretHeight / fretSizeRatio;

  const getCenter = (width, height, ratio) => [
    (width * ratio) / 2,
    (height * ratio) / 2
  ];

  const getTopLeft = (cx, cy, fretHeight, fretWidth) =>
    horizontal
      ? [
          cy - (fretWidth * _.size(tuning)) / 2,
          cx - (fretHeight * frets) / 2 + fretWidth / 2
        ]
      : [
          cy - (fretHeight * frets) / 2,
          cx - (fretWidth * (_.size(tuning) - 1)) / 2
        ];

  let notesInChord = _.chain(chord)
    .get("notes")
    .filter(([string, fret]) => {
      return _.chain(chord.quality)
        .get("quality")
        .map(base => (base + roots[chord.root]) % 12)
        .includes(note(string, fret, tuning))
        .value();
    })
    .value();

  let relevantVoicings = _.filter(voicings, voicing => {
    return _.every(notesInChord, note =>
      _.chain(voicing)
        .map(note => note.toString())
        .includes(note.toString())
        .value()
    );
  });

  let heatmap = _.chain(voicings)
    .thru(voicings =>
      getHeatmap(voicings, (previous, { voicing }) => {
        let hasPreviousChord = !_.isEmpty(_.get(previousChord, "notes"));
        if (hasPreviousChord) {
          let distance =
            semitoneDistance(previousChord, tuning)(voicing) || 0.1;
          return _.max([previous || 0, 1 / distance]);
        } else {
          return 1;
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

  useEffect(() => {
    let canvas = ref.current;
    let context = canvas.getContext("2d");

    let ratio = getPixelRatio(context);

    let fretHeight = getFretHeight(
      horizontal ? getWidth(canvas) : getHeight(canvas),
      ratio
    );
    let fretWidth = getFretWidth(fretHeight);

    let height = horizontal
      ? (fretWidth / ratio) * _.size(tuning)
      : getHeight(canvas);
    let width = horizontal
      ? getWidth(canvas)
      : (fretWidth / ratio) * _.size(tuning);

    let [cx, cy] = getCenter(width, height, ratio);
    let [stringTop, fretsLeft] = getTopLeft(cx, cy, fretHeight, fretWidth);

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    context.lineWidth = lineWidth;
    context.lineCap = "square";
    context.strokeStyle = "#eee";
    context.fillStyle = "#eee";
    context.textBaseline = "middle";

    context.fillStyle = "#FFF";
    context.fillRect(0, 0, width * 2, height * 2);

    setFretHeight(fretHeight);
    setFretWidth(fretWidth);

    const rotate = (x, y) => (horizontal ? [y, x] : [x, y]);
    const invert = string =>
      horizontal ? _.size(tuning) - string - 1 : string;

    // Draw frets:
    for (let fret = 1; fret < frets + 1; fret++) {
      context.beginPath();
      context.moveTo(...rotate(fretsLeft, stringTop + fret * fretHeight));
      context.lineTo(
        ...rotate(
          fretsLeft + fretWidth * (_.size(tuning) - 1),
          stringTop + fret * fretHeight
        )
      );
      context.stroke();
      if (_.includes([3, 5, 7, 9, 12, 15, 18], fret)) {
        context.fillStyle = "#eee";
        context.beginPath();
        context.arc(
          ...rotate(
            fretsLeft + 2 * fretWidth + fretWidth / 2,
            stringTop + fret * fretHeight + fretHeight / 2
          ),
          fretWidth / 4 - lineWidth,
          0,
          2 * Math.PI
        );
        context.fill();
      }
      if (_.includes([0 + 1, 12 + 1], fret)) {
        context.beginPath();
        context.moveTo(
          ...rotate(fretsLeft, stringTop + fret * fretHeight + lineWidth)
        );
        context.lineTo(
          ...rotate(
            fretsLeft + fretWidth * (_.size(tuning) - 1),
            stringTop + fret * fretHeight + lineWidth
          )
        );
        context.stroke();
      }
    }

    // Draw strings:
    context.beginPath();
    for (let string = 0; string < _.size(tuning); string++) {
      context.moveTo(
        ...rotate(fretsLeft + string * fretWidth, stringTop + fretHeight)
      );
      context.lineTo(
        ...rotate(
          fretsLeft + string * fretWidth,
          stringTop + fretHeight * frets
        )
      );
    }
    context.stroke();

    if (loading) {
      context.font = `bold ${fretWidth *
        (2 /
          5)}px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif`;
      context.fillStyle = `rgba(255,255,255,0.66)`;
      context.beginPath();
      context.rect(0, 0, width * ratio, height * ratio);
      context.fill();
      context.fillStyle = "#666";
      context.textAlign = "center";
      context.fillText("Loading...", (width * ratio) / 2, (height * ratio) / 2);
      return;
    }

    // Draw heatmap:
    for (let fret = 0; fret < frets; fret++) {
      for (let string = 0; string < _.size(tuning); string++) {
        context.fillStyle = `rgba(0,0,255,${
          heatmap[[invert(string), fret]]
            ? Math.max(0.1, heatmap[[invert(string), fret]])
            : 0
        })`;
        context.beginPath();
        context.rect(
          ...rotate(
            fretsLeft + (string - 1) * fretWidth + fretWidth / 2,
            stringTop + fret * fretHeight
          ),
          ...rotate(fretWidth, fretHeight)
        );
        context.fill();
      }
    }

    // Draw fret marker:
    context.fillStyle = "#666";
    context.strokeStyle = "#666";
    context.lineWidth = (lineWidth * 4) / 3;
    context.textAlign = "center";
    context.font = `bold ${fretWidth *
      (2 /
        5)}px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif`;
    let noteMap = _.chain(chord.notes)
      .reduce((map, v) => {
        map[v] = true;
        return map;
      }, {})
      .value();
    for (let fret = 0; fret < frets + 1; fret++) {
      for (let string = 0; string < _.size(tuning); string++) {
        if (noteMap[[invert(string), fret]]) {
          context.fillStyle = "#666";
          context.beginPath();
          context.arc(
            ...rotate(
              fretsLeft + string * fretWidth,
              stringTop + fret * fretHeight + fretHeight / 2
            ),
            fretWidth / 2 - lineWidth,
            0,
            2 * Math.PI
          );
          context.fill();
          context.fillStyle = "#FFF";
          context.fillText(
            noteName(invert(string), fret, sharps, tuning, chord.quality),
            ...rotate(
              fretsLeft + string * fretWidth,
              stringTop + fret * fretHeight + fretHeight / 2
            )
          );
        } else if (
          _.includes(notesInQualities, (tuning[invert(string)] + fret) % 12)
        ) {
          if (heatmap[[invert(string), fret]]) {
            var [r, g, b] = context.getImageData(
              ...rotate(
                fretsLeft + string * fretWidth - lineWidth * 2,
                stringTop + fret * fretHeight + fretHeight / 2
              ),
              1,
              1
            ).data;
            context.fillStyle = `rgb(${r}, ${g}, ${b})`;
            context.beginPath();
            context.arc(
              ...rotate(
                fretsLeft + string * fretWidth,
                stringTop + fret * fretHeight + fretHeight / 2
              ),
              fretWidth / 4,
              0,
              2 * Math.PI
            );
            context.fill();
            context.fillStyle = "white";
          } else {
            context.fillStyle = "#FFF";
            context.beginPath();
            context.arc(
              ...rotate(
                fretsLeft + string * fretWidth,
                stringTop + fret * fretHeight + fretHeight / 2
              ),
              fretWidth / 4,
              0,
              2 * Math.PI
            );
            context.fill();
            context.fillStyle = "#999";
          }
          context.fillText(
            noteName(invert(string), fret, sharps, tuning, chord.quality),
            ...rotate(
              fretsLeft + string * fretWidth,
              stringTop + fret * fretHeight + fretHeight / 2
            )
          );
        }
      }
    }

    // Draw capo:
    context.fillStyle = "rgba(0,0,0,0.068)";
    context.beginPath();
    context.rect(
      ...rotate(0, stringTop - lineWidth / 2),
      ...rotate(width * ratio, stringTop + capo * fretHeight - lineWidth / 2)
    );
    context.fill();
  });

  const onClick = e => {
    let canvas = ref.current;
    let context = canvas.getContext("2d");
    let ratio = getPixelRatio(context);

    let x = e.nativeEvent.offsetX * ratio;
    let y = e.nativeEvent.offsetY * ratio;

    let fretHeight = getFretHeight(
      horizontal ? getWidth(canvas) : getHeight(canvas),
      ratio
    );
    let fretWidth = getFretWidth(fretHeight);

    let height = horizontal
      ? (fretWidth / ratio) * _.size(tuning)
      : getHeight(canvas);
    let width = horizontal
      ? getWidth(canvas)
      : (fretWidth / ratio) * _.size(tuning);

    let [cx, cy] = getCenter(width, height, ratio);
    let [stringTop, fretsLeft] = getTopLeft(cx, cy, fretHeight, fretWidth);

    let fret = horizontal
      ? Math.floor(x / fretHeight)
      : Math.floor((y - stringTop) / fretHeight);
    let string = horizontal
      ? _.size(tuning) - Math.floor((y - stringTop) / fretWidth) - 1
      : Math.floor((x - fretsLeft - fretWidth / 2) / fretWidth) + 1;

    if (
      _.isFunction(onClickFret) &&
      fret >= 0 &&
      fret < frets &&
      string >= 0 &&
      string < _.size(tuning)
    ) {
      onClickFret({ string, fret }, e);
    }
  };

  return <Canvas ref={ref} onClick={onClick}></Canvas>;
};

export default Fretboard;
