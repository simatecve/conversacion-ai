import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type AdminSubscription = Database['public']['Tables']['admin_subscriptions']['Row'];
type AdminSubscriptionInsert = Database['public']['Tables']['admin_subscriptions']['Insert'];
type AdminSubscriptionUpdate = Database['public']['Tables']['admin_subscriptions']['Update'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type PaymentPlan = Database['public']['Tables']['subscription_plans']['Row'];
type PaymentMethod = Database['public']['Tables']['payment_methods']['Row'];

export interface SubscriptionWithRelations extends AdminSubscription {
  user_profile?: {
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    email: string | null;
  };
  subscription_plan?: {
    name: string;
    price: number;
    description: string | null;
  };
  payment_method?: {
    name: string;
    provider: string;
  };
}

export interface CreateSubscriptionData {
  user_id: string;
  plan_id: string;
  payment_method_id?: string;
  start_date: string;
  end_date?: string;
  amount: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly' | 'quarterly' | 'weekly' | 'one-time';
  status: 'active' | 'inactive' | 'suspended' | 'cancelled' | 'expired' | 'pending';
  notes?: string;
  auto_renew: boolean;
  trial_end_date?: string;
}

export interface UpdateSubscriptionData extends Partial<CreateSubscriptionData> {
  id: string;
}

export interface SubscriptionFilters {
  status?: string;
  user_id?: string;
  plan_id?: string;
  search?: string;
  start_date_from?: string;
  start_date_to?: string;
  end_date_from?: string;
  end_date_to?: string;
}

export interface SubscriptionStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  cancelled: number;
  expired: number;
  pending: number;
  total_revenue: number;
  monthly_revenue: number;
  yearly_revenue: number;
}

class SubscriptionService {
  /**
   * Obtener todas las suscripciones con relaciones
   */
  static async getAllSubscriptions(filters?: SubscriptionFilters): Promise<SubscriptionWithRelations[]> {
    try {
      let query = supabase
        .from('admin_subscriptions')
        .select(`
          *,
          user_profile:profiles!admin_subscriptions_user_id_fkey(
            first_name,
            last_name,
            company_name,
            email
          ),
          subscription_plan:subscription_plans!admin_subscriptions_plan_id_fkey(
            name,
            price,
            description
          ),
          payment_method:payment_methods!admin_subscriptions_payment_method_id_fkey(
            name,
            provider
          )
        `);

      // Aplicar filtros
      if (filters) {
        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        if (filters.user_id) {
          query = query.eq('user_id', filters.user_id);
        }
        if (filters.plan_id) {
          query = query.eq('plan_id', filters.plan_id);
        }
        if (filters.start_date_from) {
          query = query.gte('start_date', filters.start_date_from);
        }
        if (filters.start_date_to) {
          query = query.lte('start_date', filters.start_date_to);
        }
        if (filters.end_date_from) {
          query = query.gte('end_date', filters.end_date_from);
        }
        if (filters.end_date_to) {
          query = query.lte('end_date', filters.end_date_to);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }
  }

  /**
   * Obtener una suscripción por ID
   */
  static async getSubscriptionById(id: string): Promise<SubscriptionWithRelations | null> {
    try {
      const { data, error } = await supabase
        .from('admin_subscriptions')
        .select(`
          *,
          user_profile:profiles!admin_subscriptions_user_id_fkey(
            first_name,
            last_name,
            company_name,
            email
          ),
          subscription_plan:subscription_plans!admin_subscriptions_plan_id_fkey(
            name,
            price,
            description
          ),
          payment_method:payment_methods!admin_subscriptions_payment_method_id_fkey(
            name,
            provider
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }

  /**
   * Obtener suscripciones de un usuario específico
   */
  static async getUserSubscriptions(userId: string): Promise<SubscriptionWithRelations[]> {
    try {
      const { data, error } = await supabase
        .from('admin_subscriptions')
        .select(`
          *,
          subscription_plan:subscription_plans!admin_subscriptions_plan_id_fkey(
            name,
            price,
            description
          ),
          payment_method:payment_methods!admin_subscriptions_payment_method_id_fkey(
            name,
            provider
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
      throw error;
    }
  }

  /**
   * Crear una nueva suscripción
   */
  static async createSubscription(subscriptionData: CreateSubscriptionData): Promise<AdminSubscription> {
    try {
      // Validar datos antes de crear
      this.validateSubscriptionData(subscriptionData);

      // Obtener el usuario actual para created_by
      const { data: { user } } = await supabase.auth.getUser();
      
      const dataToInsert: AdminSubscriptionInsert = {
        ...subscriptionData,
        created_by: user?.id || null,
        updated_by: user?.id || null
      };

      const { data, error } = await supabase
        .from('admin_subscriptions')
        .insert([dataToInsert])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Actualizar una suscripción existente
   */
  static async updateSubscription(id: string, updateData: Partial<CreateSubscriptionData>): Promise<AdminSubscription> {
    try {
      // Obtener el usuario actual para updated_by
      const { data: { user } } = await supabase.auth.getUser();
      
      const dataToUpdate = {
        ...updateData,
        updated_by: user?.id || null
      };

      const { data, error } = await supabase
        .from('admin_subscriptions')
        .update(dataToUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Eliminar una suscripción
   */
  static async deleteSubscription(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_subscriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting subscription:', error);
      throw error;
    }
  }

  /**
   * Cambiar el estado de una suscripción
   */
  static async changeSubscriptionStatus(
    id: string, 
    status: 'active' | 'inactive' | 'suspended' | 'cancelled' | 'expired' | 'pending'
  ): Promise<AdminSubscription> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('admin_subscriptions')
        .update({ 
          status,
          updated_by: user?.id || null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error changing subscription status:', error);
      throw error;
    }
  }

  /**
   * Renovar una suscripción
   */
  static async renewSubscription(id: string, newEndDate: string): Promise<AdminSubscription> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('admin_subscriptions')
        .update({ 
          end_date: newEndDate,
          status: 'active',
          updated_by: user?.id || null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error renewing subscription:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de suscripciones
   */
  static async getSubscriptionStats(): Promise<SubscriptionStats> {
    try {
      const { data, error } = await supabase
        .from('admin_subscriptions')
        .select('status, amount, billing_cycle');

      if (error) throw error;

      const stats: SubscriptionStats = {
        total: data.length,
        active: 0,
        inactive: 0,
        suspended: 0,
        cancelled: 0,
        expired: 0,
        pending: 0,
        total_revenue: 0,
        monthly_revenue: 0,
        yearly_revenue: 0
      };

      data.forEach(subscription => {
        // Contar por estado
        stats[subscription.status as keyof SubscriptionStats] = 
          (stats[subscription.status as keyof SubscriptionStats] as number) + 1;

        // Calcular ingresos
        stats.total_revenue += subscription.amount;
        
        if (subscription.billing_cycle === 'monthly') {
          stats.monthly_revenue += subscription.amount;
        } else if (subscription.billing_cycle === 'yearly') {
          stats.yearly_revenue += subscription.amount;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching subscription stats:', error);
      throw error;
    }
  }

  /**
   * Obtener suscripciones próximas a vencer
   */
  static async getExpiringSubscriptions(days: number = 30): Promise<SubscriptionWithRelations[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const { data, error } = await supabase
        .from('admin_subscriptions')
        .select(`
          *,
          user_profile:profiles!admin_subscriptions_user_id_fkey(
            first_name,
            last_name,
            company_name,
            email
          ),
          subscription_plan:subscription_plans!admin_subscriptions_plan_id_fkey(
            name,
            price,
            description
          )
        `)
        .eq('status', 'active')
        .not('end_date', 'is', null)
        .lte('end_date', futureDate.toISOString())
        .order('end_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching expiring subscriptions:', error);
      throw error;
    }
  }

  /**
   * Obtener usuarios disponibles para suscripciones
   */
  static async getAvailableUsers(): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('profile_type', 'cliente')
        .order('first_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching available users:', error);
      throw error;
    }
  }

  /**
   * Obtener planes de suscripción activos
   */
  static async getActiveSubscriptionPlans(): Promise<PaymentPlan[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }
  }

  /**
   * Obtener métodos de pago activos
   */
  static async getActivePaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  }

  /**
   * Validar datos de suscripción
   */
  private static validateSubscriptionData(data: CreateSubscriptionData): void {
    if (!data.user_id) {
      throw new Error('El ID del usuario es requerido');
    }
    if (!data.plan_id) {
      throw new Error('El ID del plan es requerido');
    }
    if (!data.start_date) {
      throw new Error('La fecha de inicio es requerida');
    }
    if (data.amount <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }
    if (data.end_date && new Date(data.end_date) <= new Date(data.start_date)) {
      throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
    }
    if (data.trial_end_date && new Date(data.trial_end_date) <= new Date(data.start_date)) {
      throw new Error('La fecha de fin del trial debe ser posterior a la fecha de inicio');
    }
  }

  /**
   * Validar fechas de suscripción
   */
  static validateSubscriptionDates(startDate: string, endDate?: string, trialEndDate?: string): boolean {
    const start = new Date(startDate);
    
    if (endDate) {
      const end = new Date(endDate);
      if (end <= start) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }
    }
    
    if (trialEndDate) {
      const trialEnd = new Date(trialEndDate);
      if (trialEnd <= start) {
        throw new Error('La fecha de fin del trial debe ser posterior a la fecha de inicio');
      }
    }
    
    return true;
  }

  /**
   * Calcular próxima fecha de renovación
   */
  static calculateNextRenewalDate(startDate: string, billingCycle: string): string {
    const start = new Date(startDate);
    
    switch (billingCycle) {
      case 'weekly':
        start.setDate(start.getDate() + 7);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() + 1);
        break;
      case 'quarterly':
        start.setMonth(start.getMonth() + 3);
        break;
      case 'yearly':
        start.setFullYear(start.getFullYear() + 1);
        break;
      default:
        throw new Error('Ciclo de facturación no válido');
    }
    
    return start.toISOString();
  }

  /**
   * Buscar suscripciones por texto
   */
  static async searchSubscriptions(searchTerm: string): Promise<SubscriptionWithRelations[]> {
    try {
      const { data, error } = await supabase
        .from('admin_subscriptions')
        .select(`
          *,
          user_profile:profiles!admin_subscriptions_user_id_fkey(
            first_name,
            last_name,
            company_name,
            email
          ),
          subscription_plan:subscription_plans!admin_subscriptions_plan_id_fkey(
            name,
            price,
            description
          ),
          payment_method:payment_methods!admin_subscriptions_payment_method_id_fkey(
            name,
            provider
          )
        `)
        .or(`
          user_profile.first_name.ilike.%${searchTerm}%,
          user_profile.last_name.ilike.%${searchTerm}%,
          user_profile.company_name.ilike.%${searchTerm}%,
          user_profile.email.ilike.%${searchTerm}%,
          subscription_plan.name.ilike.%${searchTerm}%
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching subscriptions:', error);
      throw error;
    }
  }
}

export default SubscriptionService;