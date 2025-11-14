import { apiFetch } from "./client";

export type ProdutorDashboardData = {
  fazendas_total: number;
  cultivos_total: number;
  cultivos_ativos: number;
  estoque_total_kg: number;
  ofertas_publicadas: number;
  previsao_colheita: { dias_30: number; dias_60: number; dias_90: number };
  charts: {
    evolucao_producao_mensal: { x: Array<string>; y: Array<number> };
    area_por_cultura: { labels: Array<string>; values: Array<number> };
    estoque_por_cultivo: { x: Array<string>; y: Array<number> };
  };
};

export async function getProdutorDashboard(): Promise<ProdutorDashboardData> {
  return apiFetch("/api/produtor/dashboard/");
}