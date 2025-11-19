import { useEffect, useState } from "react";
import { ShoppingCart, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/context/CartContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listPublicOfertas, type OfertaPublica } from "@/services/api/marketplace";
import { authLogout } from "@/services/api/auth";
import { useUserRole } from "@/hooks/useUserRole";

 

export default function Marketplace() {
  const navigate = useNavigate();
  const { items, add } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [cultura, setCultura] = useState<string>("");

  const { data: ofertasAll = [] } = useQuery<OfertaPublica[]>({
    queryKey: ["public_ofertas_all"],
    queryFn: () => listPublicOfertas(),
    refetchOnWindowFocus: false,
  });

  const { data: ofertas = [], isLoading } = useQuery<OfertaPublica[]>({
    queryKey: ["public_ofertas", cultura, searchTerm],
    queryFn: () => listPublicOfertas({ cultura: cultura || undefined, q: searchTerm || undefined }),
    refetchOnWindowFocus: false,
  });

  const itemCount = items.reduce((acc, it) => acc + it.quantidade, 0);
  const [isLogged, setIsLogged] = useState<boolean>(typeof window !== "undefined" ? !!localStorage.getItem("access_token") : false);
  useEffect(() => {
    setIsLogged(typeof window !== "undefined" ? !!localStorage.getItem("access_token") : false);
  }, []);
  const { data: roleData } = useUserRole();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">StockPlant</h1>
              <p className="text-sm text-muted-foreground">Marketplace Agrícola</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => navigate("/cliente/carrinho")} variant="outline" className="relative">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Carrinho
                {itemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground">{itemCount}</Badge>
                )}
              </Button>
              {isLogged && roleData?.role === "CLIENTE" && (
                <Button variant="outline" onClick={() => navigate("/cliente/historico")}>Minhas compras</Button>
              )}
              {isLogged ? (
                <Button onClick={() => authLogout()} variant="outline">Logout</Button>
              ) : (
                <Button onClick={() => navigate("/auth")} variant="default">Login</Button>
              )}
             
            </div>
            
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar ofertas (cultura, origem...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div>
            <Select value={cultura || "__all__"} onValueChange={(v) => setCultura(v === "__all__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as culturas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {Array.from(new Set(ofertasAll.map((o) => o.cultura))).map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading && (
          <Card className="p-4"><div className="text-muted-foreground">Carregando ofertas...</div></Card>
        )}

        {!isLoading && ofertas.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma oferta encontrada</h3>
            <p className="text-muted-foreground">Ajuste sua busca para encontrar ofertas</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ofertas.map((o) => {
            const kgPorSaca = 60;
            const precoSc = o.preco_kg * kgPorSaca;
            const qtdSc = o.quantidade_kg / kgPorSaca;
            return (
              <Card key={o.id} className="p-0 overflow-hidden">
                {(
                  <div className="h-36 w-full bg-muted">
                    <img src={o.imagem_url || "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800"} alt={o.cultura} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">
                      {o.cultura}{o.variedade ? ` • ${o.variedade}` : ""}
                    </div>
                    <div className="text-sm text-muted-foreground">{o.origem ?? ""}</div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Preço</div>
                      <div className="text-2xl font-semibold text-green-600">R$ {precoSc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-xs text-muted-foreground">por sc</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Disponível</div>
                      <div className="text-xl font-semibold">{Math.floor(qtdSc).toLocaleString()} sc</div>
                    </div>
                  </div>
                  <Button onClick={() => add({ ofertaId: o.id, nome: `${o.cultura}${o.variedade ? ` • ${o.variedade}` : ""}`, quantidade: 1, preco: precoSc })} className="w-full">
                    Adicionar ao carrinho
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

