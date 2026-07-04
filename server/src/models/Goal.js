import mongoose from 'mongoose'

const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  targetAmount: { type: Number, required: true, min: 0 },
  currentAmount: { type: Number, default: 0, min: 0 },
  deadline: { type: String },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  color: { type: String, default: '#10b981' },
})

goalSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString()
    ret.accountId = ret.accountId?.toString()
    delete ret._id
    delete ret.__v
    return ret
  },
})

export const Goal = mongoose.model('Goal', goalSchema)
