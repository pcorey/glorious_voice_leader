import React from "react";
import _ from "lodash";
import getSubstitutions from "./getSubstitutions.js";
import styled from "styled-components";
import { Button } from "semantic-ui-react";
import { Icon } from "semantic-ui-react";
import { Search } from "semantic-ui-react";
import { qualities } from "./qualities";
import { roots } from "./roots";
import { useState } from "react";

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
  onChangeRoot,
  onChangeQuality,
  onClickAdd,
  onClickRemove
}) => {
  let [searchString, setSearchString] = useState(
    chord.root && chord.quality ? `${chord.root}${chord.quality.name}` : ""
  );
  let [loading, setLoading] = useState(false);

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
    onChangeRoot(alternate.root, true);
    onChangeQuality(alternate.quality, true);
    return false;
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
              onChangeRoot(root);
              onChangeQuality(quality);
            }}
            value={searchString}
          />
        </div>
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
      </Row>
      {/* <Row>
        <p style={{ margin: "1rem 0" }}>
          <strong>Possible substitutions:</strong>{" "}
          <ul style={{ margin: "1rem 0 0 0" }}>
            {_.chain(
              getSubstitutions(
                _.map(
                  chord.notes,
                  ([string, fret]) => (tuning[string] + fret) % 12
                ),
                chord.quality,
                allowPartialQualities,
                sharps
              )
            )
              .map((alternate, i, list) => {
                return (
                  <React.Fragment key={i}>
                    <li>
                      <Link onClick={onClickAlternate(alternate)}>
                        {alternate.root}
                        {alternate.quality.name}
                      </Link>{" "}
                      - Shares the exact same notes as your current chord.
                    </li>
                  </React.Fragment>
                );
              })
              .value()}
          </ul>
        </p>
      </Row> */}
    </Wrapper>
  );
};

export default Controls;
