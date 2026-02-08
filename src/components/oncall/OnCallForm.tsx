import { useState, useEffect } from 'react'
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
import type { House, Staff, OnCallNurse } from '../../types'

interface OnCallFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry?: OnCallNurse | null
  onSave: () => void
  toast: (msg: string, type?: 'success' | 'error') => void
}

export function OnCallForm({ open, onOpenChange, entry, onSave, toast }: OnCallFormProps) {
  const [houseId, setHouseId] = useState<string>('')
  const [nurseType, setNurseType] = useState<'staff' | 'external'>('external')
  const [staffId, setStaffId] = useState<string>('')
  const [externalName, setExternalName] = useState('')
  const [externalPhone, setExternalPhone] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [houses, setHouses] = useState<House[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      window.api.houses.list().then(setHouses).catch(() => {})
      window.api.staff.list().then(setStaffList).catch(() => {})
    }
  }, [open])

  useEffect(() => {
    if (entry) {
      setHouseId(String(entry.house_id))
      setNurseType(entry.staff_id ? 'staff' : 'external')
      setStaffId(entry.staff_id ? String(entry.staff_id) : '')
      setExternalName(entry.external_name || '')
      setExternalPhone(entry.external_phone || '')
      setStartDate(entry.start_date)
      setEndDate(entry.end_date)
      setNotes(entry.notes || '')
    } else {
      setHouseId('')
      setNurseType('external')
      setStaffId('')
      setExternalName('')
      setExternalPhone('')
      setStartDate('')
      setEndDate('')
      setNotes('')
    }
  }, [entry, open])

  const handleSubmit = async () => {
    if (!houseId || !startDate || !endDate) return
    if (nurseType === 'staff' && !staffId) return
    if (nurseType === 'external' && !externalName) return

    setSaving(true)
    try {
      const data = {
        house_id: Number(houseId),
        staff_id: nurseType === 'staff' ? Number(staffId) : null,
        external_name: nurseType === 'external' ? externalName : null,
        external_phone: nurseType === 'external' ? externalPhone || null : null,
        start_date: startDate,
        end_date: endDate,
        notes: notes || null,
      }

      if (entry) {
        await window.api.oncall.update(entry.id, data)
        toast('Assignment updated')
      } else {
        await window.api.oncall.create(data)
        toast('Assignment created')
      }
      onOpenChange(false)
      onSave()
    } catch {
      toast('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 max-w-md">
        <div className="h-1.5 gradient-indigo" />
        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle>{entry ? 'Edit' : 'Add'} On-Call Assignment</DialogTitle>
            <DialogDescription>Assign a nurse to a house for a date range.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>House</Label>
              <Select value={houseId} onValueChange={setHouseId}>
                <SelectTrigger><SelectValue placeholder="Select house..." /></SelectTrigger>
                <SelectContent>
                  {houses.map(h => (
                    <SelectItem key={h.id} value={String(h.id)}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nurse Type</Label>
              <Select value={nurseType} onValueChange={(v) => setNurseType(v as 'staff' | 'external')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff Nurse</SelectItem>
                  <SelectItem value="external">External Nurse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {nurseType === 'staff' ? (
              <div>
                <Label>Staff Member</Label>
                <Select value={staffId} onValueChange={setStaffId}>
                  <SelectTrigger><SelectValue placeholder="Select staff..." /></SelectTrigger>
                  <SelectContent>
                    {staffList.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.first_name} {s.last_name}{s.phone ? ` (${s.phone})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div>
                  <Label>Nurse Name</Label>
                  <Input value={externalName} onChange={e => setExternalName(e.target.value)} placeholder="Jane Smith" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={externalPhone} onChange={e => setExternalPhone(e.target.value)} placeholder="555-123-4567" />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." rows={2} />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-md shadow-indigo-500/20"
            >
              {saving ? 'Saving...' : entry ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
