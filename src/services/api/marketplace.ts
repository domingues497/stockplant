import { apiFetch } from "./client";

export type OfertaPublica = {
  id: number;
  cultivo_id?: number | null;
  cultura: string;
  variedade?: string;
  origem?: string;
  preco_kg: number;
  quantidade_kg: number;
  imagem_url?: string;
  criado_em?: string;
};

export async function listPublicOfertas(params?: { cultura?: string; q?: string; ordenar?: "preco" | "quantidade"; }): Promise<OfertaPublica[]> {
  const search = new URLSearchParams();
  if (params?.cultura) search.set("cultura", params.cultura);
  if (params?.q) search.set("q", params.q);
  if (params?.ordenar) search.set("ordenar", params.ordenar);
  const qs = search.toString();
  const path = "/api/marketplace/ofertas/" + (qs ? `?${qs}` : "");
  return apiFetch(path);
}

export async function listMinhasOfertas(): Promise<OfertaPublica[]> {
  return apiFetch("/api/marketplace/minhas-ofertas/");
}