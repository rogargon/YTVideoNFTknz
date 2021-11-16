const {networkConfig, getNetworkIdFromName} = require('../helper-hardhat-config')
const {numToBytes32} = require('@chainlink/test-helpers/dist/src/helpers')
const contractInfo = require("../src/contracts/contractInfo.json");

task(
    'mint-nft',
    'Calls the YTVideoNFT contract for the specified network to mint an NFT for the provided YouTube videoId, which the oracle assumes owned by the minter if running on a local network'
)
    .addParam('video', 'The identifier of the YouTube video for which the NFT is to be minted')
    .addParam('metadata', 'The IPFS content hash pointing to the NFT JSON metadata')
    .setAction(async (taskArgs) => {
        const contractName = 'YTVideoNFT'
        const networkId = await getNetworkIdFromName(network.name)
        const YTVideoNFT = await ethers.getContractFactory(contractName)
        const networkName = Object.keys(contractInfo[parseInt(networkId)])[0]
        const contract = contractInfo[parseInt(networkId)][networkName].contracts[contractName]
        const accounts = await ethers.getSigners()
        const signer = accounts[0]
        console.log('Calling YTVideoNFT contract', contract.address, 'on network', network.name)
        console.log('Request that an YTVNFT is minted for YouTube video with id', taskArgs.video)

        const ytVideoNft = new ethers.Contract(contract.address, YTVideoNFT.interface, signer)

        let oracle;
        if (['hardhat', 'localhost', 'ganache'].indexOf(network.name) >= 0) {
            const MockOracle = await ethers.getContractFactory('MockOracle')
            const contract = contractInfo[parseInt(networkId)][networkName].contracts['MockOracle']
            oracle = new ethers.Contract(contract.address, MockOracle.interface, signer)
            console.log('Using MockOracle at', contract.address, 'in network',  network.name)
            oracle.on('OracleRequest', (_specId, _sender, requestId, _payment,
                                        _cbAddress, _callbackFuncId, expiration, _dataVersion, _data) => {
                    console.log('OracleRequest:', requestId, _data)
                    oracle.fulfillOracleRequest(requestId, numToBytes32(1))
            })
        } else {
            const oracleAddress = networkConfig[networkId].oracle;
            const Oracle = await ethers.getContractFactory('MockOracle')
            oracle = Oracle.attach(oracleAddress)
            console.log('Using oracle at', oracleAddress, 'in network',  network.name)
            oracle.on('OracleRequest', (_specId, _sender, requestId, _payment,
                                        _cbAddress, _callbackFuncId, expiration, _dataVersion, _data) => {
                console.log('OracleRequest:', requestId, _data)
            })
        }

        ytVideoNft.on('YouTubeVideoVerification', async(requestId, videoId, isVerified) => {
            console.log('YouTubeVideoVerification:', requestId, videoId, isVerified)
            if (!isVerified) {
                console.log('YouTube video verification failed, its description doesn\'t contain video tokenId')
                process.exit(0)
            }
        })

        ytVideoNft.on('YTVNFTMinted', (minter, videoId, edition, tokenId, tokenUri) => {
                console.log('YTVNFTMinted:', minter, videoId, edition, tokenId, tokenUri)
                process.exit(0)
            }
        )

        await ytVideoNft.mint(taskArgs.video, taskArgs.metadata)

        console.log('Minting, waiting...')
        await new Promise(resolve => setTimeout(resolve, 300000))
    })
module.exports = {}
