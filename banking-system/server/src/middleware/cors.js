export const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || [/^http:\/\/localhost:(5173|5174)$/],
  credentials: true,
}

export default corsOptions
