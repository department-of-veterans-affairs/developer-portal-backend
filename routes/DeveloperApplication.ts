import express from 'express'

export default function developerApplicationHandler(req: express.Request, res: express.Response): express.Response {
  return res.send('success')
}
