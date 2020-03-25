import React from "react";
import _ from "lodash";
import qualities from "./qualities";
import styled from "styled-components";
import tunings from "./tunings";
import voicings from "./voicings";
import { Button } from "semantic-ui-react";
import { Dropdown } from "semantic-ui-react";
import { Icon } from "semantic-ui-react";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";

const Wrapper = styled.div`
  display: flex;
  width: auto;
  background-color: #eee;
  grid-column: 1 / span 6;
  padding: 1rem;
  align-items: flex-end;
  margin-bottom: 1rem;
`;

const Controls = ({
  chord,
  sharps,
  onChangeRoot,
  onChangeQualities,
  onClickAdd,
  onClickRemove
}) => {
  const keys = sharps
    ? [
        { text: "C", value: 0, key: "root-0" },
        { text: "C#", value: 1, key: "root-1" },
        { text: "D", value: 2, key: "root-2" },
        { text: "D#", value: 3, key: "root-3" },
        { text: "E", value: 4, key: "root-4" },
        { text: "F", value: 5, key: "root-5" },
        { text: "F#", value: 6, key: "root-6" },
        { text: "G", value: 7, key: "root-7" },
        { text: "G#", value: 8, key: "root-8" },
        { text: "A", value: 9, key: "root-9" },
        { text: "A#", value: 10, key: "root-10" },
        { text: "B", value: 11, key: "root-11" }
      ]
    : [
        { text: "C", value: 0, key: "root-0" },
        { text: "Db", value: 1, key: "root-1" },
        { text: "D", value: 2, key: "root-2" },
        { text: "Eb", value: 3, key: "root-3" },
        { text: "E", value: 4, key: "root-4" },
        { text: "F", value: 5, key: "root-5" },
        { text: "Gb", value: 6, key: "root-6" },
        { text: "G", value: 7, key: "root-7" },
        { text: "Ab", value: 8, key: "root-8" },
        { text: "A", value: 9, key: "root-9" },
        { text: "Bb", value: 10, key: "root-10" },
        { text: "B", value: 11, key: "root-11" }
      ];

  return (
    <Wrapper>
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
          onChange={onChangeRoot}
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
          Possible qualities:
          <br />
        </strong>
        <Dropdown
          search
          placeholder="Qualities"
          multiple
          selection
          options={qualities}
          value={_.map(chord.qualities, quality => JSON.stringify(quality))}
          onChange={onChangeQualities}
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
    </Wrapper>
  );
};

export default Controls;
