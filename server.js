const express = require('express')
const path = require('path')
const ffmpeg = require('fluent-ffmpeg')
const multer = require('multer')
const bodyParser = require('body-parser')

const app = express()
const upload = multer({ dest: 'uploads/' })

const port = 3000

app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'))
})

app.post('/uploadVideo', upload.single('video'), function (req, res) {
  // condense validations and just return a object with status
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

  const inputFilePath = req.file.path
  const outputFilePath = path.join(__dirname, `output.${outputType}`)

  ffmpeg(inputFilePath)
    .output(outputFilePath)
    .outputOptions('-vf', `fps=10,scale=${outputWidth}:-1:flags=lanczos`)
    .on('end', () => {
      res.json({ outputFilePath })
    })
    .on('error', (err) => {
      console.error('Error during conversion:', err)
      res.status(500).send('Error during conversion.')
    })
    .run()

  // res.send()
})

app.use(express.static('public'))

// app.use()

app.listen(port, function () {
  console.log(`listening on port ${port}!`)
})
