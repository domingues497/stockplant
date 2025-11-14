import Plot from "react-plotly.js";

type Props = {
  title?: string;
  labels: Array<string>;
  values: Array<number>;
};

const PieChart = ({ title, labels, values }: Props) => {
  return (
    <Plot
      data={[{ labels, values, type: "pie" }]}
      layout={{ title: title || "", autosize: true, margin: { t: 40, r: 20, b: 40, l: 40 } }}
      style={{ width: "100%", height: "100%" }}
      useResizeHandler
      config={{ displayModeBar: false }}
    />
  );
};

export default PieChart;

