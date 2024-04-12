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

const rateLimit = (req, res, next) => {
  const ip = req.ip
  const maxRequests = 20
  const requestCount = ipRequests.get(ip) ? ipRequests.get(ip).count : 0
  const currentDate = new Date()
  const newExpiryDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)

  if (requestCount >= maxRequests) {
    return res
      .status(429)
      .send({ status: 'You can only upload 20 files in a 24 hour period' })
  }

  ipRequests.set(ip, { expiryDate: newExpiryDate, count: requestCount + 1 })

  if (currentDate.getTime() > ipRequests.get(ip).expiryDate.getTime()) {
    ipRequests.delete(ip)
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
  if (!req.file) {
    return res.status(400).send('No file uploaded.')
  }
  console.log('video', req.file)
  console.log('ipRequestsMap', [...ipRequests.entries()])
  const maxSize = 5 * 1024 * 1024 * 2
  if (req.file.size > maxSize) {
    return res.status(400).send('File size exceeds 10MB')
  }

  const { outputWidth, outputType, outputFps } = req.body
  const maxWidth = 480
  if (outputType > maxWidth)
    return res.status(400).send(`output width exceeds max width of ${maxWidth}`)

  if (outputWidth === '') {
    return res.status(400).send('width field must be filled out')
  }
  if (outputType === '') {
    return res.status(400).send('type field must be filled out')
  }
  if (outputFps === '') {
    return res.status(400).send('fps field must be filled out')
  }

  const filename = `${req.file.filename}.${outputType}`
  const outputFileBasename = `/download/${filename}`
  const inputFilePath = req.file.path
  const outputFilePath = path.join(__dirname, 'public', outputFileBasename)

  const deleteTmpFile = (inputFilePath) => {
    fs.unlink(inputFilePath, (err) => {
      if (err) throw err
      console.log(`${inputFilePath} was deleted`)
    })
  }

  ffmpeg(inputFilePath)
    .output(outputFilePath)
    .outputOptions(
      '-vf',
      `fps=${outputFps},scale=${outputWidth}:-1:flags=lanczos`,
    )
    .on('end', () => {
      res.json({ filename })
      deleteTmpFile(inputFilePath)
    })
    .on('error', (err) => {
      deleteTmpFile(inputFilePath)
      console.error('Error during conversion:', err)
      res.status(500).send('Error during conversion.')
    })
    .run()
})

app.get('/download/:filename', (req, res) => {
  const { filename } = req.params
  const filePath = path.resolve(__dirname, 'public', 'download', filename)
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' })
  }
  res.setHeader('Content-Disposition', 'attachment; filename=' + filename)
  res.setHeader('Content-Type', 'image/gif')
  fs.createReadStream(filePath).pipe(res)
})

app.use(express.static('public'))

app.listen(port, function () {
  console.log(`-------- listening on port ${port}`)
})
