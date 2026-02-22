import { neon } from "@netlify/neon"
const sql = neon()

export default async (req: Request) => {
  const url = new URL(req.url)
  const action = url.searchParams.get('action')
  const id = Number(url.searchParams.get('id'))

  try {
    if (action === 'list') {
      const rows = await sql`SELECT * FROM staff WHERE is_active = 1 ORDER BY last_name, first_name`
      return Response.json(rows)
    }

    if (action === 'get') {
      const rows = await sql`SELECT * FROM staff WHERE id = ${id}`
      return Response.json(rows[0] ?? null)
    }

    if (action === 'byHouse') {
      const houseId = Number(url.searchParams.get('houseId'))
      const rows = await sql`
        SELECT s.* FROM staff s
        JOIN staff_houses sh ON s.id = sh.staff_id
        WHERE sh.house_id = ${houseId} AND s.is_active = 1
        ORDER BY s.last_name, s.first_name
      `
      return Response.json(rows)
    }

    if (action === 'getHouses') {
      const rows = await sql`SELECT house_id FROM staff_houses WHERE staff_id = ${id}`
      return Response.json(rows.map((r: { house_id: number }) => r.house_id))
    }

    if (action === 'create' && req.method === 'POST') {
      const body = await req.json()
      const rows = await sql`
        INSERT INTO staff (first_name, last_name, phone, email, role)
        VALUES (${body.first_name}, ${body.last_name}, ${body.phone ?? null}, ${body.email ?? null}, ${body.role ?? null})
        RETURNING *
      `
      return Response.json(rows[0])
    }

    if (action === 'update' && req.method === 'POST') {
      const body = await req.json()
      await sql`
        UPDATE staff SET
          first_name = ${body.first_name}, last_name = ${body.last_name},
          phone = ${body.phone ?? null}, email = ${body.email ?? null},
          role = ${body.role ?? null}, updated_at = NOW()
        WHERE id = ${id}
      `
      const rows = await sql`SELECT * FROM staff WHERE id = ${id}`
      return Response.json(rows[0])
    }

    if (action === 'delete' && req.method === 'POST') {
      await sql`UPDATE staff SET is_active = 0, updated_at = NOW() WHERE id = ${id}`
      return Response.json({ success: true })
    }

    if (action === 'assignHouses' && req.method === 'POST') {
      const body = await req.json()   // { houseIds: number[] }
      await sql`DELETE FROM staff_houses WHERE staff_id = ${id}`
      for (const hid of body.houseIds) {
        await sql`INSERT INTO staff_houses (staff_id, house_id) VALUES (${id}, ${hid}) ON CONFLICT DO NOTHING`
      }
      return Response.json({ success: true })
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 500 })
  }
}
