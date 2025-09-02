import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Wallet, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  Settings,
  Globe,
  DollarSign
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type PaymentMethod = Database['public']['Tables']['payment_methods']['Row'];
type PaymentMethodInsert = Database['public']['Tables']['payment_methods']['Insert'];
type PaymentMethodUpdate = Database['public']['Tables']['payment_methods']['Update'];

const AdminPaymentMethods = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    provider: '',
    api_key: '',
    secret_key: '',
    webhook_url: '',
    supported_currencies: '',
    is_active: true,
    is_sandbox: false,
    configuration: ''
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los métodos de pago",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMethod = async () => {
    if (!formData.name || !formData.provider) {
      toast({
        title: "Error",
        description: "Nombre y proveedor son requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);

      const methodData: PaymentMethodInsert = {
        name: formData.name,
        description: formData.description || null,
        provider: formData.provider,
        api_key: formData.api_key || null,
        secret_key: formData.secret_key || null,
        webhook_url: formData.webhook_url || null,
        supported_currencies: formData.supported_currencies ? formData.supported_currencies.split(',').map(c => c.trim()) : null,
        is_active: formData.is_active,
        is_sandbox: formData.is_sandbox,
        configuration: formData.configuration ? JSON.parse(formData.configuration) : null
      };

      const { error } = await supabase
        .from('payment_methods')
        .insert(methodData);

      if (error) throw error;

      toast({
        title: "Método creado",
        description: "El método de pago ha sido creado exitosamente",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchMethods();
    } catch (error: any) {
      console.error('Error creating payment method:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el método de pago",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateMethod = async () => {
    if (!selectedMethod) return;

    try {
      setUpdating(true);

      const methodData: PaymentMethodUpdate = {
        name: formData.name,
        description: formData.description || null,
        provider: formData.provider,
        api_key: formData.api_key || null,
        secret_key: formData.secret_key || null,
        webhook_url: formData.webhook_url || null,
        supported_currencies: formData.supported_currencies ? formData.supported_currencies.split(',').map(c => c.trim()) : null,
        is_active: formData.is_active,
        is_sandbox: formData.is_sandbox,
        configuration: formData.configuration ? JSON.parse(formData.configuration) : null
      };

      const { error } = await supabase
        .from('payment_methods')
        .update(methodData)
        .eq('id', selectedMethod.id);

      if (error) throw error;

      toast({
        title: "Método actualizado",
        description: "El método de pago ha sido actualizado",
      });

      setIsEditDialogOpen(false);
      setSelectedMethod(null);
      fetchMethods();
    } catch (error: any) {
      console.error('Error updating payment method:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el método de pago",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', methodId);

      if (error) throw error;

      toast({
        title: "Método eliminado",
        description: "El método de pago ha sido eliminado",
      });

      fetchMethods();
    } catch (error: any) {
      console.error('Error deleting payment method:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el método de pago",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setFormData({
      name: method.name,
      description: method.description || '',
      provider: method.provider,
      api_key: method.api_key || '',
      secret_key: method.secret_key || '',
      webhook_url: method.webhook_url || '',
      supported_currencies: method.supported_currencies ? method.supported_currencies.join(', ') : '',
      is_active: method.is_active,
      is_sandbox: method.is_sandbox || false,
      configuration: method.configuration ? JSON.stringify(method.configuration, null, 2) : ''
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      provider: '',
      api_key: '',
      secret_key: '',
      webhook_url: '',
      supported_currencies: '',
      is_active: true,
      is_sandbox: false,
      configuration: ''
    });
  };

  const filteredMethods = methods.filter(method => 
    method.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    method.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
    method.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'stripe':
      case 'paypal':
      case 'mercadopago':
      case 'payoneer':
        return <CreditCard className="h-5 w-5" />;
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando métodos de pago...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Wallet className="mr-3 h-8 w-8" />
              Métodos de Pago
            </h1>
            <p className="text-gray-600 mt-2">Configura los proveedores de pago disponibles</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Método
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agregar Método de Pago</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Stripe Checkout"
                    />
                  </div>
                  <div>
                    <Label htmlFor="provider">Proveedor *</Label>
                    <Input
                      id="provider"
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                      placeholder="stripe"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción del método de pago..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="api_key">API Key</Label>
                    <Input
                      id="api_key"
                      type="password"
                      value={formData.api_key}
                      onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                      placeholder="pk_test_..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="secret_key">Secret Key</Label>
                    <Input
                      id="secret_key"
                      type="password"
                      value={formData.secret_key}
                      onChange={(e) => setFormData({ ...formData, secret_key: e.target.value })}
                      placeholder="sk_test_..."
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="webhook_url">Webhook URL</Label>
                  <Input
                    id="webhook_url"
                    value={formData.webhook_url}
                    onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                    placeholder="https://tu-sitio.com/webhooks/stripe"
                  />
                </div>
                <div>
                  <Label htmlFor="supported_currencies">Monedas Soportadas (separadas por coma)</Label>
                  <Input
                    id="supported_currencies"
                    value={formData.supported_currencies}
                    onChange={(e) => setFormData({ ...formData, supported_currencies: e.target.value })}
                    placeholder="USD, EUR, MXN"
                  />
                </div>
                <div>
                  <Label htmlFor="configuration">Configuración JSON</Label>
                  <Textarea
                    id="configuration"
                    value={formData.configuration}
                    onChange={(e) => setFormData({ ...formData, configuration: e.target.value })}
                    placeholder='{"success_url": "https://tu-sitio.com/success", "cancel_url": "https://tu-sitio.com/cancel"}'
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label>Activo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_sandbox}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_sandbox: checked })}
                    />
                    <Label>Modo Sandbox</Label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateMethod} disabled={creating}>
                    {creating ? "Creando..." : "Crear Método"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar métodos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="secondary">
            {filteredMethods.length} método{filteredMethods.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMethods.map((method) => (
            <Card key={method.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      {getProviderIcon(method.provider)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{method.name}</CardTitle>
                      <p className="text-sm text-gray-500 capitalize">{method.provider}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {method.is_active ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    {method.is_sandbox && (
                      <Badge variant="outline" className="text-xs">
                        Sandbox
                      </Badge>
                    )}
                  </div>
                </div>
                {method.description && (
                  <p className="text-gray-600 text-sm">{method.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Configuration Details */}
                  <div className="space-y-2">
                    {method.webhook_url && (
                      <div className="flex items-center text-sm">
                        <Globe className="h-3 w-3 mr-2 text-gray-400" />
                        <span className="text-gray-600 truncate">Webhook configurado</span>
                      </div>
                    )}
                    {method.supported_currencies && method.supported_currencies.length > 0 && (
                      <div className="flex items-center text-sm">
                        <DollarSign className="h-3 w-3 mr-2 text-gray-400" />
                        <span className="text-gray-600">
                          {method.supported_currencies.slice(0, 3).join(', ')}
                          {method.supported_currencies.length > 3 && ` +${method.supported_currencies.length - 3}`}
                        </span>
                      </div>
                    )}
                    {method.api_key && (
                      <div className="flex items-center text-sm">
                        <Settings className="h-3 w-3 mr-2 text-gray-400" />
                        <span className="text-gray-600">API configurada</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(method)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar método?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el método de pago.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteMethod(method.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {/* Created date */}
                  <div className="flex items-center text-xs text-gray-500 pt-2 border-t">
                    <Calendar className="h-3 w-3 mr-1" />
                    Creado: {new Date(method.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredMethods.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron métodos de pago</p>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Método de Pago</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_name">Nombre *</Label>
                  <Input
                    id="edit_name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Stripe Checkout"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_provider">Proveedor *</Label>
                  <Input
                    id="edit_provider"
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    placeholder="stripe"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_description">Descripción</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del método de pago..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_api_key">API Key</Label>
                  <Input
                    id="edit_api_key"
                    type="password"
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    placeholder="pk_test_..."
                  />
                </div>
                <div>
                  <Label htmlFor="edit_secret_key">Secret Key</Label>
                  <Input
                    id="edit_secret_key"
                    type="password"
                    value={formData.secret_key}
                    onChange={(e) => setFormData({ ...formData, secret_key: e.target.value })}
                    placeholder="sk_test_..."
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_webhook_url">Webhook URL</Label>
                <Input
                  id="edit_webhook_url"
                  value={formData.webhook_url}
                  onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                  placeholder="https://tu-sitio.com/webhooks/stripe"
                />
              </div>
              <div>
                <Label htmlFor="edit_supported_currencies">Monedas Soportadas (separadas por coma)</Label>
                <Input
                  id="edit_supported_currencies"
                  value={formData.supported_currencies}
                  onChange={(e) => setFormData({ ...formData, supported_currencies: e.target.value })}
                  placeholder="USD, EUR, MXN"
                />
              </div>
              <div>
                <Label htmlFor="edit_configuration">Configuración JSON</Label>
                <Textarea
                  id="edit_configuration"
                  value={formData.configuration}
                  onChange={(e) => setFormData({ ...formData, configuration: e.target.value })}
                  placeholder='{"success_url": "https://tu-sitio.com/success", "cancel_url": "https://tu-sitio.com/cancel"}'
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Activo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_sandbox}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_sandbox: checked })}
                  />
                  <Label>Modo Sandbox</Label>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateMethod} disabled={updating}>
                  {updating ? "Actualizando..." : "Actualizar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminPaymentMethods;