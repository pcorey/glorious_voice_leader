import _ from "lodash";

const tunings = _.chain([
  {
    text: "Standard tuning - EADGBE",
    value: JSON.stringify([40, 45, 50, 55, 59, 64])
  },
  {
    text: "Major thirds",
    value: JSON.stringify([40, 44, 48, 52, 56, 60])
  },
  {
    text: "Drop D tuning - DADGBE",
    value: JSON.stringify([38, 45, 50, 55, 59, 64])
  },
  { text: "DADGAD tuning", value: JSON.stringify([38, 45, 50, 55, 60, 62]) },
  {
    text: "New standard tuning - CGDAEG",
    value: JSON.stringify([36, 43, 50, 57, 64, 67])
  },
  {
    text: "Ukulele (High G) tuning - GBCD",
    value: JSON.stringify([67, 60, 64, 69])
  },
  {
    text: "Ukulele (Low G) tuning - GBCD",
    value: JSON.stringify([55, 60, 64, 69])
  }
])
  .sortBy("text")
  .map(option => ({ key: JSON.stringify(option), ...option }))
  .value();

export default tunings;
