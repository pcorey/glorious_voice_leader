import _ from "lodash";
import getVoicings from "../voicings";
import { roots } from "../roots";

export const workerGetVoicings = ({
  chord,
  tuning,
  allowOpen,
  frets,
  maxReach,
  capo
}) => {
  let result = _.chain(chord.quality)
    .get("quality")
    .map(base => (base + roots[chord.root]) % 12)
    .thru(quality =>
      getVoicings(
        quality,
        chord.notes,
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
