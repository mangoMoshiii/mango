const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const GiftCard = await hre.ethers.getContractFactory("GiftCard");

  // Deploy the contract (note: don't forget the parentheses!)
  const giftCard = await GiftCard.deploy(); // ← ensure this is a function call

  // Wait for it to be deployed
  await giftCard.waitForDeployment(); // ⬅️ newer Hardhat versions use this instead of .deployed()

  // Get the address
  const address = giftCard.address;
  // Write to a shared JSON file
  const output = { address: address };
  const filePath = path.join(__dirname, "..", "web", "contractInfo.json");
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2));

  console.log("🎉 GiftCard deployed to:", address);
}

main().catch((error) => {
  console.error("🚨 Deployment failed:", error);
  process.exitCode = 1;
});
