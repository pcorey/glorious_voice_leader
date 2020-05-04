import "lodash.combinations";
import _ from "lodash";

const degreeToPitch = degree => {
  switch (degree) {
    case "1":
      return 0;
    case "b2":
    case "b9":
      return 1;
    case "2":
    case "9":
      return 2;
    case "b3":
    case "#9":
      return 3;
    case "3":
      return 4;
    case "4":
    case "11":
      return 5;
    case "#4":
    case "#11":
    case "b5":
      return 6;
    case "5":
      return 7;
    case "#5":
    case "b6":
    case "b13":
      return 8;
    case "6":
    case "13":
      return 9;
    case "b7":
      return 10;
    case "7":
      return 11;
    default:
      console.warn(`Unrecognized degree "${degree}".`);
  }
};

const degreesToQuality = degrees => {
  return _.chain(degrees)
    .map(degreeToPitch)
    .sortBy(_.identity)
    .thru(quality =>
      _.size(quality) !==
      _.chain(quality)
        .uniq()
        .size()
        .value()
        ? undefined
        : quality
    )
    .value();
};

const doesNotContain = (degrees, test) => {
  return _.chain(degrees)
    .intersection(test)
    .isEmpty()
    .value();
};

const contains = (degrees, test) => {
  return !_.chain(degrees)
    .intersection(test)
    .isEmpty()
    .value();
};

const hasAny = (degrees, test) => {
  return !_.chain(degrees)
    .intersection(test)
    .isEmpty()
    .value();
};

const hasAll = (degrees, test) => {
  return _.chain(degrees)
    .intersection(test)
    .size()
    .eq(_.size(test))
    .value();
};

// sus2
// sus4
// maj
// min
// dom
// dim
// aug

const parseAs = (
  degrees,
  symbol,
  required,
  extensions,
  optional,
  alterations,
  forbidden
) => {
  if (
    !_.chain(forbidden)
      .intersection(degrees)
      .isEmpty()
      .value()
  ) {
    return undefined;
  }
};

// parseAs(degrees, "sus2", ["1", "9", "5"], [], [], ["7", "11", "13"]);
// parseAs(degrees, "sus4", ["1", "11", "5"], [], [], ["7", "11", "13"]);

const analyze = degrees => {
  let highest = _.chain(["b7", "7", "9", "11", "13"])
    .intersection(degrees)
    .last()
    .value();

  let major3 = _.find(degrees, d => d === "3");
  let minor3 = _.find(degrees, d => d === "b3");
  let major7 = _.find(degrees, d => d === "7");
  let minor7 = _.find(degrees, d => d === "b7");

  let alterationsArray = _.chain(["b5", "#5", "b9", "#9", "#11", "b13"])
    .intersection(degrees)
    .value();
  let alterations = _.join(alterationsArray, "");

  let missingArray = _.chain(["1", "3", "5", "7", "9", "11", "13"])
    .reject(
      degree =>
        _.toInteger(degree) >
        _.chain(highest)
          .clone()
          .replace(/b|#/, "")
          .toInteger()
          .value()
    )
    .difference(
      _.map(degrees, degree =>
        _.chain(degree)
          .clone()
          .replace(/b|#/, "")
          .value()
      )
    )
    .value();
  let missing = _.chain(missingArray)
    .map(degree => `no ${degree}`)
    .join(" ")
    .value();

  if (!highest && _.isEqual(degrees, ["1", "3", "5"])) {
    var family = "major";
    var base = "maj";
  } else if (!highest && _.isEqual(degrees, ["1", "b3", "5"])) {
    var family = "minor";
    var base = "m";
  } else if (!highest && _.isEqual(degrees, ["1", "b3", "b5"])) {
    var family = "diminished";
    var base = "dim";
  } else if (!highest && _.isEqual(degrees, ["1", "3", "#5"])) {
    var family = "augmented";
    var base = "aug";
  } else if (major3 && major7) {
    var family = "major";
    var base = `maj${highest === "b7" ? "7" : highest}`;
  } else if (major3 && minor7) {
    var family = "dominant";
    var base = `${highest === "b7" ? "7" : highest}`;
  } else if (minor3 && major7) {
    var family = "minor";
    var base = `mM${highest === "b7" ? "7" : highest}`;
  } else if (minor3 && minor7) {
    var family = "minor";
    var base = `m${highest === "b7" ? "7" : highest}`;
  } else if (!major3 && !minor3 && major7) {
    var family = "dominant";
    var base = `${highest === "b7" ? "7" : highest}`;
  } else {
    var family = "minor";
    var base = `m${highest === "b7" ? "7" : highest}`;
  }
  return {
    family,
    formula: _.join(degrees, " "),
    name: _.trim(`${base}${alterations} ${missing}`),
    missing: missingArray,
    alterations: alterationsArray
  };
};

const someKindOf = degree => [`b${degree}`, degree, `#${degree}`];

export const qualities = _.chain([
  "1",
  "b3",
  "3",
  "b5",
  "5",
  "#5",
  "b7",
  "7",
  "b9",
  "9",
  "#9",
  "11",
  "#11",
  "b13",
  "13"
])
  .flatMap((v, i, a) => _.combinations(a, i + 1))
  .reject(degrees => _.size(degrees) < 3)
  .filter(
    degrees =>
      (contains(degrees, someKindOf("1")) &&
        contains(degrees, [...someKindOf("3"), "9", "11"]) &&
        contains(degrees, someKindOf("5"))) ||
      (contains(degrees, someKindOf("3")) && contains(degrees, someKindOf("7")))
  )
  .map(degrees =>
    _.chain(degrees)
      .sortBy(degree =>
        _.chain(degree)
          .clone()
          .replace(/#|b/, "")
          .toInteger()
          .value()
      )
      .uniqBy(degree =>
        _.chain(degree)
          .clone()
          .replace(/#|b/, "")
          .value()
      )
      .value()
  )
  .uniqBy(degrees => degrees.toString())
  .reject(degrees => _.size(degrees) < 3)
  .map(degrees => {
    return { degrees, quality: degreesToQuality(degrees) };
  })
  .reject(({ quality }) => _.isUndefined(quality))
  .map(({ degrees, quality }) => {
    return {
      ...analyze(degrees),
      degrees,
      quality
    };
  })
  // .filter(({ alterations }) => _.size(alterations) === 0)
  // .filter(({ missing }) => _.size(missing) === 0)
  .tap(qualities =>
    console.log(
      `Generated ${_.size(qualities)} possible chord qualities. *whew*`
    )
  )
  .value();

// 5 note chords, either root or 5th is often omitted
// 6 note chords, both root and fifth often omitted
// 4 note chords, something 5th omitted
// 4 note chords, very rarely the root is omitted
// if chord has 11th, 3rd is often omitted
// you may omit 3rd from ANY chord (possibly replace with 2 or 4)
// b5th, #5th, b9th, #9th

export const qualitiesOptions = _.chain(qualities)
  .map(quality => ({
    ...quality,
    key: quality.name,
    text: quality.name,
    value: JSON.stringify(quality.quality)
  }))
  .sortBy(quality => quality.text)
  .value();

// console.log(
//   "major:",
//   _.keyBy(qualities, "quality")[[0, 4, 7]],
//   _.keyBy(qualities, "quality")[[0, 5, 7]],
//   _.keyBy(qualities, "quality")[[0, 2, 7]],
//   _.keyBy(qualities, "quality")
// );
