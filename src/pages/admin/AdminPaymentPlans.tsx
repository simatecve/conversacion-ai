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
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Star
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type PaymentPlan = Database['public']['Tables']['payment_plans']['Row'];
type PaymentPlanInsert = Database['public']['Tables']['payment_plans']['Insert'];
type PaymentPlanUpdate = Database['public']['Tables']['payment_plans']['Update'];

const AdminPaymentPlans = () => {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'USD',
    billing_period: 'monthly',
    features: '',
    is_active: true,
    is_popular: false,
    max_users: '',
    max_campaigns: '',
    max_contacts: ''
  });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('payment_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching payment plans:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los planes de pago",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!formData.name || !formData.price) {
      toast({
        title: "Error",
        description: "Nombre y precio son requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);

      const planData: PaymentPlanInsert = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        currency: formData.currency,
        billing_period: formData.billing_period,
        features: formData.features ? formData.features.split('\n').filter(f => f.trim()) : null,
        is_active: formData.is_active,
        is_popular: formData.is_popular,
        max_users: formData.max_users ? parseInt(formData.max_users) : null,
        max_campaigns: formData.max_campaigns ? parseInt(formData.max_campaigns) : null,
        max_contacts: formData.max_contacts ? parseInt(formData.max_contacts) : null
      };

      const { error } = await supabase
        .from('payment_plans')
        .insert(planData);

      if (error) throw error;

      toast({
        title: "Plan creado",
        description: "El plan de pago ha sido creado exitosamente",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchPlans();
    } catch (error: any) {
      console.error('Error creating payment plan:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el plan de pago",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlan) return;

    try {
      setUpdating(true);

      const planData: PaymentPlanUpdate = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        currency: formData.currency,
        billing_period: formData.billing_period,
        features: formData.features ? formData.features.split('\n').filter(f => f.trim()) : null,
        is_active: formData.is_active,
        is_popular: formData.is_popular,
        max_users: formData.max_users ? parseInt(formData.max_users) : null,
        max_campaigns: formData.max_campaigns ? parseInt(formData.max_campaigns) : null,
        max_contacts: formData.max_contacts ? parseInt(formData.max_contacts) : null
      };

      const { error } = await supabase
        .from('payment_plans')
        .update(planData)
        .eq('id', selectedPlan.id);

      if (error) throw error;

      toast({
        title: "Plan actualizado",
        description: "El plan de pago ha sido actualizado",
      });

      setIsEditDialogOpen(false);
      setSelectedPlan(null);
      fetchPlans();
    } catch (error: any) {
      console.error('Error updating payment plan:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el plan de pago",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('payment_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Plan eliminado",
        description: "El plan de pago ha sido eliminado",
      });

      fetchPlans();
    } catch (error: any) {
      console.error('Error deleting payment plan:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el plan de pago",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (plan: PaymentPlan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price.toString(),
      currency: plan.currency,
      billing_period: plan.billing_period,
      features: plan.features ? plan.features.join('\n') : '',
      is_active: plan.is_active,
      is_popular: plan.is_popular || false,
      max_users: plan.max_users?.toString() || '',
      max_campaigns: plan.max_campaigns?.toString() || '',
      max_contacts: plan.max_contacts?.toString() || ''
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      currency: 'USD',
      billing_period: 'monthly',
      features: '',
      is_active: true,
      is_popular: false,
      max_users: '',
      max_campaigns: '',
      max_contacts: ''
    });
  };

  const filteredPlans = plans.filter(plan => 
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando planes de pago...</p>
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
              <CreditCard className="mr-3 h-8 w-8" />
              Planes de Pago
            </h1>
            <p className="text-gray-600 mt-2">Administra los planes de suscripción disponibles</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Crear Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Plan de Pago</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nombre del Plan *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Plan Básico"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Precio *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="29.99"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción del plan..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="currency">Moneda</Label>
                    <Input
                      id="currency"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      placeholder="USD"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billing_period">Período</Label>
                    <Input
                      id="billing_period"
                      value={formData.billing_period}
                      onChange={(e) => setFormData({ ...formData, billing_period: e.target.value })}
                      placeholder="monthly"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <span className="text-sm">Activo</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="max_users">Máx. Usuarios</Label>
                    <Input
                      id="max_users"
                      type="number"
                      value={formData.max_users}
                      onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_campaigns">Máx. Campañas</Label>
                    <Input
                      id="max_campaigns"
                      type="number"
                      value={formData.max_campaigns}
                      onChange={(e) => setFormData({ ...formData, max_campaigns: e.target.value })}
                      placeholder="50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_contacts">Máx. Contactos</Label>
                    <Input
                      id="max_contacts"
                      type="number"
                      value={formData.max_contacts}
                      onChange={(e) => setFormData({ ...formData, max_contacts: e.target.value })}
                      placeholder="1000"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="features">Características (una por línea)</Label>
                  <Textarea
                    id="features"
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    placeholder="Envío de mensajes ilimitado\nSoporte 24/7\nIntegraciones avanzadas"
                    rows={4}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_popular}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
                  />
                  <Label>Marcar como popular</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreatePlan} disabled={creating}>
                    {creating ? "Creando..." : "Crear Plan"}
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
              placeholder="Buscar planes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="secondary">
            {filteredPlans.length} plan{filteredPlans.length !== 1 ? 'es' : ''}
          </Badge>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <Card key={plan.id} className={`relative ${plan.is_popular ? 'ring-2 ring-primary' : ''}`}>
              {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="flex items-center space-x-1">
                    {plan.is_active ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-gray-500">/{plan.billing_period}</span>
                </div>
                {plan.description && (
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Limits */}
                  <div className="space-y-2">
                    {plan.max_users && (
                      <div className="flex justify-between text-sm">
                        <span>Usuarios:</span>
                        <span className="font-medium">{plan.max_users}</span>
                      </div>
                    )}
                    {plan.max_campaigns && (
                      <div className="flex justify-between text-sm">
                        <span>Campañas:</span>
                        <span className="font-medium">{plan.max_campaigns}</span>
                      </div>
                    )}
                    {plan.max_contacts && (
                      <div className="flex justify-between text-sm">
                        <span>Contactos:</span>
                        <span className="font-medium">{plan.max_contacts}</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  {plan.features && plan.features.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Características:</h4>
                      <ul className="space-y-1">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center">
                            <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                        {plan.features.length > 3 && (
                          <li className="text-sm text-gray-500">+{plan.features.length - 3} más...</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(plan)}
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
                          <AlertDialogTitle>¿Eliminar plan?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el plan de pago.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeletePlan(plan.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {/* Created date */}
                  <div className="flex items-center text-xs text-gray-500 pt-2 border-t">
                    <Calendar className="h-3 w-3 mr-1" />
                    Creado: {new Date(plan.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPlans.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron planes de pago</p>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Plan de Pago</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_name">Nombre del Plan *</Label>
                  <Input
                    id="edit_name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Plan Básico"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_price">Precio *</Label>
                  <Input
                    id="edit_price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="29.99"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_description">Descripción</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del plan..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit_currency">Moneda</Label>
                  <Input
                    id="edit_currency"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    placeholder="USD"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_billing_period">Período</Label>
                  <Input
                    id="edit_billing_period"
                    value={formData.billing_period}
                    onChange={(e) => setFormData({ ...formData, billing_period: e.target.value })}
                    placeholder="monthly"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <span className="text-sm">Activo</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit_max_users">Máx. Usuarios</Label>
                  <Input
                    id="edit_max_users"
                    type="number"
                    value={formData.max_users}
                    onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_max_campaigns">Máx. Campañas</Label>
                  <Input
                    id="edit_max_campaigns"
                    type="number"
                    value={formData.max_campaigns}
                    onChange={(e) => setFormData({ ...formData, max_campaigns: e.target.value })}
                    placeholder="50"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_max_contacts">Máx. Contactos</Label>
                  <Input
                    id="edit_max_contacts"
                    type="number"
                    value={formData.max_contacts}
                    onChange={(e) => setFormData({ ...formData, max_contacts: e.target.value })}
                    placeholder="1000"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_features">Características (una por línea)</Label>
                <Textarea
                  id="edit_features"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Envío de mensajes ilimitado\nSoporte 24/7\nIntegraciones avanzadas"
                  rows={4}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_popular}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
                />
                <Label>Marcar como popular</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdatePlan} disabled={updating}>
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

export default AdminPaymentPlans;