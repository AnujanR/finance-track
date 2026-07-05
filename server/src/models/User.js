import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { DATE_FILTER_PRESETS, defaultPreferences } from '../constants/preferences.js'

const dateFilterSchema = new mongoose.Schema(
  {
    preset: { type: String, enum: DATE_FILTER_PRESETS, default: 'today' },
    customFrom: { type: String },
    customTo: { type: String },
  },
  { _id: false },
)

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    preferences: {
      expensesDateFilter: { type: dateFilterSchema, default: () => defaultPreferences().expensesDateFilter },
      incomeDateFilter: { type: dateFilterSchema, default: () => defaultPreferences().incomeDateFilter },
      transactionsDateFilter: { type: dateFilterSchema, default: () => defaultPreferences().transactionsDateFilter },
    },
  },
  { timestamps: true },
)

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password)
}

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
    delete ret.password
    return ret
  },
})

export const User = mongoose.model('User', userSchema)
