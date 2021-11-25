const chai = require('chai')
const {expect} = require('chai')
const BN = require('bn.js')
chai.use(require('chai-bn')(BN))

const {BigNumber} = require("ethers");
const {numToBytes32} = require("@chainlink/test-helpers/dist/src/helpers");

describe('YTAPIConsumer Tests', async function () {

    let apiConsumer, mockOracle

    beforeEach(async () => {
        await deployments.fixture(['all'])
        const APIConsumer = await deployments.get('YTVideoNFT')
        apiConsumer = await ethers.getContractAt('YTVideoNFT', APIConsumer.address)
        const MockOracle = await deployments.get('MockOracle')
        mockOracle = await ethers.getContractAt('MockOracle', MockOracle.address)
    })

    afterEach(async () => {
        mockOracle.removeAllListeners()
        apiConsumer.removeAllListeners()
    })

    it('Should get a positive verification for a valid video', (done) => {
        mockOracle.once('OracleRequest',
            (_specId, _sender, requestId, _payment, _cbAddress, _callbackFuncId, expiration, _dataVersion, _data) => {
                console.log('OracleRequest:', requestId, _data)
                mockOracle.fulfillOracleRequest(requestId, numToBytes32(1))
        })

        apiConsumer.once('VerificationRequest', (requestId, videoId, videoTokenId) =>
            console.log('VerificationRequest:', requestId, videoId, videoTokenId))

        apiConsumer.once('YouTubeVideoVerification', async(requestId, videoId, isVerified) => {
            console.log('YouTubeVideoVerification:', requestId, videoId, isVerified)
            expect((await apiConsumer.requests(requestId)).isPending).to.be.false
            expect((await apiConsumer.requests(requestId)).isVerified).to.be.true
            done()
        })

        apiConsumer.check("VALID_VIDEO", BigNumber.from("104275981540243725275645263"))
            .then(transaction => transaction.wait())
            .then(receipt => {
                const verificationRequestEvents = receipt.events.filter(event => event.event === "VerificationRequest")
                console.log("RequestId:", verificationRequestEvents[0].args['requestId'])
            })
    })
})
