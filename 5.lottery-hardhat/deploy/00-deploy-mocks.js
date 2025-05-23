const { network } = require("hardhat")

const BASE_FEE = "100000000000000000" // 0.25 is this the premium in LINK?
const GAS_PRICE_LINK = 1000000000 // link per gas, is this the gas lane? // 0.000000001 LINK per gas

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    console.log(chainId, 'chainId');
    
    if (chainId == 31337) {
        log("Local network detected! Deploying mocks...")
        await deploy("VRFCoordinatorV2_5Mock", {
            from: deployer,
            log: true,
            args: [BASE_FEE, GAS_PRICE_LINK, 1797350000],
        })

        log("Mocks Deployed!")
        log("----------------------------------------------------------")
        log("You are deploying to a local network, you'll need a local network running to interact")
        log(
            "Please run `yarn hardhat console --network localhost` to interact with the deployed smart contracts!"
        )
        log("----------------------------------------------------------")
    }
}
module.exports.tags = ["all", "mocks"]