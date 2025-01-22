import getSubstitutions from "../getSubstitutions.js";

const workerGetSubstitutions = ({
  chord,
  tuning,
  allowPartialQualities,
  sharps,
  previousChord,
  nextChord,
}) => {
  return getSubstitutions(
    chord.notes,
    tuning,
    chord.root,
    chord.quality,
    allowPartialQualities,
    sharps,
    previousChord,
    nextChord
  );
};

export default workerGetSubstitutions;
