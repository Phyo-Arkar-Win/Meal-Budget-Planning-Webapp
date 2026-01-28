import express from 'express'
import cors from 'cors'
import authRoutes from "./routes/auth.routes";

const app = express()

app.use(cors())
app.use(express.json())

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Auth route
app.use('/api/auth', authRoutes)

export default app