const { ethers, network, run } = require("hardhat");
require("dotenv").config();

async function main() {
  const SimpleStorageFactory = await ethers.getContractFactory("SimpleStorage");
  console.log("deploying 1 ...");
  const simpleStorage = await SimpleStorageFactory.deploy();
  console.log("deploying 2 ..");
  await simpleStorage.waitForDeployment(1);
  console.log("deployed ..", network.config);
  // chinaId = 31337
  console.log(`Deployed contract to: ${await simpleStorage.getAddress()}`);

  if (network.config.chainId === 11155111 && process.env.ETHERSCAN_API_KEY) {
    await simpleStorage.waitForDeployment(6);
    await verify(simpleStorage.target, []);
  }

  const currentValue = await simpleStorage.retrieve();
  console.log(`current value is ${currentValue}`);

  // update value
  const tranRes = await simpleStorage.store(7);
  await tranRes.wait(1);
  const updateValue = await simpleStorage.retrieve();
  console.log(`current value is ${updateValue}`);
}

const verify = async (contractAddress, args) => {
  console.log("verify contract...");

  try {
    await run("verify:verify", {
      address: contractAddress,
      ConstructorArguments: args,
    });
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("验证过了");
    } else {
      console.log(e);
    }
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
