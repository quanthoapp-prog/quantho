
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  try {
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    let event
    
    if (webhookSecret) {
      event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret)
    } else {
      event = JSON.parse(body)
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.metadata.userId
      
      console.log(`Payment confirmed for user ${userId}`)

      // Update profile status in database using service role (bypass RLS)
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          subscription_status: 'active',
          subscription_end_date: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString() // Default 1 month buffer
        })
        .eq('id', userId)

      if (error) throw error
      console.log(`Profile ${userId} updated to active`)
    }

    return new Response(JSON.stringify({ received: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })
  } catch (error) {
    console.error('Webhook Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400 
    })
  }
})
