const { network, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");

const VRF_SUB_FUND_AWOUNT = ethers.parseEther("30");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let vrfV2Address, subscriptId, vrfCoordinatorV2Mock;

  if (developmentChains.includes(network.name)) {
    vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
    vrfV2Address = vrfCoordinatorV2Mock.target;
    console.log({ vrfV2Address });

    const tranRes = await vrfCoordinatorV2Mock.createSubscription();
    const tranReceipt = await tranRes.wait();
    // subscriptId = tranReceipt.events[0].args.subId;
    subscriptId = 1;
    await vrfCoordinatorV2Mock.fundSubscription(
      subscriptId,
      VRF_SUB_FUND_AWOUNT
    );
  } else {
    vrfV2Address = networkConfig[chainId].vrfCoordinatorV2;
    subscriptId = networkConfig[chainId].subscriptId;
  }

  const enterFee = networkConfig[chainId].enterFee;
  const gasLane = networkConfig[chainId].gasLane;
  const callbackGasLimit = networkConfig[chainId].callbackGasLimit;
  const interval = networkConfig[chainId].interval;

  const args = [
    vrfV2Address,
    enterFee,
    gasLane,
    subscriptId,
    callbackGasLimit,
    interval,
  ];
  const raffle = await deploy("Raffle", {
    from: deployer,
    args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  console.log("deployed");

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, args);
  } else {
    await vrfCoordinatorV2Mock.addConsumer(Number(subscriptId), raffle.address);
  }
};

module.exports.tags = ["all", "raffle"];
