;(function () {
  // global variable to hold the file
  let droppedFile
  let currentStep = 1
  const OUTPUT_TYPES = new Set('gif')
  const vidOutput = {
    type: 'gif',
  }

  // Create a function to interpolate variables into the template
  const interpolate = (template, data) => {
    return template.replace(/\{\{(\w+)\}\}/g, function (match, key) {
      return data[key] || ''
    })
  }
  function renderStep(stepNumber, data) {
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

        if (aspectRatio > 1) {
          canvasWidth = thumbnail.clientWidth
          canvasHeight = thumbnail.clientWidth / aspectRatio
        } else {
          canvasWidth = thumbnail.clientHeight * aspectRatio
          canvasHeight = thumbnail.clientHeight
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

  const nextStep = () => {
    renderStep('2')
  }

  const onUploadClick = (e) => {
    const uploadInput = document.getElementById('uploadInput')
    uploadInput.addEventListener('change', onDrop)
    e.preventDefault()
    uploadInput.click()
  }

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
        const data = {}
        const newMarkup = interpolate(template, data)
        document.getElementById('action-area').innerHTML = newMarkup

        // validations
        // width
        document
          .getElementById('outputWidth')
          .addEventListener('input', widthHandler)
        // output type
        document
          .getElementById('outputTypeSelect')
          .addEventListener('change', typeHandler)
        // fps
        document.getElementById('fps').addEventListener('change', fpsHandler)

        document
          .getElementById('upload-button')
          .addEventListener('click', renderUploadStep)
      },
      templateId: 'step-2-template',
    },
    '3': {
      init: (template) => {
        const data = {}
        const newMarkup = interpolate(template, data)
        document.getElementById('action-area').innerHTML = newMarkup
        handleUpload(vidOutput)
      },
      templateId: 'step-3-template',
    },
    '4': {
      init: () => {
        // add event listeners to elements in the template
      },
      templateId: 'step-4-template',
    },
  }
  const setVidOutput = (type, val) => {
    vidOutput[type] = val
  }
  const renderUploadStep = () => {
    const errorText = document.getElementById('error').textContent
    if (errorText === '' || errorText === null) renderStep('3')
  }
  const handleUpload = (vidOutput) => {
    const xhr = new XMLHttpRequest()
    xhr.timeout = 60000
    const log = document.querySelector('output')

    xhr.upload.addEventListener('progress', (event) => {
      log.textContent = `Uploading (${(
        (event.loaded / event.total) *
        100
      ).toFixed(2)}%)…`
    })

    xhr.upload.addEventListener('loadend', (event) => {
      if (event.loaded !== 0) {
        log.textContent = 'Upload finished.'
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
    // xhr.onload = () => {
    //   if (xhr.status === 200) {
    //     const response = JSON.parse(xhr.responseText)
    //     const gifUrl = `/download/${response.filename}`

    //     setTimeout(() => {
    //       downloadLink = document.getElementById('download-link')
    //       downloadLink.setAttribute('href', gifUrl)
    //       downloadLink.style.display = 'block'
    //       document.getElementById('pre-download-text').style.display = 'none'
    //     }, 5000)
    //   } else {
    //     console.error('Upload failed with status:', xhr.status)
    //   }
    // }

    // Note that the event listener must be set before sending (as it is a preflighted request)
    xhr.send(fileData)
  }
  const isValidVidWidth = (width) => {
    if (width === '') {
      return { error: `width can't be blank`, isValid: false }
    } else if (width < 10) {
      return { error: `width must be greater than 10px`, isValid: false }
    } else if (width > 480) {
      return { error: `width must be less than 480px`, isValid: false }
    } else {
      setVidOutput('width', width)
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
    OUTPUT_TYPES.has(type)
      ? ({ error: '', isValid: true }, setVidOutput('type', type))
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
      setVidOutput('fps', fps)
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
