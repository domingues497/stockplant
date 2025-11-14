import { useEffect, useMemo, useState } from "react";
import 'leaflet/dist/leaflet.css';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { listFazendas, createFazenda, updateFazenda, deleteFazenda, cepLookup, type Fazenda } from "@/services/api/farm";
import { useDebounce } from "@/hooks/useDebounce";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const Fazendas = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["fazendas"], queryFn: listFazendas });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Fazenda | null>(null);
  type FazendaForm = { nome: string; cep: string; areatotal: string; areacultivada: string; latitude: string; longitude: string };
  const [form, setForm] = useState<FazendaForm>({ nome: "", cep: "", areatotal: "", areacultivada: "", latitude: "", longitude: "" });
  const [cepInfo, setCepInfo] = useState<{ city: string; state: string }>({ city: "", state: "" });
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const debouncedCep = useDebounce(form.cep, 400);
  const [mapZoom, setMapZoom] = useState(13);
  const [triedAlt, setTriedAlt] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const leafletIcon = useMemo(() => L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowSize: [41, 41]
  }), []);

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

  const onChange = (k: keyof FazendaForm, v: string) => {
    setForm({ ...form, [k]: v });
  };

  const createMut = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: form.nome,
        cep: form.cep,
        cidade: cepInfo.city,
        estado: cepInfo.state,
        areatotal: parseDecimalInput(form.areatotal),
        areacultivada: parseDecimalInput(form.areacultivada),
        latitude: parseDecimalInput(form.latitude),
        longitude: parseDecimalInput(form.longitude),
      } as Omit<Fazenda, "id">;
      return createFazenda(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fazendas"] });
      setOpen(false);
      setForm({ nome: "", cep: "", areatotal: "", areacultivada: "", latitude: "", longitude: "" });
      toast({ title: "Fazenda criada" });
    },
    onError: (e: any) => toast({ title: "Erro ao criar", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: form.nome,
        cep: form.cep,
        cidade: cepInfo.city,
        estado: cepInfo.state,
        areatotal: parseDecimalInput(form.areatotal),
        areacultivada: parseDecimalInput(form.areacultivada),
        latitude: parseDecimalInput(form.latitude),
        longitude: parseDecimalInput(form.longitude),
      } as Partial<Fazenda>;
      return updateFazenda(editing!.id, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fazendas"] });
      setOpen(false);
      setEditing(null);
      setForm({ nome: "", cep: "", areatotal: "", areacultivada: "", latitude: "", longitude: "" });
      toast({ title: "Fazenda atualizada" });
    },
    onError: (e: any) => toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => deleteFazenda(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fazendas"] });
      setConfirmId(null);
      toast({ title: "Fazenda excluída" });
    },
    onError: (e: any) => toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" }),
  });

  const startCreate = () => {
    setEditing(null);
    setForm({ nome: "", cep: "", areatotal: "", areacultivada: "", latitude: "", longitude: "" });
    setCepInfo({ city: "", state: "" });
    setOpen(true);
  };

  const startEdit = (f: Fazenda) => {
    setEditing(f);
    setForm({ nome: f.nome || "", cep: f.cep || "", areatotal: (f.areatotal ?? "").toString(), areacultivada: (f.areacultivada ?? "").toString(), latitude: (f.latitude ?? "").toString(), longitude: (f.longitude ?? "").toString() });
    setCepInfo({ city: f.cidade || "", state: f.estado || "" });
    setOpen(true);
  };

  useEffect(() => {
    const run = async () => {
      const clean = (debouncedCep || "").replace(/\D/g, "");
      if (clean.length !== 8) { setCepInfo({ city: "", state: "" }); return; }
      try {
        const info = await cepLookup(clean);
        if (info) setCepInfo({ city: info.city, state: info.state });
        else setCepInfo({ city: "", state: "" });
      } catch {
        setCepInfo({ city: "", state: "" });
      }
    };
    run();
  }, [debouncedCep]);

  const mapUrl = useMemo(() => {
    const lat = parseDecimalInput(form.latitude);
    const lon = parseDecimalInput(form.longitude);
    if (lat == null || lon == null) return "";
    setTriedAlt(false);
    setMapFailed(false);
    const size = "600x360";
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=${mapZoom}&size=${size}&maptype=mapnik&markers=${lat},${lon},red`;
  }, [form.latitude, form.longitude, mapZoom]);
  const mapUrlAlt = useMemo(() => {
    const lat = parseDecimalInput(form.latitude);
    const lon = parseDecimalInput(form.longitude);
    if (lat == null || lon == null) return "";
    const size = "600x360";
    return `https://staticmap.openstreetmap.fr/staticmap/getmap.php?center=${lat},${lon}&zoom=${mapZoom}&size=${size}&markers=${lat},${lon},red`;
  }, [form.latitude, form.longitude, mapZoom]);
  const embedUrl = useMemo(() => {
    const lat = parseDecimalInput(form.latitude);
    const lon = parseDecimalInput(form.longitude);
    if (lat == null || lon == null) return "";
    const d = 0.02;
    const bbox = `${(lon - d).toFixed(6)},${(lat - d).toFixed(6)},${(lon + d).toFixed(6)},${(lat + d).toFixed(6)}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
  }, [form.latitude, form.longitude]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fazendas</h1>
        <div className="flex gap-2">
          <Link to="/produtor/dashboard"><Button variant="outline">Voltar</Button></Link>
          <Button onClick={startCreate}>Nova Fazenda</Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-4">Carregando...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CEP</TableHead>
                <TableHead>Área total (ha)</TableHead>
                <TableHead>Área cultivada (ha)</TableHead>
                <TableHead>Latitude</TableHead>
                <TableHead>Longitude</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data || []).map((f) => (
                <TableRow key={f.id}>
                  <TableCell>{f.nome}</TableCell>
                  <TableCell>{f.cep}</TableCell>
                  <TableCell>{f.areatotal ?? ""}</TableCell>
                  <TableCell>{f.areacultivada ?? ""}</TableCell>
                  <TableCell>{f.latitude ?? ""}</TableCell>
                  <TableCell>{f.longitude ?? ""}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" onClick={() => startEdit(f)}>Editar</Button>
                    <Button variant="destructive" onClick={() => setConfirmId(f.id)}>Excluir</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Fazenda" : "Nova Fazenda"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => onChange("nome", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input value={form.cep || ""} onChange={(e) => onChange("cep", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Área total (ha)</Label>
              <Input inputMode="decimal" value={form.areatotal} onChange={(e) => onChange("areatotal", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Área cultivada (ha)</Label>
              <Input inputMode="decimal" value={form.areacultivada} onChange={(e) => onChange("areacultivada", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input disabled value={cepInfo.city} />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Input disabled value={cepInfo.state} />
            </div>
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input inputMode="decimal" maxLength={9} value={form.latitude} onChange={(e) => onChange("latitude", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input inputMode="decimal" maxLength={9} value={form.longitude} onChange={(e) => onChange("longitude", e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Mapa</Label>
              {(parseDecimalInput(form.latitude) != null && parseDecimalInput(form.longitude) != null) ? (
                <div className="mt-2 w-full max-w-[600px]">
                  <MapContainer center={[Number(parseDecimalInput(form.latitude)), Number(parseDecimalInput(form.longitude))]} zoom={mapZoom} style={{ height: 360, width: '100%' }} scrollWheelZoom={true} whenCreated={(map) => {}}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                    <Marker
                      position={[Number(parseDecimalInput(form.latitude)), Number(parseDecimalInput(form.longitude))]}
                      icon={leafletIcon}
                      draggable
                      eventHandlers={{
                        dragend: (e) => {
                          const p = (e.target as any).getLatLng();
                          const lat = Number(p.lat).toFixed(4);
                          const lon = Number(p.lng).toFixed(4);
                          setForm({ ...form, latitude: lat, longitude: lon });
                        }
                      }}
                    />
                    <MapClick onClick={(lat, lon) => {
                      const latStr = Number(lat).toFixed(4);
                      const lonStr = Number(lon).toFixed(4);
                      setForm({ ...form, latitude: latStr, longitude: lonStr });
                    }} />
                  </MapContainer>
                </div>
              ) : (
                <div className="mt-2 text-sm text-muted-foreground">Informe latitude e longitude para visualizar o mapa</div>
              )}
            </div>
          </div>
          <DialogFooter>
            {editing ? (
              <Button onClick={() => updateMut.mutate()} disabled={updateMut.isPending}>{updateMut.isPending ? "Salvando..." : "Salvar"}</Button>
            ) : (
              <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>{createMut.isPending ? "Criando..." : "Criar"}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmId !== null} onOpenChange={(v) => !v && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmId && deleteMut.mutate(confirmId)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Fazendas;
function MapClick({ onClick }: { onClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
