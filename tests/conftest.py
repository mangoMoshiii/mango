import os
import pytest
from selenium import webdriver
from selenium.webdriver.edge.service import Service
import time

def pytest_addoption(parser):
    parser.addoption(
        "--code",
        action="store",
        default=None,
        help="Gift card code to use during test"
    )

@pytest.fixture(scope="module")
def code(request):
    return request.config.getoption("--code")


@pytest.fixture(scope="module")
def driver(request):
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
    time.sleep(30)
    #driver.quit()
