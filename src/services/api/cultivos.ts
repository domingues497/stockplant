import { apiFetch } from "./client";

export type Cultivo = {
  id: number;
  fazenda_id: number;
  cultura: string;
  variedade?: string | null;
  area?: number | null;
  data_plantio: string; // ISO date
  data_prevista_colheita?: string | null; // ISO date
  criado_em?: string;
};

export async function listCultivos(): Promise<Cultivo[]> {
  return apiFetch("/api/cultivos/");
}

export async function createCultivo(payload: Omit<Cultivo, "id" | "criado_em">): Promise<Cultivo> {
  return apiFetch("/api/cultivos/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}