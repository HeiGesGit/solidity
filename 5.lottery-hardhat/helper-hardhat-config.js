const { ethers } = require("hardhat");
const { verify } = require("./utils/verify");

const networkConfig = {
  11155111: {
    name: "sepolia",
    vrfCoordinatorV2: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",
    enterFee: ethers.parseEther("0.02"),
    gasLane:
      "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
    subscriptId: "53848252032028089055526812993571037610340660547374314352813404140952394424854", // sepolia 的 subId
    callbackGasLimit: "500000",
    interval: "30",
  },
  31337: {
    name: "hardhat",
    enterFee: ethers.parseEther("0.02"),
    gasLane:
      "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
    callbackGasLimit: "500000",
    interval: "30",
  },
};

const developmentChains = ["hardhat", "localhost"];
const VERIFICATION_BLOCK_CONFIRMATIONS = 6

module.exports = {
  networkConfig,
  developmentChains,
  verify,
  VERIFICATION_BLOCK_CONFIRMATIONS
};
