import { Dashboard } from '@/components/dashboard/Dashboard';
import UsageDashboard from '@/components/UsageDashboard';
import AppLayout from '@/components/layout/AppLayout';

const Index = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <Dashboard />
        <UsageDashboard />
      </div>
    </AppLayout>
  );
};

export default Index;
