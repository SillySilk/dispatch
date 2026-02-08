import { useState } from 'react'
import { Plus, Eye, EyeOff, Pencil, Trash2, Lock, Unlock, Globe, Shield, KeyRound } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent } from '../ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import { useApi, useToast } from '../../hooks/useApi'
import { ToastContainer } from '../layout/ToastContainer'
import type { ClientAccount } from '../../types'

interface VaultProps {
  clientId: number
}

export function ClientAccountVault({ clientId }: VaultProps) {
  const { toasts, toast } = useToast()
  const [vaultSetup, setVaultSetup] = useState<boolean | null>(null)
  const [vaultUnlocked, setVaultUnlocked] = useState(false)
  const [masterPassword, setMasterPassword] = useState('')
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [accountFormOpen, setAccountFormOpen] = useState(false)
  const [editAccount, setEditAccount] = useState<ClientAccount | null>(null)
  const [revealedPasswords, setRevealedPasswords] = useState<Record<number, string>>({})

  const [serviceName, setServiceName] = useState('')
  const [serviceUrl, setServiceUrl] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const { data: accounts, refresh } = useApi(
    async () => {
      const setup = await window.api.vault.isSetup()
      setVaultSetup(setup)
      const unlocked = await window.api.vault.isUnlocked()
      setVaultUnlocked(unlocked)
      if (unlocked) {
        return window.api.vault.listAccounts(clientId)
      }
      return []
    },
    [clientId]
  )

  const handleSetupOrUnlock = async () => {
    if (!masterPassword) return
    try {
      if (!vaultSetup) {
        await window.api.vault.setMasterPassword(masterPassword)
        toast('Master password set')
      } else {
        const success = await window.api.vault.unlock(masterPassword)
        if (!success) {
          toast('Invalid password', 'error')
          return
        }
        toast('Vault unlocked')
      }
      setMasterPassword('')
      setPasswordDialogOpen(false)
      refresh()
    } catch {
      toast('Error', 'error')
    }
  }

  const handleLock = async () => {
    await window.api.vault.lock()
    setVaultUnlocked(false)
    setRevealedPasswords({})
    refresh()
  }

  const handleReveal = async (accountId: number) => {
    if (revealedPasswords[accountId]) {
      setRevealedPasswords(prev => {
        const copy = { ...prev }
        delete copy[accountId]
        return copy
      })
      return
    }
    try {
      const pw = await window.api.vault.reveal(accountId)
      if (pw) {
        setRevealedPasswords(prev => ({ ...prev, [accountId]: pw }))
      }
    } catch {
      toast('Failed to reveal password', 'error')
    }
  }

  const openAddForm = () => {
    setEditAccount(null)
    setServiceName('')
    setServiceUrl('')
    setUsername('')
    setPassword('')
    setAccountFormOpen(true)
  }

  const openEditForm = (acc: ClientAccount) => {
    setEditAccount(acc)
    setServiceName(acc.service_name)
    setServiceUrl(acc.service_url || '')
    setUsername(acc.username || '')
    setPassword('')
    setAccountFormOpen(true)
  }

  const handleSaveAccount = async () => {
    if (!serviceName.trim()) {
      toast('Service name is required', 'error')
      return
    }
    try {
      if (editAccount) {
        await window.api.vault.updateAccount(editAccount.id, {
          service_name: serviceName,
          service_url: serviceUrl || undefined,
          username: username || undefined,
          password: password || undefined,
        })
        toast('Account updated')
      } else {
        await window.api.vault.addAccount({
          client_id: clientId,
          service_name: serviceName,
          service_url: serviceUrl || undefined,
          username: username || undefined,
          password: password || undefined,
        })
        toast('Account added')
      }
      setAccountFormOpen(false)
      refresh()
    } catch {
      toast('Failed to save', 'error')
    }
  }

  const handleDeleteAccount = async (id: number) => {
    if (!confirm('Delete this account credential?')) return
    try {
      await window.api.vault.deleteAccount(id)
      toast('Account deleted')
      refresh()
    } catch {
      toast('Failed to delete', 'error')
    }
  }

  if (!vaultUnlocked) {
    return (
      <div className="space-y-4">
        <Card className="overflow-hidden">
          <div className="h-1 gradient-amber" />
          <CardContent className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl gradient-amber flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">
                {vaultSetup === false ? 'Set Up Credential Vault' : 'Vault Locked'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {vaultSetup === false
                  ? 'Set a master password to start using the credential vault for secure storage.'
                  : 'Enter your master password to access stored credentials.'}
              </p>
            </div>
            <Button
              onClick={() => setPasswordDialogOpen(true)}
              className="bg-gradient-to-r from-amber-600 to-amber-500 shadow-md shadow-amber-500/20"
            >
              <KeyRound className="h-4 w-4 mr-2" />
              {vaultSetup === false ? 'Set Master Password' : 'Unlock Vault'}
            </Button>
          </CardContent>
        </Card>

        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogContent className="overflow-hidden p-0">
            <div className="h-1.5 gradient-amber" />
            <div className="p-6">
              <DialogHeader className="mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-amber flex items-center justify-center shadow-md shadow-amber-500/20">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg">{vaultSetup === false ? 'Set Master Password' : 'Unlock Vault'}</DialogTitle>
                    <DialogDescription className="mt-0.5">
                      {vaultSetup === false
                        ? 'Choose a strong master password. This cannot be recovered if lost.'
                        : 'Enter your master password.'}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="masterPw" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Master Password</Label>
                  <Input
                    id="masterPw"
                    type="password"
                    value={masterPassword}
                    onChange={e => setMasterPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSetupOrUnlock()}
                    placeholder="Enter your master password"
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSetupOrUnlock} className="bg-gradient-to-r from-amber-600 to-amber-500 shadow-md shadow-amber-500/20">
                  {vaultSetup === false ? 'Set Password' : 'Unlock'}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
        <ToastContainer toasts={toasts} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Unlock className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm text-emerald-700 font-semibold">Vault Unlocked</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleLock} className="border-emerald-200 hover:bg-emerald-100">
            <Lock className="h-3.5 w-3.5 mr-1.5" />
            Lock
          </Button>
          <Button size="sm" onClick={openAddForm} className="bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-md shadow-emerald-500/20">
            <Plus className="h-4 w-4 mr-1" />
            Add Account
          </Button>
        </div>
      </div>

      {!accounts?.length ? (
        <div className="py-10 text-center">
          <Globe className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No saved credentials for this client.</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Add Account" to store service credentials securely.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc, i) => (
            <Card
              key={acc.id}
              className="overflow-hidden animate-slide-up"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}
            >
              <CardContent className="p-0">
                <div className="flex">
                  <div className="w-1 bg-amber-400 flex-shrink-0" />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Globe className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <span className="font-semibold text-sm">{acc.service_name}</span>
                            {acc.service_url && (
                              <p className="text-xs text-muted-foreground">{acc.service_url}</p>
                            )}
                          </div>
                        </div>
                        <div className="ml-10 space-y-0.5">
                          {acc.username && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground w-10">User</span>
                              <span className="font-mono text-sm">{acc.username}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground w-10">Pass</span>
                            <span className="font-mono text-sm">
                              {revealedPasswords[acc.id] || '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-amber-50 hover:text-amber-600"
                              onClick={() => handleReveal(acc.id)}
                            >
                              {revealedPasswords[acc.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600" onClick={() => openEditForm(acc)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 hover:text-red-600" onClick={() => handleDeleteAccount(acc.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={accountFormOpen} onOpenChange={setAccountFormOpen}>
        <DialogContent className="overflow-hidden p-0">
          <div className="h-1.5 gradient-amber" />
          <div className="p-6">
            <DialogHeader className="mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-amber flex items-center justify-center shadow-md shadow-amber-500/20">
                  <KeyRound className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg">{editAccount ? 'Edit Account' : 'Add Account'}</DialogTitle>
                  <DialogDescription className="mt-0.5">Store a service credential securely.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Service Name *</Label>
                <Input value={serviceName} onChange={e => setServiceName(e.target.value)} placeholder="e.g., Therap, MyChart" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Service URL</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={serviceUrl} onChange={e => setServiceUrl(e.target.value)} placeholder="https://..." className="pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</Label>
                <Input value={username} onChange={e => setUsername(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Password {editAccount ? '(leave blank to keep current)' : ''}
                </Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setAccountFormOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveAccount} className="bg-gradient-to-r from-amber-600 to-amber-500 shadow-md shadow-amber-500/20">
                {editAccount ? 'Update Account' : 'Save Account'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      <ToastContainer toasts={toasts} />
    </div>
  )
}
