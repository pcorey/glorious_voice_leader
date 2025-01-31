import React from "react";
import _ from "lodash";
import { roots } from "./roots.js";

export const substitutions = [
  // V - I
  // ii - V - I
  // tritone sub
  // ???
  {
    id: "Chord Chemistry 11.I",
    description: (
      <span>
        <blockquote>
          For basic major, minor, or dominant 7th chords, any extension may
          theoretically be substituted.
          <footer>
            —{" "}
            <a href="https://amzn.to/2YQ8xYM">
              Ted Greene in <em>Chord Chemistry</em>
            </a>
          </footer>
        </blockquote>
      </span>
    ),
    test: (
      current,
      subCurrent,
      root,
      { family, name, degrees, alterations },
      selectedRoot,
      selectedQuality
    ) => {
      return (
        root === selectedRoot &&
        family === selectedQuality.family &&
        _.isEqual(alterations, selectedQuality.alterations)
      );
    },
  },
  //   // Chord Chemistry 11.II
  //   // Needs to insert another chord...
  // {
  //   id: "Chord Chemistry 11.II",
  //   description: (
  //     <span>
  //       <blockquote>
  //           For a dominant 7th chord, you may play a m7 type chord whose root is a 5th higher than the root of the dominant chord,
  //         <footer>
  //           —{" "}
  //           <a href="https://amzn.to/2YQ8xYM">
  //             Ted Greene in <em>Chord Chemistry</em>
  //           </a>
  //         </footer>
  //       </blockquote>
  //     </span>
  //   ),
  //   test: (
  //     current,
  //     subCurrent,
  //     root,
  //     { family, name, degrees, alterations },
  //     selectedRoot,
  //     selectedQuality
  //   ) => {
  //     return (
  //       root === selectedRoot &&
  //       family === selectedQuality.family &&
  //       _.isEqual(alterations, selectedQuality.alterations)
  //     );
  //   }
  // },
  // Chord Chemistry 11.III
  {
    id: "Chord Chemistry 11.IIIa",
    description: (
      <span>
        <blockquote>
          Dominant chords with altered tones ... can be used effectively ...
          when the <em>next</em> chord is ... one whose root is a 4th higher.
          <footer>
            —{" "}
            <a href="https://amzn.to/2YQ8xYM">
              Ted Greene in <em>Chord Chemistry</em>
            </a>
          </footer>
        </blockquote>
      </span>
    ),
    test: (
      current,
      subCurrent,
      root,
      { family, name, degrees, alterations },
      selectedRoot,
      selectedQuality,
      nextChord
    ) => {
      return (
        roots[_.get(nextChord, "root")] === (roots[root] + 5) % 12 &&
        family === "dominant" &&
        !_.chain(alterations)
          .intersection(["b5", "#5", "b9", "#9"])
          .isEmpty()
          .value()
      );
    },
  },
  {
    id: "Chord Chemistry 11.IIIb",
    description: (
      <span>
        <blockquote>
          Dominant chords with altered tones ... can be used effectively ...
          when the <em>next</em> chord is ... one whose root is a 1/2 step
          lower.
          <footer>
            —{" "}
            <a href="https://amzn.to/2YQ8xYM">
              Ted Greene in <em>Chord Chemistry</em>
            </a>
          </footer>
        </blockquote>
      </span>
    ),
    test: (
      current,
      subCurrent,
      root,
      { family, name, degrees, alterations },
      selectedRoot,
      selectedQuality,
      nextChord
    ) => {
      return (
        roots[_.get(nextChord, "root")] + 1 === roots[root] &&
        family === "dominant" &&
        !_.chain(alterations)
          .intersection(["b5", "#5", "b9", "#9"])
          .isEmpty()
          .value()
      );
    },
  },
  {
    id: "Chord Chemistry 11.IIIc",
    description: (
      <span>
        <blockquote>
          Dominant chords with altered tones ... can be used effectively ...
          when the <em>next</em> chord is ... a minor type chord with the same
          root. lower.
          <footer>
            —{" "}
            <a href="https://amzn.to/2YQ8xYM">
              Ted Greene in <em>Chord Chemistry</em>
            </a>
          </footer>
        </blockquote>
      </span>
    ),
    test: (
      current,
      subCurrent,
      root,
      { family, name, degrees, alterations },
      selectedRoot,
      selectedQuality,
      nextChord
    ) => {
      return (
        roots[_.get(nextChord, "root")] === roots[root] &&
        family === "dominant" &&
        !_.chain(alterations)
          .intersection(["b5", "#5", "b9", "#9"])
          .isEmpty()
          .value() &&
        _.get(nextChord, "quality.family") === "minor"
      );
    },
  },
  {
    id: "Guitar Style Major Chords",
    description: (
      <span>
        <blockquote>
          [For major chords], substitute relative minor or secondary relative
          minor chords.
          <footer>
            —{" "}
            <a href="https://amzn.to/2YNsYcG">
              Joe Pass in <em>Guitar Style</em>
            </a>
          </footer>
        </blockquote>
      </span>
    ),
    test: (
      current,
      subCurrent,
      root,
      { family, name, degrees, alterations },
      selectedRoot,
      selectedQuality,
      nextChord
    ) => {
      let relative = roots[root] === (roots[selectedRoot] + 4) % 12;
      let secondaryRelative = roots[root] === (roots[selectedRoot] + 9) % 12;
      return (
        (relative || secondaryRelative) &&
        selectedQuality.family === "major" &&
        family === "minor" &&
        _.isEmpty(alterations)
      );
    },
  },
  {
    id: "Guitar Style Minor Chords",
    description: (
      <span>
        <blockquote>
          [For minor chords], substitute relative major chords.
          <footer>
            —{" "}
            <a href="https://amzn.to/2YNsYcG">
              Joe Pass in <em>Guitar Style</em>
            </a>
          </footer>
        </blockquote>
      </span>
    ),
    test: (
      current,
      subCurrent,
      root,
      { family, name, degrees, alterations },
      selectedRoot,
      selectedQuality,
      nextChord
    ) => {
      return (
        roots[root] === (roots[selectedRoot] + 3) % 12 &&
        selectedQuality.family === "minor" &&
        family === "major" &&
        _.isEmpty(alterations)
      );
    },
  },
  {
    id: "Guitar Style Seventh Chords",
    description: (
      <span>
        <blockquote>
          [For seventh chords], substitute dominant minor chords.
          <footer>
            —{" "}
            <a href="https://amzn.to/2YNsYcG">
              Joe Pass in <em>Guitar Style</em>
            </a>
          </footer>
        </blockquote>
      </span>
    ),
    test: (
      current,
      subCurrent,
      root,
      { family, name, degrees, alterations },
      selectedRoot,
      selectedQuality,
      nextChord
    ) => {
      return (
        roots[root] === (roots[selectedRoot] + 7) % 12 &&
        selectedQuality.family === "dominant" &&
        family === "minor" &&
        _.isEmpty(alterations)
      );
    },
  },
];
