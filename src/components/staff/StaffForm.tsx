import { useState, useEffect } from 'react'
import { User, Mail, Phone, Briefcase } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Checkbox } from '../ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import type { House, Staff } from '../../types'

interface StaffFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff?: Staff | null
  houses: House[]
  onSave: () => void
  toast: (msg: string, type?: 'success' | 'error') => void
}

export function StaffForm({ open, onOpenChange, staff, houses, onSave, toast }: StaffFormProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [selectedHouses, setSelectedHouses] = useState<number[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (staff && open) {
      setFirstName(staff.first_name)
      setLastName(staff.last_name)
      setPhone(staff.phone || '')
      setEmail(staff.email || '')
      setRole(staff.role || '')
      window.api.staff.getHouses(staff.id).then(setSelectedHouses)
    } else if (open) {
      setFirstName('')
      setLastName('')
      setPhone('')
      setEmail('')
      setRole('')
      setSelectedHouses([])
    }
  }, [staff, open])

  const toggleHouse = (houseId: number) => {
    setSelectedHouses(prev =>
      prev.includes(houseId)
        ? prev.filter(id => id !== houseId)
        : [...prev, houseId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      toast('First and last name are required', 'error')
      return
    }

    setSaving(true)
    try {
      const data = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone || null,
        email: email || null,
        role: role || null,
      }
      if (staff) {
        await window.api.staff.update(staff.id, data)
        await window.api.staff.assignHouses(staff.id, selectedHouses)
        toast('Staff updated')
      } else {
        const created = await window.api.staff.create(data)
        await window.api.staff.assignHouses(created.id, selectedHouses)
        toast('Staff created')
      }
      onSave()
      onOpenChange(false)
    } catch {
      toast('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <div className="h-1.5 gradient-violet" />
        <div className="p-6">
          <DialogHeader className="mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-violet flex items-center justify-center shadow-md shadow-violet-500/20">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg">{staff ? 'Edit Staff' : 'Add Staff'}</DialogTitle>
                <DialogDescription className="mt-0.5">
                  {staff ? 'Update staff details and house assignments.' : 'Add a new staff member.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First Name *</Label>
                <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Name *</Label>
                <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="role" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g., DSP, Nurse, Manager" className="pl-10" />
              </div>
            </div>

            {houses.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned Houses</Label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto border rounded-lg p-3 bg-accent/30">
                  {houses.map(h => (
                    <label key={h.id} className="flex items-center gap-2.5 text-sm cursor-pointer hover:bg-accent/50 rounded-md px-2 py-1.5 transition-colors">
                      <Checkbox
                        checked={selectedHouses.includes(h.id)}
                        onCheckedChange={() => toggleHouse(h.id)}
                      />
                      <span className="font-medium">{h.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-gradient-to-r from-violet-600 to-violet-500 shadow-md shadow-violet-500/20">
                {saving ? 'Saving...' : staff ? 'Update Staff' : 'Add Staff'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
