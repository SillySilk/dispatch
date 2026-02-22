import { neon } from "@netlify/neon"
const sql = neon()

export default async (req: Request) => {
  const url = new URL(req.url)
  const action = url.searchParams.get('action')
  const id = Number(url.searchParams.get('id'))

  try {
    if (action === 'list') {
      const rows = await sql`
        SELECT h.*, s.first_name || ' ' || s.last_name AS manager_name
        FROM houses h LEFT JOIN staff s ON h.manager_id = s.id
        WHERE h.is_active = 1 ORDER BY h.name
      `
      return Response.json(rows)
    }

    if (action === 'get') {
      const rows = await sql`
        SELECT h.*, s.first_name || ' ' || s.last_name AS manager_name
        FROM houses h LEFT JOIN staff s ON h.manager_id = s.id
        WHERE h.id = ${id}
      `
      return Response.json(rows[0] ?? null)
    }

    if (action === 'create' && req.method === 'POST') {
      const body = await req.json()
      const rows = await sql`
        INSERT INTO houses (name, address, phone, notes, manager_id)
        VALUES (${body.name}, ${body.address ?? null}, ${body.phone ?? null}, ${body.notes ?? null}, ${body.manager_id ?? null})
        RETURNING id
      `
      const created = await sql`
        SELECT h.*, s.first_name || ' ' || s.last_name AS manager_name
        FROM houses h LEFT JOIN staff s ON h.manager_id = s.id
        WHERE h.id = ${rows[0].id}
      `
      return Response.json(created[0])
    }

    if (action === 'update' && req.method === 'POST') {
      const body = await req.json()
      await sql`
        UPDATE houses SET
          name = ${body.name}, address = ${body.address ?? null},
          phone = ${body.phone ?? null}, notes = ${body.notes ?? null},
          manager_id = ${body.manager_id ?? null}, updated_at = NOW()
        WHERE id = ${id}
      `
      const updated = await sql`
        SELECT h.*, s.first_name || ' ' || s.last_name AS manager_name
        FROM houses h LEFT JOIN staff s ON h.manager_id = s.id
        WHERE h.id = ${id}
      `
      return Response.json(updated[0])
    }

    if (action === 'delete' && req.method === 'POST') {
      await sql`UPDATE houses SET is_active = 0, updated_at = NOW() WHERE id = ${id}`
      return Response.json({ success: true })
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 500 })
  }
}
