const { network } = require("hardhat");
const { developmentChain } = require("../helper-hardhat-config");
// import {
//   //  DECIMALS,
//   developmentChain,
//   // INITIAL_ANSWER
// } from "../helper-hardhat-config";

const DECIMALS = 8;
const INITIAL_ANSWER = 200000000000;
module.exports = async ({ deployments, getNamedAccounts }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  // const chainId = network.config.chainId;

  if (developmentChain.includes(network.name)) {
    console.log("deploying mocks ...");
    await deploy("MockV3Aggregator", {
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_ANSWER]
    });
    console.log("deployed");
    console.log("----------------------------------------");
  }
};

module.exports.tags = ["all", "mocks"];
