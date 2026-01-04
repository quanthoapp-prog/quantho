
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the user ID from the request body or from the authorization header
    // Using service role, we can delete any user. For security, we should verify the user 
    // is deleting themselves or is an admin.
    
    // Get JWT from header to identify the user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        throw new Error('No authorization header')
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
        throw new Error('Invalid token or user not found')
    }

    const userId = user.id

    console.log(`Deleting all data and auth record for user: ${userId}`)

    // 1. Delete data from public schema tables (Profiles will cascade delete if schema set up correctly, 
    // but we do it manually for safety because of other tables)
    
    const tables = ['transactions', 'clients', 'fixed_debts', 'user_settings', 'reminders', 'notifications', 'contracts', 'ateco_codes', 'profiles']
    
    for (const table of tables) {
        const { error } = await supabaseAdmin.from(table).delete().eq(table === 'profiles' ? 'id' : 'user_id', userId)
        if (error) console.error(`Error deleting from ${table}:`, error)
    }

    // 2. Delete the user from Supabase Auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) throw deleteError

    return new Response(
      JSON.stringify({ message: 'Account deleted successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Delete Account Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
