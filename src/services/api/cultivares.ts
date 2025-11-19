import { apiFetch } from "./client";

export type Cultivar = {
  id: number;
  cultura: string;
  variedade: string;
  cultura_info_id?: number | null;
  criado_em?: string;
};

export async function listCultivares(params?: { cultura?: string; cultura_info_id?: number | null }): Promise<Cultivar[]> {
  let path = "/api/farm/cultivares/";
  if (params?.cultura) {
    path = `/api/farm/cultivares/?cultura=${encodeURIComponent(params.cultura)}`;
  } else if (params?.cultura_info_id != null) {
    path = `/api/farm/cultivares/?cultura_info_id=${encodeURIComponent(String(params.cultura_info_id))}`;
  }
  const rows = await apiFetch(path);
  return (rows as any[]).map((r) => ({
    id: Number(r.id),
    cultura: String(r.cultura || ""),
    variedade: String(r.variedade || ""),
    cultura_info_id: r.cultura_info_id != null ? Number(r.cultura_info_id) : null,
    criado_em: r.criado_em,
  }));
}