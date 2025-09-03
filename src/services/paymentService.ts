import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type PaymentMethod = Database['public']['Tables']['payment_methods']['Row'];

// Interfaces para diferentes proveedores
export interface StripeConfig {
  publicKey: string;
  secretKey: string;
  webhookSecret?: string;
  currency?: string;
}

export interface MercadoPagoConfig {
  accessToken: string;
  publicKey: string;
  webhookSecret?: string;
  currency?: string;
  country?: string;
}

export interface PaymentIntent {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  clientSecret?: string;
  checkoutUrl?: string;
  error?: string;
}

class PaymentService {
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
      console.error('Error fetching active payment methods:', error);
      return [];
    }
  }

  /**
   * Obtener configuración de un método de pago específico
   */
  static async getPaymentMethodConfig(provider: string): Promise<PaymentMethod | null> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('provider', provider)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching ${provider} config:`, error);
      return null;
    }
  }

  /**
   * Crear intención de pago con Stripe
   */
  static async createStripePaymentIntent(
    config: StripeConfig,
    paymentData: PaymentIntent
  ): Promise<PaymentResult> {
    try {
      // En un entorno real, esto se haría en el backend por seguridad
      // Aquí simulamos la creación de la intención de pago
      
      if (!config.secretKey || !config.publicKey) {
        return {
          success: false,
          error: 'Stripe no está configurado correctamente. Faltan las claves de API.'
        };
      }

      // Simulación de llamada a Stripe API
      // En producción, esto debe hacerse desde el backend
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentData.amount * 100, // Stripe usa centavos
          currency: paymentData.currency.toLowerCase(),
          description: paymentData.description,
          metadata: paymentData.metadata,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear la intención de pago');
      }

      const result = await response.json();

      return {
        success: true,
        paymentId: result.id,
        clientSecret: result.client_secret,
      };
    } catch (error) {
      console.error('Error creating Stripe payment intent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Crear preferencia de pago con Mercado Pago
   */
  static async createMercadoPagoPreference(
    config: MercadoPagoConfig,
    paymentData: PaymentIntent
  ): Promise<PaymentResult> {
    try {
      if (!config.accessToken) {
        return {
          success: false,
          error: 'Mercado Pago no está configurado correctamente. Falta el access token.'
        };
      }

      // En producción, esto debe hacerse desde el backend
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{
            title: paymentData.description || 'Pago',
            quantity: 1,
            unit_price: paymentData.amount,
            currency_id: paymentData.currency.toUpperCase(),
          }],
          metadata: paymentData.metadata,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear la preferencia de pago');
      }

      const result = await response.json();

      return {
        success: true,
        paymentId: result.id,
        checkoutUrl: result.init_point,
      };
    } catch (error) {
      console.error('Error creating MercadoPago preference:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Procesar pago según el proveedor
   */
  static async processPayment(
    provider: string,
    paymentData: PaymentIntent
  ): Promise<PaymentResult> {
    try {
      const config = await this.getPaymentMethodConfig(provider);
      
      if (!config) {
        return {
          success: false,
          error: `Método de pago ${provider} no disponible o no configurado`
        };
      }

      switch (provider.toLowerCase()) {
        case 'stripe':
          const stripeConfig: StripeConfig = {
            publicKey: config.api_key || '',
            secretKey: config.secret_key || '',
            currency: paymentData.currency
          };
          return await this.createStripePaymentIntent(stripeConfig, paymentData);

        case 'mercadopago':
          const mpConfig: MercadoPagoConfig = {
            accessToken: config.secret_key || '',
            publicKey: config.api_key || '',
            currency: paymentData.currency,
            country: 'AR'
          };
          return await this.createMercadoPagoPreference(mpConfig, paymentData);

        default:
          return {
            success: false,
            error: `Proveedor ${provider} no soportado`
          };
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Validar configuración de Stripe
   */
  static validateStripeConfig(config: StripeConfig): boolean {
    return !!(config.publicKey && config.secretKey &&
      config.publicKey.startsWith('pk_') &&
      config.secretKey.startsWith('sk_'));
  }

  /**
   * Validar configuración de Mercado Pago
   */
  static validateMercadoPagoConfig(config: MercadoPagoConfig): boolean {
    return !!(config.accessToken && config.publicKey &&
      config.accessToken.startsWith('APP_USR'));
  }

  /**
   * Obtener monedas soportadas por proveedor
   */
  static async getSupportedCurrencies(provider: string): Promise<string[]> {
    try {
      const config = await this.getPaymentMethodConfig(provider);
      return config?.supported_currencies || [];
    } catch (error) {
      console.error('Error getting supported currencies:', error);
      return [];
    }
  }
}

export default PaymentService;