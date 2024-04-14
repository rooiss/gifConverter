;(function () {
  // global variables
  // holds the file
  let droppedFile
  let currentStep = 1
  const OUTPUT_TYPES = new Set()
  OUTPUT_TYPES.add('gif')
  const COMPLETED_ICON = `
      <svg
        fill="#000000"
        width="18"
        height="18"
        viewBox="0 0 96 96"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title />
        <g>
          <path d="M58.3945,32.1563,42.9961,50.625l-5.3906-6.4629a5.995,5.995,0,1,0-9.211,7.6758l9.9961,12a5.9914,5.9914,0,0,0,9.211.0059l20.0039-24a5.9988,5.9988,0,1,0-9.211-7.6875Z" fill="#5cb85c"/>
          <path d="M48,0A48,48,0,1,0,96,48,48.0512,48.0512,0,0,0,48,0Zm0,84A36,36,0,1,1,84,48,36.0393,36.0393,0,0,1,48,84Z" fill="#5cb85c"/>
        </g>
      </svg>`

  const STEPS = {
    '1': {
      init: (template) => {
        // render the html
        const data = {}
        const newMarkup = interpolate(template, data)
        document.getElementById('action-area').innerHTML = newMarkup
        // add event listeners to elements in the template
        const dropZone = document.getElementById('drop-zone')
        dropZone.addEventListener('drop', onDrop)
        dropZone.addEventListener('dragover', (e) => e.preventDefault())

        // assigning the button to the hidden input
        document
          .getElementById('video-upload-button')
          .addEventListener('click', onUploadClick)
      },
      templateId: 'step-1-template',
    },
    '1b': {
      init: (template) => {
        // add event listeners to elements in the template
        const { name: fileName, size: fileSize, type: fileType } = droppedFile
        const data = {
          type: fileType,
          name: fileName,
          size: bytesToMegabytes(fileSize),
        }
        const newMarkup = interpolate(template, data)
        document.getElementById('action-area').innerHTML = newMarkup

        document
          .getElementById('clear-video-button')
          .addEventListener('click', clearQueuedVideo)
        createThumbnail()
        document
          .getElementById('next-step-button')
          .addEventListener('click', nextStep)
      },
      templateId: 'step-1b-template',
    },
    '2': {
      init: (template) => {
        // add event listeners to elements in the template
        const data = { completeIcon: COMPLETED_ICON }
        const newMarkup = interpolate(template, data)
        document.getElementById('action-area').innerHTML = newMarkup

        // validations
        document
          .getElementById('outputWidth')
          .addEventListener('input', widthHandler)
        document
          .getElementById('outputTypeSelect')
          .addEventListener('change', typeHandler)
        document.getElementById('fps').addEventListener('change', fpsHandler)

        document
          .getElementById('upload-button')
          .addEventListener('click', renderUploadStep)
      },
      templateId: 'step-2-template',
    },
    '3': {
      init: (template, data) => {
        data.completeIcon = COMPLETED_ICON
        const newMarkup = interpolate(template, data)
        document.getElementById('action-area').innerHTML = newMarkup
        handleUpload(data)
      },
      templateId: 'step-3-template',
    },
    '4': {
      init: (template, data) => {
        data.completeIcon = COMPLETED_ICON
        const newMarkup = interpolate(template, data)
        document.getElementById('action-area').innerHTML = newMarkup
        document
          .getElementById('start-over-btn')
          .addEventListener('click', startOverHandler)
      },
      templateId: 'step-4-template',
    },
  }
  // interpolate variables into the template
  const interpolate = (template, data) => {
    return template.replace(/\{\{(\w+)\}\}/g, function (match, key) {
      return data[key] || ''
    })
  }
  const renderStep = (stepNumber, data) => {
    const { init, templateId } = STEPS[stepNumber]
    const template = document.getElementById(templateId).innerHTML
    currentStep = stepNumber
    init(template, data)
  }
  // handles the upload or dropping of the video
  const onDrop = (dropEvent) => {
    dropEvent.preventDefault()
    let video
    if (dropEvent.dataTransfer) {
      video = dropEvent.dataTransfer.files[0]
    } else {
      video = dropEvent.target.files[0]
    }
    const { error, isValid } = checkDropVideoSize(video)
    if (isValid) {
      // dataTransfer is for drag and drop
      if (dropEvent.dataTransfer) droppedFile = dropEvent.dataTransfer.files[0]
      // target files is for the selection
      else droppedFile = dropEvent.target.files[0]
      renderStep('1b')
    } else {
      alert(`${error}`)
      dropEvent.target.value = ''
      droppedFile = null
    }
  }
  const checkDropVideoSize = (videoObj) => {
    let error
    let isValid
    if (isValidVideoSize(videoObj)) {
      isValid = true
      error = ''
    } else {
      isValid = false
      error = `Video size exceeds the limit (10 MB). Choose a smaller file.`
    }
    return { error, isValid }
  }
  const isValidVideoSize = (video) => {
    const maxSize = 5 * 1024 * 1024 * 2
    const videoSize = video.size
    return videoSize <= maxSize
  }

  const createThumbnail = () => {
    if (!droppedFile) return
    const thumbnail = document.getElementById('thumbnail')
    const video = document.createElement('video')
    const reader = new FileReader()

    reader.onload = function (event) {
      video.src = URL.createObjectURL(droppedFile)
      video.addEventListener('loadedmetadata', function () {
        const canvas = document.createElement('canvas')
        const aspectRatio = video.videoWidth / video.videoHeight
        let canvasWidth = video.videoWidth
        let canvasHeight = video.videoHeight

        // greater than 1 is a horizontal video
        // less than 1 is a vertical video
        if (aspectRatio > 1) {
          canvasWidth = thumbnail.clientWidth
          canvasHeight = thumbnail.clientWidth / aspectRatio
        } else {
          canvasWidth = 100
          canvasHeight = canvasWidth / aspectRatio
        }

        canvas.width = canvasWidth
        canvas.height = canvasHeight
        const ctx = canvas.getContext('2d')

        // Choose a specific point in time (e.g., 5 seconds) to capture the frame
        const captureTime = 2 // in seconds
        video.currentTime = captureTime

        video.addEventListener('seeked', function () {
          ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight)
          thumbnail.src = canvas.toDataURL('image/jpeg')
          URL.revokeObjectURL(video.src) // Free up the object URL
        })
      })
    }

    reader.readAsDataURL(droppedFile)
  }

  const clearQueuedVideo = () => {
    droppedFile = null
    renderStep('1')
  }

  const startOverHandler = () => {
    clearQueuedVideo()
    currentStep = 1
  }

  const nextStep = () => {
    renderStep('2')
  }

  const onUploadClick = (e) => {
    const uploadInput = document.getElementById('uploadInput')
    uploadInput.addEventListener('change', onDrop)
    e.preventDefault()
    uploadInput.click()
  }

  const renderUploadStep = () => {
    const vidOutputs = getVidOutputs()
    let { isValid, errorMessages } = validateAllOutputs(vidOutputs)
    return isValid ? renderStep('3', vidOutputs) : showError(errorMessages)
  }

  const getVidOutputs = () => {
    const width = document.getElementById('outputWidth').value
    const fps = document.getElementById('fps').value
    const e = document.getElementById('outputTypeSelect')
    const type = e.options[e.selectedIndex].value
    return { type, fps, width }
  }
  const handleUpload = (vidOutput) => {
    const xhr = new XMLHttpRequest()
    xhr.timeout = 60000
    const log = document.querySelector('output')

    xhr.upload.addEventListener('progress', (event) => {
      log.textContent = `Your video is uploading (${(
        (event.loaded / event.total) *
        100
      ).toFixed(2)}%)…`
    })

    xhr.upload.addEventListener('loadend', (event) => {
      if (event.loaded !== 0) {
        log.textContent = 'Processing conversion...'
      }
    })

    // In case of an error, an abort, or a timeout, we hide the progress bar
    // Note that these events can be listened to on the xhr object too
    const errorAction = (event) =>
      (log.textContent = `Upload failed: ${event.type}`)

    xhr.upload.addEventListener('error', errorAction)
    xhr.upload.addEventListener('abort', errorAction)
    xhr.upload.addEventListener('timeout', errorAction)

    const { fps, width, type } = vidOutput
    // Build the payload
    const fileData = new FormData()
    fileData.append('video', droppedFile)
    fileData.append('outputType', type)
    fileData.append('outputWidth', width)
    fileData.append('outputFps', fps)

    xhr.open('POST', '/uploadVideo', true)

    // Set up onload event listener
    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText)
        const gifUrl = `/download/${response.filename}`
        renderStep('4', { gifUrl })
      } else {
        console.error('Upload failed with status:', xhr.status)
      }
    }
    // Note that the event listener must be set before sending (as it is a preflighted request)
    xhr.send(fileData)
  }

  const validateAllOutputs = (vidOutputs) => {
    const { width, type, fps } = vidOutputs
    const { isValid: isValidWidth, error: errorWidth } = isValidVidWidth(width)
    const { isValid: isValidType, error: errorType } = isValidVidType(type)
    const { isValid: isValidFPS, error: errorFps } = isValidFps(fps)
    const errorMessages = [errorFps, errorType, errorWidth]
      .filter((e) => e !== '')
      .join(', ')
    const isValid = [isValidWidth, isValidType, isValidFPS].every(
      (valid) => valid === true,
    )
    return { isValid, errorMessages }
  }
  const isValidVidWidth = (width) => {
    if (width === '') {
      return { error: `width can't be blank`, isValid: false }
    } else if (width < 10) {
      return { error: `width must be greater than 10px`, isValid: false }
    } else if (width > 480) {
      return { error: `width must be less than 480px`, isValid: false }
    } else {
      return { error: '', isValid: true }
    }
  }
  const widthHandler = (e) => {
    const width = e.target.value
    const { error, isValid } = isValidVidWidth(width)
    isValid ? removeError() : showError(error)
  }

  const showError = (error) => {
    document.getElementById('error').textContent = error
  }
  const removeError = () => {
    document.getElementById('error').textContent = null
  }
  const isValidVidType = (type) => {
    return OUTPUT_TYPES.has(type)
      ? { error: '', isValid: true }
      : { error: 'this type is not supported', isValid: false }
  }
  const typeHandler = (e) => {
    let type = e.target.value
    const { error, isValid } = isValidVidType(type)
    isValid ? removeError() : showError(error)
  }

  const isValidFps = (fps) => {
    if (fps === '') {
      return { error: `fps can't be blank`, isValid: false }
    } else if (fps < 1) {
      return { error: `fps must be greater than 1`, isValid: false }
    } else if (fps > 30) {
      return { error: `fps must be less than 30`, isValid: false }
    } else {
      return { error: '', isValid: true }
    }
  }

  const fpsHandler = (e) => {
    const fps = e.target.value
    const { error, isValid } = isValidFps(fps)
    isValid ? removeError() : showError(error)
  }

  const bytesToMegabytes = (bytes) => {
    let newStr = (bytes / 1000000).toFixed(2).toString()
    return `${newStr} MB`
  }
  window.addEventListener('DOMContentLoaded', () => {
    // init hydrate
    renderStep('1')
  })
})()

{
  /* html for copy to clipboard button
 <button id="copy-to-clipboard-btn" class="secondary-btn">copy to clipboard</button> 
 
 // get the button and assign copyToClipboard curried fn
 document.getElementById('copy-to-clipboard-btn').addEventListener('click', copyToClipboard(gifUrl))
 
   const copyToClipboard = (gifUrl) => {
    return function () {
      fetch(gifUrl)
        .then((response) => response.blob())
        .then((blob) => {
          // Creating a new FileReader to read the blob as Data URL
          const reader = new FileReader()
          reader.onload = function (event) {
            // Writing the Data URL to the clipboard
            navigator.clipboard.writeText(event.target.result).then(
              function () {
                // Alerting the user that the GIF has been copied
                alert('GIF copied to clipboard!')
              },
              function (error) {
                console.error('Unable to write to clipboard. Error:', error)
              },
            )
          }
          reader.readAsDataURL(blob)
        })
        .catch((error) => {
          console.error('Unable to fetch GIF. Error:', error)
        })
    }
  }
 */
}
