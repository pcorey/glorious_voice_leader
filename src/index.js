import * as serviceWorker from "./serviceWorker.js";
import App from "./App.js";
import Harmonizer from "./Harmonizer.js";
import React from "react";
import _ from "lodash";
import { workerGetSubstitutions } from "./workers/getSubstitutions.js"; // eslint-disable-line import/no-webpack-loader-syntax
import { workerGetVoicings } from "./workers/getVoicings.js"; // eslint-disable-line import/no-webpack-loader-syntax
import pako from "pako";
import { get as getCachedSubstitutions } from "./substitutionsCache.js";
import { get as getCachedVoicings } from "./voicingsCache.js";
import { set as setCachedSubsitutions } from "./substitutionsCache.js";
import { set as setCachedVoicings } from "./voicingsCache.js";
import { substitutions } from "./substitutions.js";
import { createRoot } from "react-dom/client";

import "./index.css";

const substitutionMap = _.keyBy(substitutions, "id");

const parse = (hash) => {
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
        notes: [],
      },
    ],
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

const getVoicings = async ({
  chord,
  tuning,
  allowOpen,
  frets,
  maxReach,
  capo,
  notes,
}) => {
  let key = JSON.stringify({
    // chord,
    quality: chord.quality,
    root: chord.root,
    tuning,
    allowOpen,
    frets,
    maxReach,
    capo,
    notes,
  });
  if (getCachedVoicings(key)) {
    console.log("Found cached voicings.");
    return getCachedVoicings(key);
  }
  console.time("Time to generate voicings");
  let voicings = await workerGetVoicings({
    // chord,
    quality: chord.quality,
    root: chord.root,
    tuning,
    allowOpen,
    frets,
    maxReach,
    capo,
    notes,
  });
  setCachedVoicings(key, voicings);
  console.timeEnd("Time to generate voicings");
  return voicings;
};

const getSubstitutions = async ({
  chord,
  tuning,
  allowPartialQualities,
  sharps,
  previousChord,
  nextChord,
}) => {
  let key = JSON.stringify({
    chord,
    tuning,
    allowPartialQualities,
    sharps,
    previousChord,
    nextChord,
  });
  if (getCachedSubstitutions(key)) {
    console.log("Found cached substitutions.");
    return getCachedSubstitutions(key);
  }
  console.time("Time to generate substitutions");
  let substitutions = _.chain(
    await workerGetSubstitutions({
      chord,
      tuning,
      allowPartialQualities,
      sharps,
      previousChord,
      nextChord,
    })
  )
    .map((substitution) => {
      return {
        ...substitution,
        substitutions: _.map(substitution.substitutions, (id) => {
          return substitutionMap[id];
        }),
      };
    })
    .value();
  setCachedSubsitutions(key, substitutions);
  console.timeEnd("Time to generate substitutions");
  return substitutions;
};

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  // <Harmonizer getVoicings={getVoicings} getSubstitutions={getSubstitutions} />,
  <App
    hash={parse(hash)}
    getVoicings={getVoicings}
    getSubstitutions={getSubstitutions}
  />
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
