const networkConfig = {
  137: {
    name: "polygon",
    ethUsdPriceFeed: "0xF0d50568e3A7e8259E16663972b11910F89BD8e7",
  },
  11155111: {
    name: "sepolia",
    ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
  },
};

const developmentChain = ["hardhat", "localhost"];
// const DECIMALS = 8;
// const INITIAL_ANSWER = 200000000000;

module.exports = {
  networkConfig,
  developmentChain,
//   DECIMALS,
//   INITIAL_ANSWER,
};
