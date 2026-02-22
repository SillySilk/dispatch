// Real API client — replaces mockApi.ts
// Calls Netlify Functions for all data operations.
// The window.api interface is unchanged so no component edits are needed.

const fn = (name: string) => `/.netlify/functions/${name}`

async function call<T>(functionName: string, action: string, params: Record<string, string | number> = {}, body?: unknown): Promise<T> {
  const url = new URL(fn(functionName), window.location.origin)
  url.searchParams.set('action', action)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  }
  const options: RequestInit = body !== undefined
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : {}
  const res = await fetch(url.toString(), options)
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  return res.json()
}

export const api = {
  houses: {
    list: ()                            => call('houses', 'list'),
    get:  (id: number)                  => call('houses', 'get', { id }),
    create: (data: unknown)             => call('houses', 'create', {}, data),
    update: (id: number, data: unknown) => call('houses', 'update', { id }, data),
    delete: (id: number)                => call('houses', 'delete', { id }, {}),
  },
  staff: {
    list: ()                            => call('staff', 'list'),
    get:  (id: number)                  => call('staff', 'get', { id }),
    create: (data: unknown)             => call('staff', 'create', {}, data),
    update: (id: number, data: unknown) => call('staff', 'update', { id }, data),
    delete: (id: number)                => call('staff', 'delete', { id }, {}),
    byHouse: (houseId: number)          => call('staff', 'byHouse', { houseId }),
    getHouses: (staffId: number)        => call('staff', 'getHouses', { id: staffId }),
    assignHouses: (staffId: number, houseIds: number[]) => call('staff', 'assignHouses', { id: staffId }, { houseIds }),
  },
  clients: {
    list: ()                            => call('clients', 'list'),
    get:  (id: number)                  => call('clients', 'get', { id }),
    create: (data: unknown)             => call('clients', 'create', {}, data),
    update: (id: number, data: unknown) => call('clients', 'update', { id }, data),
    delete: (id: number)                => call('clients', 'delete', { id }, {}),
    byHouse: (houseId: number)          => call('clients', 'byHouse', { houseId }),
  },
  appointments: {
    list: ()                            => call('appointments', 'list'),
    get:  (id: number)                  => call('appointments', 'get', { id }),
    create: (data: unknown)             => call('appointments', 'create', {}, data),
    update: (id: number, data: unknown) => call('appointments', 'update', { id }, data),
    delete: (id: number)                => call('appointments', 'delete', { id }, {}),
    today: ()                           => call('appointments', 'today'),
    upcoming: (minutes: number)         => call('appointments', 'upcoming', { minutes }),
    byDateRange: (start: string, end: string) => call('appointments', 'byDateRange', { start, end }),
  },
  oncall: {
    list: ()                            => call('oncall', 'list'),
    listByHouse: (houseId: number)      => call('oncall', 'listByHouse', { houseId }),
    getCurrent: (houseId: number)       => call('oncall', 'getCurrent', { houseId }),
    getCurrentAll: ()                   => call('oncall', 'getCurrentAll'),
    create: (data: unknown)             => call('oncall', 'create', {}, data),
    update: (id: number, data: unknown) => call('oncall', 'update', { id }, data),
    delete: (id: number)                => call('oncall', 'delete', { id }, {}),
    bulkCreate: (rows: unknown[])       => call('oncall', 'bulkCreate', {}, { rows }),
  },
  clientContacts: {
    list: (clientId: number)            => call('client-contacts', 'list', { clientId }),
    create: (data: unknown)             => call('client-contacts', 'create', {}, data),
    update: (id: number, data: unknown) => call('client-contacts', 'update', { id }, data),
    delete: (id: number)                => call('client-contacts', 'delete', { id }, {}),
  },
  clientAccounts: {
    list: (clientId: number)            => call('client-accounts', 'list', { clientId }),
    create: (data: unknown)             => call('client-accounts', 'create', {}, data),
    update: (id: number, data: unknown) => call('client-accounts', 'update', { id }, data),
    delete: (id: number)                => call('client-accounts', 'delete', { id }, {}),
  },
  houseResources: {
    list: (houseId: number)             => call('house-resources', 'list', { houseId }),
    create: (data: unknown)             => call('house-resources', 'create', {}, data),
    update: (id: number, data: unknown) => call('house-resources', 'update', { id }, data),
    delete: (id: number)                => call('house-resources', 'delete', { id }, {}),
  },
  messages: {
    getConversation: (phone1: string, phone2: string, limit = 50) =>
      call('messages', 'getConversation', { phone1, phone2, limit }),
    send: (to: string, message: string, staffId?: number, appointmentId?: number) =>
      fetch(fn('send-sms'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, message, staffId, appointmentId }),
      }).then(r => r.json()),
  },
  // Stubs for features not applicable in web version
  vault: {
    reveal: async (_key: string) => null,
    store:  async (_key: string, _value: string) => {},
  },
  db: {
    backup:  async () => ({ success: false, error: 'Backup not available in web version' }),
    restore: async () => ({ success: false, error: 'Restore not available in web version' }),
  },
  settings: {
    get:    async (_key: string) => null,
    set:    async (_key: string, _value: string) => true,
    getAll: async () => ({} as Record<string, string>),
  },
  notifications: {
    sendTestSms: (to: string) =>
      fetch(fn('send-sms'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, message: 'Dispatcher App Test: SMS notifications are working correctly.' }),
      }).then(r => r.json()),
  },
  dashboard: {
    stats: async () => {
      const [todayAppointments, allAppointments] = await Promise.all([
        api.appointments.today() as Promise<any[]>,
        api.appointments.list() as Promise<any[]>,
      ])
      const unassigned = (allAppointments as any[]).filter(
        (a: any) => !a.assigned_staff_id && a.status === 'scheduled' && new Date(a.start_datetime) >= new Date()
      )
      return { todayAppointments, unassigned, failedReminders: [] }
    },
  },
}

// Expose as window.api to match the existing component interface
declare global {
  interface Window { api: typeof api }
}
window.api = api
