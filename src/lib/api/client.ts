import axios from 'axios'

const BASE_URL = process.env.TWENTYI_BASE_URL || 'https://api.20i.com'
const API_KEY = process.env.TWENTYI_API_KEY || ''

// 20i uses Bearer auth with base64 encoded general API key
const encoded = Buffer.from(API_KEY).toString('base64')

export const twentyI = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${encoded}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
})

twentyI.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || error.message
    if (status === 401) throw new Error('Invalid 20i API key')
    if (status === 403) throw new Error('Permission denied')
    if (status === 404) throw new Error('Resource not found')
    if (status === 429) throw new Error('Rate limit exceeded — try again shortly')
    throw new Error(message || 'An unexpected API error occurred')
  }
)

export default twentyI
