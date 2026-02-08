import { useState, useEffect } from 'react'
import { Home, MapPin, Phone, FileText, User } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import type { House, Staff } from '../../types'

interface HouseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  house?: House | null
  onSave: () => void
  toast: (msg: string, type?: 'success' | 'error') => void
}

export function HouseForm({ open, onOpenChange, house, onSave, toast }: HouseFormProps) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [managerId, setManagerId] = useState<string>('none')
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      window.api.staff.list().then(setStaffList).catch(() => {})
    }
  }, [open])

  useEffect(() => {
    if (house) {
      setName(house.name)
      setAddress(house.address || '')
      setPhone(house.phone || '')
      setNotes(house.notes || '')
      setManagerId(house.manager_id ? String(house.manager_id) : 'none')
    } else {
      setName('')
      setAddress('')
      setPhone('')
      setNotes('')
      setManagerId('none')
    }
  }, [house, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast('Name is required', 'error')
      return
    }

    setSaving(true)
    try {
      const data = {
        name: name.trim(),
        address: address || null,
        phone: phone || null,
        notes: notes || null,
        manager_id: managerId !== 'none' ? Number(managerId) : null,
      }
      if (house) {
        await window.api.houses.update(house.id, data)
        toast('House updated')
      } else {
        await window.api.houses.create(data)
        toast('House created')
      }
      onSave()
      onOpenChange(false)
    } catch (err) {
      toast('Failed to save house', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0">
        <div className="h-1.5 gradient-emerald" />
        <div className="p-6">
          <DialogHeader className="mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-emerald flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg">{house ? 'Edit House' : 'Add House'}</DialogTitle>
                <DialogDescription className="mt-0.5">
                  {house ? 'Update the house details.' : 'Add a new house/facility.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name *</Label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="House name" className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address" className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Manager</Label>
              <Select value={managerId} onValueChange={setManagerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {staffList.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.first_name} {s.last_name}{s.role ? ` (${s.role})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</Label>
              <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes" rows={3} />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-md shadow-emerald-500/20">
                {saving ? 'Saving...' : house ? 'Update House' : 'Create House'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
