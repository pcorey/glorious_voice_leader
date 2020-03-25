import _ from "lodash";

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

export default qualities;
