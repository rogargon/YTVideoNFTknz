const chai = require('chai')
const {expect} = require('chai')
const {developmentChains} = require('../helper-hardhat-config')
const {expectRevert, expectEvent, BN} = require('@openzeppelin/test-helpers');
const {BigNumber} = require("ethers");
const {numToBytes32} = require("@chainlink/test-helpers/dist/src/helpers");
chai.use(require('chai-bn')(BN))

describe('YTVideoNFT Tests', async function () {

    let apiConsumer, mockOracle

    before(async () => {
        await deployments.fixture(['all'])
        const APIConsumer = await deployments.get('YTVideoNFT')
        apiConsumer = await ethers.getContractAt('YTVideoNFT', APIConsumer.address)
        const MockOracle = await deployments.get('MockOracle')
        mockOracle = await ethers.getContractAt('MockOracle', MockOracle.address)
    })

    it('Should mint an NFT for a valid YouTube Video ', (done) => {
        mockOracle.once('OracleRequest',
            (_specId, _sender, requestId, _payment, _cbAddress, _callbackFuncId, expiration, _dataVersion, _data) => {
                console.log('OracleRequest:', requestId, _data)
                mockOracle.fulfillOracleRequest(requestId, numToBytes32(1))
            })
        apiConsumer.once('YTVNFTMinted', (minter, videoId, edition, tokenId, tokenUri) => {
            console.log('YTVNFTMinted:', minter, videoId, edition, tokenId, tokenUri)
            done()
        })
        apiConsumer.mint("VALID_VIDEO", "QmSCmcDtkkQpknosvpwj765Zy78mJyszEqfe8cWfkurUMJ")
    })

    it('Should mint multiple editions of the same YouTube video NFT', (done) => {
        mockOracle.once('OracleRequest',
            (_specId, _sender, requestId, _payment, _cbAddress, _callbackFuncId, expiration, _dataVersion, _data) => {
                console.log('OracleRequest:', requestId, _data)
                mockOracle.fulfillOracleRequest(requestId, numToBytes32(1))
            })
        apiConsumer.once('YTVNFTMinted', (minter, videoId, edition, tokenId, tokenUri) => {
            console.log('YTVNFTMinted:', minter, videoId, edition, tokenId, tokenUri)
            done()
        })
        apiConsumer.mint("VALID_VIDEO", "QmSCmcDtkkQpknosvpwj765Zy78mJyszEqfe8cWfkurUMJ")
    })

    it('Shouldn\'t mint an NFT for an invalid YouTube Video ', (done) => {
        mockOracle.once('OracleRequest',
            (_specId, _sender, requestId, _payment, _cbAddress, _callbackFuncId, expiration, _dataVersion, _data) => {
                console.log('OracleRequest:', requestId, _data)
                mockOracle.fulfillOracleRequest(requestId, numToBytes32(0))
            })
        apiConsumer.once('YTVNFTMinted', (minter, videoId, edition, tokenId, tokenUri) => {
            console.log('YTVNFTMinted:', minter, videoId, edition, tokenId, tokenUri)
            done("error")
        })
        apiConsumer.once('YouTubeVideoVerification', async(requestId, videoId, isVerified) => {
            console.log('YouTubeVideoVerification:', requestId, videoId, isVerified)
            expect((await apiConsumer.requests(requestId)).isPending).to.be.false
            expect((await apiConsumer.requests(requestId)).isVerified).to.be.false
            done()
        })
        apiConsumer.mint("INVALID_VID", "QmSCmcDtkkQpknosvpwj765Zy78mJyszEqfe8cWfkurUMJ")
    })
})
