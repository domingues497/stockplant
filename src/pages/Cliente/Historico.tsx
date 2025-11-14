import { Card } from "@/components/ui/card";

const Historico = () => {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Histórico de Compras</h1>
      <Card className="p-4">
        <p>Pedidos realizados com detalhes e status.</p>
      </Card>
    </div>
  );
};

export default Historico;

