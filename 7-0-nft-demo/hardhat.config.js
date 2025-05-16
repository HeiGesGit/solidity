require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require("hardhat-deploy");
require("hardhat-deploy-ethers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.27",
  namedAccounts: {
    firstAccount: {
      default: 0,
    },
  },
  // networks: {
  //   hardhat: {}, // 默认本地网络，无需额外配置
  // },
};
