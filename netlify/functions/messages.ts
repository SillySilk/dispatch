import { neon } from "@netlify/neon"
const sql = neon()

export default async (req: Request) => {
  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  try {
    if (action === 'getConversation') {
      const phone1 = url.searchParams.get('phone1')
      const phone2 = url.searchParams.get('phone2')
      const limit = Number(url.searchParams.get('limit') ?? 50)
      const rows = await sql`
        SELECT * FROM messages
        WHERE (from_number = ${phone1} AND to_number = ${phone2})
           OR (from_number = ${phone2} AND to_number = ${phone1})
        ORDER BY sent_at DESC LIMIT ${limit}
      `
      return Response.json(rows)
    }
    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: unknown) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
