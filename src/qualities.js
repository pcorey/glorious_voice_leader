import "lodash.combinations";
import _ from "lodash";

const parents = [
  /**/
  ["maj", "1 3 5"],
  /**/
  ["maj6", "1 3 (5) 6"],
  /**/
  ["maj/9", "1 3 (5) 9"],
  /**/
  ["maj6/9", "(1) 3 (5) 6 9"],
  /**/
  ["sus4", "1 4 5"],
  ["sus2", "1 2 5"],
  /**/
  ["maj7", "(1) 3 (5) 7"],
  /**/
  ["maj9", "(1) 3 (5) 7 9"],
  /**/
  ["maj11", "(1) (3) (5) 7 (9) 11"],
  ["maj13", "(1) 3 (5) 7 (9) (11) 13"],
  ["maj7/6", "(1) 3 (5) 6 7"],
  /**/
  ["maj7#5", "(1) 3 #5 7"],
  ["maj9#5", "(1) 3 #5 7 9"],
  /**/
  ["/#11", "1 3 (5) #11"],
  ["maj7/#11", "(1) 3 (5) 7 #11"],
  ["maj7#9#11", "(1) 3 (5) 7 #9 #11"],
  ["maj9#11", "(1) 3 (5) 7 9 #11"],
  ["maj13#11", "(1) 3 (5) 7 9 #11 13"],
  ["sus2/#11", "(1) 2 5 #11"],
  ["/9#11", "(1) 3 (5) 9 #11"],
  ["maj7/6#11", "(1) 3 (5) 6 7 #11"],
  ["maj6/9#11", "(1) 3 (5) 6 9 #11"],
  ["maj6/b9#11", "(1) 3 (5) 6 b9 #11"],
  ["maj7/6#9b5", "(1) 3 b5 6 7 #9"],
  ["maj6/#11", "(1) 3 (5) 6 #11"],
  /**/
  ["m", "1 b3 5"],
  /**/
  ["m/9", "(1) b3 (5) 9"],
  /**/
  ["mM7", "(1) b3 (5) 7"],
  /**/
  ["mM9", "(1) b3 (5) 7 9"],
  /**/
  ["m7", "(1) b3 (5) b7"],
  /**/
  ["m7b5", "(1) b3 b5 b7"],
  /**/
  ["m7/11", "(1) b3 (5) b7 11"],
  /**/
  ["m9", "(1) b3 (5) b7 9"],
  /**/
  ["m11", "(1) b3 (5) b7 9 11"],
  /**/
  ["m6", "(1) b3 5 6"],
  ["m6/9", "(1) b3 (5) 6 9"],
  /**/
  ["m13", "(1) b3 (5) b7 9 (11) 13"], // changed from formula in book
  ["m7/6/11", "(1) b3 (5) 6 b7 11"],
  ["m7/6", "(1) b3 (5) 6 b7"],
  ["mM7/6/9", "(1) b3 (5) 6 7 9"],
  ["m13/#11", "(1) b3 (5) b7 9 #11 13"],
  ["m6/9/11", "(1) b3 (5) 6 b7 9 11"],
  ["m6/9/#11", "(1) b3 (5) 6 9 #11"],
  ["mM7/6", "(1) b3 (5) 6 7"],
  ["mM7/9/11", "(1) b3 (5) 7 9 11"],
  ["mM7/11", "(1) b3 (5) 7 11"],
  ["m7b9", "(1) b3 (5) b7 b9"],
  ["m6/11", "(1) b3 (5) 6 11"],
  /**/
  ["7", "(1) 3 (5) b7"],
  /**/
  ["7b9", "(1) 3 (5) b7 b9"],
  ["dim7", "(1) b3 b5 6"],
  /**/
  ["7#9", "(1) 3 (5) b7 #9"],
  /**/
  ["7#9#5", "(1) 3 #5 b7 #9"],
  ["m7#5", "(1) b3 #5 b7"], // why is this in this section?
  /**/
  ["7b5", "(1) 3 b5 b7"],
  /**/
  ["7/6", "(1) 3 (5) 6 b7"],
  /**/
  ["7/6/11", "(1) 3 (5) 6 b7 11"],
  /**/
  ["9", "(1) 3 (5) b7 9"],
  /**/
  ["13", "(1) 3 (5) b7 (9) (11) 13"],
  /**/
  ["7sus", "1 4 (5) b7"],
  /**/
  ["7/6sus", "(1) 4 (5) 6 b7"],
  /**/
  ["7/11", "(1) 3 (5) b5 11"],
  /**/
  ["13b9", "(1) 3 (5) b7 b9 (11) 13"],
  /**/
  ["11", "(1) (3) (5) b7 (9) 11"],
  /**/
  ["13sus", "(1) 4 (5) b7 9 (11) 13"],
  /**/
  ["7b9#5", "(1) 3 #5 b7 b9"],
  /**/
  ["7#5", "(1) 3 #5 b7"],
  /**/
  ["7b9b5", "(1) 3 b5 b7 b9"],
  ["7b9#11", "(1) 3 (5) b7 b9 #11"],
  /**/
  ["7#9b5", "(1) 3 b5 b7 #9"],
  /**/
  ["13#9", "(1) 3 (5) b7 #9 (11) 13"],
  /**/
  ["13#11", "(1) 3 (5) b7 9 #11 13"],
  /**/
  ["11b9", "(1) 3 (5) b7 b9 11"],
  ["11b9#5", "(1) 3 #5 b7 b9 11"],
  ["11#5", "(1) 3 #5 b7 9 11"],
  ["6#9", "(1) 3 (5) 6 b7 #9"],
  /**/
  ["9b5", "(1) 3 b5 b7 9"],
  ["9#5", "(1) 3 #5 b7 9"],
  /**/
  ["9#5b5", "(1) 3 #5 b5 b7 9"], // should I include this? Ted says it's a weird one
  /**/
  ["#11", "(1) 3 (5) b7 9 #11"],
  /**/
  ["aug", "1 3 #5"],
  /**/
  ["7/#11", "(1) 3 (5) b7 #11"]
];

export const possibleDegrees = {
  "1": ["1"],
  "2": ["b2", "2", "#2"],
  "3": ["b3", "3"],
  "4": ["4", "#4"],
  "5": ["b5", "5", "#5"],
  "6": ["b6", "6"],
  "7": ["b7", "7"]
};

export const degreeToPitch = degree => {
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
    case "bb7":
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

const noteNames = sharps =>
  sharps
    ? ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    : ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

export const qualities = _.chain(parents)
  .flatMap(([name, formula]) => {
    let allDegrees = _.split(formula, /\s+/);
    let degrees = _.chain(formula)
      .split(/\s+/)
      .map(degree => _.trim(degree, "()"))
      .value();
    let optionals = _.chain(allDegrees)
      .filter(degree => _.startsWith(degree, "("))
      .map(degree => _.trim(degree, "()"))
      .value();
    return _.chain(_.range(_.size(optionals) + 1))
      .flatMap(i => _.combinations(optionals, i))
      .map(missing => {
        let missingString = _.chain(missing)
          .map(degree => `no ${_.replace(degree, /#|b/, "")}`)
          .join(" ")
          .value();
        let updatedDegrees = _.without(degrees, ...missing);
        let updatedFormula = _.join(updatedDegrees, " ");
        let updatedName = _.trim(`${name} ${missingString}`);
        let quality = degreesToQuality(updatedDegrees);
        let result = {
          name: updatedName,
          degrees: updatedDegrees,
          formula: updatedFormula,
          parent: degrees,
          missing,
          quality
        };
        result.value = JSON.stringify(result);
        return result;
      })
      .value();
  })
  .reject(({ degrees, parent, missing }) => {
    return !_.isEmpty(_.difference(missing, parent)) || _.size(degrees) < 3;
  })
  .value();
