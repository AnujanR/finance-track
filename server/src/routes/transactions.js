import { Router } from 'express'
import { Transaction } from '../models/Transaction.js'
import { Account } from '../models/Account.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

async function applyBalanceChange(userId, txn, reverse = false) {
  const multiplier = reverse ? -1 : 1
  const { type, amount, accountId, toAccountId } = txn

  if (type === 'income' || type === 'topup') {
    await Account.findOneAndUpdate(
      { _id: accountId, userId },
      { $inc: { balance: amount * multiplier } },
    )
  } else if (type === 'expense') {
    await Account.findOneAndUpdate(
      { _id: accountId, userId },
      { $inc: { balance: -amount * multiplier } },
    )
  } else if (type === 'transfer' && toAccountId) {
    await Account.findOneAndUpdate(
      { _id: accountId, userId },
      { $inc: { balance: -amount * multiplier } },
    )
    await Account.findOneAndUpdate(
      { _id: toAccountId, userId },
      { $inc: { balance: amount * multiplier } },
    )
  }
}

async function assertAccount(userId, accountId) {
  const account = await Account.findOne({ _id: accountId, userId })
  if (!account) throw new Error('Invalid account')
  return account
}

router.get('/', async (req, res) => {
  const transactions = await Transaction.find({ userId: req.user.id }).sort({
    date: -1,
    createdAt: -1,
  })
  res.json(transactions)
})

router.post('/', async (req, res) => {
  try {
    await assertAccount(req.user.id, req.body.accountId)
    if (req.body.toAccountId) {
      await assertAccount(req.user.id, req.body.toAccountId)
    }

    const transaction = await Transaction.create({ ...req.body, userId: req.user.id })
    await applyBalanceChange(req.user.id, transaction)
    res.status(201).json(transaction)
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to create transaction' })
  }
})

async function topUpDescription(userId, accountId, existingDescription) {
  const account = await Account.findOne({ _id: accountId, userId })
  const name = account?.name ?? 'pot'
  if (existingDescription?.startsWith('Opening balance')) {
    return `Opening balance — ${name}`
  }
  return `Top up — ${name}`
}

router.put('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user.id })
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' })
    if (!['income', 'expense', 'topup'].includes(transaction.type)) {
      return res.status(400).json({ error: 'This transaction type cannot be edited' })
    }

    const { description, amount, date, accountId, categoryId, notes } = req.body
    if (transaction.type !== 'topup' && description !== undefined && !String(description).trim()) {
      return res.status(400).json({ error: 'Description is required' })
    }
    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      return res.status(400).json({ error: 'Enter a valid amount' })
    }
    if (accountId !== undefined) {
      await assertAccount(req.user.id, accountId)
    }

    await applyBalanceChange(req.user.id, transaction, true)

    if (transaction.type === 'topup') {
      if (amount !== undefined) transaction.amount = amount
      if (date !== undefined) transaction.date = date
      if (notes !== undefined) transaction.notes = notes?.trim() || undefined
      if (accountId !== undefined) {
        transaction.accountId = accountId
        transaction.description = await topUpDescription(
          req.user.id,
          accountId,
          transaction.description,
        )
      }
    } else {
      if (description !== undefined) transaction.description = String(description).trim()
      if (amount !== undefined) transaction.amount = amount
      if (date !== undefined) transaction.date = date
      if (accountId !== undefined) transaction.accountId = accountId
      if (categoryId !== undefined) transaction.categoryId = categoryId
      if (notes !== undefined) transaction.notes = notes?.trim() || undefined
    }

    await transaction.save()
    await applyBalanceChange(req.user.id, transaction)
    res.json(transaction)
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to update transaction' })
  }
})

router.delete('/:id', async (req, res) => {
  const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user.id })
  if (!transaction) return res.status(404).json({ error: 'Transaction not found' })
  await applyBalanceChange(req.user.id, transaction, true)
  await transaction.deleteOne()
  res.json({ message: 'Transaction deleted' })
})

export default router
