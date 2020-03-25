import * as serviceWorker from "./serviceWorker";
import App from "./App";
import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";
import pako from "pako";
import "./index.css";

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

ReactDOM.render(<App hash={parse(hash)} />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
