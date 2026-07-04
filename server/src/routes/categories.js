import { Router } from 'express'
import { Category } from '../models/Category.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

router.get('/', async (req, res) => {
  const categories = await Category.find({ userId: req.user.id }).sort({ type: 1, name: 1 })
  res.json(categories)
})

router.post('/', async (req, res) => {
  const category = await Category.create({ ...req.body, userId: req.user.id })
  res.status(201).json(category)
})

router.put('/:id', async (req, res) => {
  const category = await Category.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    req.body,
    { new: true, runValidators: true },
  )
  if (!category) return res.status(404).json({ error: 'Category not found' })
  res.json(category)
})

router.delete('/:id', async (req, res) => {
  const category = await Category.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
  if (!category) return res.status(404).json({ error: 'Category not found' })
  res.json({ message: 'Category deleted' })
})

export default router
