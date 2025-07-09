import pytest
from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.common.by import By
import time
import os


def test_metamask_connect(driver):
    #go to app UI
    driver.get("http://127.0.0.1:5500/web/index.html?testMode=true") #live server port
    
    #click connect button
    connect_btn = driver.find_element(By.ID, "connectWallet")
    elements = driver.find_elements(By.ID, "connectWallet")
    #time.sleep(10)
    connect_btn.click()
    time.sleep(2)
    #check that wallet address slice is shown on button after connection
    wallet_status = driver.find_element(By.ID, "connectWallet")
    print(wallet_status)
    assert wallet_status.text.startswith("Connected")

    print("Metamask connection successful")


