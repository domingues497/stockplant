import { Card } from "@/components/ui/card";

const Carrinho = () => {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Carrinho</h1>
      <Card className="p-4">
        <p>Itens selecionados e totais.</p>
      </Card>
    </div>
  );
};

export default Carrinho;

