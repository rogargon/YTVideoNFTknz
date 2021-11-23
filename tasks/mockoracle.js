const {networkConfig, getNetworkIdFromName} = require('../helper-hardhat-config')
const {numToBytes32} = require('@chainlink/test-helpers/dist/src/helpers')
const contractInfo = require("../src/contracts/contractInfo.json");

task(
    'mockoracle',
    'Monitors incoming oracle request to the MockOracle and fulfills them with given default response'
)
    .addParam('valid', 'The oracle response by default, true for valid or false for invalid check')
    .setAction(async (taskArgs) => {
        const networkId = await getNetworkIdFromName(network.name)
        const accounts = await ethers.getSigners()
        const signer = accounts[0]
        let oracle;
        if (['hardhat', 'localhost', 'ganache'].indexOf(network.name) >= 0) {
            const MockOracle = await ethers.getContractFactory('MockOracle')
            const contract = contractInfo[parseInt(networkId)][network.name].contracts['MockOracle']
            oracle = new ethers.Contract(contract.address, MockOracle.interface, signer)
            console.log('Using MockOracle at', contract.address, 'in network',  network.name)
            oracle.on('OracleRequest', (_specId, _sender, requestId, _payment,
                                        _cbAddress, _callbackFuncId, expiration, _dataVersion, _data) => {
                    console.log('OracleRequest:', requestId, _data)
                    console.log('Fulfilling request with response:', taskArgs.valid)
                    if (taskArgs.valid === "true") {
                        oracle.fulfillOracleRequest(requestId, numToBytes32(1))
                    } else {
                        oracle.fulfillOracleRequest(requestId, numToBytes32(0))
                    }
            })
        } else {
            console.error('Emulated MockOracle just available on local development network')
            process.exit(0)
        }

        console.log('Monitoring incoming Oracle requests...')
        while (true) {
            await new Promise(resolve => setTimeout(resolve, 10000))
        }
    })
module.exports = {}
