let droppedFile
window.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop_zone')
  dropZone.addEventListener('drop', handleVideo)
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault()
  })

  // assigning the button to the hidden input
  const uploadBtn = document.getElementById('video-upload-button')
  uploadBtn.addEventListener('click', (e) => {
    const fileInput = document.getElementById('uploadInput')
    e.preventDefault()
    fileInput.click()
  })

  // hidden input that holds video file
  const uploadInput = document.getElementById('uploadInput')
  uploadInput.addEventListener('change', handleVideo)

  // check video width
  const width = document.getElementById('outputWidth')
  width.addEventListener('change', (e) => {
    const inputWidth = e.target.value
    if (isValidVidWidth(inputWidth)) {
      modalBtn.disabled = false
    }
  })

  const modalBtn = document.getElementById('modalBtn')
  modalBtn.addEventListener('click', triggerModal)

  const form = document.getElementById('uploadForm')
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const {
      outputType: { value: outputType },
      outputWidth: { value: outputWidth },
    } = form

    const xhr = new XMLHttpRequest()
    xhr.timeout = 60000
    const fileInput = document.getElementById('uploadInput')
    const progressBar = document.querySelector('progress')
    const log = document.querySelector('output')
    xhr.upload.addEventListener('loadstart', (event) => {
      progressBar.classList.add('visible')
      progressBar.value = 0
      progressBar.max = event.total
      log.textContent = 'Uploading (0%)…'
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
    const video = droppedFile
    fileData.append('video', video)
    fileData.append('outputType', outputType)
    fileData.append('outputWidth', outputWidth)

    // Theoretically, event listeners could be set after the open() call
    // but browsers are buggy here
    xhr.open('POST', '/uploadVideo', true)

    // Note that the event listener must be set before sending (as it is a preflighted request)
    xhr.send(fileData)
  })
})

window.onclick = (event) => {
  const modal = document.getElementById('modalContainer')
  if (event.target == modal) {
    modal.style.display = 'none'
  }
}

const handleVideo = (e) => {
  e.preventDefault()
  let video
  if (e.dataTransfer) {
    video = e.dataTransfer.files[0]
  } else {
    video = e.target.files[0]
  }
  const vidInputs = document.getElementById('vidInputs')
  const dropzone = document.getElementById('drop_zone')
  if (isValidVideoSize(video)) {
    vidInputs.classList.add('visible')
    dropzone.classList.add('disable')
    if (e.dataTransfer) droppedFile = e.dataTransfer.files[0]
    else droppedFile = e.target.files[0]
  } else {
    alert('File size exceeds the limit (10 MB). Please choose a smaller file.')
    e.target.value = ''
  }
}

const triggerModal = (e) => {
  e.preventDefault()
  const modal = document.getElementById('modalContainer')
  modal.style.display = 'block'

  const submitInput = document.getElementById('submitInput')
  submitInput.click()
}
// validations
const isValidVidWidth = (width) => {
  return width !== '' && width >= 10 && width <= 320
}
const isValidVideoSize = (video) => {
  const maxSize = 5 * 1024 * 1024 * 2
  const videoSize = video.size
  return videoSize <= maxSize
}

// const init = () => {

// }
