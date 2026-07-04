import { Router } from 'express'
import { Account } from '../models/Account.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

router.get('/', async (req, res) => {
  const accounts = await Account.find({ userId: req.user.id }).sort({ createdAt: -1 })
  res.json(accounts)
})

router.get('/:id', async (req, res) => {
  const account = await Account.findOne({ _id: req.params.id, userId: req.user.id })
  if (!account) return res.status(404).json({ error: 'Account not found' })
  res.json(account)
})

router.post('/', async (req, res) => {
  const account = await Account.create({ ...req.body, userId: req.user.id })
  res.status(201).json(account)
})

router.put('/:id', async (req, res) => {
  const account = await Account.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    req.body,
    { new: true, runValidators: true },
  )
  if (!account) return res.status(404).json({ error: 'Account not found' })
  res.json(account)
})

router.delete('/:id', async (req, res) => {
  const account = await Account.findOneAndDelete({ _id: req.params.id, userId: req.user.id })
  if (!account) return res.status(404).json({ error: 'Account not found' })
  res.json({ message: 'Account deleted' })
})

export default router
