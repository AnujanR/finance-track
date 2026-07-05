import { useState } from 'react'
import {
  Briefcase,
  Laptop,
  ShoppingCart,
  Home,
  Car,
  Film,
  Zap,
  Heart,
  Smartphone,
  Tv,
  Receipt,
} from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { Card, CardBody } from '../components/ui/Card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import type { CategoryType } from '../types/entities'
import { PageContainer, PageHeader } from '../components/layout/PageContainer'

const iconMap: Record<string, typeof Briefcase> = {
  briefcase: Briefcase,
  laptop: Laptop,
  'shopping-cart': ShoppingCart,
  home: Home,
  car: Car,
  film: Film,
  zap: Zap,
  heart: Heart,
  smartphone: Smartphone,
  tv: Tv,
  receipt: Receipt,
}

const iconOptions = [
  { value: 'home', label: 'Home (rent)' },
  { value: 'shopping-cart', label: 'Shopping (groceries)' },
  { value: 'smartphone', label: 'Phone (bills)' },
  { value: 'zap', label: 'Utilities' },
  { value: 'tv', label: 'Subscriptions' },
  { value: 'car', label: 'Transport' },
  { value: 'film', label: 'Entertainment' },
  { value: 'heart', label: 'Healthcare' },
  { value: 'receipt', label: 'General' },
  { value: 'briefcase', label: 'Work' },
  { value: 'laptop', label: 'Freelance' },
]

const colorOptions = [
  { value: '#ef4444', label: 'Red' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#10b981', label: 'Green' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#6366f1', label: 'Indigo' },
  { value: '#14b8a6', label: 'Teal' },
]

export function CategoriesPage() {
  const { categories, addCategory } = useFinance()
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    type: 'expense' as CategoryType,
    color: '#ef4444',
    icon: 'home',
  })

  const incomeCategories = categories.filter((c) => c.type === 'income')
  const expenseCategories = categories.filter((c) => c.type === 'expense')

  const resetForm = () => {
    setForm({ name: '', type: 'expense', color: '#ef4444', icon: 'home' })
    setFormError(null)
  }

  const openForm = () => {
    resetForm()
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!form.name.trim()) {
      setFormError('Category name is required')
      return
    }
    setSubmitting(true)
    try {
      await addCategory({
        name: form.name.trim(),
        type: form.type,
        color: form.color,
        icon: form.icon,
      })
      setShowForm(false)
      resetForm()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create category')
    } finally {
      setSubmitting(false)
    }
  }

  const CategoryGrid = ({ items, title }: { items: typeof categories; title: string }) => (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">No {title.toLowerCase()} categories yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((cat) => {
            const Icon = iconMap[cat.icon] ?? Briefcase
            return (
              <Card key={cat.id}>
                <CardBody className="flex items-center gap-3 py-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{cat.name}</p>
                    <p className="text-xs capitalize text-slate-500">{cat.type}</p>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <PageContainer>
      <PageHeader>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Categories</h1>
          <p className="mt-1 text-slate-500">
            Label your spending — rent, groceries, bills, subscriptions, etc.
          </p>
        </div>
        <Button onClick={openForm} className="w-full sm:w-auto">
          + Add Category
        </Button>
      </PageHeader>

      <div className="space-y-8">
        <CategoryGrid items={expenseCategories} title="Expenses" />
        <CategoryGrid items={incomeCategories} title="Income" />
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>Create a label for your income or expenses.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <DialogBody className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Name</Label>
                <Input
                  id="cat-name"
                  placeholder="e.g. Rent, Groceries, Phone Bill, Subscriptions"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(type) => setForm({ ...form, type: type as CategoryType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={form.icon} onValueChange={(icon) => setForm({ ...form, icon })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
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
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
