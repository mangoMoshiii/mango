import os
import pytest
from selenium import webdriver
from selenium.webdriver.edge.service import Service

@pytest.fixture(scope="module")
def driver():
    #absolute path to the script's folder
    script_dir = os.path.dirname(os.path.abspath(__file__))
    #full path to msedgedriver
    edgedriver_path = os.path.join(script_dir, '..', 'msedgedriver')

    service = Service(edgedriver_path)

    #for controlling browser behaviour
    options = webdriver.EdgeOptions() 
    #start the browser window maximized
    options.add_argument("--start-maximized") 
    #start new browser session
    driver = webdriver.Edge(service=service, options=options)
    yield driver #handoff to test functions
    #driver.quit()
