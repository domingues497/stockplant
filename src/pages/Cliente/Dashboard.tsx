import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authLogout } from "@/services/api/auth";

const ClienteDashboard = () => {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard do Cliente</h1>
        <Button variant="destructive" onClick={() => authLogout()}>Logout</Button>
      </div>
      <Card className="p-4">
        <p>Resumo de compras, carrinho e marketplace.</p>
      </Card>
    </div>
  );
};

export default ClienteDashboard;

