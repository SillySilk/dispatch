import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AppSidebar } from './components/layout/AppSidebar'
import { Dashboard } from './components/dashboard/Dashboard'
import { HouseList } from './components/houses/HouseList'
import { HouseDetail } from './components/houses/HouseDetail'
import { ClientList } from './components/clients/ClientList'
import { ClientDetail } from './components/clients/ClientDetail'
import { StaffList } from './components/staff/StaffList'
import { StaffDetail } from './components/staff/StaffDetail'
import { AppointmentListPage } from './components/appointments/AppointmentList'
import { MessagingPage } from './components/messaging/MessagingPage'
import { OnCallSchedulePage } from './components/oncall/OnCallSchedulePage'
import { SettingsPage } from './components/settings/SettingsPage'
import './mockApi' // Initialize mock API

export default function App() {
  return (
    <div className="relative">
      {/* Demo banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-center py-2 px-4 text-sm font-medium shadow-lg">
        <div className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>DEMO VERSION - Data is not persistent. Changes will be lost on page refresh.</span>
        </div>
      </div>

      <Router>
        <div className="flex h-screen overflow-hidden pt-10">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/houses" element={<HouseList />} />
              <Route path="/houses/:id" element={<HouseDetail />} />
              <Route path="/clients" element={<ClientList />} />
              <Route path="/clients/:id" element={<ClientDetail />} />
              <Route path="/staff" element={<StaffList />} />
              <Route path="/staff/:id" element={<StaffDetail />} />
              <Route path="/appointments" element={<AppointmentListPage />} />
              <Route path="/messaging" element={<MessagingPage />} />
              <Route path="/on-call" element={<OnCallSchedulePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </div>
  )
}
