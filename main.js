import {
  calculateProjectedPointsByFrame,
  calculateRotationFrames,
} from "./functions.js";
import "./style.css";

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

// requestAnimationFrame(draw);

// console.debug("Creating worker");
// const worker = new Worker("/worker/index.js", { type: "module" });
// worker.addEventListener("error", (event) => {
//   console.error("Worker:", event.error);
//   // throw event.error;
// });
// worker.addEventListener("message", (event) => {
//   console.log("Worker:", event.data);
// });
// console.debug("Worker created");
// worker.postMessage("start");
// console.debug("Worker started");

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
 * @param {[number[], number]} param0
 * @param {Point2d[]} framePoints
 * @returns {[number[], number]}
 */
function reducer([deltas, previousX], framePoints) {
  // Get x of first point in every frame
  const [x] = framePoints[0];

  const delta = x - previousX;
  deltas.push(delta);
  return [deltas, x];
}

// Look at the deltas for the first point x coordinate over time
const deltas = projectedPointsByFrame.reduce(reducer, [[], 0]);
console.debug("Deltas", deltas);
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
