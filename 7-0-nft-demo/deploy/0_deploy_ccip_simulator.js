module.exports = async ({ getNamedAccounts, deployments }) => {
  const { firstAccount } = await getNamedAccounts();
  const { deploy, log } = deployments;

  log("deploy ccip simulator contract");

  await deploy("CCIPLocalSimulator", {
    contract: "CCIPLocalSimulator",
    from: firstAccount,
    log: true,
    args: [],
  });
  log("nft ccip simulator contract deployed successs");
};

module.exports.tags = ["sourcechain", "all"];
