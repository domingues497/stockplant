import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getProdutorDashboard } from "@/services/api/produtor";
import LineChart from "@/components/Charts/LineChart";
import PieChart from "@/components/Charts/PieChart";
import BarChart from "@/components/Charts/BarChart";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { authLogout } from "@/services/api/auth";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/services/api/client";

const ProdutorDashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["produtor-dashboard"],
    queryFn: getProdutorDashboard,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: "always",
  });
  const { toast } = useToast();

  const openSigmaABC = async () => {
    try {
      const params = new URLSearchParams({ identificador: String(10988), categoria: String(1), exp: String(3600) });
      const body = await apiFetch(`/api/integrations/sigmaabc/logar/?${params.toString()}`);
      const url = String(body?.url || "");
      if (!url) throw new Error("URL inválida");
      window.open(url, "_blank");
    } catch (e: any) {
      toast({ title: "Erro ao acessar SigmaABC", description: e.message || String(e), variant: "destructive" });
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard do Produtor</h1>
        <div className="flex gap-2">
          <Link to="/produtor/fazendas"><Button variant="outline">Fazendas</Button></Link>
          <Link to="/produtor/cultivos"><Button variant="outline">Cultivos</Button></Link>
          <Link to="/produtor/estoque"><Button variant="outline">Estoque</Button></Link>
          <Link to="/produtor/ofertas"><Button variant="outline">Ofertas</Button></Link>
          <Link to="/produtor/relatorios"><Button variant="outline">Relatórios</Button></Link>
          <Button onClick={openSigmaABC}>Acessar SigmaABC</Button>
          <Button variant="destructive" onClick={() => authLogout()}>Logout</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4"><div className="text-sm">Fazendas</div><div className="text-2xl font-bold">{isLoading ? "..." : data?.fazendas_total ?? 0}</div></Card>
        <Card className="p-4"><div className="text-sm">Cultivos ativos</div><div className="text-2xl font-bold">{isLoading ? "..." : data?.cultivos_ativos ?? 0}</div></Card>
        <Card className="p-4"><div className="text-sm">Estoque total (kg)</div><div className="text-2xl font-bold">{isLoading ? "..." : data?.estoque_total_kg ?? 0}</div></Card>
        <Card className="p-4"><div className="text-sm">Ofertas publicadas</div><div className="text-2xl font-bold">{isLoading ? "..." : data?.ofertas_publicadas ?? 0}</div></Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4"><div className="text-sm">Previsão 30 dias</div><div className="text-2xl font-bold">{isLoading ? "..." : data?.previsao_colheita?.dias_30 ?? 0}</div></Card>
        <Card className="p-4"><div className="text-sm">Previsão 60 dias</div><div className="text-2xl font-bold">{isLoading ? "..." : data?.previsao_colheita?.dias_60 ?? 0}</div></Card>
        <Card className="p-4"><div className="text-sm">Previsão 90 dias</div><div className="text-2xl font-bold">{isLoading ? "..." : data?.previsao_colheita?.dias_90 ?? 0}</div></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4 h-[360px]">
          <div className="mb-2 font-semibold">Evolução da produção por mês</div>
          <div className="h-[300px]">
            <LineChart title="Produção" x={data?.charts?.evolucao_producao_mensal?.x || []} y={data?.charts?.evolucao_producao_mensal?.y || []} />
          </div>
        </Card>
        <Card className="p-4 h-[360px]">
          <div className="mb-2 font-semibold">% área por cultura</div>
          <div className="h-[300px]">
            <PieChart title="Áreas" labels={data?.charts?.area_por_cultura?.labels || []} values={data?.charts?.area_por_cultura?.values || []} />
          </div>
        </Card>
        <Card className="p-4 h-[360px]">
          <div className="mb-2 font-semibold">Estoque atual por cultivo</div>
          <div className="h-[300px]">
            <BarChart title="Estoque" x={data?.charts?.estoque_por_cultivo?.x || []} y={data?.charts?.estoque_por_cultivo?.y || []} />
          </div>
        </Card>
        <Card className="p-4 h-[360px]">
          <div className="mb-2 font-semibold">Cultivos por status (cultura/ano)</div>
          <div className="h-[300px]">
            <BarChart
              title="Status"
              x={data?.charts?.status_por_cultura_ano?.x || []}
              y={(data?.charts?.status_por_cultura_ano?.series?.planejado || []).map(() => 0)}
              series={
                data?.charts?.status_por_cultura_ano
                  ? [
                      { name: "Planejado", y: data.charts.status_por_cultura_ano.series.planejado },
                      { name: "Em desenvolvimento", y: data.charts.status_por_cultura_ano.series.em_desenvolvimento },
                      { name: "Colhido", y: data.charts.status_por_cultura_ano.series.colhido },
                    ]
                  : []
              }
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProdutorDashboard;

