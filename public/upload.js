addEventListener('DOMContentLoaded', () => {
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
    fileData.append('video', fileInput.files[0])
    fileData.append('outputType', outputType)
    fileData.append('outputWidth', outputWidth)

    // Theoretically, event listeners could be set after the open() call
    // but browsers are buggy here
    xhr.open('POST', '/uploadVideo', true)

    // Note that the event listener must be set before sending (as it is a preflighted request)
    xhr.send(fileData)
  })
})

function checkFileSize(input) {
  var maxSize = 5 * 1024 * 1024 // 5 MB

  if (input.files && input.files[0]) {
    var fileSize = input.files[0].size // Size in bytes

    if (fileSize > maxSize) {
      alert('File size exceeds the limit (5 MB). Please choose a smaller file.')
      input.value = '' // Reset file input to clear the selected file
    } else {
      const vidInputs = document.getElementById('vidInputs')
      const dropzone = document.getElementById('drop_zone')
      vidInputs.classList.add('visible')
      dropzone.classList.add('disable')
    }
  }
}

function dropHandler(e) {
  e.preventDefault()

  if (e.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    ;[...e.dataTransfer.items].forEach((item, i) => {
      // If dropped items aren't files, reject them
      if (item.kind === 'file') {
        const file = item.getAsFile()
        console.log(`… file[${i}].name = ${file.name}`)
      }
    })
  } else {
    // Use DataTransfer interface to access the file(s)
    ;[...e.dataTransfer.files].forEach((file, i) => {
      console.log(`… file[${i}].name = ${file.name}`)
    })
  }
}

function dragOverHandler(e) {
  // Prevent default behavior (Prevent file from being opened)
  e.preventDefault()
}

function uploadButtonClick(e) {
  e.preventDefault()
  const fileInput = document.getElementById('uploadInput')
  fileInput.click()
}

const checkVideoWidth = (input) => {
  const modalBtn = document.getElementById('modalBtn')
  if (input.value !== '' && input.value >= 10 && input.value <= 320) {
    modalBtn.disabled = false
  }
}

const triggerModal = (e) => {
  e.preventDefault()
  const modal = document.getElementById('modalContainer')
  modal.style.display = 'block'

  // add this back in
  const submitInput = document.getElementById('submitInput')
  submitInput.click()
}

window.onclick = (event) => {
  const modal = document.getElementById('modalContainer')
  if (event.target == modal) {
    modal.style.display = 'none'
  }
}
