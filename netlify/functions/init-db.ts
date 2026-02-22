import { neon } from "@netlify/neon"

const sql = neon()

export default async (req: Request) => {
  // Protect with secret token
  const url = new URL(req.url)
  const secret = url.searchParams.get('secret')
  if (!process.env.INIT_SECRET || secret !== process.env.INIT_SECRET) {
    return new Response('Forbidden', { status: 403 })
  }

  try {
    // ── Schema ──────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS houses (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        notes TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        manager_id INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS staff (
        id SERIAL PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        role TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS staff_houses (
        staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
        house_id INTEGER NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
        PRIMARY KEY (staff_id, house_id)
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        house_id INTEGER REFERENCES houses(id) ON DELETE SET NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        dob TEXT,
        phone TEXT,
        email TEXT,
        emergency_contact TEXT,
        notes TEXT,
        allergies TEXT,
        current_medications TEXT,
        hospital_preference TEXT,
        behavioral_notes TEXT,
        emergency_protocol TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
        house_id INTEGER REFERENCES houses(id) ON DELETE SET NULL,
        assigned_staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        type TEXT,
        location TEXT,
        start_datetime TIMESTAMPTZ NOT NULL,
        end_datetime TIMESTAMPTZ,
        status TEXT NOT NULL DEFAULT 'scheduled',
        notes TEXT,
        reminder_sent INTEGER NOT NULL DEFAULT 0,
        reminder_error TEXT,
        recurrence_rule TEXT,
        recurrence_parent_id INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS client_contacts (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'other',
        phone TEXT,
        email TEXT,
        address TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS client_accounts (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        service_name TEXT NOT NULL,
        service_url TEXT,
        username TEXT,
        password TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS house_resources (
        id SERIAL PRIMARY KEY,
        house_id INTEGER NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'other',
        username TEXT,
        password TEXT,
        url TEXT,
        value TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS oncall_nurses (
        id SERIAL PRIMARY KEY,
        house_id INTEGER NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
        staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
        external_name TEXT,
        external_phone TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        twilio_sid TEXT UNIQUE,
        direction TEXT NOT NULL CHECK(direction IN ('outbound', 'inbound')),
        from_number TEXT NOT NULL,
        to_number TEXT NOT NULL,
        body TEXT NOT NULL,
        status TEXT,
        staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
        related_appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
        error_message TEXT,
        sent_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        field_name TEXT,
        old_value TEXT,
        new_value TEXT,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        is_secret INTEGER NOT NULL DEFAULT 0
      )
    `

    // ── Indexes ──────────────────────────────────────────────────────
    await sql`CREATE INDEX IF NOT EXISTS idx_clients_house ON clients(house_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_appts_client ON appointments(client_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_appts_house ON appointments(house_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_appts_staff ON appointments(assigned_staff_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_appts_start ON appointments(start_datetime)`
    await sql`CREATE INDEX IF NOT EXISTS idx_contacts_client ON client_contacts(client_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_accounts_client ON client_accounts(client_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_house_resources_house ON house_resources(house_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_oncall_house ON oncall_nurses(house_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_to ON messages(to_number)`
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_from ON messages(from_number)`

    // ── Check if already seeded ──────────────────────────────────────
    const existing = await sql`SELECT COUNT(*) as count FROM houses`
    if (Number(existing[0].count) > 0) {
      return Response.json({ success: true, message: 'Schema ready. Data already seeded — skipping.' })
    }

    // ── Seed: Houses ─────────────────────────────────────────────────
    const h1 = await sql`INSERT INTO houses (name, address, phone, notes) VALUES ('Maple Grove Home', '1234 Maple Ave, Portland, OR 97201', '(503) 555-0101', 'Main residential facility. 6 beds. Recently renovated kitchen.') RETURNING id`
    const h2 = await sql`INSERT INTO houses (name, address, phone, notes) VALUES ('Cedar Park Residence', '5678 Cedar Blvd, Portland, OR 97202', '(503) 555-0102', 'Community-based home. 4 beds. Near public transit.') RETURNING id`
    const h3 = await sql`INSERT INTO houses (name, address, phone, notes) VALUES ('Riverside House', '910 River Rd, Portland, OR 97203', '(503) 555-0103', 'Waterfront property. 5 beds. Wheelchair accessible throughout.') RETURNING id`
    const h4 = await sql`INSERT INTO houses (name, address, phone, notes) VALUES ('Oak Street Group Home', '2468 Oak St, Beaverton, OR 97005', '(503) 555-0104', '8-bed facility. Dedicated activity room. Fenced backyard.') RETURNING id`
    const h5 = await sql`INSERT INTO houses (name, address, phone, notes) VALUES ('Willow Creek Home', '1357 Willow Ln, Tigard, OR 97223', '(503) 555-0105', 'Newer construction. 4 beds. Sensory room available.') RETURNING id`
    const hIds = [h1[0].id, h2[0].id, h3[0].id, h4[0].id, h5[0].id]

    // ── Seed: Staff ──────────────────────────────────────────────────
    const s1  = await sql`INSERT INTO staff (first_name, last_name, phone, email, role) VALUES ('Maria', 'Rodriguez', '(503) 555-1001', 'maria.rodriguez@example.com', 'Lead DSP') RETURNING id`
    const s2  = await sql`INSERT INTO staff (first_name, last_name, phone, email, role) VALUES ('James', 'Thompson', '(503) 555-1002', 'james.thompson@example.com', 'DSP') RETURNING id`
    const s3  = await sql`INSERT INTO staff (first_name, last_name, phone, email, role) VALUES ('Aisha', 'Johnson', '(503) 555-1003', 'aisha.johnson@example.com', 'DSP') RETURNING id`
    const s4  = await sql`INSERT INTO staff (first_name, last_name, phone, email, role) VALUES ('David', 'Chen', '(503) 555-1004', 'david.chen@example.com', 'Nurse') RETURNING id`
    const s5  = await sql`INSERT INTO staff (first_name, last_name, phone, email, role) VALUES ('Sarah', 'Williams', '(503) 555-1005', 'sarah.williams@example.com', 'DSP') RETURNING id`
    const s6  = await sql`INSERT INTO staff (first_name, last_name, phone, email, role) VALUES ('Michael', 'Brown', '(503) 555-1006', 'michael.brown@example.com', 'Program Manager') RETURNING id`
    const s7  = await sql`INSERT INTO staff (first_name, last_name, phone, email, role) VALUES ('Emily', 'Davis', '(503) 555-1007', 'emily.davis@example.com', 'DSP') RETURNING id`
    const s8  = await sql`INSERT INTO staff (first_name, last_name, phone, email, role) VALUES ('Carlos', 'Martinez', '(503) 555-1008', 'carlos.martinez@example.com', 'Lead DSP') RETURNING id`
    const s9  = await sql`INSERT INTO staff (first_name, last_name, phone, email, role) VALUES ('Lisa', 'Anderson', '(503) 555-1009', 'lisa.anderson@example.com', 'Behavior Specialist') RETURNING id`
    const s10 = await sql`INSERT INTO staff (first_name, last_name, phone, email, role) VALUES ('Kevin', 'Taylor', '(503) 555-1010', 'kevin.taylor@example.com', 'DSP') RETURNING id`
    const sIds = [s1[0].id, s2[0].id, s3[0].id, s4[0].id, s5[0].id, s6[0].id, s7[0].id, s8[0].id, s9[0].id, s10[0].id]

    // Staff-house assignments
    const assignments: [number, number][] = [
      [sIds[0], hIds[0]], [sIds[0], hIds[1]],
      [sIds[1], hIds[0]],
      [sIds[2], hIds[1]], [sIds[2], hIds[2]],
      [sIds[3], hIds[0]], [sIds[3], hIds[1]], [sIds[3], hIds[2]], [sIds[3], hIds[3]], [sIds[3], hIds[4]],
      [sIds[4], hIds[2]],
      [sIds[5], hIds[0]], [sIds[5], hIds[1]], [sIds[5], hIds[2]], [sIds[5], hIds[3]], [sIds[5], hIds[4]],
      [sIds[6], hIds[3]],
      [sIds[7], hIds[3]], [sIds[7], hIds[4]],
      [sIds[8], hIds[0]], [sIds[8], hIds[1]], [sIds[8], hIds[2]],
      [sIds[9], hIds[4]],
    ]
    for (const [sid, hid] of assignments) {
      await sql`INSERT INTO staff_houses (staff_id, house_id) VALUES (${sid}, ${hid})`
    }

    // Set managers
    await sql`UPDATE houses SET manager_id = ${sIds[5]} WHERE id = ANY(${hIds}::int[])`
    await sql`UPDATE houses SET manager_id = ${sIds[0]} WHERE id = ${hIds[0]}`
    await sql`UPDATE houses SET manager_id = ${sIds[7]} WHERE id = ${hIds[3]}`

    // ── Seed: Clients ────────────────────────────────────────────────
    const c1  = await sql`INSERT INTO clients (house_id, first_name, last_name, dob, phone, email, emergency_contact, notes, allergies, current_medications) VALUES (${hIds[0]}, 'Tyler', 'Morgan', '1992-03-15', '(503) 555-2001', null, 'Janet Morgan (Mother) - (503) 555-3001', 'Enjoys music therapy. Needs assistance with daily living activities.', null, 'Sertraline 50mg daily') RETURNING id`
    const c2  = await sql`INSERT INTO clients (house_id, first_name, last_name, dob, phone, email, emergency_contact, notes, allergies, current_medications) VALUES (${hIds[0]}, 'Brittany', 'Foster', '1988-07-22', '(503) 555-2002', 'brittany.f@example.com', 'Robert Foster (Father) - (503) 555-3002', 'Participates in day program M-F.', 'Penicillin', 'Risperdal 2mg nightly') RETURNING id`
    const c3  = await sql`INSERT INTO clients (house_id, first_name, last_name, dob, phone, email, emergency_contact, notes) VALUES (${hIds[0]}, 'Jason', 'Nguyen', '1995-11-08', null, null, 'Linda Nguyen (Sister) - (503) 555-3003', 'Non-verbal. Uses AAC device. Loves swimming.') RETURNING id`
    const c4  = await sql`INSERT INTO clients (house_id, first_name, last_name, dob, phone, email, emergency_contact, notes) VALUES (${hIds[1]}, 'Amanda', 'Clark', '1990-01-30', '(503) 555-2004', 'amanda.c@example.com', 'Tom Clark (Brother) - (503) 555-3004', 'Semi-independent. Works part-time at grocery store.') RETURNING id`
    const c5  = await sql`INSERT INTO clients (house_id, first_name, last_name, dob, phone, email, emergency_contact, notes, current_medications) VALUES (${hIds[1]}, 'Derek', 'Robinson', '1985-09-12', '(503) 555-2005', null, 'Mary Robinson (Mother) - (503) 555-3005', 'Diabetes management required. Enjoys arts and crafts.', 'Metformin 500mg twice daily, Insulin glargine 20 units nightly') RETURNING id`
    const c6  = await sql`INSERT INTO clients (house_id, first_name, last_name, dob, phone, email, emergency_contact, notes, behavioral_notes) VALUES (${hIds[2]}, 'Samantha', 'Lee', '1993-05-17', '(503) 555-2006', 'samantha.lee@example.com', 'Grace Lee (Mother) - (503) 555-3006', 'Wheelchair user. Has a service dog.', 'Enjoys outdoor activities. Service dog must accompany to all appointments.') RETURNING id`
    const c7  = await sql`INSERT INTO clients (house_id, first_name, last_name, dob, phone, email, emergency_contact, notes, current_medications, emergency_protocol) VALUES (${hIds[2]}, 'Marcus', 'Wright', '1991-12-03', '(503) 555-2007', null, 'Paul Wright (Father) - (503) 555-3007', 'Seizure disorder. Enjoys video games.', 'Levetiracetam 500mg twice daily', 'If seizure lasts >5 min call 911. Do not restrain. Position on side.') RETURNING id`
    const c8  = await sql`INSERT INTO clients (house_id, first_name, last_name, dob, phone, email, emergency_contact, notes) VALUES (${hIds[2]}, 'Rachel', 'Kim', '1997-08-25', '(503) 555-2008', null, 'Susan Kim (Aunt) - (503) 555-3008', 'Transition-age. Exploring vocational training options.') RETURNING id`
    const c9  = await sql`INSERT INTO clients (house_id, first_name, last_name, dob, phone, email, emergency_contact, notes, behavioral_notes) VALUES (${hIds[3]}, 'Brandon', 'Harris', '1987-04-11', '(503) 555-2009', null, 'Carol Harris (Mother) - (503) 555-3009', 'Behavioral support plan in place.', 'Responds well to positive reinforcement. Avoid loud sudden noises.') RETURNING id`
    const c10 = await sql`INSERT INTO clients (house_id, first_name, last_name, dob, phone, email, emergency_contact, notes) VALUES (${hIds[3]}, 'Jessica', 'Patel', '1994-06-28', '(503) 555-2010', 'jessica.p@example.com', 'Raj Patel (Father) - (503) 555-3010', 'Attends community college. Needs transportation support.') RETURNING id`
    const c11 = await sql`INSERT INTO clients (house_id, first_name, last_name, dob, phone, email, emergency_contact, notes) VALUES (${hIds[3]}, 'Anthony', 'Lopez', '1989-10-19', null, null, 'Maria Lopez (Mother) - (503) 555-3011', 'Dual diagnosis. Weekly therapy sessions required.') RETURNING id`
    const c12 = await sql`INSERT INTO clients (house_id, first_name, last_name, dob, phone, email, emergency_contact, notes) VALUES (${hIds[4]}, 'Nicole', 'Evans', '1996-02-14', '(503) 555-2012', null, 'Diane Evans (Mother) - (503) 555-3012', 'Recently transitioned from family home. Adjusting well.') RETURNING id`
    const c13 = await sql`INSERT INTO clients (house_id, first_name, last_name, dob, phone, email, emergency_contact, notes) VALUES (${hIds[4]}, 'Ryan', 'Mitchell', '1992-07-07', '(503) 555-2013', null, 'Steven Mitchell (Brother) - (503) 555-3013', 'Autism spectrum. Strong routine-based schedule needed.') RETURNING id`
    const cIds = [c1[0].id,c2[0].id,c3[0].id,c4[0].id,c5[0].id,c6[0].id,c7[0].id,c8[0].id,c9[0].id,c10[0].id,c11[0].id,c12[0].id,c13[0].id]

    // ── Seed: Client contacts ────────────────────────────────────────
    await sql`INSERT INTO client_contacts (client_id, name, category, phone, address, notes) VALUES (${cIds[1]}, 'Walgreens Pharmacy #1234', 'pharmacy', '(503) 555-8001', '100 SW Broadway, Portland, OR', 'Preferred pharmacy')`
    await sql`INSERT INTO client_contacts (client_id, name, category, phone, email, address) VALUES (${cIds[1]}, 'Dr. Patricia Wells - PCP', 'medical', '(503) 555-9001', 'pwells@portlandmed.org', '200 Medical Center Dr, Portland, OR')`
    await sql`INSERT INTO client_contacts (client_id, name, category, phone, address, notes) VALUES (${cIds[5]}, 'CVS Pharmacy #5678', 'pharmacy', '(503) 555-8002', '456 Burnside St, Portland, OR', 'Has wheelchair accessible entrance')`
    await sql`INSERT INTO client_contacts (client_id, name, category, phone, email, notes) VALUES (${cIds[5]}, 'Dr. James Ortega - Physiatrist', 'medical', '(503) 555-9002', 'jortega@rehab.org', 'Manages wheelchair and PT referrals')`
    await sql`INSERT INTO client_contacts (client_id, name, category, phone, notes) VALUES (${cIds[6]}, 'OHSU Neurology', 'medical', '(503) 555-9003', 'Seizure clinic, Dr. Park')`
    await sql`INSERT INTO client_contacts (client_id, name, category, phone, notes) VALUES (${cIds[4]}, 'Providence Diabetes Center', 'medical', '(503) 555-9004', 'Monthly check-ins')`

    // ── Seed: Client accounts ────────────────────────────────────────
    await sql`INSERT INTO client_accounts (client_id, service_name, service_url, username, notes) VALUES (${cIds[3]}, 'Netflix', 'https://netflix.com', 'amanda.clark.house@gmail.com', 'Shared with Oak Street house account')`
    await sql`INSERT INTO client_accounts (client_id, service_name, service_url, username, notes) VALUES (${cIds[3]}, 'Portland Community College Portal', 'https://my.pcc.edu', 'aclark@students.pcc.edu', 'Student ID: 112233')`
    await sql`INSERT INTO client_accounts (client_id, service_name, username, notes) VALUES (${cIds[9]}, 'PCC Student Portal', 'jpatel@students.pcc.edu', 'Student ID: 445566. Registered for spring term.')`
    await sql`INSERT INTO client_accounts (client_id, service_name, service_url, username, notes) VALUES (${cIds[5]}, 'Oregon Medicaid Portal', 'https://oregonhealthplan.oregon.gov', 'samantha.lee.medicaid', 'Case manager: Janet Torres ext. 4521')`
    await sql`INSERT INTO client_accounts (client_id, service_name, username, notes) VALUES (${cIds[5]}, 'Planet Fitness Membership', 'sleewheelchair', 'Membership #PF-98765. Accessible location at 789 Burnside.')`

    // ── Seed: House resources ────────────────────────────────────────
    await sql`INSERT INTO house_resources (house_id, name, category, password, notes) VALUES (${hIds[0]}, 'House WiFi', 'credential', 'MapleGrove2024!', 'Network: MapleGrove_5G')`
    await sql`INSERT INTO house_resources (house_id, name, category, username, password, url) VALUES (${hIds[0]}, 'Netflix (House Account)', 'credential', 'maplegrove.house@gmail.com', 'N3tflix2024', 'https://netflix.com')`
    await sql`INSERT INTO house_resources (house_id, name, category, value, notes) VALUES (${hIds[0]}, 'HVAC Repair', 'vendor', 'Portland HVAC Co - (503) 555-7001', 'Annual service contract. Call for any heating/cooling issues.')`
    await sql`INSERT INTO house_resources (house_id, name, category, value) VALUES (${hIds[0]}, 'Grocery Delivery Account', 'utility', 'Fred Meyer account #FM-11223. Delivery Tuesdays.')`

    await sql`INSERT INTO house_resources (house_id, name, category, password, notes) VALUES (${hIds[1]}, 'House WiFi', 'credential', 'CedarPark#2024', 'Network: CedarPark_Home')`
    await sql`INSERT INTO house_resources (house_id, name, category, username, password, url) VALUES (${hIds[1]}, 'Hulu (House Account)', 'credential', 'cedarpark.house@gmail.com', 'Hulu2024Cedar', 'https://hulu.com')`
    await sql`INSERT INTO house_resources (house_id, name, category, value) VALUES (${hIds[1]}, 'Plumber On-Call', 'vendor', 'Roto-Rooter Portland - (503) 555-7002. 24hr emergency line.')`

    await sql`INSERT INTO house_resources (house_id, name, category, password, notes) VALUES (${hIds[2]}, 'House WiFi', 'credential', 'RiversideH0use!', 'Network: Riverside_Secure')`
    await sql`INSERT INTO house_resources (house_id, name, category, value, notes) VALUES (${hIds[2]}, 'Wheelchair Van Schedule', 'procedure', 'Contact SafeRide Transport (503) 555-6001', 'Book 48hrs in advance. Account #SR-5566.')`
    await sql`INSERT INTO house_resources (house_id, name, category, value) VALUES (${hIds[2]}, 'Service Dog Food Vendor', 'vendor', 'Pet Store Plus - (503) 555-7003. Monthly auto-order for Guide Dog food.')`

    await sql`INSERT INTO house_resources (house_id, name, category, password, notes) VALUES (${hIds[3]}, 'House WiFi', 'credential', 'OakSt2024Secure', 'Network: OakStreet_GH')`
    await sql`INSERT INTO house_resources (house_id, name, category, username, password, url) VALUES (${hIds[3]}, 'Amazon Account', 'credential', 'oakstreet.supplies@gmail.com', 'Amaz0n0ak!', 'https://amazon.com')`
    await sql`INSERT INTO house_resources (house_id, name, category, value, notes) VALUES (${hIds[3]}, 'Lawn Care', 'vendor', 'Green Thumb Landscaping - (503) 555-7004', 'Every other Friday. Leave gate unlocked.')`

    await sql`INSERT INTO house_resources (house_id, name, category, password, notes) VALUES (${hIds[4]}, 'House WiFi', 'credential', 'Willow2024Creek!', 'Network: WillowCreek_5G')`
    await sql`INSERT INTO house_resources (house_id, name, category, value, notes) VALUES (${hIds[4]}, 'Sensory Room Schedule', 'procedure', 'See binder on kitchen counter', 'Book in 30-min blocks. Ryan Mitchell has 9-9:30am reserved daily.')`

    // ── Seed: On-call nurses ─────────────────────────────────────────
    const today = new Date()
    const fmt = (d: Date) => d.toISOString().slice(0, 10)
    const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }

    const weekStart = fmt(addDays(today, -today.getDay()))
    const weekEnd = fmt(addDays(today, 6 - today.getDay()))
    const nextStart = fmt(addDays(today, 7 - today.getDay()))
    const nextEnd = fmt(addDays(today, 13 - today.getDay()))

    await sql`INSERT INTO oncall_nurses (house_id, external_name, external_phone, start_date, end_date, notes) VALUES (${hIds[0]}, 'Jane Smith RN', '(503) 555-4001', ${weekStart}, ${weekEnd}, 'Agency nurse from MedStaff Solutions')`
    await sql`INSERT INTO oncall_nurses (house_id, external_name, external_phone, start_date, end_date) VALUES (${hIds[0]}, 'Bob Jones RN', '(503) 555-4002', ${nextStart}, ${nextEnd})`
    await sql`INSERT INTO oncall_nurses (house_id, staff_id, start_date, end_date, notes) VALUES (${hIds[1]}, ${sIds[3]}, ${weekStart}, ${nextEnd}, 'David Chen covering both weeks')`
    await sql`INSERT INTO oncall_nurses (house_id, external_name, external_phone, start_date, end_date, notes) VALUES (${hIds[2]}, 'Mary Wilson RN', '(503) 555-4003', ${weekStart}, ${weekEnd}, 'Prefers text messages')`
    await sql`INSERT INTO oncall_nurses (house_id, external_name, external_phone, start_date, end_date) VALUES (${hIds[3]}, 'Patricia Moore RN', '(503) 555-4004', ${weekStart}, ${weekEnd})`
    await sql`INSERT INTO oncall_nurses (house_id, staff_id, start_date, end_date) VALUES (${hIds[4]}, ${sIds[3]}, ${weekStart}, ${weekEnd})`

    // ── Seed: Appointments ───────────────────────────────────────────
    const dt = (daysOffset: number, hour: number, min = 0) => {
      const d = new Date()
      d.setDate(d.getDate() + daysOffset)
      d.setHours(hour, min, 0, 0)
      return d.toISOString()
    }
    // Today
    await sql`INSERT INTO appointments (client_id, house_id, assigned_staff_id, title, type, location, start_datetime, end_datetime, status, notes) VALUES (${cIds[0]}, ${hIds[0]}, ${sIds[1]}, 'Annual Physical Exam', 'Medical', 'Providence Medical Center', ${dt(0,9)}, ${dt(0,10)}, 'scheduled', 'Fasting required. Bring insurance card.')`
    await sql`INSERT INTO appointments (client_id, house_id, assigned_staff_id, title, type, location, start_datetime, end_datetime, status, notes) VALUES (${cIds[3]}, ${hIds[1]}, ${sIds[2]}, 'Dentist Cleaning', 'Dental', 'Bright Smile Dental, 456 Main St', ${dt(0,10,30)}, ${dt(0,11,30)}, 'scheduled', 'Regular 6-month cleaning.')`
    await sql`INSERT INTO appointments (client_id, house_id, assigned_staff_id, title, type, location, start_datetime, end_datetime, status, notes) VALUES (${cIds[5]}, ${hIds[2]}, ${sIds[4]}, 'Physical Therapy', 'Therapy', 'PT Solutions, 789 Health Ave', ${dt(0,14)}, ${dt(0,15)}, 'scheduled', 'Working on upper body strength.')`
    await sql`INSERT INTO appointments (client_id, house_id, assigned_staff_id, title, type, location, start_datetime, end_datetime, status, notes) VALUES (${cIds[9]}, ${hIds[3]}, ${sIds[6]}, 'College Registration', 'Administrative', 'Portland Community College', ${dt(0,11)}, ${dt(0,12)}, 'scheduled', 'Spring term registration. Bring student ID.')`
    // Tomorrow
    await sql`INSERT INTO appointments (client_id, house_id, assigned_staff_id, title, type, location, start_datetime, end_datetime, status, notes) VALUES (${cIds[1]}, ${hIds[0]}, ${sIds[0]}, 'Psychiatrist Follow-up', 'Medical', 'Dr. Wilson Office, Suite 200', ${dt(1,9,30)}, ${dt(1,10,15)}, 'scheduled', 'Medication review appointment.')`
    await sql`INSERT INTO appointments (client_id, house_id, assigned_staff_id, title, type, location, start_datetime, end_datetime, status, notes) VALUES (${cIds[6]}, ${hIds[2]}, ${sIds[4]}, 'Neurology Appointment', 'Medical', 'OHSU Neurology Dept', ${dt(1,13)}, ${dt(1,14)}, 'scheduled', 'Seizure management follow-up. Bring seizure log.')`
    await sql`INSERT INTO appointments (client_id, house_id, assigned_staff_id, title, type, location, start_datetime, end_datetime, status, notes) VALUES (${cIds[11]}, ${hIds[4]}, ${sIds[9]}, 'Occupational Therapy', 'Therapy', 'OT Works, 321 Therapy Ln', ${dt(1,10)}, ${dt(1,11)}, 'scheduled', 'Life skills assessment.')`
    // This week
    await sql`INSERT INTO appointments (client_id, house_id, assigned_staff_id, title, type, location, start_datetime, end_datetime, status, notes) VALUES (${cIds[2]}, ${hIds[0]}, ${sIds[1]}, 'Swimming Lessons', 'Social', 'Community Pool, 555 Swim Dr', ${dt(2,15)}, ${dt(2,16)}, 'scheduled', 'Bring swim gear. Staff must be in water.')`
    await sql`INSERT INTO appointments (client_id, house_id, assigned_staff_id, title, type, location, start_datetime, end_datetime, status, notes) VALUES (${cIds[4]}, ${hIds[1]}, ${sIds[2]}, 'Endocrinologist Visit', 'Medical', 'Diabetes Care Center', ${dt(2,8,30)}, ${dt(2,9,30)}, 'scheduled', 'A1C check. Bring blood sugar log.')`
    await sql`INSERT INTO appointments (client_id, house_id, assigned_staff_id, title, type, location, start_datetime, end_datetime, status, notes) VALUES (${cIds[8]}, ${hIds[3]}, ${sIds[7]}, 'Behavioral Assessment', 'Therapy', 'Oak Street Group Home', ${dt(3,10)}, ${dt(3,11,30)}, 'scheduled', 'Quarterly assessment with Dr. Park.')`
    await sql`INSERT INTO appointments (client_id, house_id, assigned_staff_id, title, type, location, start_datetime, end_datetime, status, notes) VALUES (${cIds[12]}, ${hIds[4]}, ${sIds[9]}, 'ISP Meeting', 'Administrative', 'Willow Creek Home', ${dt(4,13)}, ${dt(4,14,30)}, 'scheduled', 'Annual ISP review. Family invited.')`
    // Next week
    await sql`INSERT INTO appointments (client_id, house_id, assigned_staff_id, title, type, location, start_datetime, end_datetime, status, notes) VALUES (${cIds[7]}, ${hIds[2]}, ${sIds[4]}, 'Vocational Assessment', 'Administrative', 'Employment First, 234 Work Ave', ${dt(7,9)}, ${dt(7,11)}, 'scheduled', 'Initial vocational evaluation.')`
    await sql`INSERT INTO appointments (client_id, house_id, assigned_staff_id, title, type, location, start_datetime, end_datetime, status, notes) VALUES (${cIds[3]}, ${hIds[1]}, ${sIds[2]}, 'Eye Exam', 'Medical', 'Vision Center, 567 See St', ${dt(8,10)}, ${dt(8,11)}, 'scheduled', 'Annual vision check. May need new glasses.')`
    await sql`INSERT INTO appointments (client_id, house_id, assigned_staff_id, title, type, location, start_datetime, end_datetime, status, notes) VALUES (${cIds[5]}, ${hIds[2]}, ${sIds[4]}, 'Wheelchair Fitting', 'Medical', 'Mobility Plus, 890 Access Rd', ${dt(9,14)}, ${dt(9,15,30)}, 'scheduled', 'New wheelchair evaluation.')`
    // Past (completed)
    await sql`INSERT INTO appointments (client_id, house_id, assigned_staff_id, title, type, location, start_datetime, end_datetime, status, notes) VALUES (${cIds[0]}, ${hIds[0]}, ${sIds[1]}, 'Blood Work', 'Medical', 'Quest Diagnostics', ${dt(-3,8)}, ${dt(-3,8,30)}, 'completed', 'Routine blood panel. Results pending.')`
    await sql`INSERT INTO appointments (client_id, house_id, assigned_staff_id, title, type, location, start_datetime, end_datetime, status, notes) VALUES (${cIds[9]}, ${hIds[3]}, ${sIds[7]}, 'Academic Advising', 'Administrative', 'PCC Advising Center', ${dt(-5,11)}, ${dt(-5,12)}, 'completed', 'Discussed course load for next term.')`
    await sql`INSERT INTO appointments (client_id, house_id, assigned_staff_id, title, type, location, start_datetime, end_datetime, status, notes) VALUES (${cIds[4]}, ${hIds[1]}, ${sIds[3]}, 'Podiatrist Visit', 'Medical', 'Foot & Ankle Clinic', ${dt(-7,10)}, ${dt(-7,10,45)}, 'completed', 'Diabetic foot check. All clear.')`
    // Unassigned (triggers dashboard alerts)
    await sql`INSERT INTO appointments (client_id, house_id, assigned_staff_id, title, type, location, start_datetime, end_datetime, status, notes) VALUES (${cIds[1]}, ${hIds[0]}, null, 'Dermatology Appointment', 'Medical', 'Skin Care Clinic', ${dt(5,9)}, ${dt(5,10)}, 'scheduled', 'Rash on left arm. Need staff assigned.')`
    await sql`INSERT INTO appointments (client_id, house_id, assigned_staff_id, title, type, location, start_datetime, end_datetime, status, notes) VALUES (${cIds[11]}, ${hIds[4]}, null, 'Speech Therapy Eval', 'Therapy', 'Communication Works', ${dt(6,13)}, ${dt(6,14)}, 'scheduled', 'Initial evaluation. Needs staff transport.')`
    // Cancelled
    await sql`INSERT INTO appointments (client_id, house_id, assigned_staff_id, title, type, location, start_datetime, end_datetime, status, notes) VALUES (${cIds[6]}, ${hIds[2]}, ${sIds[4]}, 'MRI Scan', 'Medical', 'OHSU Imaging', ${dt(-1,15)}, ${dt(-1,16)}, 'cancelled', 'Rescheduled due to patient illness.')`

    // ── Seed: Settings ───────────────────────────────────────────────
    await sql`INSERT INTO settings (key, value, is_secret) VALUES ('reminder_minutes', '30', 0) ON CONFLICT (key) DO NOTHING`

    return Response.json({ success: true, message: 'Database initialized and seeded successfully.' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[init-db] Error:', message)
    return Response.json({ success: false, error: message }, { status: 500 })
  }
}
