const {networkConfig, getNetworkIdFromName} = require('../helper-hardhat-config')
const {numToBytes32} = require('@chainlink/test-helpers/dist/src/helpers')
const contractInfo = require("../src/contracts/contractInfo.json");

task(
    'nft-tokenid',
    'Compute the tokenid for a videoId'
)
    .addParam('video', 'The identifier of the YouTube video for which the NFT is to be minted')
    .setAction(async (taskArgs) => {
        const contractName = 'YTVideoNFT'
        const videoId = taskArgs.video
        const networkId = await getNetworkIdFromName(network.name)
        const YTVideoNFT = await ethers.getContractFactory(contractName)
        const networkName = Object.keys(contractInfo[parseInt(networkId)])[0];
        const contract = contractInfo[parseInt(networkId)][networkName].contracts[contractName];
        const accounts = await ethers.getSigners()
        const signer = accounts[0]
        const ytVideoNft = new ethers.Contract(contract.address, YTVideoNFT.interface, signer)

        const result = await ytVideoNft.generateTokenId(videoId)
        console.log('NFT videoTokenId:', result.videoTokenId.toString(),
            ", tokenId:", result.tokenId.toString())
    })
module.exports = {}
