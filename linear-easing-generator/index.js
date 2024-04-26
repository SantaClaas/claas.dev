// The following code is taken and adapted from https://github.com/jakearchibald/linear-easing-generator

import { svgPathProperties as SVGPathProperties } from "svg-path-properties";

/** @typedef {[position: number, value: number][]} LinearData */
/**
 * Square distance from a point to a segment
 * @param {[number, number]} p
 * @param {[number, number]} p1
 * @param {[number, number]} p2
 * @returns {number}
 */
function getSqSegDist(p, p1, p2) {
  let x = p1[0];
  let y = p1[1];
  let dx = p2[0] - x;
  let dy = p2[1] - y;

  if (dx !== 0 || dy !== 0) {
    var t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      x = p2[0];
      y = p2[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = p[0] - x;
  dy = p[1] - y;

  return dx * dx + dy * dy;
}

/**
 *
 * @param {LinearData} points
 * @param {number} first
 * @param {number} last
 * @param {number} sqTolerance
 * @param {LinearData} simplified
 */
function simplifyDPStep(points, first, last, sqTolerance, simplified) {
  let maxSqDist = sqTolerance;
  let index;

  for (let i = first + 1; i < last; i++) {
    const sqDist = getSqSegDist(points[i], points[first], points[last]);

    if (sqDist > maxSqDist) {
      index = i;
      maxSqDist = sqDist;
    }
  }

  if (maxSqDist > sqTolerance) {
    if (/** @type {!number}*/ (index) - first > 1) {
      simplifyDPStep(
        points,
        first,
        /** @type {!number}*/ (index),
        sqTolerance,
        simplified
      );
    }

    simplified.push(points[/** @type {!number}*/ (index)]);

    if (last - /** @type {!number}*/ (index) > 1) {
      simplifyDPStep(
        points,
        /** @type {!number}*/ (index),
        last,
        sqTolerance,
        simplified
      );
    }
  }
}

/**
 * Simplification using Ramer-Douglas-Peucker algorithm
 * @param {LinearData} points
 * @param {number} tolerance
 * @returns {LinearData}
 */
export function simplifyDouglasPeucker(points, tolerance) {
  if (points.length <= 1) return points;
  const sqTolerance = tolerance * tolerance;
  const last = points.length - 1;
  /** @type {LinearData} */
  const simplified = [points[0]];
  simplifyDPStep(points, 0, last, sqTolerance, simplified);
  simplified.push(points[last]);

  return simplified;
}

const pointsLength = 10_000;

/**
 *
 * @param {string} pathData
 * @returns {LinearData}
 */
export function processSvgData(pathData) {
  const parsedPath = new SVGPathProperties(pathData);
  const totalLength = parsedPath.getTotalLength();

  if (totalLength === 0) throw new TypeError("Path is zero length");

  let lastX = -Infinity;

  /** @type {LinearData} */
  const points = Array.from({ length: pointsLength }, (_, i) => {
    const pos = (i / (pointsLength - 1)) * totalLength;
    const point = parsedPath.getPointAtLength(pos);

    // Prevent paths going back on themselves
    lastX = Math.max(lastX, point.x);
    return [lastX, point.y];
  });

  return points;
}

/**
 *
 * @param {LinearData} points
 * @param {number} round
 * @returns {string[]}
 */
export function toLinearSyntax(points, round) {
  if (!points) return [];
  const xFormat = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: Math.max(round - 2, 0),
  });
  const yFormat = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: round,
  });

  const pointsValue = points;
  /** @type {Set<[number, number]>} */
  const valuesWithRedundantX = new Set();
  const maxDelta = 1 / 10 ** round;

  // Figure out entries that don't need an explicit position value
  for (const [i, value] of pointsValue.entries()) {
    const [x] = value;
    // If the first item's position is 0, then we don't need to state the position
    if (i === 0) {
      if (x === 0) valuesWithRedundantX.add(value);
      continue;
    }
    // If the last entry's position is 1, and the item before it is less than 1, then we don't need to state the position
    if (i === pointsValue.length - 1) {
      const previous = pointsValue[i - 1][0];
      if (x === 1 && previous <= 1) valuesWithRedundantX.add(value);
      continue;
    }

    // If the position is the average of the previous and next positions, then we don't need to state the position
    const previous = pointsValue[i - 1][0];
    const next = pointsValue[i + 1][0];

    const averagePos = (next - previous) / 2 + previous;
    const delta = Math.abs(x - averagePos);

    if (delta < maxDelta) valuesWithRedundantX.add(value);
  }

  // Group into sections with same y
  /** @type {LinearData[]} */
  const groupedValues = [[pointsValue[0]]];

  for (const value of pointsValue.slice(1)) {
    if (value[1] === /** @type {!LinearData} */ (groupedValues.at(-1))[0][1]) {
      /** @type {!LinearData} */ (groupedValues.at(-1)).push(value);
    } else {
      groupedValues.push([value]);
    }
  }

  const outputValues = groupedValues.map((group) => {
    const yValue = yFormat.format(group[0][1]);

    const regularValue = group
      .map((value) => {
        const [x] = value;
        let output = yValue;

        if (!valuesWithRedundantX.has(value)) {
          output += " " + xFormat.format(x * 100) + "%";
        }

        return output;
      })
      .join(", ");

    if (group.length === 1) return regularValue;

    // Maybe it's shorter to provide a value that skips steps?
    const xVals = [
      group[0][0],
      /** @type {![pos: number, val: number]} */ (group.at(-1))[0],
    ];
    const positionalValues = xVals
      .map((x) => xFormat.format(x * 100) + "%")
      .join(" ");

    const skipValue = `${yValue} ${positionalValues}`;

    return skipValue.length > regularValue.length ? regularValue : skipValue;
  });

  return outputValues;
}

const lineLength = 80;
const durationFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3,
});
/**
 *
 * @param {string[]} parts
 * @param {string} name
 * @param {number} idealDuration
 * @returns {string}
 */
export function toFriendlyLinearCode(parts, name, idealDuration) {
  if (parts.length === 0) return "";

  let outputStart = ":root {\n";
  let linearStart = `  ${name}: linear(`;
  let linearEnd = ");";
  let outputEnd = "\n}";
  let lines = [];
  let line = "";

  const lineIndentSize = 4;

  for (const part of parts) {
    // 1 for comma
    if (line.length + part.length + lineIndentSize + 1 > lineLength) {
      lines.push(line + ",");
      line = "";
    }
    if (line) line += ", ";
    line += part;
  }

  if (line) lines.push(line);

  if (
    lines.length === 1 &&
    linearStart.length + lines[0].length + linearEnd.length < lineLength
  ) {
    return outputStart + linearStart + lines[0] + linearEnd + outputEnd;
  }

  let idealDurationLine = "";

  if (idealDuration !== 0) {
    idealDurationLine = `\n  --${name}-duration: ${durationFormat.format(
      idealDuration / 1000
    )}s;`;
  }

  return (
    outputStart +
    linearStart +
    "\n    " +
    lines.join("\n    ") +
    "\n  " +
    linearEnd +
    idealDurationLine +
    outputEnd
  );
}
