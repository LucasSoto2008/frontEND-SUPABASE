import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejar preflight request de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { mission_id, hunter_id } = await req.json()

    // Usar el Service Role Key para bypasear RLS y hacer operaciones admin (cobro y actualización de saldos)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Obtener la misión
    const { data: mission, error: missionErr } = await supabaseAdmin
      .from('missions')
      .select('*')
      .eq('id', mission_id)
      .single()

    if (missionErr || !mission) throw new Error('Misión no encontrada.')
    if (mission.status === 'completed') throw new Error('La misión ya fue completada.')
    if (mission.assigned_to !== hunter_id) throw new Error('El cazarrecompensas no está asignado a esta misión.')

    // 2. Calcular pago (aplicar 10% de impuesto del Gremio)
    const payout = Math.floor(mission.bounty_credits * 0.9)

    // 3. Obtener saldo actual del cazarrecompensas
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', hunter_id)
      .single()

    if (profileErr || !profile) throw new Error('Perfil no encontrado.')

    // 4. Actualizar créditos del usuario
    const { error: updateProfileErr } = await supabaseAdmin
      .from('profiles')
      .update({ credits: (profile.credits || 0) + payout })
      .eq('id', hunter_id)

    if (updateProfileErr) throw updateProfileErr

    // 5. Marcar la misión como completada
    const { error: updateMissionErr } = await supabaseAdmin
      .from('missions')
      .update({ status: 'completed' })
      .eq('id', mission_id)

    if (updateMissionErr) throw updateMissionErr

    // 6. Devolver resultado JSON
    return new Response(
      JSON.stringify({
        success: true,
        message: "Recompensa cobrada exitosamente.",
        payout,
        tax_deducted: mission.bounty_credits - payout
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
