import _ from "lodash";
import getVoicings from "../voicings.js";
import { roots } from "../roots.js";

export const workerGetVoicings = ({
  // chord,
  quality,
  root,
  tuning,
  allowOpen,
  frets,
  maxReach,
  capo,
  notes,
}) => {
  let result = _.chain(quality)
    .get("quality")
    .map((base) => (base + roots[root]) % 12)
    .thru((quality) =>
      getVoicings(
        quality,
        // chord.notes,
        tuning,
        allowOpen,
        frets,
        maxReach,
        capo,
        frets,
        notes
      )
    )
    .uniqWith(_.isEqual)
    .value();
  return result;
};
