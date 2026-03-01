// src/app.ts
import express from 'express'
import cors from 'cors'
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import foodRoutes from "./routes/food.routes";
import planRoutes from "./routes/plan.routes";
import reviewRoutes from "./routes/review.routes";
import dailyProgressRoutes from "./routes/dailyProgress.routes";
import exerciseRoutes from "./routes/exercise.routes";

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/food', foodRoutes)
app.use('/api/plans', planRoutes);
app.use('/api/progress', dailyProgressRoutes); // 2. ADD THIS ROUTE
app.use('/api/reviews', reviewRoutes)
app.use('/api/exercises', exerciseRoutes);

export default app