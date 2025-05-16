const { ethers } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { firstAccount } = await getNamedAccounts();
  const { deploy, log } = deployments;

  log("deploy pool_burn_and_mint_nft contract");

  const CCIPSimulatorDeployment = await deployments.get("CCIPLocalSimulator");
  const ccSimulator = await ethers.getContractAt(
    "CCIPLocalSimulator",
    CCIPSimulatorDeployment.address
  );
  const ccipConfig = await ccSimulator.configuration();
  const { destinationRouter_, linkToken_ } = ccipConfig;
  const wnftAddr = (await deployments.get("WrapperMyToken")).address;
  await deploy("NFTPoolBurnAndMint", {
    contract: "NFTPoolBurnAndMint",
    from: firstAccount,
    log: true,
    args: [destinationRouter_, linkToken_, wnftAddr],
  });
  log("pool_burn_and_mint_nft contract deployed successs");
};

module.exports.tags = ["sourcechain", "all"];
