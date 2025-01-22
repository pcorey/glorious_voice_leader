import "lodash.combinations";
import "lodash.product";
import React from "react";
import _ from "lodash";
import styled from "styled-components";
import { roots } from "./roots.js";
import { qualities } from "./qualities.js";
import { Checkbox } from "semantic-ui-react";
import { Dropdown } from "semantic-ui-react";
import { Slider } from "react-semantic-ui-range";

const Wrapper = styled.div`
  width: 1000px;
  margin: 2rem auto;
`;

const Table = styled.table`
  width: 100%;
  & td:first-of-type {
    width: 10rem;
    line-height: 2.75;
  }
  margin: 2rem 0;
`;

const Label = styled.label`
  font-weight: bold;
  color: #999;
  line-height: 1.6;
`;

const Roots = styled.div`
  margin: 1rem 0;
  & > div {
    margin: none;
  }
`;

const Optionals = styled.div`
  display: flex;
  justify-content: space-between;
  & > label {
    font-weight: bold;
    color: #999;
  }
`;

const Row = styled.div`
  display: flex;
  align-items: baseline;
  padding: 1rem;
  &:nth-child(even) {
    background-color: #f8f8f8;
  }
`;

const Root = styled.span`
  font-weight: bold;
  width: 3rem;
  text-align: center;
`;

const Names = styled.span`
  flex: 1;
  flex-wrap: wrap;
  display: flex;
  align-items: flex-start;
  // justify-content: space-between;
`;

const Name = styled.span`
  // border: 1px solid tomato;
  // margin: 0 0.5rem;
  // font-size: 0.75rem;
  line-height: 1.5rem;
  // margin: 0 1rem;
  margin-left: 1ex;
  white-space: nowrap;
  // font-family: monospace;
  color: #999;
  // flex-basis: 8%;
  &:after {
    content: ", ";
  }

  &:last-of-type:after {
    content: "";
  }
`;

const getChordNames = (notes) =>
  _.chain(qualities)
    // .filter(quality => _.isEmpty(quality.missing))
    .filter((quality) => _.size(quality.quality) === 4)
    .flatMap((quality) =>
      _.map(Object.keys(roots), (root) => {
        return {
          root,
          quality,
        };
      })
    )
    .filter(({ root, quality }) => {
      if (_.isEmpty(notes)) {
        return false;
      }
      let chordNotes = _.chain(notes)
        .uniq()
        .sortBy(_.identity)
        .value();
      let qualityNotes = _.chain(quality.quality)
        .map((note) => (roots[root] + note) % 12)
        .sortBy(_.identity)
        .value();
      return _.isEqual(chordNotes, qualityNotes);
    })
    // .map(({ root, quality }) => {
    //   return `${root}${quality.name}`;
    // })
    .sortBy(({ quality }) => quality.name)
    .value();

const Harmonizer = ({ getVoicings, getSubstitutions }) => {
  // let scale = [0, 2, 4, 7, 9];
  let scale = [0, 2, 4, 5, 7, 9, 11];
  // let scale = [0, 3, 6, 9];
  // let scale = [0, 2, 3, 5, 6];

  let noteSets = _.flatMap(_.range(3, 6 + 1), (length) =>
    _.combinations(scale, length)
  );

  let chordNames = _.chain(noteSets)
    .tap(console.log)
    .map((noteSet) => getChordNames(noteSet))
    .flatten()
    .value();

  // let range = scale;
  let range = _.range(0, 12);

  return (
    <Wrapper>
      <Table>
        <tr>
          <td>
            <Label>Scale notes:</Label>
          </td>
          <td>
            <Dropdown
              placeholder="Scale notes"
              fluid
              multiple
              search
              selection
              options={_.chain(_.toPairs(roots))
                .groupBy(_.last)
                .map((roots) => {
                  return [
                    _.chain(roots)
                      .map(_.first)
                      .join("/")
                      .value(),
                    _.last(roots[0]),
                  ];
                })
                .map(([root, value]) => {
                  return {
                    key: root,
                    text: root,
                    value,
                  };
                })
                .value()}
            />
          </td>
        </tr>
        <tr>
          <td>
            <Label>Optional degrees:</Label>
          </td>
          <td>
            <Optionals>
              {_.chain([
                [1, "root"],
                [3, "3rd"],
                [5, "5th"],
                [7, "7th"],
                [9, "9th"],
                [11, "11th"],
                [13, "13th"],
              ])
                .map(([note, label]) => {
                  return <Checkbox label={label} />;
                })
                .value()}
            </Optionals>
          </td>
        </tr>
        <tr>
          <td>
            <Label>Chord size:</Label>
          </td>
          <td>
            <Slider
              style={{ trackFill: { backgroundColor: "#eee" } }}
              discrete
              value={7}
              settings={{
                min: 3,
                max: 7,
                step: 1,
                // onChange: onChangeFrets
              }}
            />
          </td>
        </tr>
      </Table>
      {_.chain(range)
        .map((note) =>
          _.chain(_.toPairs(roots))
            .filter(([name, root]) => note === root)
            .map((root) => _.first(root))
            .join("/")
            .value()
        )
        // .map(root => _.first(root))
        .map((root) => (
          <Row>
            <Root>{root}</Root>
            <Names>
              {_.chain(chordNames)
                .filter(
                  (chord) =>
                    chord.root ===
                    _.chain(root)
                      .split("/")
                      .first()
                      .value()
                )
                .map(({ root, quality }) => <Name>{`${quality.name}`}</Name>)
                .value()}
            </Names>
          </Row>
        ))
        .value()}
    </Wrapper>
  );
};

export default Harmonizer;
