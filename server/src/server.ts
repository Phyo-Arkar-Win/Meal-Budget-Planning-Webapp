import dotenv from 'dotenv'
import app from './app'
import connectDB from './config/db'

dotenv.config()

const PORT = process.env.PORT || 5001

connectDB()

app.listen(PORT, () => {
  console.log(`Server up and running on port ${PORT}`)
})