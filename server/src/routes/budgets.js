import { Router } from 'express'
import { Budget } from '../models/Budget.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

router.get('/', async (req, res) => {
  const budgets = await Budget.find({ userId: req.user.id }).sort({ startDate: -1 })
  res.json(budgets)
})

router.post('/', async (req, res) => {
  const budget = await Budget.create({ ...req.body, userId: req.user.id })
  res.status(201).json(budget)
})

router.put('/:id', async (req, res) => {
  const budget = await Budget.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    req.body,
    { new: true, runValidators: true },
  )
  if (!budget) return res.status(404).json({ error: 'Budget not found' })
  res.json(budget)
})

router.delete('/:id', async (req, res) => {
  const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
  if (!budget) return res.status(404).json({ error: 'Budget not found' })
  res.json({ message: 'Budget deleted' })
})

export default router
