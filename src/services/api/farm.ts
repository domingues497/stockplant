import { apiFetch } from "./client";

export type Fazenda = {
  id: number;
  nome: string;
  cep?: string;
  cidade?: string;
  estado?: string;
  areatotal?: number | null;
  areacultivada?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  criado_em?: string;
};

export async function listFazendas(): Promise<Fazenda[]> {
  return apiFetch("/api/farm/fazendas/");
}

export async function createFazenda(payload: Omit<Fazenda, "id">): Promise<Fazenda> {
  return apiFetch("/api/farm/fazendas/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateFazenda(id: number, payload: Partial<Fazenda>): Promise<Fazenda> {
  return apiFetch(`/api/farm/fazendas/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteFazenda(id: number): Promise<void> {
  await apiFetch(`/api/farm/fazendas/${id}/`, { method: "DELETE" });
}

export async function cepLookup(cep: string): Promise<{ city: string; state: string; street?: string; neighborhood?: string } | null> {
  const clean = cep.replace(/\D/g, "");
  if (!clean || clean.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (res.ok) {
      const data = await res.json();
      if (!data?.erro) {
        return {
          city: String(data.localidade || ""),
          state: String(data.uf || ""),
          street: String(data.logradouro || ""),
          neighborhood: String(data.bairro || ""),
        };
      }
    }
  } catch {}
  try {
    const res2 = await fetch(`https://cdn.apicep.com/file/apicep/${clean}.json`);
    if (res2.ok) {
      const d2 = await res2.json();
      if (d2?.status === 200) {
        return {
          city: String(d2.city || ""),
          state: String(d2.state || ""),
          street: String(d2.address || ""),
          neighborhood: String(d2.district || ""),
        };
      }
    }
  } catch {}
  return null;
}

