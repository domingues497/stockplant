import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { listCultivos, type Cultivo } from "@/services/api/cultivos";
import { listEstoque } from "@/services/api/estoque";
import { listMinhasOfertas, type OfertaPublica } from "@/services/api/marketplace";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

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


  return (
    <div className="p-4 space-y-6">
            <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Relatórios do Produtor</h1>
              <div className="flex gap-2">
                <Link to="/produtor/dashboard"><Button variant="outline">Voltar</Button></Link>  
              </div>
            </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Produtividade (kg por mês)</h2>
          <div className="h-72">
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
          <div className="h-72">
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
          <div className="h-72">
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
          <h2 className="text-lg font-semibold mb-4">Radar de KPIs</h2>
          <div className="h-72">
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
      </div>

    </div>
  );
};

export default RelatoriosProdutor;

