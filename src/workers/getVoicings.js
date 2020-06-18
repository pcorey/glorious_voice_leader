import _ from "lodash";
import getVoicings from "../voicings";
import { roots } from "../roots";

export const workerGetVoicings = ({
  // chord,
  quality,
  root,
  tuning,
  allowOpen,
  frets,
  maxReach,
  capo
}) => {
  let result = _.chain(quality)
    .get("quality")
    .map(base => (base + roots[root]) % 12)
    .thru(quality =>
      getVoicings(
        quality,
        // chord.notes,
        tuning,
        allowOpen,
        frets,
        maxReach,
        capo
      )
    )
    .uniqWith(_.isEqual)
    .value();
  return result;
};
