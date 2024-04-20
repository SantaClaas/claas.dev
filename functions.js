/**
 *
 * @param {number} z
 * @returns {import("./index").Matrix}
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

/**
 *
 * @param {import("./index").Matrix} matrixA
 * @param {import("./index").Matrix} matrixB
 * @returns {import("./index").Matrix}
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

  /** @type {import("./index").Matrix} */
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
/** @type {import("./index").Point3d[]} */
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

export function calculateRotationFrames() {
  const MAX_ANGLE = 2 * Math.PI;
  // You can't preallocate an array with fixed length
  /** Index is frame number and the array gives the rotation matrices for x, y, z for a specific frame
   * @type {Array<[x: import("./index").RotationMatrix, y: import("./index").RotationMatrix, z: import("./index").RotationMatrix]>}
   */
  const rotationFrames = new Array();

  console.log("Calculating rotation frames", rotationFrames.length);
  //   for (let index = 0; index < rotationFrames.length; index++) {
  // console.log(index);
  for (let angle = 0; angle <= MAX_ANGLE; angle += 0.005) {
    /** @type {import("./index").RotationMatrix} */
    const rotationX = [
      [1, 0, 0],
      [0, Math.cos(angle), -Math.sin(angle)],
      [0, Math.sin(angle), Math.cos(angle)],
    ];

    /** @type {import("./index").RotationMatrix} */
    const rotationY = [
      [Math.cos(angle), 0, -Math.sin(angle)],
      [0, 1, 0],
      [Math.sin(angle), 0, Math.cos(angle)],
    ];

    /** @type {import("./index").RotationMatrix} */
    const rotationZ = [
      [Math.cos(angle), -Math.sin(angle), 0],
      [Math.sin(angle), Math.cos(angle), 0],
      [0, 0, 1],
    ];

    rotationFrames.push([rotationX, rotationY, rotationZ]);
  }

  return rotationFrames;
}

/**
 *
 * @param {ReturnType<typeof calculateRotationFrames>} rotationFrames
 * @returns
 */
export function calculateProjectedPointsByFrame(rotationFrames) {
  console.debug("Calculating projected points by frame", rotationFrames[0]);

  // Can not preallocate an array with fixed length
  /**
   * @type {import("./index").Point2d[][]}
   */
  const projectedPointsByFrame = new Array();
  for (const [rotationX, rotationY, rotationZ] of rotationFrames) {
    /** @type {import("./index").Point2d[]} */
    const projectedPoints = points.map(([x, y, z]) => {
      const pointMatrix = [[x], [y], [z]];
      // Project point
      let rotated = multiplyMatrices(rotationX, pointMatrix);
      rotated = multiplyMatrices(rotationY, rotated);
      rotated = multiplyMatrices(rotationZ, rotated);

      const rotatedZ = rotated[2][0];
      const perspectiveProjectionMatrix =
        getPerspectiveProjectionMatrix(rotatedZ);
      const projectedTo2D = multiplyMatrices(
        perspectiveProjectionMatrix,
        rotated
      );

      const [[projectedX], [projectedY]] = projectedTo2D;
      return [projectedX, projectedY];
    });

    projectedPointsByFrame.push(projectedPoints);
  }

  return projectedPointsByFrame;
}
