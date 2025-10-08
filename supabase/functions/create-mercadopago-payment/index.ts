import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener datos del request
    const { planId } = await req.json();
    
    // Obtener el usuario autenticado
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Usuario no autenticado');
    }

    console.log('Creating payment for user:', user.id, 'plan:', planId);

    // Obtener el plan
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      throw new Error('Plan no encontrado');
    }

    // Obtener la configuración de Mercado Pago
    const { data: paymentMethod, error: pmError } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('provider', 'mercadopago_argentina')
      .eq('is_active', true)
      .single();

    if (pmError || !paymentMethod) {
      throw new Error('Mercado Pago no está configurado. Contacta al administrador.');
    }

    // Obtener perfil del usuario para información adicional
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const accessToken = paymentMethod.secret_key;

    // Crear la preferencia de pago
    const preferenceData = {
      items: [
        {
          title: `Plan ${plan.name}`,
          description: plan.description || `Suscripción mensual al plan ${plan.name}`,
          quantity: 1,
          unit_price: Number(plan.price),
          currency_id: 'ARS'
        }
      ],
      payer: {
        name: profile?.first_name || '',
        surname: profile?.last_name || '',
        email: user.email || '',
      },
      back_urls: {
        success: `${req.headers.get('origin')}/payment-success`,
        failure: `${req.headers.get('origin')}/payment-failure`,
        pending: `${req.headers.get('origin')}/payment-pending`
      },
      auto_return: 'approved',
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
        plan_name: plan.name
      },
      external_reference: `${user.id}-${planId}-${Date.now()}`
    };

    console.log('Creating Mercado Pago preference:', preferenceData);

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceData)
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error('Mercado Pago API error:', errorText);
      throw new Error(`Error al crear la preferencia de pago: ${errorText}`);
    }

    const preference = await mpResponse.json();
    console.log('Mercado Pago preference created:', preference.id);

    return new Response(
      JSON.stringify({
        init_point: preference.init_point,
        preference_id: preference.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});