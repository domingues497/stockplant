import { Card } from "@/components/ui/card";

const Marketplace = () => {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Marketplace</h1>
      <Card className="p-4">
        <p>Listagem de ofertas com filtros (cultura, região, preço).</p>
      </Card>
    </div>
  );
};

export default Marketplace;

