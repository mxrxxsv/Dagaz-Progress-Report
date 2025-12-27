import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { env } from './env.js'
import authRoutes from './routes/auth.js'
import rowsRoutes from './routes/rows.js'
import importRoutes from './routes/import.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: env.FRONTEND_ORIGIN,
    credentials: true,
  }),
)
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api/auth', authRoutes)
app.use('/api/rows', rowsRoutes)
app.use('/api/import', importRoutes)

app.use(errorHandler)

app.listen(env.PORT, () => {
  console.log(`API listening on :${env.PORT}`)
})
