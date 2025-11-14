import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listFazendas, type Fazenda } from "@/services/api/farm";
import { listCultivos, createCultivo, type Cultivo } from "@/services/api/cultivos";
import { useToast } from "@/hooks/use-toast";
import LineChart from "@/components/Charts/LineChart";
import AreaChart from "@/components/Charts/AreaChart";
import { Link } from "react-router-dom";

const Cultivos = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: fazendas = [], isLoading: loadingFaz } = useQuery({ queryKey: ["fazendas"], queryFn: listFazendas });
  const { data: cultivos = [], isLoading: loadingCult } = useQuery({ queryKey: ["cultivos"], queryFn: listCultivos });

  const [selectedFazendaId, setSelectedFazendaId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  type Form = { fazenda_id: string; cultura: string; variedade: string; area: string; data_plantio: string; data_prevista_colheita: string };
  const [form, setForm] = useState<Form>({ fazenda_id: "", cultura: "", variedade: "", area: "", data_plantio: "", data_prevista_colheita: "" });
  const [weather, setWeather] = useState<{ temp?: number; precip?: number; wind?: number } | null>(null);
  const [rainHistory, setRainHistory] = useState<{ x: string[]; y: number[] } | null>(null);
  const [rainPeriod, setRainPeriod] = useState<"7" | "30" | "60" | "90" | "custom">("30");
  const [rainStart, setRainStart] = useState<string>("");
  const [rainEnd, setRainEnd] = useState<string>("");
  const [rainAgg, setRainAgg] = useState<"daily" | "weekly" | "monthly">("daily");

  useEffect(() => {
    if (selectedFazendaId === null) return;
    const f = fazendas.find((x) => x.id === selectedFazendaId);
    const lat = f?.latitude ?? null;
    const lon = f?.longitude ?? null;
    if (lat == null || lon == null) { setWeather(null); setRainHistory(null); return; }
    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,wind_speed_10m`;
        const res = await fetch(url);
        const data = await res.json();
        const c = data?.current;
        setWeather({ temp: c?.temperature_2m, precip: c?.precipitation, wind: c?.wind_speed_10m });
      } catch (e: any) {
        setWeather(null);
      }
    };
    const fetchRain = async () => {
      try {
        const today = new Date();
        const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        let startIso = "";
        let endIso = "";
        if (rainPeriod === "custom" && rainStart && rainEnd) {
          startIso = rainStart;
          endIso = rainEnd;
        } else {
          const days = Number(rainPeriod);
          const start = new Date(today.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
          startIso = toIso(start);
          endIso = toIso(today);
        }
        const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startIso}&end_date=${endIso}&daily=precipitation_sum&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();
        const xRaw = (data?.daily?.time || []) as string[];
        const yRaw = (data?.daily?.precipitation_sum || []) as number[];
        if (!(xRaw.length && yRaw.length && xRaw.length === yRaw.length)) { setRainHistory(null); return; }
        if (rainAgg === "daily") {
          const x = xRaw.map((s) => {
            const d = new Date(s + "T00:00:00");
            return d.toLocaleDateString("pt-BR");
          });
          setRainHistory({ x, y: yRaw });
          return;
        }
        if (rainAgg === "weekly") {
          const acc: Record<string, number> = {};
          for (let i = 0; i < xRaw.length; i++) {
            const d = new Date(xRaw[i] + "T00:00:00");
            const day = d.getDay();
            const diff = day === 0 ? 6 : day - 1;
            const monday = new Date(d);
            monday.setDate(d.getDate() - diff);
            const key = toIso(monday);
            acc[key] = (acc[key] || 0) + (yRaw[i] || 0);
          }
          const keys = Object.keys(acc).sort();
          const x = keys.map((k) => {
            const d = new Date(k + "T00:00:00");
            return `semana de ${d.toLocaleDateString("pt-BR")}`;
          });
          const y = keys.map((k) => acc[k]);
          setRainHistory({ x, y });
          return;
        }
        if (rainAgg === "monthly") {
          const acc: Record<string, number> = {};
          for (let i = 0; i < xRaw.length; i++) {
            const d = new Date(xRaw[i] + "T00:00:00");
            const key = `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
            acc[key] = (acc[key] || 0) + (yRaw[i] || 0);
          }
          const keys = Object.keys(acc);
          keys.sort((a, b) => {
            const [ma, ya] = a.split("/").map((s) => Number(s));
            const [mb, yb] = b.split("/").map((s) => Number(s));
            if (ya !== yb) return ya - yb;
            return ma - mb;
          });
          const x = keys;
          const y = keys.map((k) => acc[k]);
          setRainHistory({ x, y });
          return;
        }
      } catch {
        setRainHistory(null);
      }
    };
    fetchWeather();
    fetchRain();
  }, [selectedFazendaId, fazendas, rainPeriod, rainStart, rainEnd, rainAgg]);

  const parseDecimalInput = (value: string) => {
    const t = value.trim();
    if (t === "") return null;
    if (t.includes(",")) {
      const s = t.replace(/\./g, "").replace(",", ".");
      const n = Number(s);
      return Number.isNaN(n) ? null : n;
    }
    const n = Number(t);
    return Number.isNaN(n) ? null : n;
  };

  const onChange = (k: keyof Form, v: string) => setForm({ ...form, [k]: v });

  const createMut = useMutation({
    mutationFn: async () => {
      const payload = {
        fazenda_id: Number(form.fazenda_id),
        cultura: form.cultura,
        variedade: form.variedade || null,
        area: parseDecimalInput(form.area),
        data_plantio: form.data_plantio,
        data_prevista_colheita: form.data_prevista_colheita || null,
      } as Omit<Cultivo, "id" | "criado_em">;
      return createCultivo(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cultivos"] });
      setOpen(false);
      setForm({ fazenda_id: "", cultura: "", variedade: "", area: "", data_plantio: "", data_prevista_colheita: "" });
      toast({ title: "Cultivo criado" });
    },
    onError: (e: any) => toast({ title: "Erro ao criar", description: e.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    if (!selectedFazendaId) return cultivos;
    return (cultivos || []).filter((c) => c.fazenda_id === selectedFazendaId);
  }, [cultivos, selectedFazendaId]);

  const status = (c: Cultivo) => {
    const today = new Date();
    const plantio = new Date(c.data_plantio);
    const colheita = c.data_prevista_colheita ? new Date(c.data_prevista_colheita) : null;
    if (colheita && today > colheita) return "Colhido";
    if (today < plantio) return "Planejado";
    return colheita ? "Em desenvolvimento" : "Plantado";
  };

  const chartPlantios = useMemo(() => {
    const byMonth: Record<string, number> = {};
    for (const c of cultivos || []) {
      const d = new Date(c.data_plantio);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth[k] = (byMonth[k] || 0) + 1;
    }
    const keys = Object.keys(byMonth).sort();
    return { x: keys, y: keys.map((k) => byMonth[k]) };
  }, [cultivos]);

  const chartColheitaArea = useMemo(() => {
    const byMonth: Record<string, number> = {};
    for (const c of cultivos || []) {
      if (!c.data_prevista_colheita || c.area == null) continue;
      const d = new Date(c.data_prevista_colheita);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth[k] = (byMonth[k] || 0) + (c.area || 0);
    }
    const keys = Object.keys(byMonth).sort();
    return { x: keys, y: keys.map((k) => byMonth[k]) };
  }, [cultivos]);

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cultivos</h1>
        <div className="flex gap-2">
          <Link to="/produtor/dashboard"><Button variant="outline">Voltar</Button></Link>
          <Button onClick={() => setOpen(true)}>Novo Cultivo</Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Fazenda</Label>
            <select className="mt-2 w-full border rounded h-9 px-2" value={selectedFazendaId ?? ""} onChange={(e) => setSelectedFazendaId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">Todas</option>
              {(fazendas || []).map((f) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Clima atual</Label>
            <div className="mt-2 text-sm text-muted-foreground">
              {selectedFazendaId === null ? (
                <span>Selecione uma fazenda</span>
              ) : weather ? (
                <span>{weather.temp ?? "-"}°C, chuva {weather.precip ?? "-"} mm, vento {weather.wind ?? "-"} km/h</span>
              ) : (
                <span>Sem dados de clima</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 h-[380px]">
        <div className="mb-2 font-semibold">Chuva histórica</div>
        <div className="grid gap-2 sm:grid-cols-3 mb-3">
          <div>
            <Label>Período</Label>
            <select className="mt-2 w-full border rounded h-9 px-2" value={rainPeriod} onChange={(e) => setRainPeriod(e.target.value as any)}>
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="60">Últimos 60 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
          <div>
            <Label>Agregação</Label>
            <select className="mt-2 w-full border rounded h-9 px-2" value={rainAgg} onChange={(e) => setRainAgg(e.target.value as any)}>
              <option value="daily">Diária</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>
          </div>
          {rainPeriod === "custom" && (
            <div className="grid grid-cols-2 gap-2 items-end">
              <div>
                <Label>Início</Label>
                <Input type="date" className="mt-2" value={rainStart} onChange={(e) => setRainStart(e.target.value)} />
              </div>
              <div>
                <Label>Fim</Label>
                <Input type="date" className="mt-2" value={rainEnd} onChange={(e) => setRainEnd(e.target.value)} />
              </div>
            </div>
          )}
        </div>
        <div className="h-[260px]">
          {rainHistory ? (
            <AreaChart title="Precipitação (mm)" x={rainHistory.x} y={rainHistory.y} />
          ) : (
            <div className="text-sm text-muted-foreground">Sem dados históricos</div>
          )}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {loadingCult ? (
          <div className="p-4">Carregando...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fazenda</TableHead>
                <TableHead>Cultura</TableHead>
                <TableHead>Variedade</TableHead>
                <TableHead>Área (ha)</TableHead>
                <TableHead>Plantio</TableHead>
                <TableHead>Prev. Colheita</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const f = fazendas.find((x) => x.id === c.fazenda_id) as Fazenda | undefined;
                return (
                  <TableRow key={c.id}>
                    <TableCell>{f?.nome || c.fazenda_id}</TableCell>
                    <TableCell>{c.cultura}</TableCell>
                    <TableCell>{c.variedade || ""}</TableCell>
                    <TableCell>{c.area ?? ""}</TableCell>
                    <TableCell>{c.data_plantio}</TableCell>
                    <TableCell>{c.data_prevista_colheita || ""}</TableCell>
                    <TableCell>{status(c)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4 h-[320px]">
          <div className="mb-2 font-semibold">Plantios por mês</div>
          <div className="h-[260px]">
            <LineChart title="Plantios" x={chartPlantios.x} y={chartPlantios.y} />
          </div>
        </Card>
        <Card className="p-4 h-[320px]">
          <div className="mb-2 font-semibold">Previsão de colheita (área)</div>
          <div className="h-[260px]">
            <AreaChart title="Colheita prevista" x={chartColheitaArea.x} y={chartColheitaArea.y} />
          </div>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cultivo</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fazenda</Label>
              <select className="w-full border rounded h-9 px-2" value={form.fazenda_id} onChange={(e) => onChange("fazenda_id", e.target.value)}>
                <option value="">Selecione</option>
                {(fazendas || []).map((f) => (
                  <option key={f.id} value={String(f.id)}>{f.nome}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Cultura</Label>
              <Input value={form.cultura} onChange={(e) => onChange("cultura", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Variedade</Label>
              <Input value={form.variedade} onChange={(e) => onChange("variedade", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Área (ha)</Label>
              <Input inputMode="decimal" value={form.area} onChange={(e) => onChange("area", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data de plantio</Label>
              <Input type="date" value={form.data_plantio} onChange={(e) => onChange("data_plantio", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data prevista colheita</Label>
              <Input type="date" value={form.data_prevista_colheita} onChange={(e) => onChange("data_prevista_colheita", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>{createMut.isPending ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cultivos;

