const { Requester, Validator } = require('@chainlink/external-adapter')
require('dotenv').config()

// Define custom error scenarios for the API.
// Return true for the adapter to retry.
const customError = (data) => {
  return data.Response === 'Error'
}

// Define custom parameters to be used by the adapter.
// Extra parameters can be stated in the extra object,
// with a Boolean value indicating whether or not they
// should be required.
const customParams = {
  id: ['id'],
  hash: ['hash']
}

const createRequest = (input, callback) => {
  // The Validator helps you validate the Chainlink request data
  const validator = new Validator(callback, input, customParams)
  const jobRunID = validator.validated.id
  const url = 'https://youtube.googleapis.com/youtube/v3/videos'
  const part = 'snippet'
  const hash = validator.validated.data.hash
  const id = validator.validated.data.id
  const key = process.env.API_KEY

  const params = {
    part,
    id,
    key
  }

  // This is where you would add method and headers
  // you can add method like GET or POST and add it to the config
  // The default is GET requests
  // method = 'get'
  // headers = 'headers.....'
  const config = {
    url,
    params
  }

  // The Requester allows API calls be retry in case of timeout
  // or connection failure
  Requester.request(config, customError)
    .then(response => {
      let validVideoDescription = false
      if (response.data.items && response.data.items.length > 0) {
        const description = Requester.getResult(response.data, ['items', '0', 'snippet', 'description'])
        validVideoDescription = description.indexOf(hash) >= 0
        // It's common practice to store the desired value at the top-level
        // result key. This allows different adapters to be compatible with
        // one another.
        response.result = validVideoDescription
        callback(response.status, Requester.success(jobRunID,
          { jobRunID: jobRunID, data: { result: validVideoDescription } }))
      } else {
        callback(500, Requester.errored(jobRunID, 'Video ' + id + ' not found'))
      }
    })
    .catch(error => {
      console.log(error)
      callback(500, Requester.errored(jobRunID, error))
    })
}

// This is a wrapper to allow the function to work with
// GCP Functions
exports.gcpservice = (req, res) => {
  createRequest(req.body, (statusCode, data) => {
    res.status(statusCode).send(data)
  })
}

// This is a wrapper to allow the function to work with
// AWS Lambda
exports.handler = (event, context, callback) => {
  createRequest(event, (statusCode, data) => {
    callback(null, data)
  })
}

// This is a wrapper to allow the function to work with
// newer AWS Lambda implementations
exports.handlerv2 = (event, context, callback) => {
  createRequest(JSON.parse(event.body), (statusCode, data) => {
    callback(null, {
      statusCode: statusCode,
      body: JSON.stringify(data),
      isBase64Encoded: false
    })
  })
}

// This allows the function to be exported for testing
// or for running in express
module.exports.createRequest = createRequest
