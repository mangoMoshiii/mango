let provider;
let signer;
let contract;
let userAddress;
let contractAddress;
console.log("Ethers version:", ethers.version);

fetch("contractInfo.json")
  .then(res => res.json())
  .then(data => {
    console.log("address:", data);
    contractAddress = data.address;
  })
  .catch(err => {
    console.error("contract info load failed:", err);
  });

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
  if (window.location.search.includes("testMode=true")) { //in testmode use hardhat
    provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
    //hardcoded hardhat wallet address
    const wallet = new ethers.Wallet("0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e", provider);
    userAddress = await wallet.getAddress();
    signer = wallet;
    contract = new ethers.Contract(contractAddress, contractABI, signer);
  }
  
  else if (window.ethereum){ //use metamask
    // Initialize provider and signer
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    console.log("Signer:", signer);

    // Load contract instance
    contract = new ethers.Contract(contractAddress, contractABI,signer);
    userAddress = await signer.getAddress();
  }
  else{//no metamask or mock
      alert("Please install MetaMask to use this app.");
      return;
  }
  document.getElementById("connectWallet").textContent = `Connected: ${userAddress.slice(0, 6)}...`;
  await updateBalance();
  console.log("Wallet connected");
  await getOwnedGiftCards();
  
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
    document.getElementById("statusMessage").textContent = "Processing purchase...";
    await tx.wait();
    document.getElementById("statusMessage").textContent ="✅ Gift card purchased!";
    getOwnedGiftCards();
    updateBalance();
    document.getElementById("buyCode").value = "";
    document.getElementById("amountETH").value = "";

  } catch (err) {
    console.error(err);
    document.getElementById("statusMessage").textContent ="Purchase failed ❌";
  }
};

//redeem a gift card
async function redeemGiftCard() {
  const code = document.getElementById("redeemCode").value;
  if (!code) {
    document.getElementById("statusMessage").textContent ="Enter a code to redeem.";
    return;
  }

  const codeHash = ethers.utils.id(code);

  try {
    const tx = await contract.redeem(codeHash);
    document.getElementById("statusMessage").textContent = "Processing redemption...";
    await tx.wait();
    document.getElementById("statusMessage").textContent = "🎉 Gift card redeemed!";
    getOwnedGiftCards();
    updateBalance();
    document.getElementById("redeemCode").value = "";
  } catch (err) {
    console.error(err);
    document.getElementById("statusMessage").textContent = "❌ Redemption failed.";
  }
};


// 📋 Show gift cards owned by the connected wallet
async function getOwnedGiftCards() {
  try {
    const cards = await contract.getGiftCards();
    console.log("got gift cards");
    const list = document.getElementById("ownedGiftCards");
    list.innerHTML = "";

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
      li.textContent = `Hash: ${hash.slice(0, 8)}...   ${redeemed ? "✅ Redeemed" : "🟢 Active"} ${
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

//check wallet balance
async function updateBalance(){ 
  if (!provider) {
    console.warn("⛔ provider not initialized");
    return;
  }
  console.log("Calling updateBalance()");
  try {
    const addr = await signer.getAddress();
    console.log("Signer address:", addr);

    const raw = await provider.getBalance(addr);
    if (!raw || raw._hex === "0x0") {
      console.warn("⚠️ Balance response is blank or zero:", raw);
    } else {
      const eth = ethers.utils.formatEther(raw);
      console.log("💰 ETH balance:", eth);
      document.getElementById("walletBalance").textContent = eth;
    }
  } catch (err) {
    console.error("❌ Thrown error during getBalance:", err);
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


