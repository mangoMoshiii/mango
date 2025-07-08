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

//connect wallet
async function connectWallet() {
  if (!window.ethereum) {
    alert("Please install MetaMask to use this app.");
    return;
  }

  // Initialize provider and signer
  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();

  // Load contract instance
  contract = new ethers.Contract(contractAddress, contractABI,signer);

  const userAddress = await signer.getAddress();
  document.getElementById("connectWallet").textContent = `Connected: ${userAddress.slice(0, 6)}...`;

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
    const tx = await contract.redeemGiftCard(codeHash);
    await tx.wait();
    alert("🎉 Gift card redeemed!");
    getOwnedGiftCards();
  } catch (err) {
    console.error(err);
    alert("❌ Redemption failed.");
  }
};


// 📋 Show gift cards owned by the connected wallet
async function getOwnedGiftCards() {
  try {
    const cards = await contract.getGiftCards();
    const list = document.getElementById("ownedGiftCards");
    list.innerHTML = "";

    for (let hash of cards) {
      const redeemed = await contract.redeemed(hash);
      const timestamp = await contract.getPurchaseTime(hash);
      const expiration = Number(timestamp) + 30 * 24 * 60 * 60;
      const isExpired = Date.now() / 1000 > expiration;

      const li = document.createElement("li");
      li.textContent = `Hash: ${hash} | ${redeemed ? "✅ Redeemed" : "🟢 Active"} | ${
        isExpired ? "⏰ Expired" : "📆 Valid"
      }`;
      list.appendChild(li);
    }
  } catch (err) {
    console.error("Fetch error:", err);
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


