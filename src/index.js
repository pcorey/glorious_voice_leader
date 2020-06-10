import * as serviceWorker from "./serviceWorker";
import App from "./App";
import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";
import getSubstitutionsWorker from "workerize-loader!./workers/getSubstitutions.js"; // eslint-disable-line import/no-webpack-loader-syntax
import getVoicingsWorker from "workerize-loader!./workers/getVoicings.js"; // eslint-disable-line import/no-webpack-loader-syntax
import pako from "pako";
import { substitutions } from "./substitutions";

import "./index.css";

const substitutionMap = _.keyBy(substitutions, "id");

const parse = hash => {
  let initial = {
    sharps: false,
    allowPartialQualities: true,
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
        notes: []
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

let hash = window.location.hash.slice(1);

const voicingsCache = {};
const getVoicings = async ({
  chord,
  tuning,
  allowOpen,
  frets,
  maxReach,
  capo
}) => {
  let key = JSON.stringify({
    chord,
    tuning,
    allowOpen,
    frets,
    maxReach,
    capo
  });
  if (voicingsCache[key]) {
    return voicingsCache[key];
  }
  console.time("Time to generate voicings");
  let voicings = await getVoicingsWorker().workerGetVoicings({
    chord,
    tuning,
    allowOpen,
    frets,
    maxReach,
    capo
  });
  voicingsCache[key] = voicings;
  console.timeEnd("Time to generate voicings");
  return voicings;
};

const substitutionsCache = {};
const getSubstitutions = async ({
  chord,
  tuning,
  allowPartialQualities,
  sharps,
  previousChord,
  nextChord
}) => {
  let key = JSON.stringify({
    chord,
    tuning,
    allowPartialQualities,
    sharps,
    previousChord,
    nextChord
  });
  if (substitutionsCache[key]) {
    console.log("cache hit!");
    return substitutionsCache[key];
  }
  console.time("Time to generate substitutions");
  let possibleSubstitutions = _.chain(
    await getSubstitutionsWorker().workerGetSubstitutions({
      chord,
      tuning,
      allowPartialQualities,
      sharps,
      previousChord,
      nextChord
    })
  )
    .map(substitution => {
      return {
        ...substitution,
        substitutions: _.map(substitution.substitutions, id => {
          return substitutionMap[id];
        })
      };
    })
    .value();
  substitutionsCache[key] = possibleSubstitutions;
  console.timeEnd("Time to generate substitutions");
  return possibleSubstitutions;
};

ReactDOM.render(
  <App
    hash={parse(hash)}
    getVoicings={getVoicings}
    getSubstitutions={getSubstitutions}
  />,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
