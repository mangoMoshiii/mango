const hre = require("hardhat");

async function main() {
  const GiftCard = await hre.ethers.getContractFactory("GiftCard");

  // Deploy the contract (note: don't forget the parentheses!)
  const giftCard = await GiftCard.deploy(); // ← ensure this is a function call

  // Wait for it to be deployed
  await giftCard.waitForDeployment(); // ⬅️ newer Hardhat versions use this instead of .deployed()

  // Get the address
  const address = await giftCard.getAddress();

  console.log("🎉 GiftCard deployed to:", address);
}

main().catch((error) => {
  console.error("🚨 Deployment failed:", error);
  process.exitCode = 1;
});
