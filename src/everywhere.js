import "lodash.product";

import React from "react";
import _ from "lodash";
import getPixelRatio from "./getPixelRatio";
import styled from "styled-components";
import { useEffect } from "react";
import { useRef } from "react";

const getRange = intervals => {
  return _.sum(intervals);
};

const getSmallestPosition = intervals => {
  let tuning = _.reduce(
    intervals,
    (strings, interval) => [...strings, _.last(strings) + interval],
    [0]
  );
  return _.chain(0)
    .range(12)
    .find(n =>
      _.chain(tuning)
        .map(open => _.range(open, open + n))
        .flatten()
        .map(n => n % 12)
        .uniq()
        .sortBy(_.identity)
        .isEqual(_.range(0, 12))
        .value()
    )
    .value();
};

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
  border: 1px solid tomato;
`;

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

const Everywhere = () => {
  let ref = useRef();

  useEffect(() => {
    let canvas = ref.current;
    let context = canvas.getContext("2d");
    let ratio = getPixelRatio(context);
    let width = getWidth(canvas);
    let height = getHeight(canvas);

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    context.lineWidth = 2;
    context.lineCap = "square";
    context.strokeStyle = "#666";
    context.fillStyle = "#666";

    let range = _.range(1, 12);

    let stats = _.chain(_.product(range, range, range, range, range))
      .map(intervals => {
        return {
          intervals,
          range: getRange(intervals),
          positionSize: getSmallestPosition(intervals)
        };
      })
      .value();

    let maxRange = _.maxBy(stats, "range").range;
    let maxPositionSize = _.maxBy(stats, "positionSize").positionSize;

    console.log(stats);

    _.map(stats, ({ range, positionSize }) => {
      context.beginPath();
      // console.log(
      //   (range / maxRange) * width,
      //   (positionSize / maxPositionSize) * height,
      //   4,
      //   0,
      //   2 * Math.PI
      // );
      context.arc(
        (range / maxRange) * width * ratio,
        height * ratio -
          ((maxPositionSize - positionSize) / maxPositionSize) * height * ratio,
        4,
        0,
        2 * Math.PI
      );
      context.fill();
    });
  });

  return (
    <Wrapper>
      <Canvas ref={ref}></Canvas>
    </Wrapper>
  );
};

export default Everywhere;
