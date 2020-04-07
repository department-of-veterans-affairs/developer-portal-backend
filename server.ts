import * as http from 'http'
import configureApp from './app'
import fs from 'fs'

try {
  const extraCerts = process.env.NODE_EXTRA_CA_CERTS || ''
  console.log(`extra ca certs: ${extraCerts}`)

  if(extraCerts !== '') {
    const exists = fs.existsSync(extraCerts)
    if (exists) {
      console.log(`extra certs exist at path: ${extraCerts}`)
    } else {
      console.log(`extra certs do not exist at path ${extraCerts}`)
    }
  } 
} catch (err) {
  console.log(`error checking certs: ${err}`)
}

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
