import { neon } from "@netlify/neon"
const sql = neon()

export default async (req: Request) => {
  const url = new URL(req.url)
  const action = url.searchParams.get('action')
  const id = Number(url.searchParams.get('id'))

  try {
    if (action === 'list') {
      const rows = await sql`
        SELECT c.*, h.name as house_name FROM clients c
        LEFT JOIN houses h ON c.house_id = h.id
        WHERE c.is_active = 1 ORDER BY c.last_name, c.first_name
      `
      return Response.json(rows)
    }

    if (action === 'get') {
      const rows = await sql`
        SELECT c.*, h.name as house_name FROM clients c
        LEFT JOIN houses h ON c.house_id = h.id
        WHERE c.id = ${id}
      `
      return Response.json(rows[0] ?? null)
    }

    if (action === 'byHouse') {
      const houseId = Number(url.searchParams.get('houseId'))
      const rows = await sql`
        SELECT c.*, h.name as house_name FROM clients c
        LEFT JOIN houses h ON c.house_id = h.id
        WHERE c.house_id = ${houseId} AND c.is_active = 1
        ORDER BY c.last_name, c.first_name
      `
      return Response.json(rows)
    }

    if (action === 'create' && req.method === 'POST') {
      const b = await req.json()
      const rows = await sql`
        INSERT INTO clients (house_id, first_name, last_name, dob, phone, email, emergency_contact, notes, allergies, current_medications, hospital_preference, behavioral_notes, emergency_protocol)
        VALUES (${b.house_id ?? null}, ${b.first_name}, ${b.last_name}, ${b.dob ?? null}, ${b.phone ?? null}, ${b.email ?? null}, ${b.emergency_contact ?? null}, ${b.notes ?? null}, ${b.allergies ?? null}, ${b.current_medications ?? null}, ${b.hospital_preference ?? null}, ${b.behavioral_notes ?? null}, ${b.emergency_protocol ?? null})
        RETURNING id
      `
      const created = await sql`
        SELECT c.*, h.name as house_name FROM clients c
        LEFT JOIN houses h ON c.house_id = h.id WHERE c.id = ${rows[0].id}
      `
      return Response.json(created[0])
    }

    if (action === 'update' && req.method === 'POST') {
      const b = await req.json()
      await sql`
        UPDATE clients SET
          house_id = ${b.house_id ?? null}, first_name = ${b.first_name}, last_name = ${b.last_name},
          dob = ${b.dob ?? null}, phone = ${b.phone ?? null}, email = ${b.email ?? null},
          emergency_contact = ${b.emergency_contact ?? null}, notes = ${b.notes ?? null},
          allergies = ${b.allergies ?? null}, current_medications = ${b.current_medications ?? null},
          hospital_preference = ${b.hospital_preference ?? null}, behavioral_notes = ${b.behavioral_notes ?? null},
          emergency_protocol = ${b.emergency_protocol ?? null}, updated_at = NOW()
        WHERE id = ${id}
      `
      const updated = await sql`
        SELECT c.*, h.name as house_name FROM clients c
        LEFT JOIN houses h ON c.house_id = h.id WHERE c.id = ${id}
      `
      return Response.json(updated[0])
    }

    if (action === 'delete' && req.method === 'POST') {
      await sql`UPDATE clients SET is_active = 0, updated_at = NOW() WHERE id = ${id}`
      return Response.json({ success: true })
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 500 })
  }
}
