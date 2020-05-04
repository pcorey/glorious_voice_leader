import "lodash.product";
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

const removeAccidental = degree => {
  return _.replace(degree, /b|#/, "");
};

const removeAccidentals = degrees => {
  return _.map(degrees, removeAccidental);
};

const higherThanHighest = highest => degree => {
  return (
    _.toInteger(degree) >
    _.chain(highest)
      .thru(removeAccidental)
      .toInteger()
      .value()
  );
};

const altered = {
  degrees: [["1"], ["3"], ["#5"]],
  analyze: degrees => {
    return {
      name: "alt",
      alterations: [],
      missing: []
    };
  }
};

const diminished = {
  degrees: [["1"], ["b3"], ["b5"]],
  analyze: degrees => {
    return {
      name: "dim",
      alterations: [],
      missing: []
    };
  }
};

const triads = {
  degrees: [["1"], ["b3", "3"], ["5"], ["9", "11", undefined]],
  analyze: degrees => {
    let extension = _.includes(degrees, "9")
      ? "/9"
      : _.includes(degrees, "11")
      ? "/11"
      : "";
    if (_.includes(degrees, "b3")) {
      var name = `m${extension}`;
    } else {
      var name = `maj${extension}`;
    }
    return {
      name,
      alterations: [],
      missing: []
    };
  }
};

const susTriads = {
  degrees: [["1"], ["2", "4"], ["5"]],
  analyze: degrees => {
    if (_.includes(degrees, "2")) {
      var name = "sus2";
    } else {
      var name = "sus4";
    }
    return {
      name,
      alterations: [],
      missing: []
    };
  }
};

const sixths = {
  degrees: [["1"], ["b3", "3"], ["5"], ["6"], ["9", undefined]],
  analyze: degrees => {
    let extension = _.includes(degrees, "9") ? "/9" : "";
    if (_.includes(degrees, "b3")) {
      var name = `m6${extension}`;
    } else {
      var name = `6${extension}`;
    }
    return {
      name,
      alterations: [],
      missing: []
    };
  }
};

const extendedMajor = {
  degrees: [
    ["1", undefined],
    ["3"],
    ["b5", "5", "#5", undefined],
    ["7"],
    ["b9", "9", "#9", undefined],
    ["11", "#11", undefined],
    ["b13", "13", undefined]
  ],
  analyze: degrees => {
    let highest = _.chain(["7", "9", "11", "13"])
      .intersection(degrees)
      .last()
      .value();

    let alterations = _.chain(["b5", "#5", "b9", "#9", "#11", "b13"])
      .intersection(degrees)
      .value();

    let missing = _.chain(["1", "3", "5", "7", "9", "11", "13"])
      .reject(higherThanHighest(highest))
      .difference(removeAccidentals(degrees))
      .value();

    let name = _.trim(
      `maj${highest}${_.join(alterations, "")} ${_.chain(missing)
        .map(degree => `no ${degree}`)
        .join(" ")
        .value()}`
    );

    return {
      name,
      alterations,
      missing
    };
  }
};

const extendedMinor = {
  degrees: [
    ["1", undefined],
    ["b3"],
    ["b5", "5", "#5", undefined],
    ["b7", "7"],
    ["b9", "9", "#9", undefined],
    ["11", "#11", undefined],
    ["b13", "13", undefined]
  ],
  analyze: degrees => {
    let highest = _.chain(["b7", "7", "9", "11", "13"])
      .intersection(degrees)
      .last()
      .value();

    let alterations = _.chain(["b5", "#5", "b9", "#9", "#11", "b13"])
      .intersection(degrees)
      .value();

    let missing = _.chain(["1", "3", "5", "7", "9", "11", "13"])
      .reject(higherThanHighest(highest))
      .difference(removeAccidentals(degrees))
      .value();

    let symbol = _.includes(degrees, "7") ? "mM" : "m";

    let name = _.trim(
      `${symbol}${removeAccidental(highest)}${_.join(
        alterations,
        ""
      )} ${_.chain(missing)
        .map(degree => `no ${degree}`)
        .join(" ")
        .value()}`
    );

    return {
      name,
      alterations,
      missing
    };
  }
};

const extendedDominant = {
  degrees: [
    ["1", undefined],
    ["3"],
    ["b5", "5", "#5", undefined],
    ["b7"],
    ["b9", "9", "#9", undefined],
    ["11", "#11", undefined],
    ["b13", "13", undefined]
  ],
  analyze: degrees => {
    let highest = _.chain(["b7", "9", "11", "13"])
      .intersection(degrees)
      .last()
      .value();

    let alterations = _.chain(["b5", "#5", "b9", "#9", "#11", "b13"])
      .intersection(degrees)
      .value();

    let missing = _.chain(["1", "3", "5", "7", "9", "11", "13"])
      .reject(higherThanHighest(highest))
      .difference(removeAccidentals(degrees))
      .value();

    let name = _.trim(
      `${removeAccidental(highest)}${_.join(alterations, "")} ${_.chain(missing)
        .map(degree => `no ${degree}`)
        .join(" ")
        .value()}`
    );

    return {
      name,
      alterations,
      missing
    };
  }
};

const extendedDominantSus = {
  degrees: [
    ["1", undefined],
    ["4"],
    ["b5", "5", "#5", undefined],
    ["b7"],
    ["b9", "9", "#9", undefined],
    ["b13", "13", undefined]
  ],
  analyze: degrees => {
    let highest = _.chain(["b7", "9", "11", "13"])
      .intersection(degrees)
      .last()
      .value();

    let alterations = _.chain(["b5", "#5", "b9", "#9", "#11", "b13"])
      .intersection(degrees)
      .value();

    let missing = _.chain(["1", "3", "5", "7", "9", "13"])
      .reject(higherThanHighest(highest))
      .difference(removeAccidentals(degrees))
      .value();

    let name = _.trim(
      `sus${removeAccidental(highest)}${_.join(alterations, "")} ${_.chain(
        missing
      )
        .map(degree => `no ${degree}`)
        .join(" ")
        .value()}`
    );

    return {
      name,
      alterations,
      missing
    };
  }
};

const chordFamilies = [
  altered,
  diminished,
  triads,
  susTriads,
  sixths,
  extendedMajor,
  extendedMinor,
  extendedDominant,
  extendedDominantSus
];

export const qualites = _.chain(chordFamilies)
  .flatMap(family => {
    return _.chain(family.degrees)
      .thru(degrees => _.product(...degrees))
      .map(degrees => _.reject(degrees, _.isNil))
      .reject(degrees => _.size(degrees) < 3)
      .map(degrees => ({ degrees, quality: degreesToQuality(degrees) }))
      .reject(({ quality }) => _.isUndefined(quality))
      .map(chord => {
        return {
          ...chord,
          ...family.analyze(chord.degrees)
        };
      })
      .value();
  })
  // .groupBy("quality")
  .tap(console.log)
  .value();
