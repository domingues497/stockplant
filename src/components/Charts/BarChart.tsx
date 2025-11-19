import Plot from "react-plotly.js";

type Series = { name?: string; y: Array<number> };
type Props = {
  title?: string;
  x: Array<string>;
  y: Array<number>;
  series?: Array<Series>;
};

const BarChart = ({ title, x, y, series }: Props) => {
  return (
    <Plot
      data={(series && series.length ? series : [{ y }]).map((s) => ({ x, y: s.y, type: "bar", name: s.name }))}
      layout={{ title: title || "", autosize: true, margin: { t: 40, r: 20, b: 40, l: 40 }, barmode: series && series.length ? "group" : undefined }}
      style={{ width: "100%", height: "100%" }}
      useResizeHandler
      config={{ displayModeBar: false }}
    />
  );
};

export default BarChart;

