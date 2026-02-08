export interface House {
  id: number
  name: string
  address: string | null
  phone: string | null
  notes: string | null
  manager_id: number | null
  manager_name: string | null
  is_active: number
  created_at: string
  updated_at: string
}

export interface Staff {
  id: number
  first_name: string
  last_name: string
  phone: string | null
  email: string | null
  role: string | null
  is_active: number
  created_at: string
  updated_at: string
}

export interface Client {
  id: number
  house_id: number | null
  first_name: string
  last_name: string
  dob: string | null
  phone: string | null
  email: string | null
  emergency_contact: string | null
  notes: string | null
  is_active: number
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: number
  client_id: number | null
  house_id: number | null
  assigned_staff_id: number | null
  title: string
  type: string | null
  location: string | null
  start_datetime: string
  end_datetime: string | null
  status: string
  notes: string | null
  reminder_sent: number
  reminder_error: string | null
  created_at: string
  updated_at: string
  client_name?: string
  house_name?: string
  staff_name?: string
  house_address?: string
  house_phone?: string
  staff_phone?: string
}

export interface ClientAccount {
  id: number
  client_id: number
  service_name: string
  service_url: string | null
  username: string | null
  created_at: string
  updated_at: string
}

export interface ClientContact {
  id: number
  client_id: number
  name: string
  category: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: number
  twilio_sid: string | null
  direction: 'outbound' | 'inbound'
  from_number: string
  to_number: string
  body: string
  status: string | null
  staff_id: number | null
  related_appointment_id: number | null
  error_message: string | null
  sent_at: string
  created_at: string
}

export interface OnCallNurse {
  id: number
  house_id: number
  staff_id: number | null
  external_name: string | null
  external_phone: string | null
  start_date: string
  end_date: string
  notes: string | null
  nurse_name: string
  nurse_phone: string | null
  house_name: string
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  todayAppointments: Appointment[]
  unassigned: Appointment[]
  failedReminders: Appointment[]
}

// Extend window with our API
declare global {
  interface Window {
    api: {
      houses: {
        list: () => Promise<House[]>
        get: (id: number) => Promise<House | undefined>
        create: (data: Partial<House>) => Promise<House>
        update: (id: number, data: Partial<House>) => Promise<House>
        delete: (id: number) => Promise<void>
      }
      staff: {
        list: () => Promise<Staff[]>
        get: (id: number) => Promise<Staff | undefined>
        create: (data: Partial<Staff>) => Promise<Staff>
        update: (id: number, data: Partial<Staff>) => Promise<Staff>
        delete: (id: number) => Promise<void>
        assignHouses: (staffId: number, houseIds: number[]) => Promise<void>
        getHouses: (staffId: number) => Promise<number[]>
        byHouse: (houseId: number) => Promise<Staff[]>
      }
      clients: {
        list: () => Promise<Client[]>
        get: (id: number) => Promise<Client | undefined>
        create: (data: Partial<Client>) => Promise<Client>
        update: (id: number, data: Partial<Client>) => Promise<Client>
        delete: (id: number) => Promise<void>
        byHouse: (houseId: number) => Promise<Client[]>
      }
      appointments: {
        list: () => Promise<Appointment[]>
        get: (id: number) => Promise<Appointment | undefined>
        create: (data: Partial<Appointment>) => Promise<Appointment>
        update: (id: number, data: Partial<Appointment>) => Promise<Appointment>
        delete: (id: number) => Promise<void>
        today: () => Promise<Appointment[]>
        upcoming: (minutes: number) => Promise<Appointment[]>
        byDateRange: (start: string, end: string) => Promise<Appointment[]>
      }
      clientContacts: {
        list: (clientId: number) => Promise<ClientContact[]>
        get: (id: number) => Promise<ClientContact | undefined>
        create: (data: { client_id: number; name: string; category?: string; phone?: string; email?: string; address?: string; notes?: string }) => Promise<ClientContact>
        update: (id: number, data: { name?: string; category?: string; phone?: string; email?: string; address?: string; notes?: string }) => Promise<boolean>
        delete: (id: number) => Promise<boolean>
      }
      vault: {
        isSetup: () => Promise<boolean>
        isUnlocked: () => Promise<boolean>
        setMasterPassword: (password: string) => Promise<boolean>
        unlock: (password: string) => Promise<boolean>
        lock: () => Promise<void>
        listAccounts: (clientId: number) => Promise<ClientAccount[]>
        addAccount: (data: { client_id: number; service_name: string; service_url?: string; username?: string; password?: string }) => Promise<ClientAccount>
        updateAccount: (id: number, data: { service_name?: string; service_url?: string; username?: string; password?: string }) => Promise<boolean>
        deleteAccount: (id: number) => Promise<boolean>
        reveal: (id: number) => Promise<string | null>
      }
      settings: {
        get: (key: string) => Promise<string | null>
        set: (key: string, value: string, isSecret?: boolean) => Promise<boolean>
        getAll: () => Promise<Record<string, string>>
      }
      notifications: {
        sendTestEmail: (to: string) => Promise<{ success: boolean; error?: string }>
        sendTestSms: (to: string) => Promise<{ success: boolean; error?: string }>
        sendSms: (to: string, body: string, staffId?: number, appointmentId?: number) => Promise<{ success: boolean; error?: string; messageId?: number }>
      }
      messages: {
        getConversation: (phone1: string, phone2: string, limit?: number) => Promise<Message[]>
        fetchInbound: (phoneNumber: string) => Promise<{ success: boolean; error?: string; count?: number }>
      }
      oncall: {
        list: () => Promise<OnCallNurse[]>
        listByHouse: (houseId: number) => Promise<OnCallNurse[]>
        getCurrent: (houseId: number) => Promise<OnCallNurse | undefined>
        getCurrentAll: () => Promise<OnCallNurse[]>
        create: (data: Partial<OnCallNurse>) => Promise<OnCallNurse>
        update: (id: number, data: Partial<OnCallNurse>) => Promise<OnCallNurse>
        delete: (id: number) => Promise<boolean>
        bulkCreate: (rows: Partial<OnCallNurse>[]) => Promise<OnCallNurse[]>
      }
      dashboard: {
        stats: () => Promise<DashboardStats>
      }
      db: {
        backup: () => Promise<{ success: boolean; error?: string; path?: string }>
        restore: () => Promise<{ success: boolean; error?: string; backupPath?: string }>
      }
    }
  }
}
