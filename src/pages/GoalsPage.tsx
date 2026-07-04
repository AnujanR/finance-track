import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { Card, CardBody } from '../components/ui/Card'
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
import { formatCurrency, formatDate, formatPercent } from '../utils/format'
import { useAlert } from '../components/AlertProvider'
import type { Goal } from '../types/entities'

const colorOptions = [
  { value: '#10b981', label: 'Green' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#ef4444', label: 'Red' },
]

const NONE_POT = '__none__'

type DialogMode = 'add' | 'edit' | 'contribute' | null

export function GoalsPage() {
  const { goals, accounts, addGoal, updateGoal, deleteGoal, contributeToGoal } = useFinance()
  const { confirm, alert } = useAlert()
  const [dialog, setDialog] = useState<DialogMode>(null)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [contributingGoal, setContributingGoal] = useState<Goal | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    accountId: NONE_POT,
    color: '#10b981',
  })
  const [contributeAmount, setContributeAmount] = useState('')

  const summary = useMemo(() => {
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0)
    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0)
    const completed = goals.filter((g) => g.currentAmount >= g.targetAmount).length
    return { totalTarget, totalSaved, completed }
  }, [goals])

  const getPotName = (id?: string) => accounts.find((a) => a.id === id)?.name

  const resetForm = () => {
    setForm({
      name: '',
      targetAmount: '',
      currentAmount: '',
      deadline: '',
      accountId: NONE_POT,
      color: '#10b981',
    })
    setContributeAmount('')
    setFormError(null)
    setEditingGoal(null)
    setContributingGoal(null)
  }

  const closeDialog = () => {
    setDialog(null)
    resetForm()
  }

  const openAdd = () => {
    resetForm()
    setDialog('add')
  }

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setForm({
      name: goal.name,
      targetAmount: String(goal.targetAmount),
      currentAmount: String(goal.currentAmount),
      deadline: goal.deadline ?? '',
      accountId: goal.accountId ?? NONE_POT,
      color: goal.color,
    })
    setFormError(null)
    setDialog('edit')
  }

  const openContribute = (goal: Goal) => {
    setContributingGoal(goal)
    setContributeAmount('')
    setFormError(null)
    setDialog('contribute')
  }

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const targetAmount = parseFloat(form.targetAmount)
    const currentAmount = form.currentAmount === '' ? 0 : parseFloat(form.currentAmount)

    if (!form.name.trim()) {
      setFormError('Goal name is required')
      return
    }
    if (!targetAmount || targetAmount <= 0) {
      setFormError('Enter a valid target amount')
      return
    }
    if (Number.isNaN(currentAmount) || currentAmount < 0) {
      setFormError('Enter a valid starting amount')
      return
    }
    if (currentAmount > targetAmount) {
      setFormError('Starting amount cannot exceed target')
      return
    }

    const payload = {
      name: form.name.trim(),
      targetAmount,
      currentAmount,
      deadline: form.deadline || undefined,
      accountId: form.accountId === NONE_POT ? undefined : form.accountId,
      color: form.color,
    }

    setSubmitting(true)
    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, payload)
      } else {
        await addGoal(payload)
      }
      closeDialog()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save goal')
    } finally {
      setSubmitting(false)
    }
  }

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!contributingGoal) return

    const amount = parseFloat(contributeAmount)
    if (!amount || amount <= 0) {
      setFormError('Enter a valid amount')
      return
    }

    setSubmitting(true)
    try {
      await contributeToGoal(contributingGoal.id, amount)
      closeDialog()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add contribution')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (goal: Goal) => {
    const proceed = await confirm({
      title: 'Delete goal',
      description: `Are you sure you want to delete "${goal.name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'destructive',
    })
    if (!proceed) return
    try {
      await deleteGoal(goal.id)
    } catch (err) {
      await alert({
        title: 'Could not delete goal',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Savings Goals</h1>
          <p className="mt-1 text-slate-500">Track progress toward your financial targets</p>
        </div>
        <Button onClick={openAdd}>+ Add Goal</Button>
      </div>

      {goals.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardBody className="py-4">
              <p className="text-xs font-medium uppercase text-slate-500">Total saved</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {formatCurrency(summary.totalSaved)}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <p className="text-xs font-medium uppercase text-slate-500">Total targets</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {formatCurrency(summary.totalTarget)}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <p className="text-xs font-medium uppercase text-slate-500">Completed</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {summary.completed} / {goals.length}
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {goals.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center text-sm text-slate-400">
            No goals yet. Create one — e.g. Vacation Fund, Emergency Fund, New Laptop.
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => {
            const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
            const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0)
            const isComplete = goal.currentAmount >= goal.targetAmount
            const linkedPot = getPotName(goal.accountId)

            return (
              <Card key={goal.id} className={isComplete ? 'border-emerald-200' : ''}>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: goal.color }}
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{goal.name}</h3>
                        {linkedPot && (
                          <p className="text-xs text-slate-500">Linked to {linkedPot}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400"
                        onClick={() => openEdit(goal)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-500"
                        onClick={() => handleDelete(goal)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    {formatCurrency(goal.currentAmount)}
                  </p>
                  <p className="text-sm text-slate-500">of {formatCurrency(goal.targetAmount)} goal</p>

                  <div className="mt-4">
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${percent}%`, backgroundColor: goal.color }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-slate-500">
                      <span>{formatPercent(percent)} complete</span>
                      <span>{isComplete ? 'Goal reached!' : `${formatCurrency(remaining)} to go`}</span>
                    </div>
                  </div>

                  {goal.deadline && (
                    <p className="mt-3 text-xs text-slate-400">Target date: {formatDate(goal.deadline)}</p>
                  )}

                  {!isComplete && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full"
                      onClick={() => openContribute(goal)}
                    >
                      <Plus size={16} />
                      Add contribution
                    </Button>
                  )}
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={dialog === 'add' || dialog === 'edit'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Edit Goal' : 'Add Goal'}</DialogTitle>
            <DialogDescription>
              Set a savings target and track how much you&apos;ve put aside.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveGoal}>
            <DialogBody className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goal-name">Goal name</Label>
                <Input
                  id="goal-name"
                  placeholder="e.g. Vacation Fund, Emergency Fund"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goal-target">Target amount</Label>
                  <Input
                    id="goal-target"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="3000"
                    value={form.targetAmount}
                    onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-current">Already saved</Label>
                  <Input
                    id="goal-current"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={form.currentAmount}
                    onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Target date (optional)</Label>
                <DatePicker
                  value={form.deadline}
                  onChange={(deadline) => setForm({ ...form, deadline })}
                  placeholder="Pick a deadline"
                />
              </div>

              <div className="space-y-2">
                <Label>Link to pot (optional)</Label>
                <Select
                  value={form.accountId}
                  onValueChange={(accountId) => setForm({ ...form, accountId })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No linked pot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_POT}>No linked pot</SelectItem>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <Select value={form.color} onValueChange={(color) => setForm({ ...form, color })}>
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
              <Button type="button" variant="ghost" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : editingGoal ? 'Update Goal' : 'Create Goal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'contribute'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add contribution</DialogTitle>
            <DialogDescription>
              {contributingGoal?.name} — {formatCurrency(contributingGoal?.currentAmount ?? 0)} saved so far
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleContribute}>
            <DialogBody className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contribute-amount">Amount to add</Label>
                <Input
                  id="contribute-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  autoFocus
                />
              </div>
              {formError && <p className="text-sm text-red-500">{formError}</p>}
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" variant="success" disabled={submitting}>
                {submitting ? 'Adding…' : 'Add to goal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
