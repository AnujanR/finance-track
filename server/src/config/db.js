import mongoose from 'mongoose'

let connected = false

export function isDBConnected() {
  return connected
}

export async function connectDB() {
  const uri = process.env.MONGO_URI
  if (!uri) throw new Error('MONGO_URI is not defined')

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  })
  connected = true
  console.log('MongoDB connected')
}

mongoose.connection.on('disconnected', () => {
  connected = false
  console.error('MongoDB disconnected')
})
