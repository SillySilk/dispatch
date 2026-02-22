import { neon } from "@netlify/neon"
const sql = neon()

export default async (req: Request) => {
  const url = new URL(req.url)
  const action = url.searchParams.get('action')
  const id = Number(url.searchParams.get('id'))

  try {
    if (action === 'list') {
      const rows = await sql`
        SELECT o.*, COALESCE(s.first_name || ' ' || s.last_name, o.external_name) as nurse_name,
          COALESCE(s.phone, o.external_phone) as nurse_phone, h.name as house_name
        FROM oncall_nurses o LEFT JOIN staff s ON o.staff_id = s.id LEFT JOIN houses h ON o.house_id = h.id
        ORDER BY o.start_date DESC
      `
      return Response.json(rows)
    }

    if (action === 'listByHouse') {
      const houseId = Number(url.searchParams.get('houseId'))
      const rows = await sql`
        SELECT o.*, COALESCE(s.first_name || ' ' || s.last_name, o.external_name) as nurse_name,
          COALESCE(s.phone, o.external_phone) as nurse_phone, h.name as house_name
        FROM oncall_nurses o LEFT JOIN staff s ON o.staff_id = s.id LEFT JOIN houses h ON o.house_id = h.id
        WHERE o.house_id = ${houseId} ORDER BY o.start_date DESC
      `
      return Response.json(rows)
    }

    if (action === 'getCurrent') {
      const houseId = Number(url.searchParams.get('houseId'))
      const today = new Date().toISOString().slice(0, 10)
      const rows = await sql`
        SELECT o.*, COALESCE(s.first_name || ' ' || s.last_name, o.external_name) as nurse_name,
          COALESCE(s.phone, o.external_phone) as nurse_phone, h.name as house_name
        FROM oncall_nurses o LEFT JOIN staff s ON o.staff_id = s.id LEFT JOIN houses h ON o.house_id = h.id
        WHERE o.house_id = ${houseId} AND ${today} BETWEEN o.start_date AND o.end_date LIMIT 1
      `
      return Response.json(rows[0] ?? null)
    }

    if (action === 'getCurrentAll') {
      const today = new Date().toISOString().slice(0, 10)
      const rows = await sql`
        SELECT o.*, COALESCE(s.first_name || ' ' || s.last_name, o.external_name) as nurse_name,
          COALESCE(s.phone, o.external_phone) as nurse_phone, h.name as house_name
        FROM oncall_nurses o LEFT JOIN staff s ON o.staff_id = s.id LEFT JOIN houses h ON o.house_id = h.id
        WHERE ${today} BETWEEN o.start_date AND o.end_date ORDER BY h.name
      `
      return Response.json(rows)
    }

    if (action === 'create' && req.method === 'POST') {
      const b = await req.json()
      const rows = await sql`
        INSERT INTO oncall_nurses (house_id, staff_id, external_name, external_phone, start_date, end_date, notes)
        VALUES (${b.house_id}, ${b.staff_id ?? null}, ${b.external_name ?? null}, ${b.external_phone ?? null}, ${b.start_date}, ${b.end_date}, ${b.notes ?? null})
        RETURNING id
      `
      const created = await sql`
        SELECT o.*, COALESCE(s.first_name || ' ' || s.last_name, o.external_name) as nurse_name,
          COALESCE(s.phone, o.external_phone) as nurse_phone, h.name as house_name
        FROM oncall_nurses o LEFT JOIN staff s ON o.staff_id = s.id LEFT JOIN houses h ON o.house_id = h.id
        WHERE o.id = ${rows[0].id}
      `
      return Response.json(created[0])
    }

    if (action === 'update' && req.method === 'POST') {
      const b = await req.json()
      await sql`
        UPDATE oncall_nurses SET
          house_id = ${b.house_id}, staff_id = ${b.staff_id ?? null},
          external_name = ${b.external_name ?? null}, external_phone = ${b.external_phone ?? null},
          start_date = ${b.start_date}, end_date = ${b.end_date},
          notes = ${b.notes ?? null}, updated_at = NOW()
        WHERE id = ${id}
      `
      const updated = await sql`
        SELECT o.*, COALESCE(s.first_name || ' ' || s.last_name, o.external_name) as nurse_name,
          COALESCE(s.phone, o.external_phone) as nurse_phone, h.name as house_name
        FROM oncall_nurses o LEFT JOIN staff s ON o.staff_id = s.id LEFT JOIN houses h ON o.house_id = h.id
        WHERE o.id = ${id}
      `
      return Response.json(updated[0])
    }

    if (action === 'delete' && req.method === 'POST') {
      await sql`DELETE FROM oncall_nurses WHERE id = ${id}`
      return Response.json({ success: true })
    }

    if (action === 'bulkCreate' && req.method === 'POST') {
      const body = await req.json()  // { rows: OnCallInput[] }
      const created = []
      for (const row of body.rows) {
        const r = await sql`
          INSERT INTO oncall_nurses (house_id, staff_id, external_name, external_phone, start_date, end_date, notes)
          VALUES (${row.house_id}, ${row.staff_id ?? null}, ${row.external_name ?? null}, ${row.external_phone ?? null}, ${row.start_date}, ${row.end_date}, ${row.notes ?? null})
          RETURNING id
        `
        const full = await sql`
          SELECT o.*, COALESCE(s.first_name || ' ' || s.last_name, o.external_name) as nurse_name,
            COALESCE(s.phone, o.external_phone) as nurse_phone, h.name as house_name
          FROM oncall_nurses o LEFT JOIN staff s ON o.staff_id = s.id LEFT JOIN houses h ON o.house_id = h.id
          WHERE o.id = ${r[0].id}
        `
        created.push(full[0])
      }
      return Response.json(created)
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 500 })
  }
}
