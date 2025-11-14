import { Card } from "@/components/ui/card";

const ClienteDashboard = () => {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard do Cliente</h1>
      <Card className="p-4">
        <p>Resumo de compras, carrinho e marketplace.</p>
      </Card>
    </div>
  );
};

export default ClienteDashboard;

