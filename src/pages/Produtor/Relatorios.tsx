import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { listCultivos, type Cultivo } from "@/services/api/cultivos";
import { listEstoque } from "@/services/api/estoque";
import { listMinhasOfertas, type OfertaPublica } from "@/services/api/marketplace";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart, Area, ScatterChart, Scatter, ZAxis } from "recharts";
import Plot from "react-plotly.js";

const RelatoriosProdutor = () => {
  const { data: cultivos = [] } = useQuery({ queryKey: ["cultivos"], queryFn: listCultivos, refetchOnWindowFocus: false });
  const { data: estoque } = useQuery({ queryKey: ["estoque"], queryFn: listEstoque, refetchOnWindowFocus: false });
  const { data: ofertas = [] } = useQuery({ queryKey: ["minhas-ofertas"], queryFn: listMinhasOfertas, refetchOnWindowFocus: false });

  const produtividadeMensal = useMemo(() => {
    const map: Record<string, number> = {};
    (cultivos as Cultivo[]).forEach((c) => {
      const dt = c.data_prevista_colheita || c.data_plantio;
      if (!dt) return;
      const d = new Date(dt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const area = Number(c.area || 0);
      const sacas = Number(c.sacas_por_ha || 0);
      const kgPorSaca = Number(c.kg_por_saca || 60);
      const kg = area * sacas * kgPorSaca;
      map[key] = (map[key] || 0) + (isFinite(kg) ? kg : 0);
    });
    return Object.keys(map).sort().map((k) => ({ mes: k, kg: Math.round(map[k]) }));
  }, [cultivos]);

  const estoquePorCultivo = useMemo(() => {
    const m: Record<string, number> = {};
    (estoque?.entradas || []).forEach((e) => {
      const nome = e.cultivo || String(e.cultivo_id || "?");
      m[nome] = (m[nome] || 0) + Number(e.quantidade_kg || 0);
    });
    return Object.entries(m).map(([cultivo, kg]) => ({ cultivo, kg: Math.round(kg as number) }));
  }, [estoque]);

  const vendasMensais = useMemo(() => {
    const map: Record<string, number> = {};
    (ofertas as OfertaPublica[]).forEach((o) => {
      const dt = o.criado_em ? new Date(o.criado_em) : null;
      if (!dt) return;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      const kg = Number(o.quantidade_kg || 0);
      map[key] = (map[key] || 0) + (isFinite(kg) ? kg : 0);
    });
    return Object.keys(map).sort().map((k) => ({ mes: k, kg: Math.round(map[k]) }));
  }, [ofertas]);

  const culturas = useMemo(() => {
    const set = new Set<string>();
    (cultivos as Cultivo[]).forEach((c) => set.add(c.cultura));
    return Array.from(set).filter(Boolean).sort();
  }, [cultivos]);

  const mesesOrdenados = useMemo(() => {
    const set = new Set<string>();
    (cultivos as Cultivo[]).forEach((c) => {
      const dt = c.data_prevista_colheita || c.data_plantio;
      if (!dt) return;
      const d = new Date(dt);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    });
    return Array.from(set).sort();
  }, [cultivos]);

  const heatmapZ = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    (cultivos as Cultivo[]).forEach((c) => {
      const dt = c.data_prevista_colheita || c.data_plantio;
      if (!dt) return;
      const d = new Date(dt);
      const keyMes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const cultura = c.cultura || "";
      const area = Number(c.area || 0);
      const sacas = Number(c.sacas_por_ha || 0);
      const kgPorSaca = Number(c.kg_por_saca || 60);
      const kg = area * sacas * kgPorSaca;
      if (!m[cultura]) m[cultura] = {};
      m[cultura][keyMes] = (m[cultura][keyMes] || 0) + (isFinite(kg) ? kg : 0);
    });
    return culturas.map((c) => mesesOrdenados.map((mes) => Math.round(m[c]?.[mes] || 0)));
  }, [cultivos, culturas, mesesOrdenados]);

  const estoquePorCultura = useMemo(() => {
    const m: Record<string, number> = {};
    (estoque?.entradas || []).forEach((e) => {
      const nome = e.cultivo || String(e.cultivo_id || "?");
      m[nome] = (m[nome] || 0) + Number(e.quantidade_kg || 0);
    });
    return m;
  }, [estoque]);

  const ofertasPorCultura = useMemo(() => {
    const m: Record<string, number> = {};
    (ofertas as OfertaPublica[]).forEach((o) => {
      const nome = o.cultura || String(o.cultivo_id || "?");
      m[nome] = (m[nome] || 0) + Number(o.quantidade_kg || 0);
    });
    return m;
  }, [ofertas]);

  const radarData = useMemo(() => {
    const areaTotal = (cultivos as Cultivo[]).reduce((acc, c) => acc + Number(c.area || 0), 0);
    const prodEst = (cultivos as Cultivo[]).reduce((acc, c) => acc + Number((c.area || 0) * (c.sacas_por_ha || 0) * (c.kg_por_saca || 60)), 0);
    const estoqueTotal = (estoque?.entradas || []).reduce((acc, e) => acc + Number(e.quantidade_kg || 0), 0);
    const ofertasTotal = (ofertas as OfertaPublica[]).reduce((acc, o) => acc + Number(o.quantidade_kg || 0), 0);
    return [
      { kpi: "Área", v: Math.round(areaTotal) },
      { kpi: "Produtividade", v: Math.round(prodEst) },
      { kpi: "Estoque", v: Math.round(estoqueTotal) },
      { kpi: "Ofertas", v: Math.round(ofertasTotal) },
    ];
  }, [cultivos, estoque, ofertas]);

  const paretoData = useMemo(() => {
    const arr = Object.entries(ofertasPorCultura).map(([cultura, kg]) => ({ cultura, kg }));
    arr.sort((a, b) => Number(b.kg) - Number(a.kg));
    let cum = 0;
    const total = arr.reduce((acc, x) => acc + Number(x.kg), 0) || 1;
    return arr.map((x) => {
      cum += Number(x.kg);
      return { cultura: x.cultura, kg: Math.round(Number(x.kg)), pct: Math.round((cum / total) * 100) };
    });
  }, [ofertasPorCultura]);

  const vendasForecast = useMemo(() => {
    const base = vendasMensais;
    const ma3: number[] = [];
    for (let i = 0; i < base.length; i++) {
      const a = base[i - 2]?.kg || 0;
      const b = base[i - 1]?.kg || 0;
      const c = base[i]?.kg || 0;
      ma3.push(Math.round((a + b + c) / 3));
    }
    const lastMes = base[base.length - 1]?.mes || "";
    const [anoStr, mesStr] = lastMes.split("-");
    let ano = Number(anoStr || 0);
    let mes = Number(mesStr || 0);
    const fut: { mes: string; kg: number }[] = [];
    let last = base[base.length - 1]?.kg || 0;
    for (let i = 0; i < 3; i++) {
      mes += 1;
      if (mes > 12) { mes = 1; ano += 1; }
      last = Math.round(last * 0.95);
      fut.push({ mes: `${ano}-${String(mes).padStart(2, "0")}`, kg: last });
    }
    return base.map((x, i) => ({ mes: x.mes, kg: x.kg, ma3: ma3[i] || 0 })).concat(fut.map((x) => ({ mes: x.mes, kg: x.kg, ma3: 0 })));
  }, [vendasMensais]);

  const bubbleData = useMemo(() => {
    return (cultivos as Cultivo[]).map((c) => {
      const prodHa = Number(c.sacas_por_ha || 0) * Number(c.kg_por_saca || 60);
      const area = Number(c.area || 0);
      return { cultura: c.cultura || "", area, prodHa, size: Math.max(10, Math.min(80, area * 5)) };
    });
  }, [cultivos]);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Relatórios do Produtor</h1>

      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Produtividade (kg por mês)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={produtividadeMensal} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="kg" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Estoque acumulado por cultivo (kg)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={estoquePorCultivo} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cultivo" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="kg" fill="#16a34a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Vendas (kg ofertados por mês)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={vendasMensais} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="kg" stroke="#ea580c" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Heatmap de Produtividade por Cultura x Mês</h2>
        <div className="h-72">
          <Plot
            data={[{ z: heatmapZ, x: mesesOrdenados, y: culturas, type: "heatmap", colorscale: "YlGnBu" }]}
            layout={{ autosize: true, margin: { l: 40, r: 10, t: 10, b: 40 } }}
            style={{ width: "100%", height: "100%" }}
            useResizeHandler
          />
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Sankey Culturas → Estoque/Ofertas</h2>
        <div className="h-72">
          <Plot
            data={[{
              type: "sankey",
              node: { label: [...culturas, "Estoque", "Ofertas"] },
              link: {
                source: [...culturas.map((_, i) => i), ...culturas.map((_, i) => i)],
                target: [...culturas.map(() => culturas.length), ...culturas.map(() => culturas.length + 1)],
                value: [...culturas.map((c) => Math.round(estoquePorCultura[c] || 0)), ...culturas.map((c) => Math.round(ofertasPorCultura[c] || 0))],
              },
            }]}
            layout={{ autosize: true, margin: { l: 10, r: 10, t: 10, b: 10 } }}
            style={{ width: "100%", height: "100%" }}
            useResizeHandler
          />
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Radar de KPIs</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="kpi" />
              <PolarRadiusAxis />
              <Radar dataKey="v" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Pareto de Ofertas por Cultura</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={paretoData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cultura" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
              <Tooltip />
              <Bar yAxisId="left" dataKey="kg" fill="#22c55e" />
              <Line yAxisId="right" type="monotone" dataKey="pct" stroke="#ef4444" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Vendas com Média Móvel e Forecast</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={vendasForecast} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="kg" stroke="#ea580c" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ma3" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Bubble: Área vs Produtividade por Cultura</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="area" name="Área" />
              <YAxis dataKey="prodHa" name="Produtividade kg/ha" />
              <ZAxis dataKey="size" range={[10, 200]} />
              <Tooltip />
              <Scatter data={bubbleData} fill="#3b82f6" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default RelatoriosProdutor;

