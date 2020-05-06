import React from "react";
import _ from "lodash";
import getSubstitutions from "./getSubstitutions.js";
import styled from "styled-components";
import { Button } from "semantic-ui-react";
import { Dropdown } from "semantic-ui-react";
import { Icon } from "semantic-ui-react";
import { qualities } from "./qualities";

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

const keys = [
  { text: "C", value: 0, key: "C" },
  { text: "C#", value: 1, key: "C#" },
  { text: "Db", value: 1, key: "Db" },
  { text: "D", value: 2, key: "D" },
  { text: "D#", value: 3, key: "D#" },
  { text: "Eb", value: 3, key: "Eb" },
  { text: "E", value: 4, key: "E" },
  { text: "F", value: 5, key: "F" },
  { text: "F#", value: 6, key: "F#" },
  { text: "Gb", value: 6, key: "Gb" },
  { text: "G", value: 7, key: "G" },
  { text: "G#", value: 8, key: "G#" },
  { text: "Ab", value: 8, key: "Ab" },
  { text: "A", value: 9, key: "A" },
  { text: "A#", value: 10, key: "A#" },
  { text: "Bb", value: 10, key: "Bb" },
  { text: "B", value: 11, key: "B" }
];

const Controls = ({
  tuning,
  chord,
  sharps,
  onChangeRoot,
  onChangeQuality,
  onClickAdd,
  onClickRemove
}) => {
  const noteNames = sharps
    ? ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    : ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

  const onClickAlternate = alternate => event => {
    onChangeRoot(alternate.root, true);
    onChangeQuality(_.omit(alternate.quality, "value"), true);
    return false;
  };

  return (
    <Wrapper>
      <Row>
        <div style={{ flex: 0, marginRight: "0.5rem" }}>
          <strong
            style={{
              display: "block",
              margin: "0 0.5rem 0.5rem 0",
              textAlign: "left"
            }}
          >
            Root:
            <br />
          </strong>
          <Dropdown
            search
            placeholder="Root"
            selection
            options={keys}
            value={chord.root}
            onChange={(event, { value }) => onChangeRoot(value)}
            style={{
              minWidth: "auto",
              minHeight: "auto",
              width: "100%",
              margin: 0
            }}
          />
        </div>
        <div style={{ flex: 1, marginRight: "0.5rem" }}>
          <strong
            style={{
              display: "block",
              margin: "0 0.5rem 0.5rem 0",
              textAlign: "left"
            }}
          >
            Quality:
            <br />
          </strong>
          <Dropdown
            search
            placeholder="Qualities"
            selection
            options={qualities}
            value={JSON.stringify(chord.quality)}
            onChange={(event, { value }) => onChangeQuality(JSON.parse(value))}
            style={{
              minWidth: "auto",
              minHeight: "auto",
              width: "100%",
              margin: 0
            }}
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
      <Row>
        <p style={{ margin: "1rem 0" }}>
          <strong>Other names:</strong>{" "}
          {_.chain(
            getSubstitutions(
              _.map(
                chord.notes,
                ([string, fret]) => (tuning[string] + fret) % 12
              ),
              chord.quality
            )
          )
            .map((alternate, i, list) => {
              return (
                <React.Fragment key={i}>
                  <Link onClick={onClickAlternate(alternate)}>
                    {noteNames[alternate.root]}
                    {alternate.quality.name}
                  </Link>
                  {i !== _.size(list) - 1 ? ", " : ""}
                </React.Fragment>
              );
            })
            .value()}
        </p>
      </Row>
    </Wrapper>
  );
};

export default Controls;
