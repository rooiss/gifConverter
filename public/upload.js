// Create a new XMLHttpRequest object
// var xhr = new XMLHttpRequest()

// // Define the URL and method for the request
// var url = inputFilePath
// var method = 'POST'

// // Open the request
// xhr.open(method, url, true)

// console.log(xhr)

// Set up event listeners to track progress
// xhr.upload.addEventListener('progress', function (event) {
//   if (event.lengthComputable) {
//     var percentComplete = (event.loaded / event.total) * 100
//     console.log('Upload Progress: ' + percentComplete + '%')
//   }
// })

// // Set up event listener for when the upload is complete
// xhr.upload.addEventListener('load', function (event) {
//   console.log('Upload Complete!')
// })

// // Set up event listener for when there's an error
// xhr.upload.addEventListener('error', function (event) {
//   console.log('Error uploading file!')
// })

// // Send the request
// xhr.send(your_xml_data)

addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('uploadInput')
  const progressBar = document.querySelector('progress')
  const log = document.querySelector('output')

  fileInput.addEventListener('change', () => {
    const xhr = new XMLHttpRequest()
    xhr.timeout = 2000

    xhr.upload.addEventListener('loadstart', (event) => {
      progressBar.classList.add('visible')
      progressBar.value = 0
      progressBar.max = event.total
      log.textContent = 'Uploading (0%)…'
      abortButton.disabled = false
    })

    xhr.upload.addEventListener('progress', (event) => {
      progressBar.value = event.loaded
      log.textContent = `Uploading (${(
        (event.loaded / event.total) *
        100
      ).toFixed(2)}%)…`
    })

    xhr.upload.addEventListener('loadend', (event) => {
      progressBar.classList.remove('visible')
      if (event.loaded !== 0) {
        log.textContent = 'Upload finished.'
      }
      abortButton.disabled = true
    })

    // In case of an error, an abort, or a timeout, we hide the progress bar
    // Note that these events can be listened to on the xhr object too
    function errorAction(event) {
      progressBar.classList.remove('visible')
      log.textContent = `Upload failed: ${event.type}`
    }
    xhr.upload.addEventListener('error', errorAction)
    xhr.upload.addEventListener('abort', errorAction)
    xhr.upload.addEventListener('timeout', errorAction)

    // Build the payload
    const fileData = new FormData()
    fileData.append('file', fileInput.files[0])

    // Theoretically, event listeners could be set after the open() call
    // but browsers are buggy here
    xhr.open('POST', '/uploadVideo', true)

    // Note that the event listener must be set before sending (as it is a preflighted request)
    xhr.send(fileData)
  })
})
