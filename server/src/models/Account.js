import mongoose from 'mongoose'

const accountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['checking', 'savings', 'credit', 'cash', 'investment'],
      required: true,
    },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'GBP' },
    color: { type: String, default: '#3b82f6' },
  },
  { timestamps: true },
)

accountSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString()
    ret.createdAt = ret.createdAt?.toISOString().split('T')[0]
    delete ret._id
    delete ret.__v
    delete ret.updatedAt
    return ret
  },
})

export const Account = mongoose.model('Account', accountSchema)
