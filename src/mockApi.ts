// Mock API layer for web demo - replaces Electron IPC with in-memory data

import type { House, Client, Staff, Appointment, OnCallNurse, ClientContact } from './types'

// Demo data
const houses: House[] = [
  { id: 1, name: 'Maple House', address: '123 Maple St, Harrisburg, PA 17101', phone: '(555) 100-0001', manager_id: 1, manager_name: 'John Smith', created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 2, name: 'Oak House', address: '456 Oak Ave, Harrisburg, PA 17102', phone: '(555) 100-0002', manager_id: 2, manager_name: 'Sarah Johnson', created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 3, name: 'Pine House', address: '789 Pine Rd, Camp Hill, PA 17011', phone: '(555) 100-0003', manager_id: null, manager_name: null, created_at: '2025-01-01', updated_at: '2025-01-01' },
]

const clients: Client[] = [
  { id: 1, first_name: 'Samantha', last_name: 'Lee', date_of_birth: '1995-03-15', phone: '(555) 201-0001', email: null, house_id: 1, house_name: 'Maple House', allergies: 'Penicillin', medications: 'Sertraline 50mg daily', notes: 'Wheelchair user', created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 2, first_name: 'Marcus', last_name: 'Johnson', date_of_birth: '1998-07-22', phone: '(555) 201-0002', email: null, house_id: 1, house_name: 'Maple House', allergies: null, medications: 'Risperdal 2mg', notes: null, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 3, first_name: 'Emily', last_name: 'Rodriguez', date_of_birth: '2000-11-08', phone: '(555) 201-0003', email: null, house_id: 2, house_name: 'Oak House', allergies: 'Latex', medications: null, notes: null, created_at: '2025-01-01', updated_at: '2025-01-01' },
]

const staff: Staff[] = [
  { id: 1, first_name: 'John', last_name: 'Smith', phone: '(555) 301-0001', email: 'jsmith@example.com', role: 'Manager', active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 2, first_name: 'Sarah', last_name: 'Johnson', phone: '(555) 301-0002', email: 'sjohnson@example.com', role: 'Manager', active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 3, first_name: 'Mike', last_name: 'Davis', phone: '(555) 301-0003', email: 'mdavis@example.com', role: 'DSP', active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 4, first_name: 'Lisa', last_name: 'Chen', phone: '(555) 301-0004', email: 'lchen@example.com', role: 'DSP', active: true, created_at: '2025-01-01', updated_at: '2025-01-01' },
]

const appointments: Appointment[] = [
  {
    id: 1,
    title: 'Wheelchair Fitting',
    type: 'Medical',
    client_id: 1,
    house_id: 1,
    assigned_staff_id: 3,
    location: '500 University Dr, Hershey, PA 17033',
    start_datetime: '2025-02-10T10:00:00',
    end_datetime: '2025-02-10T11:30:00',
    status: 'scheduled',
    notes: 'Annual wheelchair assessment',
    client_name: 'Samantha Lee',
    house_name: 'Maple House',
    staff_name: 'Mike Davis',
    house_address: '123 Maple St, Harrisburg, PA 17101',
    house_phone: '(555) 100-0001',
    staff_phone: '(555) 301-0003',
    created_at: '2025-01-15', updated_at: '2025-01-15'
  },
  {
    id: 2,
    title: 'Dental Cleaning',
    type: 'Dental',
    client_id: 2,
    house_id: 1,
    assigned_staff_id: 4,
    location: '425 N Front St, Harrisburg, PA 17101',
    start_datetime: '2025-02-12T14:00:00',
    end_datetime: '2025-02-12T15:00:00',
    status: 'scheduled',
    notes: '6-month checkup',
    client_name: 'Marcus Johnson',
    house_name: 'Maple House',
    staff_name: 'Lisa Chen',
    house_address: '123 Maple St, Harrisburg, PA 17101',
    house_phone: '(555) 100-0001',
    staff_phone: '(555) 301-0004',
    created_at: '2025-01-20', updated_at: '2025-01-20'
  },
  {
    id: 3,
    title: 'Psychiatry Follow-up',
    type: 'Medical',
    client_id: 3,
    house_id: 2,
    assigned_staff_id: null,
    location: '75 Behavioral Health Way, Camp Hill, PA 17011',
    start_datetime: '2025-02-15T09:00:00',
    end_datetime: '2025-02-15T10:00:00',
    status: 'scheduled',
    notes: 'Medication review',
    client_name: 'Emily Rodriguez',
    house_name: 'Oak House',
    staff_name: null,
    house_address: '456 Oak Ave, Harrisburg, PA 17102',
    house_phone: '(555) 100-0002',
    staff_phone: null,
    created_at: '2025-01-22', updated_at: '2025-01-22'
  },
]

const oncallNurses: OnCallNurse[] = [
  {
    id: 1,
    house_id: 1,
    staff_id: null,
    external_name: 'Jane Smith RN',
    external_phone: '(555) 400-0001',
    start_date: '2025-02-03',
    end_date: '2025-02-09',
    notes: 'Agency nurse',
    nurse_name: 'Jane Smith RN',
    nurse_phone: '(555) 400-0001',
    house_name: 'Maple House',
    created_at: '2025-02-01', updated_at: '2025-02-01'
  },
  {
    id: 2,
    house_id: 1,
    staff_id: null,
    external_name: 'Bob Jones RN',
    external_phone: '(555) 400-0002',
    start_date: '2025-02-10',
    end_date: '2025-02-16',
    notes: null,
    nurse_name: 'Bob Jones RN',
    nurse_phone: '(555) 400-0002',
    house_name: 'Maple House',
    created_at: '2025-02-01', updated_at: '2025-02-01'
  },
  {
    id: 3,
    house_id: 2,
    staff_id: null,
    external_name: 'Mary Wilson RN',
    external_phone: '(555) 400-0003',
    start_date: '2025-02-03',
    end_date: '2025-02-09',
    notes: 'Prefers text messages',
    nurse_name: 'Mary Wilson RN',
    nurse_phone: '(555) 400-0003',
    house_name: 'Oak House',
    created_at: '2025-02-01', updated_at: '2025-02-01'
  },
]

const clientContacts: ClientContact[] = [
  { id: 1, client_id: 1, name: 'CVS Pharmacy #4521', category: 'pharmacy', phone: '(555) 234-5678', email: null, address: '1200 Market St, Harrisburg, PA 17101', notes: 'Preferred pharmacy', created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 2, client_id: 1, name: 'Dr. Sarah Mitchell - PCP', category: 'medical', phone: '(555) 456-7890', email: 'smitchell@pennmed.org', address: '200 Medical Center Dr, Suite 310, Harrisburg, PA 17110', notes: 'Primary care', created_at: '2025-01-01', updated_at: '2025-01-01' },
  { id: 3, client_id: 1, name: 'Mom - Emergency Contact', category: 'personal', phone: '(555) 111-2222', email: null, address: null, notes: 'Primary family contact', created_at: '2025-01-01', updated_at: '2025-01-01' },
]

// Mock API implementation
export const mockApi = {
  houses: {
    list: async () => houses,
    get: async (id: number) => houses.find(h => h.id === id),
    create: async (data: Partial<House>) => {
      const newHouse = { ...data, id: houses.length + 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as House
      houses.push(newHouse)
      return newHouse
    },
    update: async (id: number, data: Partial<House>) => {
      const index = houses.findIndex(h => h.id === id)
      if (index >= 0) houses[index] = { ...houses[index], ...data, updated_at: new Date().toISOString() }
    },
    delete: async (id: number) => {
      const index = houses.findIndex(h => h.id === id)
      if (index >= 0) houses.splice(index, 1)
    },
  },
  clients: {
    list: async () => clients,
    get: async (id: number) => clients.find(c => c.id === id),
    create: async (data: Partial<Client>) => {
      const newClient = { ...data, id: clients.length + 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Client
      clients.push(newClient)
      return newClient
    },
    update: async (id: number, data: Partial<Client>) => {
      const index = clients.findIndex(c => c.id === id)
      if (index >= 0) clients[index] = { ...clients[index], ...data, updated_at: new Date().toISOString() }
    },
    delete: async (id: number) => {
      const index = clients.findIndex(c => c.id === id)
      if (index >= 0) clients.splice(index, 1)
    },
  },
  staff: {
    list: async () => staff,
    get: async (id: number) => staff.find(s => s.id === id),
    create: async (data: Partial<Staff>) => {
      const newStaff = { ...data, id: staff.length + 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Staff
      staff.push(newStaff)
      return newStaff
    },
    update: async (id: number, data: Partial<Staff>) => {
      const index = staff.findIndex(s => s.id === id)
      if (index >= 0) staff[index] = { ...staff[index], ...data, updated_at: new Date().toISOString() }
    },
    delete: async (id: number) => {
      const index = staff.findIndex(s => s.id === id)
      if (index >= 0) staff.splice(index, 1)
    },
  },
  appointments: {
    list: async () => appointments,
    get: async (id: number) => appointments.find(a => a.id === id),
    create: async (data: Partial<Appointment>) => {
      const newAppt = { ...data, id: appointments.length + 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Appointment
      appointments.push(newAppt)
      return newAppt
    },
    update: async (id: number, data: Partial<Appointment>) => {
      const index = appointments.findIndex(a => a.id === id)
      if (index >= 0) appointments[index] = { ...appointments[index], ...data, updated_at: new Date().toISOString() }
    },
    delete: async (id: number) => {
      const index = appointments.findIndex(a => a.id === id)
      if (index >= 0) appointments.splice(index, 1)
    },
  },
  oncall: {
    list: async () => oncallNurses,
    listByHouse: async (houseId: number) => oncallNurses.filter(o => o.house_id === houseId),
    getCurrent: async (houseId: number) => {
      const today = new Date().toISOString().slice(0, 10)
      return oncallNurses.find(o => o.house_id === houseId && o.start_date <= today && o.end_date >= today) || null
    },
    getCurrentAll: async () => {
      const today = new Date().toISOString().slice(0, 10)
      return oncallNurses.filter(o => o.start_date <= today && o.end_date >= today)
    },
    create: async (data: Partial<OnCallNurse>) => {
      const newOncall = { ...data, id: oncallNurses.length + 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as OnCallNurse
      oncallNurses.push(newOncall)
      return newOncall
    },
    update: async (id: number, data: Partial<OnCallNurse>) => {
      const index = oncallNurses.findIndex(o => o.id === id)
      if (index >= 0) oncallNurses[index] = { ...oncallNurses[index], ...data, updated_at: new Date().toISOString() }
    },
    delete: async (id: number) => {
      const index = oncallNurses.findIndex(o => o.id === id)
      if (index >= 0) oncallNurses.splice(index, 1)
    },
    bulkCreate: async (rows: Partial<OnCallNurse>[]) => {
      const created = rows.map((row, i) => ({
        ...row,
        id: oncallNurses.length + i + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as OnCallNurse))
      oncallNurses.push(...created)
      return created
    },
  },
  clientContacts: {
    list: async (clientId: number) => clientContacts.filter(c => c.client_id === clientId),
    create: async (data: Partial<ClientContact>) => {
      const newContact = { ...data, id: clientContacts.length + 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as ClientContact
      clientContacts.push(newContact)
      return newContact
    },
    update: async (id: number, data: Partial<ClientContact>) => {
      const index = clientContacts.findIndex(c => c.id === id)
      if (index >= 0) clientContacts[index] = { ...clientContacts[index], ...data, updated_at: new Date().toISOString() }
    },
    delete: async (id: number) => {
      const index = clientContacts.findIndex(c => c.id === id)
      if (index >= 0) clientContacts.splice(index, 1)
    },
  },
  messages: {
    send: async (data: any) => {
      console.log('[DEMO] Message send:', data)
      return { success: true, message: 'Demo mode - message not actually sent' }
    },
  },
  vault: {
    reveal: async (key: string) => {
      console.log('[DEMO] Vault reveal:', key)
      return 'demo-value'
    },
    store: async (key: string, value: string) => {
      console.log('[DEMO] Vault store:', key, value)
    },
  },
  db: {
    backup: async () => {
      console.log('[DEMO] Backup triggered')
      return { success: true, path: '/demo/backup.db' }
    },
    restore: async () => {
      console.log('[DEMO] Restore triggered')
      return { success: true }
    },
  },
}

// Expose mock API as window.api for compatibility
declare global {
  interface Window {
    api: typeof mockApi
  }
}

window.api = mockApi
