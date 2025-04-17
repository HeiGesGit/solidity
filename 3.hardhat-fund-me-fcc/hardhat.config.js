require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@nomicfoundation/hardhat-verify");
require("hardhat-deploy");

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  defaultNetwork: "hardhat",
  // networks: {
  //   sepolia: {
  //     url: RPC_URL,
  //     accounts: [],
  //     chainId: 11155111,
  //   },
  // },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  sourcify: {
    enabled: true,
  },
  namedAccounts: {
    deployer: {
      default: 0,
      // 11155111: 1, // 让 sepolia 的下标为 1 的用户 设置为 deployer
    },
    user: {
      default: 1,
    },
  },
};
