const { network } = require("hardhat");

const {
  networkConfig,
  developmentChain,
} = require("../helper-hardhat-config.js");

module.exports = async ({ deployments, getNamedAccounts }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  let ethUsdPriceFeedAddress;
  if (developmentChain.includes(network.name)) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  }

  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: [ethUsdPriceFeedAddress], // put price feed address
    log: true,
  });
  console.log("--------------------");
};

module.exports.tags = ["all"];
