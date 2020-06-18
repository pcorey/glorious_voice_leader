import React from "react";
import _ from "lodash";
import styled from "styled-components";
import { Button } from "semantic-ui-react";
import { Icon } from "semantic-ui-react";
import { Popup } from "semantic-ui-react";
import { Search } from "semantic-ui-react";
import { qualities } from "./qualities";
import { roots } from "./roots";
import { substitutions } from "./substitutions";
import { useEffect } from "react";
import { useState } from "react";

const substitutionMap = _.keyBy(substitutions, "id");

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: auto;
  background-color: #eee;
  grid-column: 1 / span 6;
  padding: 1rem;
  align-items: flex-end;
  margin-bottom: 1rem;
`;

const Row = styled.div`
  display: flex;
  width: 100%;
  align-items: flex-end;
`;

const Link = styled.a`
  cursor: pointer;
`;

const resultRenderer = ({ json }) => {
  let chord = JSON.parse(json);
  return (
    <div key={json} style={{ display: "flex" }}>
      <strong style={{ flex: "1", color: "#333" }}>
        {chord.root}
        {chord.quality.name}
      </strong>
      <span style={{ color: "#666" }}>{chord.quality.formula}</span>
    </div>
  );
};

const Controls = ({
  tuning,
  chord,
  sharps,
  allowPartialQualities,
  previousChord,
  nextChord,
  onClickAdd,
  onClickRemove,
  onClickChord,
  getSubstitutions
}) => {
  let [possibleSubstitutions, setPossibleSubstitutions] = useState(undefined);
  let [searchString, setSearchString] = useState(
    chord.root && chord.quality ? `${chord.root}${chord.quality.name}` : ""
  );
  let [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let possibleSubstitutions = await getSubstitutions({
        chord,
        tuning,
        allowPartialQualities,
        sharps,
        previousChord,
        nextChord
      });
      setPossibleSubstitutions(possibleSubstitutions);
      setLoading(false);
    };
    fetch();
  }, [
    chord,
    tuning,
    allowPartialQualities,
    sharps,
    previousChord,
    nextChord,
    getSubstitutions
  ]);

  const split = string => {
    return _.reject(
      string.match(/^[A-Z]b?#?|sus|maj|mM|m|alt|dim|b\d|#\d|\/|\d+|/g),
      _.isEmpty
    );
  };
  let inputParts = split(searchString);

  const searchResults = _.chain(qualities)
    .filter(quality => allowPartialQualities || _.isEmpty(quality.missing))
    .flatMap(quality =>
      _.map(Object.keys(roots), root => {
        return {
          root,
          quality
        };
      })
    )
    .map(({ root, quality }) => {
      let chordParts = split(`${root}${quality.name}`);
      return {
        chordParts,
        root,
        quality
      };
    })
    .filter(({ chordParts }) => {
      if (_.isEmpty(inputParts)) {
        return false;
      }
      return _.chain(inputParts)
        .intersection(chordParts)
        .isEqual(inputParts)
        .value();
    })
    .sortBy(({ chordParts }) => {
      return _.size(chordParts) - _.size(inputParts);
    })
    .map(({ root, quality }) => {
      return {
        json: JSON.stringify({ root, quality })
      };
    })
    .value();

  const onClickAlternate = alternate => event => {
    onClickChord(alternate, [
      {
        root: chord.root,
        quality: chord.quality,
        name: chord.quality.name
      },
      ...chord.previousSubstitutions
    ]);
    return false;
  };

  const Substitution = ({ substitution }) => {
    let [open, setOpen] = useState(false);
    let scoreString =
      substitution.score === 0
        ? `±0`
        : substitution.score >= 0
        ? `+${Math.abs(substitution.score)}`
        : `-${Math.abs(substitution.score)}`;
    return (
      <div
        style={{
          backgroundColor: "#fff",
          margin: "1rem 0 0 0",
          padding: "1rem"
        }}
        key={JSON.stringify({
          root: substitution.root,
          quality: substitution.quality
        })}
      >
        <div style={{ display: "flex" }}>
          <Link onClick={onClickAlternate(substitution)}>
            {substitution.root}
            {substitution.quality.name}
          </Link>
          <div style={{ flex: "1", textAlign: "right" }}>
            <Popup
              content="That's the rationale behind this chord substitution?"
              position="top right"
              trigger={
                <Icon
                  name="question"
                  style={{
                    marginRight: "1rem",
                    color: open ? "#666" : "#eee",
                    cursor: "pointer"
                  }}
                  onClick={() => setOpen(!open)}
                />
              }
            />
          </div>
          <Popup
            content={`This substitution has a voicing with ${substitution.score} semitones less movement than your current voicing.`}
            position="top right"
            trigger={
              <span
                style={{
                  padding: "0.25rem 0.5rem",
                  margin: "-0.25rem -0.5rem",
                  backgroundColor: `rgba(0,0,255,${Math.atan(
                    substitution.score * 0.25
                  ) /
                    (Math.PI / 2) /
                    2})`
                }}
              >
                {scoreString}
              </span>
            }
          />
        </div>
        {open &&
          _.map(substitution.substitutions, (substitution, i) => (
            <div key={i} style={{ margin: "1rem" }}>
              {substitution.description}
            </div>
          ))}
      </div>
    );
  };

  return (
    <Wrapper>
      <Row>
        <div style={{ flex: 1, marginRight: "0.5rem" }}>
          <Search
            loading={loading}
            results={searchResults}
            fluid
            placeholder="Search for a chord"
            noResultsMessage="I couldn't find any chords like that."
            noResultsDescription={
              'Roots should be capitalized, like "Cmaj7". Extensions and alterations can come in any order, like "7#5b9" or "7b9#5". If you still can\'t find what you\'re looking for, just ask for it!'
            }
            style={{
              minWidth: "auto",
              minHeight: "auto",
              width: "100%",
              margin: 0
            }}
            resultRenderer={resultRenderer}
            onSearchChange={(event, { value }) => {
              setSearchString(value);
            }}
            onResultSelect={(event, data) => {
              let { root, quality } = JSON.parse(_.get(data, "result.json"));
              setSearchString(`${root}${quality.name}`);
              onClickChord({ root, quality }, []);
            }}
            value={searchString}
          />
        </div>
        <Popup
          content="Add a chord after this one in the progression."
          position="top right"
          trigger={
            <Button
              icon
              style={{
                flex: 0,
                fontSize: "1rem",
                backgroundColor: "#f8f8f8",
                marginRight: "0.5rem"
              }}
              onClick={onClickAdd}
            >
              <Icon name="add circle" />
            </Button>
          }
        />
        <Popup
          content="Remove this chord from the progression."
          position="top right"
          trigger={
            <Button
              icon
              style={{
                flex: 0,
                fontSize: "1rem",
                backgroundColor: "#f8f8f8",
                marginRight: "0"
              }}
              onClick={onClickRemove}
            >
              <Icon name="trash" />
            </Button>
          }
        />
      </Row>
      {!_.isEmpty(chord.previousSubstitutions) && (
        <Row>
          <p style={{ margin: "0 0 -1rem 0", width: "100%" }}>
            <div style={{ margin: "1rem 0" }}>
              {_.chain(chord.previousSubstitutions)
                .map((alternate, i, list) => {
                  return (
                    <React.Fragment key={i}>
                      {i === 0 ? (
                        <Icon name="arrow up" style={{ margin: "0 0.5rem" }} />
                      ) : (
                        <Icon
                          name="arrow left"
                          style={{ margin: "0 0.5rem" }}
                        />
                      )}
                      <Link
                        onClick={() => {
                          onClickChord(
                            alternate,
                            chord.previousSubstitutions.slice(i + 1)
                          );
                        }}
                      >
                        {alternate.root}
                        {alternate.quality.name}
                      </Link>
                    </React.Fragment>
                  );
                })
                .value()}
            </div>
          </p>
        </Row>
      )}
      {!_.isEmpty(possibleSubstitutions) && (
        <Row>
          <div style={{ margin: "1rem 0 0", width: "100%" }}>
            <strong>Possible substitutions:</strong>{" "}
            {_.chain(possibleSubstitutions)
              .map((alternate, i, list) => {
                return <Substitution key={i} substitution={alternate} />;
              })
              .value()}
          </div>
        </Row>
      )}
    </Wrapper>
  );
};

export default Controls;
