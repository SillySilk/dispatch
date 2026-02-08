import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, MapPin, Phone, Home, Search } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import { TopBar } from '../layout/TopBar'
import { ToastContainer } from '../layout/ToastContainer'
import { HouseForm } from './HouseForm'
import { useApi, useToast } from '../../hooks/useApi'
import type { House } from '../../types'

export function HouseList() {
  const { data: houses, loading, refresh } = useApi(() => window.api.houses.list())
  const { toasts, toast } = useToast()
  const [formOpen, setFormOpen] = useState(false)
  const [editHouse, setEditHouse] = useState<House | null>(null)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const filtered = houses?.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.address?.toLowerCase().includes(search.toLowerCase())
  ) || []

  const handleDelete = async (house: House) => {
    if (!confirm(`Delete "${house.name}"? This will soft-delete the house.`)) return
    try {
      await window.api.houses.delete(house.id)
      toast('House deleted')
      refresh()
    } catch {
      toast('Failed to delete', 'error')
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="Houses">
        <Button
          onClick={() => { setEditHouse(null); setFormOpen(true) }}
          className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-md shadow-indigo-500/20"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add House
        </Button>
      </TopBar>

      <div className="p-6 space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search houses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl gradient-indigo flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20">
              <Home className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {search ? 'No houses found' : 'No houses yet'}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              {search ? 'Try a different search term.' : 'Add your first house to get started.'}
            </p>
            {!search && (
              <Button onClick={() => { setEditHouse(null); setFormOpen(true) }}>
                <Plus className="h-4 w-4 mr-2" />
                Add First House
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((house, i) => (
              <Card
                key={house.id}
                className="card-hover cursor-pointer border-l-4 border-l-indigo-500/60 overflow-hidden animate-slide-up"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}
                onClick={() => navigate(`/houses/${house.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl gradient-indigo flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/15">
                        <Home className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base truncate">{house.name}</h3>
                        {house.address && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{house.address}</span>
                          </p>
                        )}
                        {house.phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                            {house.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-0.5 ml-2" onClick={e => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600"
                        onClick={() => { setEditHouse(house); setFormOpen(true) }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleDelete(house)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <HouseForm open={formOpen} onOpenChange={setFormOpen} house={editHouse} onSave={refresh} toast={toast} />
      <ToastContainer toasts={toasts} />
    </div>
  )
}
