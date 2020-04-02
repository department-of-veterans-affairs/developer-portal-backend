/// <reference types="./typings" />
import traceroute from 'nodejs-traceroute'

export default function tracer() {
  const tracer = new traceroute()
  tracer
    .on('pid', (pid) => {
        console.log(`pid: ${pid}`)
    })
    .on('destination', (destination) => {
        console.log(`destination: ${destination}`)
    })
    .on('hop', (hop) => {
        console.log(`hop: ${JSON.stringify(hop)}`)
    })
    .on('close', (code) => {
        console.log(`close: code ${code}`)
    })
  return tracer
}
