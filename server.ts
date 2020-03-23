import * as http from 'http'
import configureApp from './app'

const app = configureApp()
const server: http.Server = new http.Server(app)
const PORT = process.env.PORT || 9999

server.listen(PORT)

server.on('error', (e: Error) => {
  console.log('Error starting server' + e)
})

server.on('listening', () => {
  console.log(
    `Server started on port ${PORT}`,
  )
})
