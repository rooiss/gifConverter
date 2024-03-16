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
  if (!req.file) {
    return res.status(400).send('No file uploaded.')
  }

  const { outputWidth, outputType } = req.body

  const inputFilePath = req.file.path
  const outputFilePath = path.join(__dirname, `output.${outputType}`)

  ffmpeg(inputFilePath)
    .output(outputFilePath)
    .outputOptions('-vf', `fps=10,scale=${outputWidth}:-1:flags=lanczos`)
    .on('end', () => {
      console.log('Conversion complete')
      res.download(outputFilePath) // Download the converted GIF file
    })
    .on('error', (err) => {
      console.error('Error during conversion:', err)
      res.status(500).send('Error during conversion.')
    })
    .run()
})

app.use(express.static('public'))

app.listen(port, function () {
  console.log(`listening on port ${port}!`)
})
