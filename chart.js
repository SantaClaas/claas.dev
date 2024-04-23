import { Chart } from "chart.js/auto";
/**
 *
 * @param {import("./main.js").Point2dFrames} pointFrames
 */
function charter(pointFrames) {
  const datasets = [];
  // Points x over time as data set
  let index = 0;
  for (const point of pointFrames) {
    const xOverTime = point[0];
    const yOverTime = point[1];

    datasets.push({
      label: `Point ${index} x over time`,
      data: xOverTime,
    });

    datasets.push({
      label: `Point ${index} y over time`,
      data: yOverTime,
    });
    index++;
  }
  // @ts-ignore
  const chart = new Chart(window.canvas.getContext("2d"), {
    type: "line",
    // data: {
    //   labels: new Array(deltas.length).map((_, i) => i),

    //   data: deltas,
    // },
    data: {
      labels: datasets[0].data.map((_, i) => i),
      datasets,
      // datasets: [
      //   // {
      //   //   label: "Deltas x over time",
      //   //   data: deltas,
      //   //   fill: false,
      //   //   borderColor: "rgb(75, 192, 192)",
      //   // tension: 0,
      //   // },
      //   {
      //     label: "Points x over time",
      //     data: points[0],
      //   },
      //   // {
      //   //   label: "Points x over time",
      //   //   data: pointFramesByPoint[0].map(([y]) => y),
      //   // },
      // ],
    },
    options: {
      elements: {
        line: {
          tension: 0,
        },
      },
    },
  });
}
