import getSubstitutions from "../getSubstitutions";

export const workerGetSubstitutions = ({
  chord,
  tuning,
  allowPartialQualities,
  sharps,
  previousChord,
  nextChord
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
