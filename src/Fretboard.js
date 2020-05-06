import "semantic-ui-css/semantic.min.css";
import React from "react";
import _ from "lodash";
import getHeatmap from "./heatmap";
import getPixelRatio from "./getPixelRatio";
import getVoicings from "./voicings";
import semitoneDistance from "./semitoneDistance";
import styled from "styled-components";
import { useEffect } from "react";
import { useRef } from "react";

const fretSizeRatio = 1.5;
const lineWidth = 3;

const Canvas = styled.canvas`
  width: 100%;
  height: 100%;
  cursor: pointer;
`;

const Fretboard = ({
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
  capo
}) => {
  let ref = useRef();

  let notesInQualities = _.chain(chord.quality)
    .get("quality")
    .uniq()
    .map(note => (note + chord.root) % 12)
    .value();

  let voicings = _.chain(chord.quality)
    .get("quality")
    .map(base => (base + chord.root) % 12)
    .thru(quality =>
      getVoicings(quality, tuning, allowOpen, frets, maxReach, capo)
    )
    .uniqWith(_.isEqual)
    .value();

  const note = (string, fret, tuning) => {
    return (tuning[string] + fret) % 12;
  };

  const noteName = (string, fret, sharps, tuning, quality) => {
    return (
      _.get(quality, `noteNames.${(tuning[string] + fret) % 12}`) ||
      (sharps
        ? ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
        : ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"])[
        note(string, fret, tuning)
      ]
    );
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

  const getTopLeft = (cx, cy, fretHeight, fretWidth) => [
    cy - (fretHeight * frets) / 2,
    cx - (fretWidth * (_.size(tuning) - 1)) / 2
  ];

  let notesInChord = _.chain(chord)
    .get("notes")
    .filter(([string, fret]) => {
      return _.chain(chord.quality)
        .get("quality")
        .map(base => (base + chord.root) % 12)
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
      getHeatmap(voicings, (previous, { i, voicing }) => {
        let hasPreviousChord = !_.isEmpty(_.get(previousChord, "notes"));
        if (hasPreviousChord) {
          let distance =
            semitoneDistance(previousChord, tuning)(voicing) || 0.1;
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

  useEffect(() => {
    let canvas = ref.current;
    let context = canvas.getContext("2d");

    let ratio = getPixelRatio(context);
    let height = getHeight(canvas);

    let fretHeight = getFretHeight(height, ratio);
    let fretWidth = getFretWidth(fretHeight);

    let width = (fretWidth / ratio) * _.size(tuning);

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

    // Draw frets:
    for (let fret = 1; fret < frets + 1; fret++) {
      context.beginPath();
      context.moveTo(fretsLeft, stringTop + fret * fretHeight);
      context.lineTo(
        fretsLeft + fretWidth * (_.size(tuning) - 1),
        stringTop + fret * fretHeight
      );
      context.stroke();
      if (_.includes([3, 5, 7, 9, 12, 15, 18], fret)) {
        context.beginPath();
        context.arc(
          fretsLeft + 2 * fretWidth + fretWidth / 2,
          stringTop + fret * fretHeight + fretHeight / 2,
          fretWidth / 4 - lineWidth,
          0,
          2 * Math.PI
        );
        context.fill();
      }
      if (_.includes([0 + 1, 12 + 1], fret)) {
        context.beginPath();
        context.moveTo(fretsLeft, stringTop + fret * fretHeight + lineWidth);
        context.lineTo(
          fretsLeft + fretWidth * (_.size(tuning) - 1),
          stringTop + fret * fretHeight + lineWidth
        );
        context.stroke();
      }
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

    // Draw heatmap:
    for (let fret = 0; fret < frets; fret++) {
      for (let string = 0; string < _.size(tuning); string++) {
        context.fillStyle = `rgba(0,0,255,${heatmap[[string, fret]] || 0})`;
        context.beginPath();
        context.rect(
          fretsLeft + (string - 1) * fretWidth + fretWidth / 2,
          stringTop + fret * fretHeight,
          fretWidth,
          fretHeight
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
        if (noteMap[[string, fret]]) {
          context.fillStyle = "#666";
          context.beginPath();
          context.arc(
            fretsLeft + string * fretWidth,
            stringTop + fret * fretHeight + fretHeight / 2,
            fretWidth / 2 - lineWidth,
            0,
            2 * Math.PI
          );
          context.fill();
          context.fillStyle = "#FFF";
          context.fillText(
            noteName(string, fret, sharps, tuning, chord.quality),
            fretsLeft + string * fretWidth,
            stringTop + fret * fretHeight + fretHeight / 2
          );
        } else if (_.includes(notesInQualities, (tuning[string] + fret) % 12)) {
          if (heatmap[[string, fret]]) {
            var [r, g, b] = context.getImageData(
              fretsLeft + string * fretWidth - lineWidth * 2,
              stringTop + fret * fretHeight + fretHeight / 2,
              1,
              1
            ).data;
            context.fillStyle = `rgb(${r}, ${g}, ${b})`;
            context.beginPath();
            context.arc(
              fretsLeft + string * fretWidth,
              stringTop + fret * fretHeight + fretHeight / 2,
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
              fretsLeft + string * fretWidth,
              stringTop + fret * fretHeight + fretHeight / 2,
              fretWidth / 4,
              0,
              2 * Math.PI
            );
            context.fill();
            context.fillStyle = "#999";
          }
          context.fillText(
            noteName(string, fret, sharps, tuning, chord.quality),
            fretsLeft + string * fretWidth,
            stringTop + fret * fretHeight + fretHeight / 2
          );
        }
      }
    }

    // Draw capo:
    context.fillStyle = "rgba(0,0,0,0.068)";
    context.beginPath();
    context.rect(
      0,
      stringTop - lineWidth / 2,
      width * ratio,
      stringTop + capo * fretHeight - lineWidth / 2
    );
    context.fill();
  });

  const onClick = e => {
    let canvas = ref.current;
    let context = canvas.getContext("2d");
    let ratio = getPixelRatio(context);

    let x = e.nativeEvent.offsetX * ratio;
    let y = e.nativeEvent.offsetY * ratio;

    let width = getWidth(canvas);
    let height = getHeight(canvas);

    let fretHeight = getFretHeight(height, ratio);
    let fretWidth = getFretWidth(fretHeight);

    let [cx, cy] = getCenter(width, height, ratio);
    let [stringTop, fretsLeft] = getTopLeft(cx, cy, fretHeight, fretWidth);

    let fret = Math.floor((y - stringTop) / fretHeight);
    let string = Math.floor((x - fretsLeft - fretWidth / 2) / fretWidth) + 1;

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
