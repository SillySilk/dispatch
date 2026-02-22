import { neon } from "@netlify/neon"
const sql = neon()

export default async (req: Request) => {
  const url = new URL(req.url)
  const action = url.searchParams.get('action')
  const id = Number(url.searchParams.get('id'))

  try {
    if (action === 'list') {
      const rows = await sql`
        SELECT a.*,
          CASE WHEN c.id IS NOT NULL THEN c.first_name || ' ' || c.last_name ELSE NULL END as client_name,
          h.name as house_name,
          CASE WHEN s.id IS NOT NULL THEN s.first_name || ' ' || s.last_name ELSE NULL END as staff_name,
          h.address as house_address, h.phone as house_phone, s.phone as staff_phone
        FROM appointments a
        LEFT JOIN clients c ON a.client_id = c.id
        LEFT JOIN houses h ON a.house_id = h.id
        LEFT JOIN staff s ON a.assigned_staff_id = s.id
        ORDER BY a.start_datetime DESC
      `
      return Response.json(rows)
    }

    if (action === 'get') {
      const rows = await sql`
        SELECT a.*,
          CASE WHEN c.id IS NOT NULL THEN c.first_name || ' ' || c.last_name ELSE NULL END as client_name,
          h.name as house_name,
          CASE WHEN s.id IS NOT NULL THEN s.first_name || ' ' || s.last_name ELSE NULL END as staff_name,
          h.address as house_address, h.phone as house_phone, s.phone as staff_phone
        FROM appointments a
        LEFT JOIN clients c ON a.client_id = c.id
        LEFT JOIN houses h ON a.house_id = h.id
        LEFT JOIN staff s ON a.assigned_staff_id = s.id
        WHERE a.id = ${id}
      `
      return Response.json(rows[0] ?? null)
    }

    if (action === 'today') {
      const rows = await sql`
        SELECT a.*,
          CASE WHEN c.id IS NOT NULL THEN c.first_name || ' ' || c.last_name ELSE NULL END as client_name,
          h.name as house_name,
          CASE WHEN s.id IS NOT NULL THEN s.first_name || ' ' || s.last_name ELSE NULL END as staff_name,
          h.address as house_address, h.phone as house_phone, s.phone as staff_phone
        FROM appointments a
        LEFT JOIN clients c ON a.client_id = c.id
        LEFT JOIN houses h ON a.house_id = h.id
        LEFT JOIN staff s ON a.assigned_staff_id = s.id
        WHERE DATE(a.start_datetime AT TIME ZONE 'UTC') = CURRENT_DATE
        ORDER BY a.start_datetime
      `
      return Response.json(rows)
    }

    if (action === 'upcoming') {
      const minutes = Number(url.searchParams.get('minutes') ?? 60)
      const rows = await sql`
        SELECT a.*,
          CASE WHEN c.id IS NOT NULL THEN c.first_name || ' ' || c.last_name ELSE NULL END as client_name,
          h.name as house_name,
          CASE WHEN s.id IS NOT NULL THEN s.first_name || ' ' || s.last_name ELSE NULL END as staff_name,
          h.address as house_address, h.phone as house_phone, s.phone as staff_phone
        FROM appointments a
        LEFT JOIN clients c ON a.client_id = c.id
        LEFT JOIN houses h ON a.house_id = h.id
        LEFT JOIN staff s ON a.assigned_staff_id = s.id
        WHERE a.start_datetime >= NOW()
          AND a.start_datetime <= NOW() + (${minutes} || ' minutes')::interval
        ORDER BY a.start_datetime
      `
      return Response.json(rows)
    }

    if (action === 'byDateRange') {
      const start = url.searchParams.get('start')
      const end = url.searchParams.get('end')
      const rows = await sql`
        SELECT a.*,
          CASE WHEN c.id IS NOT NULL THEN c.first_name || ' ' || c.last_name ELSE NULL END as client_name,
          h.name as house_name,
          CASE WHEN s.id IS NOT NULL THEN s.first_name || ' ' || s.last_name ELSE NULL END as staff_name,
          h.address as house_address, h.phone as house_phone, s.phone as staff_phone
        FROM appointments a
        LEFT JOIN clients c ON a.client_id = c.id
        LEFT JOIN houses h ON a.house_id = h.id
        LEFT JOIN staff s ON a.assigned_staff_id = s.id
        WHERE a.start_datetime >= ${start} AND a.start_datetime <= ${end}
        ORDER BY a.start_datetime
      `
      return Response.json(rows)
    }

    if (action === 'create' && req.method === 'POST') {
      const b = await req.json()
      const rows = await sql`
        INSERT INTO appointments (client_id, house_id, assigned_staff_id, title, type, location, start_datetime, end_datetime, status, notes)
        VALUES (${b.client_id ?? null}, ${b.house_id ?? null}, ${b.assigned_staff_id ?? null}, ${b.title}, ${b.type ?? null}, ${b.location ?? null}, ${b.start_datetime}, ${b.end_datetime ?? null}, ${b.status ?? 'scheduled'}, ${b.notes ?? null})
        RETURNING id
      `
      const newId = rows[0].id
      await sql`INSERT INTO audit_log (entity_type, entity_id, action) VALUES ('appointment', ${newId}, 'created')`
      const created = await sql`
        SELECT a.*,
          CASE WHEN c.id IS NOT NULL THEN c.first_name || ' ' || c.last_name ELSE NULL END as client_name,
          h.name as house_name,
          CASE WHEN s.id IS NOT NULL THEN s.first_name || ' ' || s.last_name ELSE NULL END as staff_name,
          h.address as house_address, h.phone as house_phone, s.phone as staff_phone
        FROM appointments a
        LEFT JOIN clients c ON a.client_id = c.id
        LEFT JOIN houses h ON a.house_id = h.id
        LEFT JOIN staff s ON a.assigned_staff_id = s.id
        WHERE a.id = ${newId}
      `
      return Response.json(created[0])
    }

    if (action === 'update' && req.method === 'POST') {
      const b = await req.json()
      await sql`
        UPDATE appointments SET
          client_id = ${b.client_id ?? null}, house_id = ${b.house_id ?? null},
          assigned_staff_id = ${b.assigned_staff_id ?? null}, title = ${b.title},
          type = ${b.type ?? null}, location = ${b.location ?? null},
          start_datetime = ${b.start_datetime}, end_datetime = ${b.end_datetime ?? null},
          status = ${b.status ?? 'scheduled'}, notes = ${b.notes ?? null}, updated_at = NOW()
        WHERE id = ${id}
      `
      await sql`INSERT INTO audit_log (entity_type, entity_id, action) VALUES ('appointment', ${id}, 'updated')`
      const updated = await sql`
        SELECT a.*,
          CASE WHEN c.id IS NOT NULL THEN c.first_name || ' ' || c.last_name ELSE NULL END as client_name,
          h.name as house_name,
          CASE WHEN s.id IS NOT NULL THEN s.first_name || ' ' || s.last_name ELSE NULL END as staff_name,
          h.address as house_address, h.phone as house_phone, s.phone as staff_phone
        FROM appointments a
        LEFT JOIN clients c ON a.client_id = c.id
        LEFT JOIN houses h ON a.house_id = h.id
        LEFT JOIN staff s ON a.assigned_staff_id = s.id
        WHERE a.id = ${id}
      `
      return Response.json(updated[0])
    }

    if (action === 'delete' && req.method === 'POST') {
      await sql`INSERT INTO audit_log (entity_type, entity_id, action) VALUES ('appointment', ${id}, 'deleted')`
      await sql`DELETE FROM appointments WHERE id = ${id}`
      return Response.json({ success: true })
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 500 })
  }
}
