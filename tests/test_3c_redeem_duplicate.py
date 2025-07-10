import time
import pytest
from selenium.webdriver.common.by import By

def test_redeem(driver, code):
    # 🔗 Load app in test mode
    driver.get("http://127.0.0.1:5500/web/index.html?testMode=true")

    #connect wallet
    driver.find_element(By.ID, "connectWallet").click()
    time.sleep(1)

    #fill code and price
    redeem_code = driver.find_element(By.ID, "redeemCode")
    redeem_code.send_keys(code)

    time.sleep(3)

    #record balance before
    balance_before_text = driver.find_element(By.ID, "walletBalance").text.strip()
    balance_before = float(balance_before_text)
    
    # click purchase button
    driver.find_element(By.ID, "redeemButton").click()

    time.sleep(2)
    #get balance after redemption attempt
    balance_after_text = driver.find_element(By.ID, "walletBalance").text.strip()
    balance_after = float(balance_after_text)

    status_msg = driver.find_element(By.ID, "statusMessage")
    print("Redemption status:", status_msg.text)

    #check redemption failed
    assert "failed" in status_msg.text
    assert balance_before == balance_after
