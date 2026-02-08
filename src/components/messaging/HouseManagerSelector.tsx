import { useState, useMemo } from 'react'
import { Search, Home, User } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog'
import type { House, Staff } from '../../types'

interface HouseManagerSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  houses: House[]
  staff: Staff[]
  onSelectManager: (staffMember: Staff) => void
}

export function HouseManagerSelector({
  open,
  onOpenChange,
  houses,
  staff,
  onSelectManager,
}: HouseManagerSelectorProps) {
  const [search, setSearch] = useState('')

  const housesWithManagers = useMemo(() => {
    return houses
      .filter(h => h.manager_id != null)
      .filter(
        h =>
          h.name.toLowerCase().includes(search.toLowerCase()) ||
          (h.manager_name || '').toLowerCase().includes(search.toLowerCase())
      )
  }, [houses, search])

  const handleSelect = (house: House) => {
    const manager = staff.find(s => s.id === house.manager_id)
    if (manager) {
      onSelectManager(manager)
      onOpenChange(false)
      setSearch('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 max-w-sm">
        <div className="h-1.5 gradient-emerald" />
        <div className="p-6">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-emerald flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle>Text House Manager</DialogTitle>
                <DialogDescription className="mt-0.5">Select a house to message its manager</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search houses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1">
            {housesWithManagers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {search ? 'No matching houses' : 'No houses have a manager assigned'}
              </p>
            ) : (
              housesWithManagers.map(h => (
                <button
                  key={h.id}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                  onClick={() => handleSelect(h)}
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Home className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{h.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {h.manager_name}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
