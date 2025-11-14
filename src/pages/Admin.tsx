import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
// removed supabase session dependency
import { useAdminRole } from "@/hooks/useAdminRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { adminCreateUser, adminListUsers, type UserRow } from "@/services/api/admin";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
// módulos de importação removidos

const ADMIN_PASSWORD = "Co0p@gr!#0la";

export default function Admin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { data: roleData, isLoading } = useAdminRole();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) navigate("/auth");
  }, [navigate]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (password === ADMIN_PASSWORD) {
        setIsAuthenticated(true);
        toast.success("Acesso autorizado!");
        return;
      }
      toast.error("Senha inválida");
    } catch (error) {
      console.error("Error in handlePasswordSubmit:", error);
      toast.error("Erro ao processar autenticação");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!isAuthenticated && !roleData?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Administrativo</CardTitle>
            <CardDescription>Digite a senha para acessar a área administrativa</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha de admin"
                />
              </div>
              <Button type="submit" className="w-full">
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Área Administrativa</h1>
          <p className="text-muted-foreground">Importação de catálogos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/")}>Voltar ao Dashboard</Button>
          <Button onClick={() => navigate("/admin?tab=usuarios")}>Gerenciar Usuários</Button>
        </div>
      </div>

      <Tabs defaultValue={"usuarios"} className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
        </TabsList>

        

        <TabsContent value="usuarios">
          <Card>
            <CardHeader>
              <CardTitle>Criar usuário</CardTitle>
              <CardDescription>Defina login, senha e papel de acesso</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminCreateUsersSection />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminCreateUsersSection() {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"PRODUTOR" | "CLIENTE">("PRODUTOR");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roleFilter, setRoleFilter] = useState<"PRODUTOR" | "CLIENTE" | "ALL">("ALL");
  const [pendingRole, setPendingRole] = useState<Record<number, "PRODUTOR" | "CLIENTE">>({});
  const [pendingActive, setPendingActive] = useState<Record<number, boolean>>({});

  const loadUsers = async () => {
    try {
      const rows = await adminListUsers(roleFilter === "ALL" ? undefined : roleFilter);
      setUsers(rows);
    } catch (e: any) {
      toast({ title: "Erro ao listar usuários", description: e.message, variant: "destructive" });
    }
  };

  useEffect(() => { loadUsers(); }, [roleFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await adminCreateUser({ username, email, password, role });
      toast({ title: "Usuário criado", description: created.username });
      setUsername(""); setEmail(""); setPassword(""); setRole("PRODUTOR");
      await loadUsers();
    } catch (err: any) {
      toast({ title: "Erro ao criar usuário", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Usuário</Label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Email (opcional)</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Senha</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Papel</Label>
          <Select value={role} onValueChange={(v) => setRole(v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PRODUTOR">PRODUTOR</SelectItem>
              <SelectItem value="CLIENTE">CLIENTE</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Button type="submit">Criar</Button>
        </div>
      </form>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Usuários</h3>
          <div className="flex items-center gap-2">
            <Label>Filtrar papel</Label>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="PRODUTOR">Produtor</SelectItem>
                <SelectItem value="CLIENTE">Cliente</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadUsers}>Atualizar</Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.id}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Select value={(pendingRole[u.id] ?? (u.role as any)) as any} onValueChange={(v) => setPendingRole((pr) => ({ ...pr, [u.id]: v as any }))}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRODUTOR">PRODUTOR</SelectItem>
                      <SelectItem value="CLIENTE">CLIENTE</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={(pendingActive[u.id] ?? u.is_active) ? "true" : "false"} onValueChange={(v) => setPendingActive((pa) => ({ ...pa, [u.id]: v === "true" }))}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Ativo</SelectItem>
                      <SelectItem value="false">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" onClick={async () => {
                    try {
                      const newRole = pendingRole[u.id];
                      const newActive = pendingActive[u.id];
                      const payload: any = {};
                      if (newRole && newRole !== u.role) payload.role = newRole;
                      if (typeof newActive === 'boolean' && newActive !== u.is_active) payload.is_active = newActive;
                      if (Object.keys(payload).length === 0) { toast({ title: "Sem alterações" }); return; }
                      const res = await (await import("@/services/api/admin")).adminUpdateUser(u.id, payload);
                      toast({ title: "Usuário atualizado", description: `${res.username} (${res.role})` });
                      setPendingRole((pr) => { const cp = { ...pr }; delete cp[u.id]; return cp; });
                      setPendingActive((pa) => { const cp = { ...pa }; delete cp[u.id]; return cp; });
                      await loadUsers();
                    } catch (e: any) {
                      toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" });
                    }
                  }}>Salvar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
