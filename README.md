# Sample Gift Card dApp + Testing

This project demonstrates an online gift card system backed by Ethereum smart contracts. The system allows anyone to:
1. Buy a gift card by providing a unique code and sending ETH.
2. Redeem the gift card by entering the same code.

The project includes a smart contract, a web app frontend, and automated test cases.

The web app frontend runs on Live Server and testing requires a running Hardhat node.

## Browser Driver Setup

To run Selenium UI tests, you must install the [Microsoft Edge WebDriver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/):

1. Choose the version that matches your installed Edge.
2. Place the downloaded `msedgedriver.exe` inside `mango\`
3. Ensure your system has Edge installed and up to date.

**Note**: You can also use Chrome by modifying the Selenium setup in `conftest.py`.

## Setup

### Option 1: Automated Testing 

1. Start a hardhat node:
   ```bash
   npx hardhat node
   ```

2. Deploy the smart contract:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```
   This process should remain running throughout testing

3. Start Live Server from the web folder at port 5500 (recommended: 'Go Live' in VSCode)
   ```bash
   live-server --port=5500
   ```
4. Testing (Smart contract)
   ```bash
   python3 -m pytest giftcard_test.py
   ```
6. Testing (UI: Requires msedgedriver)
   Run pytest and provide the gift card code as a parameter (each code can only be used once per node session):
   ```bash
   python3 -m pytest tests/ --code=[GIFTCARDCODE]
   ```
   The pytest will run the frontend in testmode and the wallet adress will be hardcoded.
### Option 2: Manual Testing

1. Start a hardhat node:
   ```shell
   npx hardhat node
   ```

2. Deploy the smart contract:
   ```shell
   npx hardhat run scripts/deploy.js --network localhost
   ```
   This process should remain running throughout testing

3. Start Live Server from the web folder at port 5500 (recommended: 'Go Live' in VSCode)
   ```shell
   live-server --port=5500
   ```
4. Set up test network in MetaMask using the following parameters:
    - RPC URL	http://127.0.0.1:8545 (Hardhat)
    - Chain ID	31337 (Hardhat)
    - Currency Symbol	ETH

5. Import an account into Metamask using a private key from the Hardhat node
    - Open MetaMask
    - Click “Add Account”
    - Select "Private Key"
    - Enter private key from Hardhat
   
   This gives you a test wallet preloaded with 10000 ETH, which can be used to test the web app.

