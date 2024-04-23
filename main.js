import {
  calculateProjectedPointsByFrame,
  calculateRotationFrames,
} from "./functions.js";
import "./style.css";
// import Chart from "chart.js/auto/";
import { Chart } from "chart.js/auto";

/** @typedef {number[][]} Matrix */
/** @typedef {[number, number, number]} Row */
/** @typedef {[Row, Row, Row]} RotationMatrix */
/** @typedef {[number, number, number]} Point3d */
/** @typedef {[number, number]} Point2d */

const svg = document.querySelector("svg");
if (!svg) throw new Error("No svg element found");

const pathElement = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "path"
);
pathElement.setAttribute("stroke", "white");
pathElement.setAttribute("stroke-width", "1");
pathElement.setAttribute("fill", "none");
svg.appendChild(pathElement);

let { width, height } = svg.getBoundingClientRect();
// Update width and height on resize
const observer = new ResizeObserver(([entry]) => {
  width = entry.contentBoxSize[0].inlineSize;
  height = entry.contentBoxSize[0].blockSize;
});

observer.observe(svg);

// Create line element for second experiment
// const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
// line.setAttribute("stroke", "white");
// line.setAttribute("stroke-width", "1");
// line.x1.baseVal.value = width / 2 - 10;
// line.y1.baseVal.value = height / 2 - 10;
// line.x2.baseVal.value = width / 2;
// line.y2.baseVal.value = height / 2;

// svg.appendChild(line);

// Create circle element for first experiment
const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
circle.setAttribute("stroke", "white");
circle.setAttribute("stroke-width", "1");
circle.setAttribute("fill", "none");
circle.setAttribute("r", "10");
// Set id
circle.id = "circle";
circle.cx.baseVal.value = width / 2;
circle.cy.baseVal.value = height / 2;

svg.appendChild(circle);

const rotationFrames = calculateRotationFrames();

console.debug("Calculated frames");

const projectedPointsByFrame = calculateProjectedPointsByFrame(rotationFrames);
console.debug("Calculated projected points by frame", projectedPointsByFrame);

/**
 * @param {"M" | "L"} instruction
 * @param {import("./main").Point2d} point
 * @param {number} relative
 * @returns {string}
 */
export function pointToViewableInstruction(instruction, [x, y], relative) {
  const [adjustedX, adjustedY] = adjustToViewableSpace([x, y], relative);
  return `${instruction} ${adjustedX} ${adjustedY} `;
}
/**
 * @param {import("./main").Point2d} point
 * @param {number} relative
 * @returns {import("./main").Point2d}
 */
export function adjustToViewableSpace([x, y], relative) {
  return [x * relative + width / 2, y * relative + height / 2];
}

/**
 *
 * @param {number} pointIndex
 * @returns {(param0: [number[], number], framePoints: Point2d[]) => [number[], number]}
 */
function reducer(pointIndex) {
  /**
   *
   * @param {[number[], number]} param0
   * @param {Point2d[]} framePoints
   * @returns {[number[], number]}
   */
  return ([deltas, previousX], framePoints) => {
    // Get x of first point in every frame
    const [x] = framePoints[pointIndex];

    const delta = x - previousX;
    deltas.push(delta);
    return [deltas, x];
  };
}
// const pointsCount = projectedPointsByFrame[0].length;
// const framesCount = projectedPointsByFrame.length;

// /**
//  * @type {Point2d[][]}
//  */
// const pointFramesByPoint = new Array(pointsCount).fill([]);

// for (const frame of projectedPointsByFrame) {
//   // For each point
//   for (let index = 0; index < frame.length; index++) {
//     const point = frame[index];

//     pointFramesByPoint[index].push(point);
//   }
// }

// // Look at the deltas for the first point x coordinate over time
// const [deltas] = projectedPointsByFrame.reduce(reducer(0), [[], 0]);

// /** @type {Point2d[][]} */
// const pointsOverTime = new Array(deltas.length).fill([]);

/** @typedef {[x: number[], y: number[]]} Point2dOverTime */
/** 2D points coordinates over time */
class Point2dFrames {
  static #x = 0;
  static #y = 1;
  /**
   * @type {Point2dOverTime[]}
   */
  #points;

  /**
   *
   * @param {number} pointCount
   */
  constructor(pointCount) {
    this.#points = Array.from(new Array(pointCount), () => [[], []]);
  }

  /**
   * Gets the point representation for the frame index which represents the moment in time
   * @param {number} pointIndex
   * @param {number} frameIndex
   * @returns {Point2d}
   */
  getFrame(pointIndex, frameIndex) {
    const x = this.#points[pointIndex][Point2dFrames.#x][frameIndex];
    const y = this.#points[pointIndex][Point2dFrames.#x][frameIndex];
    return [x, y];
  }

  /**
   * Add a frame by providing the point in that moment in time
   * @param {number} pointIndex
   * @param {Point2d} point
   */
  pushFrame(pointIndex, [x, y]) {
    this.#points[pointIndex][Point2dFrames.#x].push(x);
    this.#points[pointIndex][Point2dFrames.#y].push(y);
  }

  /**
   * Generates an SVG path for the value of the points dimension over time.
   * Time is normalized between 0 and 1 to be usable in animation linear timing function.
   * Additionally the path is adjusted to start at 0.5 for y.
   * @param {number} pointIndex
   * @param {number} dimensionIndex
   * @param {number} adjustYOutput
   */
  toPath(pointIndex, dimensionIndex, adjustYOutput = 0.5) {
    // Point frames by dimension
    const framesByDimension = this.#points[pointIndex];
    // Adjust to always start at a 0.5 value for y
    const adjustment = -framesByDimension[dimensionIndex][0] + adjustYOutput;
    const firstY = framesByDimension[dimensionIndex][0];
    const firstYAdjusted = firstY + adjustment;
    let path = `M 0,${firstYAdjusted}`;
    for (
      let frameIndex = 1;
      frameIndex < framesByDimension[dimensionIndex].length;
      frameIndex++
    ) {
      // Normalize index to be between 0 and 1
      const normalized = frameIndex / framesByDimension[dimensionIndex].length;
      const y = framesByDimension[dimensionIndex][frameIndex];
      const adjustedY = y + adjustment;
      path += ` L ${normalized},${adjustedY}`;
    }

    return path;
  }
}

const pointFrames = new Point2dFrames(projectedPointsByFrame[0].length);
for (const frame of projectedPointsByFrame) {
  for (let pointIndex = 0; pointIndex < frame.length; pointIndex++) {
    const point = frame[pointIndex];
    pointFrames.pushFrame(pointIndex, point);
  }
}

const pathXPoint0 = pointFrames.toPath(0, 0);
console.debug("Path x point 0", pathXPoint0);

const xOry = 0;
/**
 * @type {[number[], number[]]}
 */
const start = [[], []];
const points = projectedPointsByFrame.reduce((state, frame) => {
  state[0].push(frame[0][0]);
  state[1].push(frame[0][1]);
  return state;
}, start);
// Adjust path to start at y 0
const adjustment = -points[xOry][0] + 0.5;
const firstX = (points[xOry].shift() || 0) + adjustment;
// Generates a path to be put into https://linear-easing-generator.netlify.app/
const path = points[0].reduce((path, x, index) => {
  const normalized = Math.abs(index / points[0].length);
  const adjustedX = x + adjustment;
  return path + ` L ${normalized},${adjustedX}`;
}, `M 0,${firstX}`);

// console.debug("Bro", path);
// // Remove the jump from the first delta from 0
// deltas.shift();
const chart = new Chart(window.canvas.getContext("2d"), {
  type: "line",
  // data: {
  //   labels: new Array(deltas.length).map((_, i) => i),

  //   data: deltas,
  // },
  data: {
    labels: points[0].map((_, i) => i),
    datasets: [
      // {
      //   label: "Deltas x over time",
      //   data: deltas,
      //   fill: false,
      //   borderColor: "rgb(75, 192, 192)",
      // tension: 0,
      // },
      {
        label: "Points x over time",
        data: points[0],
      },
      // {
      //   label: "Points x over time",
      //   data: pointFramesByPoint[0].map(([y]) => y),
      // },
    ],
  },
  options: {
    elements: {
      line: {
        tension: 0,
      },
    },
  },
});

let frameIndex = 0;
function draw() {
  const projectedPoints = projectedPointsByFrame[frameIndex];
  // Translate points into viewable space that might have changed since last frame
  const relative = Math.min(width, height);

  /**
   *
   * @param {"M" | "L"} instruction
   * @param {Point2d} point
   * @returns
   */
  const toInstruction = (instruction, point) =>
    pointToViewableInstruction(instruction, point, relative);

  const path =
    // Move to first point
    // Draw front plane
    toInstruction("M", projectedPoints[0]) +
    toInstruction("L", projectedPoints[1]) +
    toInstruction("L", projectedPoints[2]) +
    toInstruction("L", projectedPoints[3]) +
    toInstruction("L", projectedPoints[0]) +
    // Draw back plane
    toInstruction("M", projectedPoints[4]) +
    toInstruction("L", projectedPoints[5]) +
    toInstruction("L", projectedPoints[6]) +
    toInstruction("L", projectedPoints[7]) +
    toInstruction("L", projectedPoints[4]) +
    // Connect points of two plains with lines
    toInstruction("M", projectedPoints[0]) +
    toInstruction("L", projectedPoints[4]) +
    toInstruction("M", projectedPoints[1]) +
    toInstruction("L", projectedPoints[5]) +
    toInstruction("M", projectedPoints[2]) +
    toInstruction("L", projectedPoints[6]) +
    toInstruction("M", projectedPoints[3]) +
    toInstruction("L", projectedPoints[7]);

  pathElement.setAttribute("d", path);

  // Increase frame index
  frameIndex++;
  if (frameIndex === rotationFrames.length) {
    frameIndex = 0;
  }

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
