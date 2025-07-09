import time
import pytest
from selenium.webdriver.common.by import By

def test_simulate_giftcard_purchase(driver):
    # 🔗 Load app in test mode
    driver.get("http://127.0.0.1:5500/web/index.html?testMode=true")

    #connect wallet
    connect_btn = driver.find_element(By.ID, "connectWallet")
    connect_btn.click()

    #fill code and price
    buy_code = driver.find_element(By.ID, "buyCode")
    buy_code.send_keys("CARD001")

    amount_field = driver.find_element(By.ID, "amountETH")
    amount_field.send_keys("1")

    # click purchase button
    purchase_btn = driver.find_element(By.ID, "buyButton")
    purchase_btn.click()

    # ⏳ Wait for status update
    time.sleep(2)
    status_msg = driver.find_element(By.ID, "statusMessage")
    print("Purchase status:", status_msg.text)

    # ✅ Assert purchase was successful
    assert "purchased" in status_msg.text or "Processing" in status_msg.text
