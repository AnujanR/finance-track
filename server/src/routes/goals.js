import { Router } from 'express'
import { Goal } from '../models/Goal.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

router.get('/', async (req, res) => {
  const goals = await Goal.find({ userId: req.user.id }).sort({ createdAt: -1 })
  res.json(goals)
})

router.post('/', async (req, res) => {
  const goal = await Goal.create({ ...req.body, userId: req.user.id })
  res.status(201).json(goal)
})

router.put('/:id', async (req, res) => {
  const goal = await Goal.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    req.body,
    { new: true, runValidators: true },
  )
  if (!goal) return res.status(404).json({ error: 'Goal not found' })
  res.json(goal)
})

router.delete('/:id', async (req, res) => {
  const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
  if (!goal) return res.status(404).json({ error: 'Goal not found' })
  res.json({ message: 'Goal deleted' })
})

export default router
