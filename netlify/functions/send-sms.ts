import { neon } from "@netlify/neon"
const sql = neon()

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  const sid   = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from  = process.env.TWILIO_FROM_NUMBER

  // Graceful no-op when not configured
  if (!sid || !token || !from) {
    return Response.json({
      success: false,
      error: 'SMS is not yet configured for this installation. Contact your administrator to enable messaging.'
    })
  }

  try {
    const body = await req.json()
    const { to, message, staffId, appointmentId } = body
    const sentAt = new Date().toISOString()

    // Dynamically import twilio to avoid issues when unconfigured
    const twilio = await import('twilio')
    const client = twilio.default(sid, token)

    const twilioMsg = await client.messages.create({ body: message, to, from })

    // Log to messages table
    await sql`
      INSERT INTO messages (twilio_sid, direction, from_number, to_number, body, status, staff_id, related_appointment_id, sent_at)
      VALUES (${twilioMsg.sid}, 'outbound', ${from}, ${to}, ${message}, ${twilioMsg.status}, ${staffId ?? null}, ${appointmentId ?? null}, ${sentAt})
    `

    return Response.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    // Log failed send
    const from2 = process.env.TWILIO_FROM_NUMBER!
    const body2 = await req.json().catch(() => ({}))
    await sql`
      INSERT INTO messages (direction, from_number, to_number, body, status, error_message, sent_at)
      VALUES ('outbound', ${from2}, ${body2.to ?? 'unknown'}, ${body2.message ?? ''}, 'failed', ${message}, ${new Date().toISOString()})
    `.catch(() => {}) // don't throw if logging fails
    return Response.json({ success: false, error: message }, { status: 500 })
  }
}
