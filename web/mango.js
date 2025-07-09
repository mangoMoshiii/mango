//import contractInfo from "./contract.json";
let provider;
let signer;
let contract;

// Replace these with your actual contract info
const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const contractABI = [
    {
    "inputs": [],
    "name": "EXPIRATION_TIME",
    "outputs": [
        {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
        }
    ],
    "stateMutability": "view",
    "type": "function"
    },
    {
    "inputs": [],
    "name": "MIN_PURCHASE",
    "outputs": [
        {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
        }
    ],
    "stateMutability": "view",
    "type": "function"
    },
    {
    "inputs": [
        {
        "internalType": "bytes32",
        "name": "codeHash",
        "type": "bytes32"
        }
    ],
    "name": "buy",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
    },
    {
    "inputs": [],
    "name": "getGiftCards",
    "outputs": [
        {
        "internalType": "bytes32[]",
        "name": "",
        "type": "bytes32[]"
        }
    ],
    "stateMutability": "view",
    "type": "function"
    },
    {
    "inputs": [
        {
        "internalType": "bytes32",
        "name": "codeHash",
        "type": "bytes32"
        }
    ],
    "name": "getPurchaseTime",
    "outputs": [
        {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
        }
    ],
    "stateMutability": "view",
    "type": "function"
    },
    {
    "inputs": [
        {
        "internalType": "bytes32",
        "name": "codeHash",
        "type": "bytes32"
        }
    ],
    "name": "redeem",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
    },
    {
    "inputs": [
        {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
        }
    ],
    "name": "redeemed",
    "outputs": [
        {
        "internalType": "bool",
        "name": "",
        "type": "bool"
        }
    ],
    "stateMutability": "view",
    "type": "function"
    },
    {
    "inputs": [
        {
        "internalType": "bytes32",
        "name": "codeHash",
        "type": "bytes32"
        }
    ],
    "name": "whoOwns",
    "outputs": [
        {
        "internalType": "address",
        "name": "",
        "type": "address"
        }
    ],
    "stateMutability": "view",
    "type": "function"
    }
];

console.log("Ethers object:", typeof ethers);

//connect wallet
async function connectWallet() {
  if (!window.ethereum) {
    alert("Please install MetaMask to use this app.");
    return;
  }

  // Initialize provider and signer
  provider = new ethers.providers.Web3Provider(window.ethereum);
  //local provider 
  //const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  //use one of the private keys from npx hardhat node
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();

  // Load contract instance
  contract = new ethers.Contract(contractAddress, contractABI,signer);

  const userAddress = await signer.getAddress();
  document.getElementById("connectWallet").textContent = `Connected: ${userAddress.slice(0, 6)}...`;
  console.log("Wallet connected");

  getOwnedGiftCards();
}

//buy a gift card
async function buyGiftCard(){
  const code = document.getElementById("buyCode").value;
  const amount = document.getElementById("amountETH").value;

  if (!code || !amount) return alert("Please enter code and amount");

  const codeHash = ethers.utils.id(code); // keccak256 hash
  const value = ethers.utils.parseEther(amount);

  try {
    const tx = await contract.buy(codeHash, { value });
    await tx.wait();
    alert("✅ Gift card purchased!");
    getOwnedGiftCards();
    document.getElementById("buyCode").value = "";
    document.getElementById("amountETH").value = "";

  } catch (err) {
    console.error(err);
    alert("Purchase failed ❌");
  }
};

//redeem a gift card
async function redeemGiftCard() {
  const code = document.getElementById("redeemCode").value;
  if (!code) {
    alert("Enter a code to redeem.");
    return;
  }

  const codeHash = ethers.utils.id(code);

  try {
    const tx = await contract.redeem(codeHash);
    await tx.wait();
    alert("🎉 Gift card redeemed!");
    getOwnedGiftCards();
    document.getElementById("redeemCode").value = "";
  } catch (err) {
    console.error(err);
    alert("❌ Redemption failed.");
  }
};


// 📋 Show gift cards owned by the connected wallet
async function getOwnedGiftCards() {
  try {
    const cards = await contract.getGiftCards();
    console.log("got gift cards");
    const list = document.getElementById("ownedGiftCards");
    list.innerHTML = "";

    // 🕵️‍♂️ Check if the result is empty or undefined
    if (!cards || cards.length === 0) {
      console.log("No gift cards detected");
      const msg = document.createElement("li");
      msg.textContent = "🎁 You don’t own any gift cards yet!";
      list.appendChild(msg);
      return;
    }

    for (let hash of cards) {
      try{
      const redeemed = await contract.redeemed(hash);
      console.log("redeemed "+redeemed);
      const timestamp = await contract.getPurchaseTime(hash);
      console.log("");
      const expiration = Number(timestamp) + 30 * 24 * 60 * 60;
      const isExpired = Date.now() / 1000 > expiration;

      const li = document.createElement("li");
      li.textContent = `Hash: ${hash.slice(0, 6)}... ${redeemed ? "✅ Redeemed" : "🟢 Active"} ${
        isExpired ? "⏰ Expired" : "📆 Valid"
      }`;
      list.appendChild(li);
    }catch (innerErr) {
        console.warn(`Error fetching details for hash ${hash}:`, innerErr);
      }
    }
  } catch(err){
    console.error("Fetch error:", err);
    const list = document.getElementById("ownedGiftCards");
    const errorMsg = document.createElement("li");
    errorMsg.textContent = "🚫 Failed to load your gift cards. Please try again.";
    list.appendChild(errorMsg);
  }
}

//event listener for connect buttons
function setupEventListeners() {
  document.getElementById("connectWallet").onclick = connectWallet;
  document.getElementById("buyButton").onclick = buyGiftCard;
  document.getElementById("redeemButton").onclick = redeemGiftCard;
};

// 🚀 Initialize app on load
window.addEventListener("load", setupEventListeners);


