import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the JWT token and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    console.log('Authenticated user:', user.id);

    const { name, phone_number, color } = await req.json();

    if (!name || !phone_number || !color) {
      throw new Error('Missing required fields: name, phone_number, color');
    }

    console.log('Creating WhatsApp connection:', { name, phone_number, color });

    // Insert the new WhatsApp connection
    const { data, error } = await supabase
      .from('whatsapp_connections')
      .insert({
        user_id: user.id,
        name,
        phone_number,
        color,
        status: 'desconectado'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('WhatsApp connection created successfully:', data);

    // Here you could add webhook integration to your WhatsApp service
    // For example, call an external API to register the WhatsApp number
    try {
      console.log('Calling WhatsApp webhook for connection setup...');
      // Example webhook call (replace with your actual webhook URL)
      // const webhookResponse = await fetch('YOUR_WHATSAPP_WEBHOOK_URL', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     action: 'create_connection',
      //     phone_number: phone_number,
      //     connection_id: data.id,
      //     user_id: user.id
      //   })
      // });
      
      // if (!webhookResponse.ok) {
      //   console.error('Webhook call failed:', await webhookResponse.text());
      // }
    } catch (webhookError) {
      console.error('Webhook error (non-blocking):', webhookError);
      // Don't throw here as the connection was created successfully
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        message: 'WhatsApp connection created successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in create-whatsapp-connection function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});