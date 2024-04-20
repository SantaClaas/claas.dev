/** @typedef {number[][]} Matrix */

/**
 *
 * @param {Matrix} matrixA
 * @param {Matrix} matrixB
 * @returns {Matrix}
 */
function multiplyMatrices(matrixA, matrixB) {
  // Assume all columns are same length and there is at least one column
  const columnsCountA = matrixA[0].length;
  const rowsCountA = matrixA.length;
  const columsCountB = matrixB[0].length;
  const rowsCountB = matrixB.length;

  if (columnsCountA !== rowsCountB) {
    throw new Error("Columns of A must match rows of B");
  }

  /** @type {Matrix} */
  const result = new Array(rowsCountA)
    .fill(0)
    .map((a) => new Array(columsCountB).fill(0));

  for (let rowIndex = 0; rowIndex < rowsCountA; rowIndex++) {
    for (let columnIndex = 0; columnIndex < columsCountB; columnIndex++) {
      let sum = 0;
      for (let columnIndexB = 0; columnIndexB < columnsCountA; columnIndexB++) {
        sum +=
          matrixA[rowIndex][columnIndexB] * matrixB[columnIndexB][columnIndex];
      }
      result[rowIndex][columnIndex] = sum;
    }
  }

  return result;
}

const screenSpaceRelative = 0.5;
const points = [
  [-screenSpaceRelative, -screenSpaceRelative, -screenSpaceRelative],
  [screenSpaceRelative, -screenSpaceRelative, -screenSpaceRelative],
  [screenSpaceRelative, screenSpaceRelative, -screenSpaceRelative],
  [-screenSpaceRelative, screenSpaceRelative, -screenSpaceRelative],

  [-screenSpaceRelative, -screenSpaceRelative, screenSpaceRelative],
  [screenSpaceRelative, -screenSpaceRelative, screenSpaceRelative],
  [screenSpaceRelative, screenSpaceRelative, screenSpaceRelative],
  [-screenSpaceRelative, screenSpaceRelative, screenSpaceRelative],
];

// Projection matrix
const orthographicProjection = [
  [1, 0, 0],
  [0, 1, 0],
];

/**
 *
 * @param {number} z
 * @returns {Matrix}
 */
function getPerspectiveProjectionMatrix(z) {
  const distance = 2;
  // Naming things is hard
  const otherZ = 1 / (distance - z);
  const perspectiveProjection = [
    [otherZ, 0, 0],
    [0, otherZ, 0],
  ];

  return perspectiveProjection;
}

let angle = 0;
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
// A translate because we can't see negative space
const translate = 100;

let { width, height } = svg.getBoundingClientRect();
// Update width and height on resize
const observer = new ResizeObserver(([entry]) => {
  width = entry.contentBoxSize[0].inlineSize;
  height = entry.contentBoxSize[0].blockSize;
});

observer.observe(svg);

/**
 *
 * @param {"M" | "L"} instruction
 * @param {number[][]} param1
 * @returns
 */
function pointToInstruction(instruction, [[x], [y]]) {
  return `${instruction} ${x} ${y} `;
}
/**
 * @param {DOMHighResTimeStamp} timestamp
 */
function draw(timestamp) {
  const rotationZ = [
    [Math.cos(angle), -Math.sin(angle), 0],
    [Math.sin(angle), Math.cos(angle), 0],
    [0, 0, 1],
  ];

  const rotationX = [
    [1, 0, 0],
    [0, Math.cos(angle), -Math.sin(angle)],
    [0, Math.sin(angle), Math.cos(angle)],
  ];

  const rotationY = [
    [Math.cos(angle), 0, -Math.sin(angle)],
    [0, 1, 0],
    [Math.sin(angle), 0, Math.cos(angle)],
  ];

  // Use smalles side to resize so that the cube is always inside the viewport
  const relative = Math.min(width, height);

  const projectedPoints = points
    .map(([x, y, z]) => {
      const pointMatrix = [[x], [y], [z]];
      // Project point
      let rotated = multiplyMatrices(rotationX, pointMatrix);
      rotated = multiplyMatrices(rotationY, rotated);
      rotated = multiplyMatrices(rotationZ, rotated);

      // const projectedTo2D = multiplyMatrices(orthographicProjection, rotated);
      const rotatedZ = rotated[2][0];
      const perspectiveProjectionMatrix =
        getPerspectiveProjectionMatrix(rotatedZ);
      const projectedTo2D = multiplyMatrices(
        perspectiveProjectionMatrix,
        rotated
      );
      return projectedTo2D;
    })
    // Translate into viewable space 😬
    .map(([[x], [y]]) =>
      // Position to relative on screen and then translate to center
      [[x * relative + width / 2], [y * relative + height / 2]]
    );

  const path = projectedPoints.reduce((state, [[x], [y]], index) => {
    switch (index) {
      // Assume first point is not the last point
      case 0:
        return state + `M${x},${y} `;
      case projectedPoints.length - 1:
        return state + `L${x},${y} Z`;
      default:
        return state + `L${x},${y} `;
    }
  }, "");

  const path2 =
    // Move to first point
    // Draw front plane
    pointToInstruction("M", projectedPoints[0]) +
    pointToInstruction("L", projectedPoints[1]) +
    pointToInstruction("L", projectedPoints[2]) +
    pointToInstruction("L", projectedPoints[3]) +
    pointToInstruction("L", projectedPoints[0]) +
    // Draw back plane
    pointToInstruction("M", projectedPoints[4]) +
    pointToInstruction("L", projectedPoints[5]) +
    pointToInstruction("L", projectedPoints[6]) +
    pointToInstruction("L", projectedPoints[7]) +
    pointToInstruction("L", projectedPoints[4]) +
    // Connect points of two plains with lines
    pointToInstruction("M", projectedPoints[0]) +
    pointToInstruction("L", projectedPoints[4]) +
    pointToInstruction("M", projectedPoints[1]) +
    pointToInstruction("L", projectedPoints[5]) +
    pointToInstruction("M", projectedPoints[2]) +
    pointToInstruction("L", projectedPoints[6]) +
    pointToInstruction("M", projectedPoints[3]) +
    pointToInstruction("L", projectedPoints[7]);

  pathElement.setAttribute("d", path2);

  angle += 0.005;
  if (angle > 2 * Math.PI) {
    angle = 0;
  }
  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
