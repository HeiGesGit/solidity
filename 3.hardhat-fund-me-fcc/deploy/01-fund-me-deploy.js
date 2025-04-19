const { network } = require("hardhat");
const {
  networkConfig,
  developmentChain,
} = require("../helper-hardhat-config.js");
const { verify } = require("../utils/verify.js");
require("dotenv").config();

module.exports = async ({ deployments, getNamedAccounts }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  // const chainId = 31337;

  console.log(network.name, "network.name", chainId);
  let ethUsdPriceFeedAddress;
  if (developmentChain.includes(network.name)) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  }

  const args = [ethUsdPriceFeedAddress];
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args,
    log: true,
    waitConfirmations: network.config.blockConfirmactions || 1,
  });

  console.log("deployed");

  // if (
  //   !developmentChain.includes(network.name) &&
  //   process.env.ETHERSCAN_API_KEY
  // ) {
  //   await verify(fundMe.address, args);
  // }
  console.log("--------------------");
};

module.exports.tags = ["all"];
