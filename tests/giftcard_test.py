import pytest
from web3 import Web3
from web3.exceptions import ContractLogicError
from web3.exceptions import Web3RPCError
import time
import json
import os

#absolute path to the script's folder
script_dir = os.path.dirname(os.path.abspath(__file__))

#full path to the JSON file
json_path = os.path.join(script_dir, '..', 'artifacts', 'contracts', 'GiftCard.sol', 'GiftCard.json')

#connect to local Ethereum node
w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))
print(w3.is_connected())  #check if connected

#get compiled ABI and bytecode
with open(json_path) as f:
    contract_data = json.load(f)

abi = contract_data['abi']
bytecode = contract_data['bytecode']

@pytest.fixture
def deploy():
    #use first account on the network to deploy
    acct = w3.eth.accounts[0]
    #contract factory 
    contract = w3.eth.contract(abi=abi, bytecode=bytecode)
    #call constructor and submit transaction to deploy the contract.
    tx_hash = contract.constructor().transact({'from': acct})
    #wait for transaction receipt
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    #return contract object
    return w3.eth.contract(address=tx_receipt.contractAddress, abi=abi)

def test_buy_valid(deploy):
    contract = deploy
    #use second account for transaction
    user = w3.eth.accounts[1]
    #hash gift code
    code_hash = w3.keccak(text="BUYVALID")
    #call contract buy function with minimum amount
    tx_hash = contract.functions.buy(code_hash).transact({
        'from': user,
        'value': w3.to_wei(0.01, 'ether')  # valid amount
    })
    #wait for transaction receipt
    w3.eth.wait_for_transaction_receipt(tx_hash)

    #check that owner is the account that purchased
    owner = contract.functions.whoOwns(code_hash).call()
    assert owner == user

    #check that card is not redeemed
    redeemed = contract.functions.redeemed(code_hash).call()
    assert redeemed is False

def test_buy_minimum(deploy):
    contract = deploy
    user = w3.eth.accounts[2]
    code_hash = w3.keccak(text="TOOLOW")

    with pytest.raises(ContractLogicError, match="Send at least 0.001 ETH"):
        contract.functions.buy(code_hash).transact({
            'from': user,
            'value': w3.to_wei(0.0009, 'ether')
        })

def test_buy_duplicate(deploy):
    contract = deploy
    user = w3.eth.accounts[3]
    code_hash = w3.keccak(text="DUPLICATE")
    #first transaction
    contract.functions.buy(code_hash).transact({
        'from': user,
        'value': w3.to_wei(0.01, 'ether')
    })
    #second transaction with same hash should raise an error
    with pytest.raises(ContractLogicError, match="Code already used"):
        contract.functions.buy(code_hash).transact({
            'from': user,
            'value': w3.to_wei(0.01, 'ether') # less than valid amount
        })

def test_redeem_valid(deploy):
    contract = deploy
    #use second account for transaction
    user = w3.eth.accounts[1]
    #hash gift code
    code_hash = w3.keccak(text="REDEEMVALID")
    #call contract buy function with minimum amount
    tx_hash = contract.functions.buy(code_hash).transact({
        'from': user,
        'value': w3.to_wei(0.001, 'ether')
    })
    #wait for transaction receipt
    w3.eth.wait_for_transaction_receipt(tx_hash)

    #redeem gift card
    tx = contract.functions.redeem(code_hash).transact({'from': user})
    w3.eth.wait_for_transaction_receipt(tx)
   
    #check that status is redeemed
    assert contract.functions.redeemed(code_hash).call() == True

    #check that owner still has the card
    owner = contract.functions.whoOwns(code_hash).call()
    assert owner == user
    
def test_redeem_unowned(deploy):
    contract = deploy
    #account for transaction
    owner = w3.eth.accounts[2]
    #account that will attempt redemption of unowned card
    other_user = w3.eth.accounts[3] 
    #hash gift code
    code_hash = w3.keccak(text="REDEEMVALID")
    #call contract buy function with minimum amount
    tx_hash = contract.functions.buy(code_hash).transact({
        'from': owner,
        'value': w3.to_wei(0.001, 'ether')
    })
    #wait for transaction receipt
    w3.eth.wait_for_transaction_receipt(tx_hash)

    with pytest.raises(ContractLogicError, match="Not your gift card"):
        contract.functions.redeem(code_hash).transact({'from': other_user})

def test_redeem_duplicate(deploy):
    contract = deploy
    #account for transaction
    user = w3.eth.accounts[4]
    #hash gift code
    code_hash = w3.keccak(text="REDEEMDUPLICATE")
    #call contract buy function with minimum amount
    tx_hash = contract.functions.buy(code_hash).transact({
        'from': user,
        'value': w3.to_wei(0.001, 'ether')
    })
    #wait for transaction receipt
    w3.eth.wait_for_transaction_receipt(tx_hash)
    
    #redeem gift card first time
    tx = contract.functions.redeem(code_hash).transact({'from': user})
    w3.eth.wait_for_transaction_receipt(tx)

    #second redemption attempt raises error
    with pytest.raises(ContractLogicError, match="Already redeemed"):
        contract.functions.redeem(code_hash).transact({'from': user})

def test_redeem_invalid(deploy):
    contract = deploy
    #account for transaction
    user = w3.eth.accounts[5]
    #hash gift code
    code_hash = w3.keccak(text="REDEEMINVALID")

    #redemption attempt with invalid code raises error
    with pytest.raises(ContractLogicError, match="Not your gift card"):
        contract.functions.redeem(code_hash).transact({'from': user})

def test_redeem_expired(deploy):
    contract = deploy
    #account for transaction
    user = w3.eth.accounts[6]
    #hash gift code
    code_hash = w3.keccak(text="REDEEMEXPIRED")

    #call contract buy function with minimum amount
    tx_hash = contract.functions.buy(code_hash).transact({
        'from': user,
        'value': w3.to_wei(0.001, 'ether')
    })
    #wait for transaction receipt
    w3.eth.wait_for_transaction_receipt(tx_hash)

    #skip to past expiry - 30 days = 2,592,000 seconds
    w3.provider.make_request("evm_increaseTime", [2592000])
    w3.provider.make_request("evm_mine", [])

    #redemption attempt with invalid code raises error
    with pytest.raises(Web3RPCError, match="Card expired"):
        contract.functions.redeem(code_hash).transact({'from': user})