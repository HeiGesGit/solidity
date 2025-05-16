module.exports = async ({ getNamedAccounts, deployments }) => {
  const { firstAccount } = await getNamedAccounts();
  const { deploy, log } = deployments;

  log("deploying wrapped NFT on destination chain");
  await deploy("WrapperMyToken", {
    contract: "WrapperMyToken",
    from: firstAccount,
    log: true,
    args: ["WrapperMyToken", "WNFT"],
  });
  log("deployed WrapperMyToken nft");
};

module.exports.tags = ["all", "destchain"];
