import mongoose from 'mongoose'

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  amount: { type: Number, required: true, min: 0 },
  period: { type: String, enum: ['weekly', 'monthly', 'yearly'], default: 'monthly' },
  startDate: { type: String, required: true },
})

budgetSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString()
    ret.categoryId = ret.categoryId?.toString()
    delete ret._id
    delete ret.__v
    return ret
  },
})

export const Budget = mongoose.model('Budget', budgetSchema)
