const express = require('express')
const path = require('path')
const ffmpeg = require('fluent-ffmpeg')
const multer = require('multer')
const bodyParser = require('body-parser')
const fs = require('fs')

const app = express()
const upload = multer({ dest: 'public/tmp' })

const port = 3000

const ipRequests = new Map()
const ipAddressesToReset = new Set()

const rateLimit = (req, res, next) => {
  const ip = req.ip
  const maxRequests = 20
  const requestCount = ipRequests.get(ip) || 0

  if (requestCount >= maxRequests) {
    return res
      .status(429)
      .send({ status: 'You can only upload 20 files in a 24 hour period' })
  }
  ipRequests.set(ip, requestCount + 1)
  if (!ipAddressesToReset.has(ip)) {
    ipAddressesToReset.add(ip)
    setTimeout(() => {
      ipRequests.delete(ip)
      ipAddressesToReset.delete(ip)
    }, 24 * 60 * 60 * 1000) // 24 hours in milliseconds
  }

  next()
}

app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'))
})

app.post('/uploadVideo', upload.single('video'), rateLimit, function (
  req,
  res,
) {
  console.log('req file', req.file)
  if (!req.file) {
    return res.status(400).send('No file uploaded.')
  }

  const maxSize = 5 * 1024 * 1024
  if (req.file.size > maxSize) {
    return res.status(400).send('File size exceeds 5MB')
  }

  const { outputWidth, outputType } = req.body
  const maxWidth = 320
  if (outputType > 320)
    return res.status(400).send(`output width exceeds max width of ${maxWidth}`)

  if (outputWidth === '' || outputType === '') {
    return res.status(400).send('output width or type field must be filled out')
  }

  const fileName = req.file.filename
  const outputFileBasename = `/uploads/${req.file.filename}.${outputType}`
  const inputFilePath = req.file.path
  const outputFilePath = path.join(__dirname, 'public', outputFileBasename)
  // const link = `${req.protocol}://${req.get('host')}`

  ffmpeg(inputFilePath)
    .output(outputFilePath)
    .outputOptions('-vf', `fps=10,scale=${outputWidth}:-1:flags=lanczos`)
    .on('end', () => {
      res.json({ fileName })
      fs.unlink(inputFilePath, (err) => {
        if (err) throw err
        console.log(`${inputFilePath} was deleted`)
      })
    })
    .on('error', (err) => {
      console.error('Error during conversion:', err)
      res.status(500).send('Error during conversion.')
    })
    .run()
})

app.get('/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename)
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=' + req.params.filename,
  )
  res.download(filePath)
})

app.use(express.static('public'))

app.listen(port, function () {
  console.log(`-------- listening on port ${port}`)
})
