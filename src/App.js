import "semantic-ui-css/semantic.min.css";
import Chart from "./Chart";
import Controls from "./Controls";
import Fretboard from "./Fretboard";
import React from "react";
import _ from "lodash";
import pako from "pako";
import qualities from "./qualities";
import styled from "styled-components";
import tunings from "./tunings";
import voicings from "./voicings";
import { Button } from "semantic-ui-react";
import { Dropdown } from "semantic-ui-react";
import { Form } from "semantic-ui-react";
import { Icon } from "semantic-ui-react";
import { Radio } from "semantic-ui-react";
import { Select } from "semantic-ui-react";
import { Slider } from "react-semantic-ui-range";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import { useWindowSize } from "@react-hook/window-size";

const v = "1.0.0";

const note = (string, fret, tuning) => {
  return (tuning[_.size(tuning) - 1 - string] + fret) % 12;
};

const noteName = (string, fret, sharps, tuning) => {
  return (sharps
    ? ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    : ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"])[
    note(string, fret, tuning)
  ];
};

const Page = styled.div`
  display: flex;
  height: 100vh;
  max-height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const Left = styled.div`
  flex: 2;
  background-color: #f8f8f8;
  padding: 0 2rem;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
  overflow: auto;
`;

const Right = styled.div`
  flex: 0;
  padding: 1em;
  background-color: white;
`;

const Settings = styled.div`
  padding: 1rem;
  background-color: #eee;
`;

const Title = styled.h1`
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
  font-weight: 100;
  text-transform: uppercase;
  padding-top: 4rem;
  margin-bottom: 0;
`;

const Subtitle = styled.p`
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
  font-weight: normal;
  margin: 1rem 0 2rem;
`;

const Charts = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-gap: 0;
  grid-auto-flow: row dense;
`;

const Add = styled.div`
  flex-basis: 100%;
  background-color: #f8f8f8;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
  padding: 1rem;
`;

const FretSizeContext = React.createContext({ height: 0, width: 0 });

const App = ({
  hash: {
    allowOpen: initialAllowOpen,
    sharps: initialSharps,
    tuning: initialTuning,
    chords: initialChords,
    frets: initialFrets,
    maxReach: initialMaxReach,
    capo: initialCapo
  }
}) => {
  let urlParams = new URLSearchParams(window.location.search);

  let [allowOpen, setAllowOpen] = useState(initialAllowOpen);
  let [tuning, setTuning] = useState(initialTuning);
  let [settings, setSettings] = useState(false);
  let [maxReach, setMaxReach] = useState(initialMaxReach);
  let [capo, setCapo] = useState(initialCapo);
  let [windowWidth, windowHeight] = useWindowSize();
  let [sharps, setSharps] = useState(initialSharps);
  let [selected, setSelected] = useState(0);
  let [frets, setFrets] = useState(initialFrets);
  let [fretHeight, setFretHeight] = useState(undefined);
  let [fretWidth, setFretWidth] = useState(undefined);
  let [chords, setChords] = useState(initialChords);

  const onChangeRoot = (event, { value: root }) => {
    chords.splice(selected, 1, { ...chords[selected], root, notes: [] });
    setChords([...chords]);
  };
  const onChangeQualities = (event, { value: qualities }) => {
    chords.splice(selected, 1, {
      ...chords[selected],
      qualities: _.map(qualities, JSON.parse),
      notes: []
    });
    setChords([...chords]);
  };
  const onClickAdd = () => {
    chords.splice(selected + 1, 0, {
      key: Math.random(),
      qualities: [],
      notes: [],
      voicings: []
    });
    setChords([...chords]);
    setSelected(selected + 1);
  };
  const onClickRemove = () => {
    if (_.size(chords) > 1) {
      chords.splice(selected, 1);
      setSelected(Math.max(0, selected - 1));
      setChords([...chords]);
    } else {
      setChords([
        {
          key: Math.random(),
          root: null,
          qualities: [],
          notes: []
        }
      ]);
    }
  };

  const onClickFret = ({ string, fret }, e) => {
    if (
      _.chain(chords[selected].notes)
        .map(a => JSON.stringify(a))
        .includes(JSON.stringify([string, fret]))
        .value()
    ) {
      chords.splice(selected, 1, {
        ...chords[selected],
        notes: _.reject(
          chords[selected].notes,
          v => JSON.stringify(v) === JSON.stringify([string, fret])
        )
      });
      setChords([...chords]);
    } else if (
      _.chain(chords[selected].notes)
        .map(([string, fret]) => string)
        .includes(string)
        .value()
    ) {
      chords.splice(selected, 1, {
        ...chords[selected],
        notes: [
          ..._.reject(
            chords[selected].notes,
            ([_string, fret]) => _string === string
          ),
          [string, fret]
        ]
      });
      setChords([...chords]);
    } else {
      chords.splice(selected, 1, {
        ...chords[selected],
        notes: [...chords[selected].notes, [string, fret]]
      });
      setChords([...chords]);
    }
  };

  const onKeyUp = event => {
    switch (event.key) {
      case "ArrowRight":
        setSelected(Math.min(selected + 1, _.size(chords) - 1));
        break;
      case "ArrowLeft":
        setSelected(Math.max(selected - 1, 0));
        break;
      case "+":
        onClickAdd();
        break;
      case "-":
        if (_.isEmpty(chords[selected].notes)) {
          onClickRemove();
        } else {
          chords.splice(selected, 1, {
            ...chords[selected],
            notes: []
          });
          setChords([...chords]);
        }
        break;
      default:
        break;
    }
  };

  const onChangeTuning = (event, { value: tuning }) => {
    let chords = [
      {
        key: Math.random(),
        root: undefined,
        qualities: [],
        notes: []
      }
    ];
    setTuning(JSON.parse(tuning));
    setChords(chords);
  };

  const onChangeSharps = sharps => {
    setSharps(sharps);
  };

  const onChangeAllowOpen = allowOpen => {
    setAllowOpen(allowOpen);
  };

  const onChangeFrets = frets => {
    setFrets(frets);
  };

  const onChangeMaxReach = maxReach => {
    setMaxReach(maxReach);
  };

  const onChangeCapo = capo => {
    setCapo(capo);
  };

  useEffect(() => {
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [selected, chords]);

  useEffect(() => {
    _.chain({
      v,
      allowOpen,
      tuning,
      maxReach,
      capo,
      windowWidth,
      sharps,
      frets,
      chords
    })
      .thru(JSON.stringify)
      .thru(data => pako.deflate(data, { to: "string" }))
      .thru(btoa)
      .thru(state => window.history.pushState(null, null, `#${state}`))
      .value();
  }, [
    allowOpen,
    tuning,
    maxReach,
    capo,
    windowWidth,
    sharps,
    selected,
    frets,
    chords
  ]);

  return (
    <FretSizeContext.Provider value={{ height: 0, width: 0 }}>
      <Page>
        <Left>
          <Title>
            {urlParams.has("title")
              ? urlParams.get("title")
              : "Glorious Voice Leader"}
            <Button
              icon
              style={{
                float: "right",
                backgroundColor: settings ? "#eee" : "#f8f8f8",
                borderRadius: 0,
                marginRight: 0
              }}
              onClick={() => setSettings(!settings)}
            >
              <Icon name="cog" />
            </Button>
          </Title>
          {settings && (
            <Settings>
              <p>
                These settings affect every chord in your progression, such as
                changing the tuning of your instrument, or changing the number
                of frets you can comfortably reach on your instrument.
              </p>
              <Dropdown
                inline
                placeholder="Tuning"
                options={tunings}
                defaultValue={JSON.stringify(tuning)}
                onChange={onChangeTuning}
              />
              <br />
              <br />
              <Form.Group>
                <Form.Field>
                  <Radio
                    label="Show accidentals as sharps (♯)"
                    checked={sharps}
                    onChange={() => onChangeSharps(true)}
                  />
                </Form.Field>
                <Form.Field>
                  <Radio
                    label="Show accidentals as flats (♭)"
                    checked={!sharps}
                    onChange={() => onChangeSharps(false)}
                  />
                </Form.Field>
              </Form.Group>
              <br />

              <Form.Group>
                <Form.Field>
                  <Radio
                    label="Don't allow open strings in higher voicings"
                    checked={!allowOpen}
                    onChange={() => onChangeAllowOpen(false)}
                  />
                </Form.Field>
                <Form.Field>
                  <Radio
                    label="Allow open strings in higher voicings"
                    checked={allowOpen}
                    onChange={() => onChangeAllowOpen(true)}
                  />
                </Form.Field>
              </Form.Group>

              <br />
              <span style={{ color: "#666" }}>Frets: {frets}</span>
              <Slider
                color="#888"
                discrete
                value={frets}
                settings={{
                  min: 12,
                  max: 24,
                  step: 1,
                  onChange: onChangeFrets
                }}
              />

              <br />
              <span style={{ color: "#666" }}>Max Reach: {maxReach}</span>
              <Slider
                color="#888"
                discrete
                value={maxReach}
                onChange={onChangeMaxReach}
                settings={{
                  min: 0,
                  max: 8,
                  step: 1,
                  onChange: onChangeMaxReach
                }}
              />

              <br />
              <span style={{ color: "#666" }}>Capo: {capo}</span>
              <Slider
                color="#888"
                discrete
                value={capo}
                settings={{ min: 0, max: 24, step: 1, onChange: onChangeCapo }}
              />
            </Settings>
          )}
          <Subtitle>
            Helping you find guitar chord voicings that voice lead smoothly from
            one chord to the next.
          </Subtitle>
          <div style={{ margin: "0 0 3rem 0" }}>
            <Charts>
              {_.map(chords, (chord, i) => {
                return (
                  <>
                    <Chart
                      {...{
                        fretHeight,
                        fretWidth,
                        chord,
                        selected: selected === i,
                        onClick: () => setSelected(i),
                        sharps,
                        tuning
                      }}
                    />
                    {selected === i && (
                      <Controls
                        {...{
                          chord,
                          sharps,
                          onChangeRoot,
                          onChangeQualities,
                          onClickAdd,
                          onClickRemove
                        }}
                      />
                    )}
                  </>
                );
              })}
            </Charts>
          </div>
          <p>
            <strong>Huh?</strong> - Start by picking a root note (like C) and
            quality (like maj7) for your first chord. Click on the fretboard to
            pick the four notes you'd like to start with. Next, add another
            chord. This time make it an Fmaj7. Glorious Voice Leader will darken
            the frets that are used by voicings with the best voice leading from
            the previous Cmaj7. Rinse and repeat! But don't actually rinse.
            Rinsing is bad for computers.{" "}
            <a href="http://www.petecorey.com/blog/2019/09/30/all-hail-glorious-voice-leader/">
              Check out this post
            </a>{" "}
            for a more in-depth rundown and an example progression!
          </p>
          <p>
            <strong>I don't like your recommendations!</strong> - I'm sorry you
            don't share my robot aesthetic. If you'd like a qualified human's
            opinions on chords and chord progressions, I highly recommend you
            pick up Ted Greene's{" "}
            <a href="https://amzn.to/2YQ8xYM">Chord Chemistry</a> and{" "}
            <a href="https://amzn.to/2YWgKur">Modern Chord Progressions</a>.
          </p>
          <p>
            <em>
              Made by <a href="https://twitter.com/petecorey">@petecorey</a>!
            </em>
          </p>
        </Left>
        <Right>
          <Fretboard
            key={JSON.stringify({ windowWidth, windowHeight })}
            {...{
              frets,
              setFretHeight,
              setFretWidth,
              sharps,
              allowOpen,
              tuning,
              maxReach,
              capo,
              chord: chords[selected],
              previousChord: selected > 0 ? chords[selected - 1] : undefined,
              onClickFret
            }}
          ></Fretboard>
        </Right>
      </Page>
    </FretSizeContext.Provider>
  );
};

export default App;
