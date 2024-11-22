const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
console.log(`Running in ${dev ? 'development' : 'production'} mode`)

const app = next({ dev })
const handle = app.getRequestHandler()

const PORT = process.env.PORT || 8080

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    console.log(`${new Date().toISOString()} - ${req.method} ${parsedUrl.pathname}`)
    
    handle(req, res, parsedUrl)
  }).listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`)
    console.log(`> Node environment: ${process.env.NODE_ENV}`)
  })
}).catch(err => {
  console.error('Error starting server:', err)
  process.exit(1)
}) 