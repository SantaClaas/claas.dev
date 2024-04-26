import {
  calculateProjectedPointsByFrame,
  calculateRotationFrames,
} from "./functions.js";
import {
  processSvgData,
  simplifyDouglasPeucker,
  toFriendlyLinearCode,
  toLinearSyntax,
} from "./linear-easing-generator/index.js";
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

// Create line element for second experiment
// const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
// line.setAttribute("stroke", "white");
// line.setAttribute("stroke-width", "1");
// line.x1.baseVal.value = width / 2 - 10;
// line.y1.baseVal.value = height / 2 - 10;
// line.x2.baseVal.value = width / 2;
// line.y2.baseVal.value = height / 2;

// svg.appendChild(line);

/**
 *
 * @param {string} id
 * @returns {SVGCircleElement}
 */
function createCircle(id, x = 0, y = 0) {
  // Create circle element for first experiment
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  circle.setAttribute("stroke", "white");
  circle.setAttribute("stroke-width", "1");
  circle.setAttribute("fill", "none");
  circle.setAttribute("r", "10");
  // Set id
  circle.id = id;
  circle.cx.baseVal.value = x ? x : width / 2;
  circle.cy.baseVal.value = y ? y : height / 2;

  return circle;
}

const rotationFrames = calculateRotationFrames();

const projectedPointsByFrame = calculateProjectedPointsByFrame(rotationFrames);
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
export class Point2dFrames {
  static #x = 0;
  static #y = 1;
  /**
   * @type {Point2dOverTime[]}
   */
  #points;

  get length() {
    return this.#points.length;
  }

  /**
   * @param {number} index
   * @returns {Point2dOverTime | undefined}
   */
  at(index) {
    return this.#points.at(index);
  }

  get framesCount() {
    return this.#points[0][0].length;
  }

  /**
   *
   * @param {number} pointCount
   */
  constructor(pointCount) {
    this.#points = Array.from({ length: pointCount }, () => [[], []]);
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

  [Symbol.iterator]() {
    return this.#points[Symbol.iterator]();
  }

  /**
   * Generates an SVG path for the value of the points dimension over time.
   * Time is normalized between 0 and 1 to be usable in animation linear timing function.
   * Additionally the path is adjusted to start at 0.5 for y.
   * Can be put into https://linear-easing-generator.netlify.app/
   * @param {number} pointIndex
   * @param {number} dimensionIndex
   * @returns {string}
   */
  toEasingPath(pointIndex, dimensionIndex) {
    // Point frames by dimension
    const framesByDimension = this.#points[pointIndex];
    const dimension = framesByDimension[dimensionIndex];
    // Max value in dimension
    const max = Math.max(...dimension);
    const min = Math.min(...dimension);
    /**
     * Maps a value in a range to a value to a value in another range by its relative position between the min and max
     * In this case the first range is min and max of the values the dimension can take and the second range is 0 and 1
     * for the animation easing curve.
     * @param {number} value
     * @returns {number}
     */
    const map = (value) => (value - min) / (max - min); /* * (1-0) + 0 */
    const firstY = dimension[0];
    const firstYAdjusted = map(firstY);
    const dimensionFrameCount = dimension.length;
    let path = `M 0,${firstYAdjusted}`;
    for (let frameIndex = 1; frameIndex < dimensionFrameCount; frameIndex++) {
      // Normalize index to be between 0 and 1
      const normalizedX = frameIndex / dimensionFrameCount;
      const y = dimension[frameIndex];
      const adjustedY = y;
      // Set animation curve to move between the bounds as in 0 and 1 on y (the easing curve)
      // Normalize y between 0 and 1
      const normalizedY = map(adjustedY);

      path += ` L ${normalizedX},${normalizedY}`;
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

/**
 * @param {string} path
 * @param {string} easingName
 * @returns {string}
 */
function createPathStyle(path, easingName) {
  const data = processSvgData(path);
  const simplified = simplifyDouglasPeucker(data, simplify);
  const syntaxed = toLinearSyntax(simplified, round);
  const friendly = toFriendlyLinearCode(syntaxed, easingName, 0);
  return friendly;
}

const sheet = new CSSStyleSheet();
// Add general rule for circles but without the easing timiming
sheet.insertRule(`
  circle {
    animation-duration: 10s;
    animation-iteration-count: infinite;
  }
`);
// User setting that goes from 0.00001 to 0.025 default 0.0017
const simplify = 0.0017;
// User setting that goes from 2 to 5 default 3
const round = 3;
let index = 0;
const relative = Math.min(width, height);
// Collect paths to draw later
const paths = [];
// Generate lines
/**
 *
 * @param {Point2dOverTime} point1
 * @param {Point2dOverTime} point2
 */
function createLine(point1, point2) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("stroke", "white");
  line.setAttribute("stroke-width", "1");
  line.setAttribute("fill", "none");
  const [xs1, ys1] = point1;
  let [x1, y1] = adjustToViewableSpace([xs1[0], ys1[0]], relative);
  line.x1.baseVal.value = x1;
  line.y1.baseVal.value = y1;
  const [xs2, ys2] = point2;
  let [x2, y2] = adjustToViewableSpace([xs2[0], ys2[0]], relative);
  line.x2.baseVal.value = x2;
  line.y2.baseVal.value = y2;
  return line;
}
const point0 = pointFrames.at(0);
if (!point0) throw new Error("No point found");
const point1 = pointFrames.at(1);
if (!point1) throw new Error("No point found");
const point2 = pointFrames.at(2);
if (!point2) throw new Error("No point found");
const point3 = pointFrames.at(3);
if (!point3) throw new Error("No point found");
const point4 = pointFrames.at(4);
if (!point4) throw new Error("No point found");
const point5 = pointFrames.at(5);
if (!point5) throw new Error("No point found");
const point6 = pointFrames.at(6);
if (!point6) throw new Error("No point found");
const point7 = pointFrames.at(7);
if (!point7) throw new Error("No point found");

/**
 *
 * @param {Point2dOverTime} point
 * @returns {[min: Point2d, max: Point2d]}
 */
function getAdjustedPointBounds(point) {
  const xValues = point[0];
  const yValues = point[1];
  const maxX = Math.max(...xValues);
  const minX = Math.min(...xValues);
  const maxY = Math.max(...yValues);
  const minY = Math.min(...yValues);
  const max = adjustToViewableSpace([maxX, maxY], relative);
  const min = adjustToViewableSpace([minX, minY], relative);

  return [min, max];
}

/**
 *
 * @param {number} index
 * @param {"x" | "y"} dimension
 * @returns {string}
 */
function getPointEasingVariableName(index, dimension) {
  return `--point-${index}-${dimension}-easing`;
}

/**
 * @param {Point2dFrames} pointFrames
 */
function* crateEasingPathStyles(pointFrames) {
  for (let index = 0; index < pointFrames.length; index++) {
    // Create path styles
    const pathX = pointFrames.toEasingPath(index, 0);
    const pathY = pointFrames.toEasingPath(index, 1);

    yield createPathStyle(pathX, getPointEasingVariableName(index, "x"));
    yield createPathStyle(pathY, getPointEasingVariableName(index, "y"));
  }
}

/**
 * @param {Point2dFrames} pointFrames
 */
function* createAnimationStyles(pointFrames) {
  let index = 0;
  for (const point of pointFrames) {
    let [[minX, minY], [maxX, maxY]] = getAdjustedPointBounds(point);

    const x1KeyframesName = `move-point-${index}-as-x1`;
    const y1KeyframesName = `move-point-${index}-as-y1`;
    const x2KeyframesName = `move-point-${index}-as-x2`;
    const y2KeyframesName = `move-point-${index}-as-y2`;

    // "as 1" means it is the first point in the line. "as 2" means it is the second point in the line

    yield `
      @keyframes ${x1KeyframesName} {
        from {
          x1: ${minX};
          cx: ${minX};
          stroke: red;
        }
        to {
          x1: ${maxX};
          cx: ${maxX};
          stroke: blue;
        }
      }`;

    yield `
      @keyframes ${y1KeyframesName} {
        from {
          y1: ${minY};
        }
        to {
          y1: ${maxY};
        }
      }`;

    yield `
      @keyframes ${x2KeyframesName} {
        from {
          x2: ${minX};
        }
        to {
          x2: ${maxX};
        }
      }`;

    yield `
      @keyframes ${y2KeyframesName} {
        from {
          y2: ${minY};
        }
        to {
          y2: ${maxY};
        }
      }`;

    const xEasingName = getPointEasingVariableName(index, "x");
    const yEasingName = getPointEasingVariableName(index, "y");

    yield `
      .point-${index}-as-xy1 {
        animation-name: ${x1KeyframesName}, ${y1KeyframesName};
      }`;

    yield `
    .point-${index}-as-xy2 {
      animation-name: ${x2KeyframesName}, ${y2KeyframesName};
    }`;

    yield `
    .point-${index}-as-xy1, .point-${index}-as-xy2 {
      animation-timing-function: var(${xEasingName}), var(${yEasingName});
    }`;

    index++;
  }
}

const easingPathStyles = crateEasingPathStyles(pointFrames);
const animationStyles = createAnimationStyles(pointFrames);
// It's probably better to insert all rules at once with a big string
// but I backed myself into a corner with how I designed the functions
// and I don't feel like correcting it right now
for (const style of easingPathStyles) {
  sheet.insertRule(style);
}
for (const style of animationStyles) {
  sheet.insertRule(style);
}

// Could abstract this repetitive drawing into a loop but this is clearer to understand
// Draw front plane
// Direction of lines does not matter so use 0,2,4,6 for point1 and 1,3,5,7 for point2
// This way the animation can use x1 and y1 for the first point and x2 and y2 for the second point
let line = createLine(point0, point1);
line.classList.add("point-0-as-xy1", "point-1-as-xy2");
svg.appendChild(line);
line = createLine(point2, point1);
line.classList.add("point-2-as-xy1", "point-1-as-xy2");
svg.appendChild(line);
line = createLine(point2, point3);
line.classList.add("point-2-as-xy1", "point-3-as-xy2");
svg.appendChild(line);
line = createLine(point0, point3);
line.classList.add("point-0-as-xy1", "point-3-as-xy2");
svg.appendChild(line);

// Draw back plane
line = createLine(point4, point5);
line.classList.add("point-4-as-xy1", "point-5-as-xy2");
svg.appendChild(line);
line = createLine(point6, point5);
line.classList.add("point-6-as-xy1", "point-5-as-xy2");
svg.appendChild(line);
line = createLine(point6, point7);
line.classList.add("point-6-as-xy1", "point-7-as-xy2");
svg.appendChild(line);
line = createLine(point4, point7);
line.classList.add("point-4-as-xy1", "point-7-as-xy2");
svg.appendChild(line);

// Connect points of two plains with lines
line = createLine(point0, point4);
line.classList.add("point-0-as-xy1", "point-4-as-xy2");
svg.appendChild(line);
line = createLine(point1, point5);
line.classList.add("point-1-as-xy1", "point-5-as-xy2");
svg.appendChild(line);
line = createLine(point2, point6);
line.classList.add("point-2-as-xy1", "point-6-as-xy2");
svg.appendChild(line);
line = createLine(point3, point7);
line.classList.add("point-3-as-xy1", "point-7-as-xy2");
svg.appendChild(line);

for (const point of pointFrames) {
  const id = `point-${index}`;

  // Create keyframes for each point
  // Get max x and y values to get bounds for animation to move between
  const [[adjustedMinX, adjustedMinY], [adjustedMaxX, adjustedMaxY]] =
    getAdjustedPointBounds(point);

  const keyframesXId = `moveX-${id}`;
  const keyframesYId = `moveY-${id}`;
  const keyframesX = `
    @keyframes ${keyframesXId} {
      from {
        cx: ${adjustedMinX};
      }
      to {
        cx: ${adjustedMaxX};
      }
    }`;

  // console.debug(keyframesX);

  const keyframesY = `
    @keyframes ${keyframesYId} {
      from {
        cy: ${adjustedMinY};
      }
      to {
        cy: ${adjustedMaxY};
      }
    }`;
  sheet.insertRule(keyframesX);
  sheet.insertRule(keyframesY);

  // Starting position
  const [xs, ys] = point;
  const [x, y] = adjustToViewableSpace([xs[0], ys[0]], relative);
  const circle = createCircle(id, x, y);
  // Draw circle to screen
  svg.appendChild(circle);

  // Create path styles
  const pathX = pointFrames.toEasingPath(index, 0);
  const pathY = pointFrames.toEasingPath(index, 1);

  paths.push(pathX, pathY);

  const xEasingName = getPointEasingVariableName(index, "x");
  const yEasingName = getPointEasingVariableName(index, "y");

  sheet.insertRule(`
    #${id} {
      animation-name: ${keyframesXId}, ${keyframesYId};
      animation-timing-function: var(${xEasingName}), var(${yEasingName});
    }
  `);

  index++;
}

// const circle = createCircle("point-69");
// svg.appendChild(circle);
// sheet.replaceSync(friendly);
document.adoptedStyleSheets.push(sheet);

const section = document.createElement("section");
section.style.display = "flex";
section.style.gap = "1rem";
section.style.flexWrap = "wrap";

// Draw paths
for (const path of paths) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.style.border = "0.1px solid gray";
  svg.setAttribute("viewBox", "0 0 1 1");
  svg.setAttribute("width", "10rem");
  svg.setAttribute("height", "10rem");

  const pathElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  pathElement.setAttribute("stroke", "white");
  pathElement.setAttribute("stroke-width", "0.01");
  pathElement.setAttribute("fill", "none");
  pathElement.setAttribute("d", path);
  svg.appendChild(pathElement);

  section.appendChild(svg);
}

document.body.appendChild(section);

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

// requestAnimationFrame(draw);
