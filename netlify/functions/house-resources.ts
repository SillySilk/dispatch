import { neon } from "@netlify/neon"
const sql = neon()

export default async (req: Request) => {
  const url = new URL(req.url)
  const action = url.searchParams.get('action')
  const id = Number(url.searchParams.get('id'))
  const houseId = Number(url.searchParams.get('houseId'))

  try {
    if (action === 'list') {
      const rows = await sql`SELECT * FROM house_resources WHERE house_id = ${houseId} ORDER BY category, name`
      return Response.json(rows)
    }
    if (action === 'create' && req.method === 'POST') {
      const b = await req.json()
      const rows = await sql`
        INSERT INTO house_resources (house_id, name, category, username, password, url, value, notes)
        VALUES (${b.house_id}, ${b.name}, ${b.category ?? 'other'}, ${b.username ?? null}, ${b.password ?? null}, ${b.url ?? null}, ${b.value ?? null}, ${b.notes ?? null})
        RETURNING *
      `
      return Response.json(rows[0])
    }
    if (action === 'update' && req.method === 'POST') {
      const b = await req.json()
      await sql`
        UPDATE house_resources SET name=${b.name}, category=${b.category ?? 'other'}, username=${b.username ?? null}, password=${b.password ?? null}, url=${b.url ?? null}, value=${b.value ?? null}, notes=${b.notes ?? null}, updated_at=NOW()
        WHERE id=${id}
      `
      const rows = await sql`SELECT * FROM house_resources WHERE id=${id}`
      return Response.json(rows[0])
    }
    if (action === 'delete' && req.method === 'POST') {
      await sql`DELETE FROM house_resources WHERE id=${id}`
      return Response.json({ success: true })
    }
    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
