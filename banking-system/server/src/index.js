import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import cors from 'cors'

import corsOptions from './middleware/cors.js'
import { notFound, errorHandler } from './middleware/error.js'
import routes from './routes/index.js'
import { authHeader } from './middleware/auth.js'

const app = express()

app.use(helmet())
app.use(cors(corsOptions))
app.use(express.json({ limit: '1mb' }))
app.use(morgan('dev'))

// Basic header-based auth stub; adds req.auth.userId when x-user-id is present
app.use(authHeader())

app.use('/api', routes)

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`PayWave API listening on http://localhost:${PORT}`)
})
