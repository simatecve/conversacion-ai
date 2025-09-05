import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, AlertCircle } from 'lucide-react';

const AdminPaymentMethods = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Métodos de Pago</h1>
        <p className="text-muted-foreground">
          Administra los métodos de pago disponibles en el sistema
        </p>
      </div>

      {/* Temporarily disabled notice */}
      <Card>
        <CardContent className="text-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-yellow-100 p-3 rounded-full">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sección en Desarrollo
              </h3>
              <p className="text-gray-500 max-w-md">
                Esta sección está temporalmente deshabilitada mientras se configura la base de datos.
                Pronto estará disponible para gestionar los métodos de pago.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats placeholder */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Métodos</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sandbox</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proveedores</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPaymentMethods;