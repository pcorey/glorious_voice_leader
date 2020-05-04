import "semantic-ui-css/semantic.min.css";
import React from "react";
import _ from "lodash";
import getPixelRatio from "./getPixelRatio";
import styled from "styled-components";
import { qualities } from "./qualities";
import { useEffect } from "react";
import { useRef } from "react";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
`;

const Canvas = styled.canvas`
  width: 100%;
  height: 100%;
  margin-bottom: 1rem;
  cursor: pointer;
`;

const ArrowUp = styled.div`
  width: 0;
  height: 0;
  border-left: 1rem solid transparent;
  border-right: 1rem solid transparent;
  border-bottom: 1rem solid #eee;
`;

const noteName = (root, sharps) => {
  return (
    (sharps
      ? ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][root]
      : ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"][
          root
        ]) || ""
  );
};

const Chart = ({
  frets,
  tuning,
  fretHeight: fretboardFretHeight,
  fretWidth: fretboardFretWidth,
  chord,
  selected,
  onClick,
  sharps
}) => {
  let fretboardRatio = 3;
  let ref = useRef();

  useEffect(() => {
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

    let fretHeight = fretboardFretHeight / fretboardRatio;
    let fretWidth = fretboardFretWidth / fretboardRatio;

    let canvas = ref.current;
    let context = canvas.getContext("2d");
    let ratio = getPixelRatio(context);
    let width = (fretWidth / ratio) * (_.size(tuning) + 1);
    let height = (fretHeight / ratio) * (frets + 1);

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    context.font =
      "28px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif";

    context.lineWidth = 2;
    context.lineCap = "square";
    context.strokeStyle = "#666";
    context.fillStyle = "#666";

    let cx = (width * ratio) / 2;
    let cy = (height * ratio) / 2;

    let stringTop = cy - (fretHeight * (frets + 1)) / 2;
    let fretsLeft = cx - (fretWidth * (_.size(tuning) - 2)) / 2;

    // Draw frets:
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

    let quality = _.chain(chord.notes)
      .map(([string, fret]) => tuning[string] + fret)
      .map(note => {
        let interval = note - chord.root;
        if (interval < 0) {
          interval += 12;
        }
        return interval % 12;
      })
      .sortBy(_.identity)
      .thru(intervals => JSON.stringify(intervals))
      .thru(value => _.find(qualities, { value }))
      .value();

    for (let fret = 0; fret < frets; fret++) {
      for (let string = 0; string < _.size(tuning); string++) {
        if (min === 0) {
          if (noteMap[[string, fret]]) {
            context.beginPath();
            context.arc(
              fretsLeft + string * fretWidth,
              stringTop + fret * fretHeight + fretHeight / 2,
              fretWidth / 2 - context.lineWidth,
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
              stringTop + fret * fretHeight + fretHeight / 2,
              fretWidth / 2 - context.lineWidth,
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
    context.font = `bolder ${fretWidth}px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif`;
    context.textAlign = "right";
    context.textBaseline = "bottom";
    context.fillStyle = "#aaa";
    context.fillText(
      `${noteName(chord.root, sharps)}${_.get(quality, "text", "?")}`,
      width * ratio - fretWidth / 2,
      height * ratio
    );

    // Draw fret number:
    context.font = `bolder ${fretWidth}px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif`;
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillStyle = "#aaa";
    context.fillText(`${!min ? "" : min}`, 0, stringTop + fretHeight * 1.5);
  });

  return (
    <Wrapper>
      <Canvas ref={ref} onClick={onClick}></Canvas>
      {selected && <ArrowUp />}
    </Wrapper>
  );
};

export default Chart;
