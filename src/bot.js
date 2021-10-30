import _ from "lodash";
import c from "canvas";
import drawChart from "./drawChart.js";
import fs from "fs";
import path from "path";
import voicings from "./voicings.js";
import semitoneDistance from "./semitoneDistance.js";
import clipTopNotes from "./clipTopNotes.js";
import sharp from "sharp";
import irb from "./irb.js";
import { roots } from "./roots.js";
import { qualities } from "./qualities.js";
import { exec } from "child_process";

let moduleURL = new URL(import.meta.url);
let __dirname = path.dirname(moduleURL.pathname);

let gapScale = 1.15;
let maxStretch = 3;
let chartWidth = 80;
let width = chartWidth * 4 * gapScale + chartWidth * 2;
let height = width * (9/16);
let canvas = c.createCanvas(width, height, "svg");
let context = canvas.getContext("2d");

context.quality = "best";
context.antialias = "subpixel";

let tuning = [40, 45, 50, 55, 59, 64];
let progression = [];

// _.chain(irb)
//     .get('charts')
//     .flatMap(chart => chart.content)
//     // .tap(console.log)
//     .flatMap(content => _.flatMap(content, _.identity()))
//     .map('chord')
//     // .tap(console.log)
//     .map(chord => chord.replace('o', 'dim').replace('ø7','m7b5').replace('ø','m7b5').replace('minmaj', 'mM').replace('min','m').replace('7#11', '7/#11').replace('+','aug').replace('69', '6/9').replace(/\*/g, "").replace(/;/g,'').replace('add9', 'maj/9').replace('maj#11', "maj9#11"))
//     .filter(chord => {
//         let [x, root, quality] = chord.match(/^([ABCDEFG][b#]?)(.*?)$/)
//         if (quality == "") {
//             quality = "maj"
//         }
//         return qualities.find(({name}) => name.match(new RegExp(`${quality}( no .*)?`))) == undefined;
//     })
//     .map(chord => {
//         let [x, root, quality] = chord.match(/^([ABCDEFG][b#]?)(.*?)$/)
//         return quality;
//     })
//     .uniq()
//     .reject(quality => quality.includes('/'))
//     // .tap(console.log)
//     .value()

// _.chain(chart)
//     .get('content')
//     .filter((value, key) => /[ABCD]\d?/.test(key))
//     .sample()
//     .take(4)
//     .map('chord')
//     .map(chord => chord.replace('o', 'dim').replace('ø7','m7b5').replace('minmaj', 'mM').replace('min','m').replace('7#11', '7/#11'))
//     .map(chord => {
//         let [x, root, quality] = chord.match(/^([ABCDEFG][b#]?)(.*?)$/)
//         return {root: roots[root], quality: _.get(qualities.find(({name}) => name == quality), 'quality'), chord: chord}
//     })
//     .tap(console.log)
//     .value()


let chords = _.chain(irb)
    .get('charts')
    .filter(chart => {
        return _.isEqual(chart.info.time, [4,4])
    })
    .sample()
    .tap(console.log)
    .get('content')
    .filter((value, key) => /[ABCD]\d?/.test(key))
    .sample()
    .takeRight(4)
    .map('chord')
    .map(chord => chord.replace('o', 'dim').replace('ø7','m7b5').replace('ø','m7b5').replace('minmaj', 'mM').replace('min','m').replace('7#11', '7/#11').replace('+','aug').replace('69', '6/9').replace(/\*/g, "").replace(/;/g,'').replace('add9', 'maj/9').replace('maj#11', "maj9#11"))
    .map(chord => {
        let [x, root, quality] = chord.match(/^([ABCDEFG][b#]?)(.*?)$/)
        quality = qualities.find(({name}) => name.match(new RegExp(`${quality}( no .*)?`)))
        return {root , quality, chord: chord, notes: _.map(quality.quality, note => (roots[root]+note )%12)}
    })
    .tap(console.log)
    .value()

let notesInVoicing = _.chain(chords).map(chord => chord.notes.length).max().value();

// let notes = [
//   [1, 3],
//   [2, 2],
//   [3, 0],
//   [4, 0]
// ];

let maxFrets = 12;

let notes = _.sample(
    voicings([0, 4, 7, 11], tuning, false, maxFrets, maxStretch, 0, maxFrets,notesInVoicing)
);

progression = _.reduce(
  chords,
  ([prevNotes, chords], chord, key) => {
    let notes2 = _.chain(
        voicings(chord.notes, tuning, false, maxFrets, maxStretch, 0, maxFrets,notesInVoicing)
    )
      .map(voicing => {
        return [
          _.chain(_.zip(_.map(prevNotes, _.first), _.map(voicing, _.first)))
            .map(([s1, s2]) => Math.abs(s1 - s2))
            .sum()
            .value(),
            semitoneDistance({ notes: prevNotes }, tuning, clipTopNotes)(voicing) || 0.1,
          voicing
        ];
      })
      .sortBy(_.first)
      .sortBy(([, n]) => n)
      .first()
      .last()
      .value();
    return [
      notes2,
      [
        ...chords,
        {
          ...chord,
          key,
          notes: notes2
        }
      ]
    ];
  },
  [notes, []]
)[1];

// console.log(progression);

let heights = progression.map((chord, i) => {
  return drawChart(
    canvas,
    context,
    tuning,
    chartWidth,
    Math.floor(chartWidth / 5),
    Math.floor(chartWidth / 7),
    chord,
    chartWidth + chartWidth * i,
    chartWidth
  );
});

let maxHeight = _.max(heights)

// canvas.height = _.max(heights) + chartWidth * 2;

context.fillStyle = "white";
context.fillRect(0, 0, canvas.width, canvas.height);

progression.map((chord, i) => {
  return drawChart(
    canvas,
    context,
    tuning,
    chartWidth,
    Math.floor(chartWidth / 5),
    Math.floor(chartWidth / 7),
    chord,
    chartWidth + chartWidth * i * gapScale,
    height/2 - maxHeight/2
  );
});

// let filename = `${__dirname}/../out/${new Date().getTime()}.png`;
let filename = `${__dirname}/../out/out.png`;
let out = fs.createWriteStream(filename);
let stream = canvas.createPNGStream();
stream.pipe(out);
out.on("finish", () => console.log(`${filename} was written.`));

let buffer = canvas.toBuffer();
fs.writeFileSync(`${__dirname}/../out/svg.svg`, buffer);

exec('convert -density 200 out/svg.svg out/png.png', () => {
    console.log('done converting');
})

// sharp(buffer)
//   .png()
//   .toFile(`${__dirname}/../out/png.png`, (err, res) => {
//     if (err) {
//       console.log(error);
//     }
//   });
