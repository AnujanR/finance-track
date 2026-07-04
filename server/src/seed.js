import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from './config/db.js'
import { User } from './models/User.js'
import { Account } from './models/Account.js'
import { Category } from './models/Category.js'
import { Transaction } from './models/Transaction.js'
import { Budget } from './models/Budget.js'
import { Goal } from './models/Goal.js'

const categories = [
  { name: 'Salary', type: 'income', color: '#10b981', icon: 'briefcase' },
  { name: 'Freelance', type: 'income', color: '#06b6d4', icon: 'laptop' },
  { name: 'Groceries', type: 'expense', color: '#f59e0b', icon: 'shopping-cart' },
  { name: 'Rent', type: 'expense', color: '#ef4444', icon: 'home' },
  { name: 'Transport', type: 'expense', color: '#3b82f6', icon: 'car' },
  { name: 'Entertainment', type: 'expense', color: '#ec4899', icon: 'film' },
  { name: 'Utilities', type: 'expense', color: '#6366f1', icon: 'zap' },
  { name: 'Healthcare', type: 'expense', color: '#14b8a6', icon: 'heart' },
]

const accounts = [
  { name: 'Main Checking', type: 'checking', balance: 4250.75, currency: 'USD', color: '#3b82f6' },
  { name: 'Emergency Savings', type: 'savings', balance: 12800.0, currency: 'USD', color: '#10b981' },
  { name: 'Visa Credit', type: 'credit', balance: -1240.5, currency: 'USD', color: '#8b5cf6' },
  { name: 'Cash Wallet', type: 'cash', balance: 180.0, currency: 'USD', color: '#f59e0b' },
]

async function seed() {
  await connectDB()

  await Promise.all([
    User.deleteMany({}),
    Account.deleteMany({}),
    Category.deleteMany({}),
    Transaction.deleteMany({}),
    Budget.deleteMany({}),
    Goal.deleteMany({}),
  ])

  const user = await User.create({
    name: 'Demo User',
    email: 'demo@fintrack.app',
    password: 'demo123',
  })

  const userId = user._id

  const createdCategories = await Category.insertMany(
    categories.map((c) => ({ ...c, userId })),
  )
  const cat = (name) => createdCategories.find((c) => c.name === name)._id

  const createdAccounts = await Account.insertMany(
    accounts.map((a) => ({ ...a, userId })),
  )
  const acc = (name) => createdAccounts.find((a) => a.name === name)._id

  await Transaction.insertMany([
    { userId, accountId: acc('Main Checking'), categoryId: cat('Salary'), amount: 5200, type: 'income', description: 'Monthly salary', date: '2026-07-01' },
    { userId, accountId: acc('Main Checking'), categoryId: cat('Rent'), amount: 1500, type: 'expense', description: 'July rent', date: '2026-07-01' },
    { userId, accountId: acc('Main Checking'), categoryId: cat('Groceries'), amount: 127.43, type: 'expense', description: 'Whole Foods', date: '2026-07-02' },
    { userId, accountId: acc('Visa Credit'), categoryId: cat('Entertainment'), amount: 45.99, type: 'expense', description: 'Netflix + Spotify', date: '2026-07-02' },
    { userId, accountId: acc('Main Checking'), categoryId: cat('Transport'), amount: 62.0, type: 'expense', description: 'Gas station', date: '2026-06-30' },
    { userId, accountId: acc('Main Checking'), toAccountId: acc('Emergency Savings'), amount: 500, type: 'transfer', description: 'Monthly savings transfer', date: '2026-07-01' },
    { userId, accountId: acc('Main Checking'), categoryId: cat('Utilities'), amount: 89.5, type: 'expense', description: 'Electric bill', date: '2026-06-28' },
    { userId, accountId: acc('Emergency Savings'), categoryId: cat('Freelance'), amount: 850, type: 'income', description: 'Freelance project', date: '2026-06-25' },
  ])

  await Budget.insertMany([
    { userId, categoryId: cat('Groceries'), amount: 500, period: 'monthly', startDate: '2026-07-01' },
    { userId, categoryId: cat('Transport'), amount: 200, period: 'monthly', startDate: '2026-07-01' },
    { userId, categoryId: cat('Entertainment'), amount: 150, period: 'monthly', startDate: '2026-07-01' },
    { userId, categoryId: cat('Utilities'), amount: 250, period: 'monthly', startDate: '2026-07-01' },
  ])

  await Goal.insertMany([
    { userId, name: 'Vacation Fund', targetAmount: 3000, currentAmount: 1850, deadline: '2026-12-01', accountId: acc('Emergency Savings'), color: '#06b6d4' },
    { userId, name: 'New Laptop', targetAmount: 2000, currentAmount: 750, deadline: '2026-09-15', color: '#8b5cf6' },
    { userId, name: 'Emergency Fund', targetAmount: 15000, currentAmount: 12800, accountId: acc('Emergency Savings'), color: '#10b981' },
  ])

  console.log('Database seeded successfully')
  console.log('Demo login: demo@fintrack.app / demo123')
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
