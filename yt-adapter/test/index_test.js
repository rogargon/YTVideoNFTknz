const assert = require('chai').assert
const createRequest = require('../index.js').createRequest

describe('createRequest', () => {
  const jobID = '1'

  context('complete calls', () => {
    const requests = [
      {
        name: 'valid',
        valid: true,
        statusCode: 200,
        testData: { id: jobID, data: { id: 'ZwVNLDIJKVA', hash: 'QmPP8X2rWc2uanbnKpxfzEAAuHPuThQRtxpoY8CYVJxDj8' } }
      },
      {
        name: 'wrong hash',
        valid: false,
        statusCode: 200,
        testData: { id: jobID, data: { id: 'ZwVNLDIJKVA', hash: 'QmPP8X2rWc2uanbnKpxfzEAAuHPuThQRtxpoY8CYVJxDj9' } }
      },
      {
        name: 'non-existing video',
        valid: undefined,
        statusCode: 500,
        testData: { id: jobID, data: { id: 'ZwVNLDIJKVB', hash: 'QmPP8X2rWc2uanbnKpxfzEAAuHPuThQRtxpoY8CYVJxDj8' } }
      }
    ]

    requests.forEach(req => {
      it(`${req.name}`, (done) => {
        createRequest(req.testData, (statusCode, data) => {
          assert.equal(statusCode, req.statusCode)
          assert.equal(data.result, req.valid)
          done()
        })
      })
    })
  })

  context('uncomplete calls', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      { name: 'missing hash', testData: { id: jobID, data: { id: 'ZwVNLDIJKVA' } } },
      { name: 'missing id', testData: { id: jobID, data: { hash: 'QmPP8X2rWc2uanbnKpxfzEAAuHPuThQRtxpoY8CYVJxDj8' } } }
    ]

    requests.forEach(req => {
      it(`${req.name}`, (done) => {
        createRequest(req.testData, (statusCode, data) => {
          assert.equal(statusCode, 500)
          assert.equal(data.jobRunID, jobID)
          assert.equal(data.status, 'errored')
          assert.isNotEmpty(data.error)
          done()
        })
      })
    })
  })
})
