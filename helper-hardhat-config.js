const networkConfig = {
    default: {
        name: 'hardhat',
        fee: '100000000000000000',
        keyHash: '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4',
        jobId: '29fa9aa13bf1468788b7cc4a500a45b8',
        fundAmount: "1000000000000000000",
    },
    1337: {
        name: 'localhost',
        fee: '100000000000000000',
        keyHash: '0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4',
        jobId: '29fa9aa13bf1468788b7cc4a500a45b8',
        fundAmount: "1000000000000000000",
    },
    4: {
        name: 'rinkeby',
        linkToken: '0x01be23585060835e02b77ef475b0cc51aa1e0709',
        keyHash: '0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311',
        oracle: '0x81946354bA92C4Ef22506e9de975df674DeC8a92',
        jobId: '43702de4d9474a2289fe87a95176cb60',
        fee: '10000000000000000', // 0.01 LINK, 1 * 10 ** 16;
        fundAmount: "1000000000000000000",
    },
    80001: {
        name: 'mumbai',
        linkToken: '0x326C977E6efc84E512bB9C30f76E30c160eD06FB',
        keyHash: '0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4',
        oracle: '0xd29b49B80d88f74fab38D24A67791D42d32b5430',
        jobId: '0ea2b291f61e46e0871d70537574ea3e',
        fee: '10000000000000000', // 0.01 LINK, 1 * 10 ** 16;
        fundAmount: "100000000000000"
    },
    137: {
        name: 'polygon',
        linkToken: '0xb0897686c545045afc77cf20ec7a532e3120e0f1',
        keyHash: '0xf86195cf7690c55907b2b611ebb7343a6f649bff128701cc542f0569e2c549da',
        oracle: '',
        jobId: '',
        fee: '10000000000000000', // 0.01 LINK, 1 * 10 ** 16;
        fundAmount: "100000000000000"
    },
}

const developmentChains = ["hardhat", "localhost"]

const getNetworkIdFromName = async (networkIdName) => {
    for (const id in networkConfig) {
        if (networkConfig[id]['name'] === networkIdName) {
            return id
        }
    }
    return null
}

const autoFundCheck = async (contractAddr, networkName, linkTokenAddress, additionalMessage) => {
    const chainId = await getChainId()
    console.log("Checking to see if contract can be auto-funded with LINK:")
    const amount = networkConfig[chainId]['fundAmount']
    //check to see if user has enough LINK
    const accounts = await ethers.getSigners()
    const signer = accounts[0]
    const LinkToken = await ethers.getContractFactory("LinkToken")
    const linkTokenContract = new ethers.Contract(linkTokenAddress, LinkToken.interface, signer)
    const balanceHex = await linkTokenContract.balanceOf(signer.address)
    const balance = await ethers.BigNumber.from(balanceHex._hex).toString()
    const contractBalanceHex = await linkTokenContract.balanceOf(contractAddr)
    const contractBalance = await ethers.BigNumber.from(contractBalanceHex._hex).toString()
    if (balance > amount && amount > 0 && contractBalance < amount) {
        //user has enough LINK to auto-fund
        //and the contract isn't already funded
        return true
    } else { //user doesn't have enough LINK, print a warning
        console.log("Account doesn't have enough LINK to fund contracts, or you're deploying to a network where auto funding isnt' done by default")
        console.log("Please obtain LINK via the faucet at https://" + networkName + ".chain.link/, then run the following command to fund contract with LINK:")
        console.log("npx hardhat fund-link --contract " + contractAddr + " --network " + networkName + additionalMessage)
        return false
    }
}

module.exports = {
    networkConfig,
    getNetworkIdFromName,
    autoFundCheck,
    developmentChains
}
