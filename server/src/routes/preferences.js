import { Router } from 'express'
import { User } from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'
import { DATE_FILTER_PRESETS, mergePreferences } from '../constants/preferences.js'

const router = Router()

router.use(requireAuth)

function isValidDateFilter(value) {
  if (!value || typeof value !== 'object') return false
  if (value.preset !== undefined && !DATE_FILTER_PRESETS.includes(value.preset)) return false
  if (value.customFrom !== undefined && typeof value.customFrom !== 'string') return false
  if (value.customTo !== undefined && typeof value.customTo !== 'string') return false
  return true
}

router.get('/', async (req, res) => {
  const user = await User.findById(req.user.id).select('preferences')
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(mergePreferences(user.preferences))
})

router.patch('/', async (req, res) => {
  const user = await User.findById(req.user.id)
  if (!user) return res.status(404).json({ error: 'User not found' })

  const { expensesDateFilter, incomeDateFilter, transactionsDateFilter } = req.body ?? {}

  if (expensesDateFilter !== undefined && !isValidDateFilter(expensesDateFilter)) {
    return res.status(400).json({ error: 'Invalid expenses date filter' })
  }
  if (incomeDateFilter !== undefined && !isValidDateFilter(incomeDateFilter)) {
    return res.status(400).json({ error: 'Invalid income date filter' })
  }
  if (transactionsDateFilter !== undefined && !isValidDateFilter(transactionsDateFilter)) {
    return res.status(400).json({ error: 'Invalid transactions date filter' })
  }

  const current = mergePreferences(user.preferences)
  user.preferences = {
    expensesDateFilter: expensesDateFilter
      ? { ...current.expensesDateFilter, ...expensesDateFilter }
      : current.expensesDateFilter,
    incomeDateFilter: incomeDateFilter
      ? { ...current.incomeDateFilter, ...incomeDateFilter }
      : current.incomeDateFilter,
    transactionsDateFilter: transactionsDateFilter
      ? { ...current.transactionsDateFilter, ...transactionsDateFilter }
      : current.transactionsDateFilter,
  }
  user.markModified('preferences')
  await user.save()
  res.json(mergePreferences(user.preferences))
})

export default router
