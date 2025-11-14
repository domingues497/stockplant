import Plot from "react-plotly.js";

type Props = {
  title?: string;
  x: Array<string>;
  y: Array<number>;
};

const BarChart = ({ title, x, y }: Props) => {
  return (
    <Plot
      data={[{ x, y, type: "bar" }]}
      layout={{ title: title || "", autosize: true, margin: { t: 40, r: 20, b: 40, l: 40 } }}
      style={{ width: "100%", height: "100%" }}
      useResizeHandler
      config={{ displayModeBar: false }}
    />
  );
};

export default BarChart;

