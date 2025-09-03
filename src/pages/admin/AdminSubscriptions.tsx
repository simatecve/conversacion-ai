import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ErrorBoundary from '@/components/ErrorBoundary';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Calendar as CalendarIcon,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Filter,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type AdminSubscription = {
  id: string;
  user_id: string;
  plan_id: string;
  started_at: string;
  expires_at: string | null;
  status: 'active' | 'inactive' | 'suspended' | 'cancelled' | 'expired' | 'pending';
  created_at: string;
  updated_at: string;
  // Compatibility fields
  start_date?: string;
  end_date?: string | null;
  payment_method_id?: string | null;
  amount?: number;
  currency?: string;
  billing_cycle?: 'monthly' | 'yearly' | 'quarterly' | 'weekly' | 'one-time';
  notes?: string | null;
  auto_renew?: boolean;
  trial_end_date?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  // Relaciones
  user_profile?: {
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
  };
  subscription_plan?: {
    name: string;
    price: number;
  };
  payment_method?: {
    name: string;
    provider: string;
  };
};

type PaymentPlan = Database['public']['Tables']['subscription_plans']['Row'];
type PaymentMethod = Database['public']['Tables']['payment_methods']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<AdminSubscription | null>(null);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [trialEndDate, setTrialEndDate] = useState<Date>();
  const [formData, setFormData] = useState({
    user_id: '',
    plan_id: '',
    payment_method_id: '',
    amount: '',
    currency: 'USD',
    billing_cycle: 'monthly' as const,
    status: 'active' as const,
    notes: '',
    auto_renew: true
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
    fetchPlans();
    fetchPaymentMethods();
    fetchUsers();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          profiles(
            first_name,
            last_name,
            company_name
          ),
          subscription_plans(
            name,
            price
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Mapear los datos para que coincidan con el tipo AdminSubscription
      const mappedData = (data || []).map(sub => ({
        id: sub.id,
        user_id: sub.user_id,
        plan_id: sub.plan_id,
        started_at: sub.started_at,
        expires_at: sub.expires_at,
        status: sub.status,
        created_at: sub.created_at,
        updated_at: sub.updated_at,
        // Compatibility fields
        start_date: sub.started_at,
        end_date: sub.expires_at,
        payment_method_id: null,
        amount: sub.subscription_plans?.price || 0,
        currency: 'USD',
        billing_cycle: 'monthly' as const,
        notes: null,
        auto_renew: true,
        trial_end_date: null,
        created_by: null,
        updated_by: null,
        user_profile: sub.profiles ? {
          first_name: sub.profiles.first_name,
          last_name: sub.profiles.last_name,
          company_name: sub.profiles.company_name
        } : undefined,
        subscription_plan: sub.subscription_plans,
        payment_method: null
      }));
      
      setSubscriptions(mappedData);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las suscripciones',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('profile_type', 'cliente')
        .order('first_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      plan_id: '',
      payment_method_id: '',
      amount: '',
      currency: 'USD',
      billing_cycle: 'monthly' as const,
      status: 'active' as const,
      notes: '',
      auto_renew: true
    });
    setStartDate(undefined);
    setEndDate(undefined);
    setTrialEndDate(undefined);
    setSelectedSubscription(null);
  };

  const handleCreate = async () => {
    try {
      if (!formData.user_id || !formData.plan_id || !startDate) {
        toast({
          title: 'Error',
          description: 'Por favor completa todos los campos requeridos (Usuario, Plan y Fecha de inicio)',
          variant: 'destructive'
        });
        return;
      }

      // Preparar datos para creación - solo campos que existen en user_subscriptions
      const subscriptionData = {
        user_id: formData.user_id,
        plan_id: formData.plan_id,
        started_at: startDate.toISOString(),
        expires_at: endDate?.toISOString() || null,
        status: formData.status
      };

      console.log('Creating subscription with data:', subscriptionData);

      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert([subscriptionData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Creation successful:', data);

      toast({
        title: 'Éxito',
        description: 'Suscripción creada correctamente'
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchSubscriptions();
    } catch (error) {
      console.error('Error creating subscription:', error);
      const errorMessage = error?.message || 'Error desconocido';
      
      // Manejo específico de errores comunes
      let userMessage = `No se pudo crear la suscripción: ${errorMessage}`;
      
      if (errorMessage.includes('foreign key')) {
        userMessage = 'Error: El usuario o plan seleccionado no existe. Por favor verifica los datos.';
      } else if (errorMessage.includes('duplicate')) {
        userMessage = 'Error: Ya existe una suscripción activa para este usuario y plan.';
      } else if (errorMessage.includes('permission')) {
        userMessage = 'Error: No tienes permisos para crear suscripciones.';
      }
      
      toast({
        title: 'Error al crear',
        description: userMessage,
        variant: 'destructive'
      });
    }
  };

  const handleEdit = async () => {
    try {
      if (!selectedSubscription || !formData.user_id || !formData.plan_id || !startDate) {
        toast({
          title: 'Error',
          description: 'Por favor completa todos los campos requeridos (Usuario, Plan y Fecha de inicio)',
          variant: 'destructive'
        });
        return;
      }

      // Preparar datos para actualización - solo campos que existen en user_subscriptions
      const subscriptionData: any = {
        user_id: formData.user_id,
        plan_id: formData.plan_id,
        started_at: startDate.toISOString(),
        expires_at: endDate?.toISOString() || null,
        status: formData.status
      };

      console.log('Updating subscription with data:', subscriptionData);

      const { data, error } = await supabase
        .from('user_subscriptions')
        .update(subscriptionData)
        .eq('id', selectedSubscription.id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Update successful:', data);

      toast({
        title: 'Éxito',
        description: 'Suscripción actualizada correctamente'
      });

      setIsEditDialogOpen(false);
      resetForm();
      fetchSubscriptions();
    } catch (error) {
      console.error('Error updating subscription:', error);
      const errorMessage = error?.message || 'Error desconocido';
      
      // Manejo específico de errores comunes
      let userMessage = `No se pudo actualizar la suscripción: ${errorMessage}`;
      
      if (errorMessage.includes('foreign key')) {
        userMessage = 'Error: El usuario o plan seleccionado no existe. Por favor verifica los datos.';
      } else if (errorMessage.includes('permission')) {
        userMessage = 'Error: No tienes permisos para actualizar esta suscripción.';
      } else if (errorMessage.includes('not found')) {
        userMessage = 'Error: La suscripción que intentas actualizar no existe.';
      }
      
      toast({
        title: 'Error al actualizar',
        description: userMessage,
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (subscription: AdminSubscription) => {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('id', subscription.id);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Suscripción eliminada correctamente'
      });

      fetchSubscriptions();
    } catch (error) {
      console.error('Error deleting subscription:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la suscripción',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (subscription: AdminSubscription) => {
    console.log('Opening edit dialog for subscription:', subscription);
    console.log('Available users:', users);
    console.log('Available plans:', plans);
    console.log('Available payment methods:', paymentMethods);
    
    // Validar que los datos necesarios estén disponibles
    if (!users.length || !plans.length) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos necesarios. Por favor, recarga la página.',
        variant: 'destructive'
      });
      return;
    }
    
    const newFormData = {
      user_id: subscription.user_id || '',
      plan_id: subscription.plan_id || '',
      payment_method_id: subscription.payment_method_id || 'none',
      amount: subscription.amount?.toString() || '',
      currency: subscription.currency || 'USD',
      billing_cycle: subscription.billing_cycle || 'monthly',
      status: subscription.status || 'active',
      notes: subscription.notes || '',
      auto_renew: subscription.auto_renew ?? true
    };
    
    console.log('Form data being set:', newFormData);
     setSelectedSubscription(subscription);
     setFormData(newFormData);
    
    const startDateValue = new Date(subscription.started_at);
    const endDateValue = subscription.expires_at ? new Date(subscription.expires_at) : undefined;
    const trialEndDateValue = subscription.trial_end_date ? new Date(subscription.trial_end_date) : undefined;
    
    console.log('Setting dates:', { startDateValue, endDateValue, trialEndDateValue });
    
    setStartDate(startDateValue);
    setEndDate(endDateValue);
    setTrialEndDate(trialEndDateValue);
    
    console.log('Opening edit dialog...');
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Activa', variant: 'default' as const, icon: CheckCircle },
      inactive: { label: 'Inactiva', variant: 'secondary' as const, icon: XCircle },
      suspended: { label: 'Suspendida', variant: 'destructive' as const, icon: AlertTriangle },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const, icon: XCircle },
      expired: { label: 'Expirada', variant: 'outline' as const, icon: Clock },
      pending: { label: 'Pendiente', variant: 'outline' as const, icon: Clock }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = 
      subscription.user_profile?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.user_profile?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.user_profile?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.subscription_plan?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || subscription.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getUserDisplayName = (subscription: AdminSubscription) => {
    const profile = subscription.user_profile;
    if (profile?.company_name) return profile.company_name;
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return 'Usuario sin nombre';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Suscripciones</h1>
          <p className="text-muted-foreground">
            Administra las suscripciones de todos los usuarios
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Suscripción
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nueva Suscripción</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="user_id">Usuario *</Label>
                  <Select value={formData.user_id} onValueChange={(value) => setFormData({ ...formData, user_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.company_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Usuario sin nombre'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="plan_id">Plan *</Label>
                  <Select value={formData.plan_id} onValueChange={(value) => {
                    setFormData({ ...formData, plan_id: value });
                    const selectedPlan = plans.find(p => p.id === value);
                    if (selectedPlan) {
                      setFormData(prev => ({ ...prev, amount: selectedPlan.price.toString() }));
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - ${plan.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="status">Estado</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activa</SelectItem>
                      <SelectItem value="inactive">Inactiva</SelectItem>
                      <SelectItem value="suspended">Suspendida</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                      <SelectItem value="expired">Expirada</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha de Inicio *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Fecha de Fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate}>
                  Crear Suscripción
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por usuario o plan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activas</SelectItem>
                  <SelectItem value="inactive">Inactivas</SelectItem>
                  <SelectItem value="suspended">Suspendidas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                  <SelectItem value="expired">Expiradas</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions List */}
      <div className="grid gap-4">
        {filteredSubscriptions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay suscripciones</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No se encontraron suscripciones que coincidan con los filtros.' 
                    : 'Aún no hay suscripciones creadas.'}
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Suscripción
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredSubscriptions.map((subscription) => (
            <Card key={subscription.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {getUserDisplayName(subscription)}
                      </h3>
                      {getStatusBadge(subscription.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Plan</p>
                        <p className="font-medium">{subscription.subscription_plan?.name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Monto</p>
                        <p className="font-medium">
                          {subscription.currency} ${subscription.amount}
                          <span className="text-muted-foreground ml-1">/{subscription.billing_cycle}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Inicio</p>
                        <p className="font-medium">
                          {format(new Date(subscription.started_at), "dd/MM/yyyy", { locale: es })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Fin</p>
                        <p className="font-medium">
                          {subscription.expires_at 
                            ? format(new Date(subscription.expires_at), "dd/MM/yyyy", { locale: es })
                            : 'Sin fecha de fin'
                          }
                        </p>
                      </div>
                    </div>

                    {subscription.payment_method && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          Método de pago: <span className="font-medium">
                            {subscription.payment_method.name} ({subscription.payment_method.provider})
                          </span>
                        </p>
                      </div>
                    )}

                    {subscription.notes && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          Notas: <span className="font-medium">{subscription.notes}</span>
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>Renovación: {subscription.auto_renew ? 'Automática' : 'Manual'}</span>
                      <span>Creado: {format(new Date(subscription.created_at), "dd/MM/yyyy HH:mm", { locale: es })}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(subscription)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar suscripción?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente la suscripción de {getUserDisplayName(subscription)}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(subscription)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <ErrorBoundary>
            <DialogHeader>
              <DialogTitle>Editar Suscripción</DialogTitle>
            </DialogHeader>
            {console.log('Rendering edit dialog. isEditDialogOpen:', isEditDialogOpen, 'selectedSubscription:', selectedSubscription, 'formData:', formData)}
          <div className="space-y-4">
            {/* Same form content as create dialog */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="user_id">Usuario *</Label>
                <Select value={formData.user_id || undefined} onValueChange={(value) => setFormData({ ...formData, user_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.company_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Usuario sin nombre'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="plan_id">Plan *</Label>
                <Select value={formData.plan_id || undefined} onValueChange={(value) => {
                  setFormData({ ...formData, plan_id: value });
                  const selectedPlan = plans.find(p => p.id === value);
                  if (selectedPlan) {
                    setFormData(prev => ({ ...prev, amount: selectedPlan.price.toString() }));
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - ${plan.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment_method_id">Método de Pago</Label>
                <Select value={formData.payment_method_id || undefined} onValueChange={(value) => setFormData({ ...formData, payment_method_id: value || '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin método de pago</SelectItem>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name} ({method.provider})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select value={formData.status || undefined} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activa</SelectItem>
                    <SelectItem value="inactive">Inactiva</SelectItem>
                    <SelectItem value="suspended">Suspendida</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                    <SelectItem value="expired">Expirada</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="amount">Monto *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="currency">Moneda</Label>
                <Select value={formData.currency || undefined} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="ARS">ARS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="billing_cycle">Ciclo de Facturación</Label>
                <Select value={formData.billing_cycle || undefined} onValueChange={(value: any) => setFormData({ ...formData, billing_cycle: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ciclo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="one-time">Único</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Fecha de Inicio *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Fecha de Fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Fin del Trial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !trialEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {trialEndDate ? format(trialEndDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={trialEndDate}
                      onSelect={setTrialEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="auto_renew"
                checked={formData.auto_renew}
                onCheckedChange={(checked) => setFormData({ ...formData, auto_renew: checked })}
              />
              <Label htmlFor="auto_renew">Renovación Automática</Label>
            </div>

            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales sobre la suscripción..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEdit}>
                Actualizar Suscripción
              </Button>
            </div>
          </div>
          </ErrorBoundary>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubscriptions;