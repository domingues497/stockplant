import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AdminDashboard = () => {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard Admin</h1>
      <Card className="p-4">
        <p>Gestão de usuários e monitoramento.</p>
        <div className="mt-4">
          <Link to="/admin?tab=usuarios">
            <Button>Ir para Usuários</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;

