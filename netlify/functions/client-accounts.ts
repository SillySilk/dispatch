import { neon } from "@netlify/neon"
const sql = neon()

export default async (req: Request) => {
  const url = new URL(req.url)
  const action = url.searchParams.get('action')
  const id = Number(url.searchParams.get('id'))
  const clientId = Number(url.searchParams.get('clientId'))

  try {
    if (action === 'list') {
      const rows = await sql`SELECT * FROM client_accounts WHERE client_id = ${clientId} ORDER BY service_name`
      return Response.json(rows)
    }
    if (action === 'create' && req.method === 'POST') {
      const b = await req.json()
      const rows = await sql`
        INSERT INTO client_accounts (client_id, service_name, service_url, username, password, notes)
        VALUES (${b.client_id}, ${b.service_name}, ${b.service_url ?? null}, ${b.username ?? null}, ${b.password ?? null}, ${b.notes ?? null})
        RETURNING *
      `
      return Response.json(rows[0])
    }
    if (action === 'update' && req.method === 'POST') {
      const b = await req.json()
      await sql`
        UPDATE client_accounts SET service_name=${b.service_name}, service_url=${b.service_url ?? null}, username=${b.username ?? null}, password=${b.password ?? null}, notes=${b.notes ?? null}, updated_at=NOW()
        WHERE id=${id}
      `
      const rows = await sql`SELECT * FROM client_accounts WHERE id=${id}`
      return Response.json(rows[0])
    }
    if (action === 'delete' && req.method === 'POST') {
      await sql`DELETE FROM client_accounts WHERE id=${id}`
      return Response.json({ success: true })
    }
    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
