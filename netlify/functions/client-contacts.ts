import { neon } from "@netlify/neon"
const sql = neon()

export default async (req: Request) => {
  const url = new URL(req.url)
  const action = url.searchParams.get('action')
  const id = Number(url.searchParams.get('id'))
  const clientId = Number(url.searchParams.get('clientId'))

  try {
    if (action === 'list') {
      const rows = await sql`SELECT * FROM client_contacts WHERE client_id = ${clientId} ORDER BY category, name`
      return Response.json(rows)
    }
    if (action === 'create' && req.method === 'POST') {
      const b = await req.json()
      const rows = await sql`
        INSERT INTO client_contacts (client_id, name, category, phone, email, address, notes)
        VALUES (${b.client_id}, ${b.name}, ${b.category ?? 'other'}, ${b.phone ?? null}, ${b.email ?? null}, ${b.address ?? null}, ${b.notes ?? null})
        RETURNING *
      `
      return Response.json(rows[0])
    }
    if (action === 'update' && req.method === 'POST') {
      const b = await req.json()
      await sql`
        UPDATE client_contacts SET name=${b.name}, category=${b.category ?? 'other'}, phone=${b.phone ?? null}, email=${b.email ?? null}, address=${b.address ?? null}, notes=${b.notes ?? null}, updated_at=NOW()
        WHERE id=${id}
      `
      const rows = await sql`SELECT * FROM client_contacts WHERE id=${id}`
      return Response.json(rows[0])
    }
    if (action === 'delete' && req.method === 'POST') {
      await sql`DELETE FROM client_contacts WHERE id=${id}`
      return Response.json({ success: true })
    }
    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
