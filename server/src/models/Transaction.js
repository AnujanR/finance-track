import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  toAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  amount: { type: Number, required: true, min: 0 },
  type: { type: String, enum: ['income', 'expense', 'transfer', 'topup'], required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  notes: { type: String },
})

transactionSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString()
    ret.accountId = ret.accountId?.toString()
    ret.categoryId = ret.categoryId?.toString()
    ret.toAccountId = ret.toAccountId?.toString()
    delete ret._id
    delete ret.__v
    return ret
  },
})

export const Transaction = mongoose.model('Transaction', transactionSchema)
