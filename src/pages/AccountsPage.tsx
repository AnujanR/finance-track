import { useState } from 'react'
import { format } from 'date-fns'
import { ArrowRightLeft, CreditCard, Landmark, Banknote, TrendingUp, Plus, History } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { Card, CardBody } from '../components/ui/Card'
import { PotHistoryModal } from '../components/PotHistoryModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency } from '../utils/format'
import type { AccountType } from '../types/entities'

const accountIcons: Record<AccountType, typeof Landmark> = {
  checking: Landmark,
  savings: TrendingUp,
  credit: CreditCard,
  cash: Banknote,
  investment: TrendingUp,
}

const colorOptions = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#ec4899', label: 'Pink' },
]

const today = () => format(new Date(), 'yyyy-MM-dd')

type Modal = 'add' | 'topup' | 'transfer' | 'history' | null

export function AccountsPage() {
  const { accounts, categories, transactions, addAccount, topUpPot, transferPot } = useFinance()
  const [modal, setModal] = useState<Modal>(null)
  const [selectedPotId, setSelectedPotId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [addForm, setAddForm] = useState({ name: '', balance: '', color: '#10b981' })
  const [topUpForm, setTopUpForm] = useState({ amount: '', date: today(), notes: '' })
  const [transferForm, setTransferForm] = useState({
    fromPotId: '',
    toPotId: '',
    amount: '',
    date: today(),
    notes: '',
  })

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const selectedPot = accounts.find((a) => a.id === selectedPotId)

  const closeModal = () => {
    setModal(null)
    setSelectedPotId(null)
    setFormError(null)
  }

  const openAdd = () => {
    setAddForm({ name: '', balance: '', color: '#10b981' })
    setFormError(null)
    setModal('add')
  }

  const openTopUp = (potId: string) => {
    setSelectedPotId(potId)
    setTopUpForm({ amount: '', date: today(), notes: '' })
    setFormError(null)
    setModal('topup')
  }

  const openTransfer = (fromPotId?: string) => {
    setTransferForm({
      fromPotId: fromPotId ?? accounts[0]?.id ?? '',
      toPotId: accounts.find((a) => a.id !== fromPotId)?.id ?? '',
      amount: '',
      date: today(),
      notes: '',
    })
    setFormError(null)
    setModal('transfer')
  }

  const openHistory = (potId: string) => {
    setSelectedPotId(potId)
    setModal('history')
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!addForm.name.trim()) {
      setFormError('Pot name is required')
      return
    }
    const balance = addForm.balance === '' ? 0 : parseFloat(addForm.balance)
    if (Number.isNaN(balance)) {
      setFormError('Enter a valid amount')
      return
    }
    setSubmitting(true)
    try {
      await addAccount({
        name: addForm.name.trim(),
        type: 'cash',
        balance,
        currency: 'USD',
        color: addForm.color,
      })
      closeModal()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create pot')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!selectedPotId) return
    const amount = parseFloat(topUpForm.amount)
    if (!amount || amount <= 0) {
      setFormError('Enter a valid amount')
      return
    }
    setSubmitting(true)
    try {
      await topUpPot(selectedPotId, amount, topUpForm.date, topUpForm.notes.trim() || undefined)
      closeModal()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to top up pot')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const amount = parseFloat(transferForm.amount)
    if (!transferForm.fromPotId || !transferForm.toPotId) {
      setFormError('Select both pots')
      return
    }
    if (transferForm.fromPotId === transferForm.toPotId) {
      setFormError('Choose two different pots')
      return
    }
    if (!amount || amount <= 0) {
      setFormError('Enter a valid amount')
      return
    }
    const fromPot = accounts.find((a) => a.id === transferForm.fromPotId)
    if (fromPot && fromPot.balance < amount) {
      setFormError(`Not enough in ${fromPot.name} (${formatCurrency(fromPot.balance)} available)`)
      return
    }
    setSubmitting(true)
    try {
      await transferPot(
        transferForm.fromPotId,
        transferForm.toPotId,
        amount,
        transferForm.date,
        transferForm.notes.trim() || undefined,
      )
      closeModal()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to transfer')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Money Pots</h1>
          <p className="mt-1 text-slate-500">
            Set aside money in pots, top them up anytime, and pay expenses from them.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Total across all pots:{' '}
            <span className="font-semibold text-slate-900">{formatCurrency(totalBalance)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {accounts.length >= 2 && (
            <Button variant="outline" onClick={() => openTransfer()}>
              <ArrowRightLeft size={16} />
              Transfer
            </Button>
          )}
          <Button onClick={openAdd}>+ Add Pot</Button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center text-sm text-slate-400">
            No pots yet. Create one for each budget — e.g. Rent, Groceries, Bills, Subscriptions.
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((pot) => {
            const Icon = accountIcons[pot.type]
            const lowBalance = pot.balance < 50
            return (
              <Card key={pot.id}>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${pot.color}20`, color: pot.color }}
                    >
                      <Icon size={22} />
                    </div>
                    {lowBalance && pot.balance >= 0 && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        Low
                      </span>
                    )}
                    {pot.balance < 0 && (
                      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">
                        Overdrawn
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{pot.name}</h3>
                  <p className={`mt-1 text-2xl font-bold ${pot.balance < 0 ? 'text-red-500' : 'text-slate-900'}`}>
                    {formatCurrency(pot.balance, pot.currency)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">Available to spend</p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      onClick={() => openTopUp(pot.id)}
                    >
                      <Plus size={16} />
                      Top Up
                    </Button>
                    {accounts.length >= 2 && (
                      <Button variant="secondary" className="flex-1" onClick={() => openTransfer(pot.id)}>
                        <ArrowRightLeft size={16} />
                        Move
                      </Button>
                    )}
                  </div>
                  <Button variant="outline" className="mt-2 w-full" onClick={() => openHistory(pot.id)}>
                    <History size={16} />
                    View History
                  </Button>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={modal === 'add'} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Pot</DialogTitle>
            <DialogDescription>Create a new money pot for a budget area.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd}>
            <DialogBody className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pot-name">Pot name</Label>
                <Input
                  id="pot-name"
                  placeholder="e.g. Rent, Groceries, Bills, Subscriptions"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pot-balance">Starting amount</Label>
                <Input
                  id="pot-balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={addForm.balance}
                  onChange={(e) => setAddForm({ ...addForm, balance: e.target.value })}
                />
                <p className="text-xs text-slate-400">How much you&apos;re putting in to start</p>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Select value={addForm.color} onValueChange={(color) => setAddForm({ ...addForm, color })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formError && <p className="text-sm text-red-500">{formError}</p>}
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Create Pot'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={modal === 'topup' && !!selectedPot} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Top Up Pot</DialogTitle>
            <DialogDescription>{selectedPot?.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTopUp}>
            <DialogBody className="space-y-4">
              <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
                Current balance:{' '}
                <span className="font-semibold text-slate-900">
                  {selectedPot ? formatCurrency(selectedPot.balance) : '—'}
                </span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="topup-amount">Amount to add</Label>
                <Input
                  id="topup-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={topUpForm.amount}
                  onChange={(e) => setTopUpForm({ ...topUpForm, amount: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <DatePicker
                  value={topUpForm.date}
                  onChange={(date) => setTopUpForm({ ...topUpForm, date })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topup-notes">
                  Note <span className="font-normal text-slate-400">(optional)</span>
                </Label>
                <Input
                  id="topup-notes"
                  placeholder="e.g. Monthly rent allowance"
                  value={topUpForm.notes}
                  onChange={(e) => setTopUpForm({ ...topUpForm, notes: e.target.value })}
                />
              </div>
              {formError && <p className="text-sm text-red-500">{formError}</p>}
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" variant="success" disabled={submitting}>
                {submitting ? 'Adding…' : 'Add Money'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={modal === 'transfer'} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Move Between Pots</DialogTitle>
            <DialogDescription>Transfer money from one pot to another.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTransfer}>
            <DialogBody className="space-y-4">
              <div className="space-y-2">
                <Label>From pot</Label>
                <Select
                  value={transferForm.fromPotId}
                  onValueChange={(fromPotId) => setTransferForm({ ...transferForm, fromPotId })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pot" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((pot) => (
                      <SelectItem key={pot.id} value={pot.id}>
                        {pot.name} ({formatCurrency(pot.balance)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>To pot</Label>
                <Select
                  value={transferForm.toPotId}
                  onValueChange={(toPotId) => setTransferForm({ ...transferForm, toPotId })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pot" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts
                      .filter((pot) => pot.id !== transferForm.fromPotId)
                      .map((pot) => (
                        <SelectItem key={pot.id} value={pot.id}>
                          {pot.name} ({formatCurrency(pot.balance)})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer-amount">Amount</Label>
                <Input
                  id="transfer-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <DatePicker
                  value={transferForm.date}
                  onChange={(date) => setTransferForm({ ...transferForm, date })}
                />
              </div>
              {formError && <p className="text-sm text-red-500">{formError}</p>}
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Moving…' : 'Move Money'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {modal === 'history' && selectedPot && (
        <PotHistoryModal
          pot={selectedPot}
          transactions={transactions}
          categories={categories}
          accounts={accounts}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
