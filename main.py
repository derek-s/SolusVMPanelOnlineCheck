# -*- coding: UTF-8 -*-
# main.py

from bs4 import BeautifulSoup
import re
from selenium import webdriver
import time
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.proxy import *
import sys
import string
import yaml
import os
from openpyxl import Workbook
from openpyxl.styles import Color, Fill, Font
from openpyxl.cell import Cell


f = open('_config.yml')
Config = yaml.load(f.read())
ProxyIP = Config['ProxyIP']
MyProxyIP = str(ProxyIP)
ProxyPort = Config['ProxyPort']
MyProxyPort = int(ProxyPort)

LTime = time.strftime("%Y-%m-%d", time.localtime()) 
WB = Workbook()
WS1 = WB.active


def CheckOnline(Url,UserName,PassWord):
    profile = webdriver.FirefoxProfile("profile")
    profile.set_preference('network.proxy.type', 1)
    profile.set_preference('network.proxy.http', MyProxyIP)
    profile.set_preference('network.proxy.http_port', MyProxyPort)
    profile.set_preference('network.proxy.ssl', MyProxyIP)
    profile.set_preference('network.proxy.ssl_port', MyProxyPort)
    profile.set_preference('network.proxy.socks', MyProxyIP)
    profile.set_preference('network.proxy.socks_port', MyProxyPort)
    profile.set_preference('network.proxy.ftp', MyProxyIP)
    profile.set_preference('network.proxy.ftp_port', MyProxyPort)
    profile.update_preferences()
    profile.accept_untrusted_certs = True
    Driver = webdriver.Firefox(profile,executable_path='lib/geckodriver.exe')
    Driver.get(Url)
    Driver.save_screenshot('screen.png')
    Driver.find_element_by_name('username').send_keys(UserName)
    Driver.find_element_by_name('password').send_keys(PassWord)
    Driver.find_element_by_name('Submit').click()
    try:
        element = WebDriverWait(Driver, 60).until(
        EC.presence_of_element_located((By.ID, "overview"))
        )
    finally:
        Driver.get('view-source:'+Url)
        Driver.current_window_handle
        PageSource = Driver.page_source
        #print PageSource
        #time.sleep(10000)
        PageSoup = BeautifulSoup(PageSource,'html.parser')
        PageATag = PageSoup.find_all('a')
        RegLink = r'\>control.php\?_v=\w*'
        for i in PageATag:
            StrLink = re.search(RegLink,str(i))
            if StrLink != None:
                ControlLink = re.findall(RegLink,str(i))
                #print ControlLink[0].replace('>','')
                StatusLink = Url+ControlLink[0].replace('>','')
                Driver.get(StatusLink)
                try:
                    element_status = WebDriverWait(Driver, 60).until(
                    EC.presence_of_element_located((By.XPATH, ".//*[@id='-state']/span"))
                    )
                finally:
                    #for span in Driver.find_element_by_xpath('html/body/div[2]/div[9]/div/div[4]/div[1]/table/tbody/tr[3]/td[2]'):
                    #    print span.text()
                    #ip = Driver.find_element_by_xpath(".//*[@id='-state']/span")
                    #label label-important
                    VPSIP = Driver.execute_script("return document.getElementById('overview').innerText")
                    VPSState = Driver.execute_script("return document.getElementById('-state').innerText")
                    print VPSIP,VPSState
                    Data = [VPSIP,VPSState]
                    WS1.append(styled_cells(Data))
        Driver.quit()

def styled_cells(data):
    a = data[0]
    c = data[1]
    if c != 'Online':
        c = Cell(WS1, column="A", row=2, value=c)
        c.font = Font(bold=True,color='FF0000')
    yield a
    yield c

def CUI():
    print '----------------------------------'
    print '-- 主菜单         '
    print '-- 1.单独检查（选择需要检查的URL地址）   '
    print '-- 2.全部检查（对配置文件中所有的URL地址都进行检查）'
    print '-- Q.退出程序'
    print '----------------------------------'
    Control = raw_input('-- 请输入要执行的操作：')
    VPSList = []
    if Control == '1':
        for Config_VPSBlock in Config:
            Match = re.search(r'VPS.*',Config_VPSBlock)
            if Match:
                VPSList.append(Match.group())
        print '-----------------------------------'
        print '-- 配置文件内包含以下VPS管理后台信息：'
        print '-----------------------------------'
        print 'ID|  后台名称|后台URL'
        for Index,Item in enumerate(VPSList): 
            print Index,'|',Config[Item][0],'|',Config[Item][1]
        print '-----------------------------------'
        VPSID = raw_input('-- 请输入需要检测的ID：')
        for Index,Item in enumerate(VPSList):
            if Index == int(VPSID):
                print '当前选择ID：'+VPSID
                print Index,'|',Config[Item][0],'|',Config[Item][1]
                WBFileName = LTime + Config[Item][0] +'.xlsx'
                print '开始检查……'
                CheckOnline(Config[Item][1],Config[Item][2],Config[Item][3])
                WB.save(filename=WBFileName)
        print '检查结束'
    elif Control == '2':
        for Config_VPSBlock in Config:
            Match = re.search(r'VPS.*',Config_VPSBlock)
            if Match:
                VPSList.append(Match.group())
        for Index,Item in enumerate(VPSList):
            print Index,'|',Config[Item][0],'|',Config[Item][1]
            WBFileName = LTime + Config[Item][0] +'.xlsx'
            print '开始检查……'
            CheckOnline(Config[Item][1],Config[Item][2],Config[Item][3])
            WB.save(filename=WBFileName)
        print '检查结束'

if __name__ == '__main__':
    CUI()

