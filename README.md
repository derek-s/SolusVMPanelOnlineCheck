# SolusVMPanelOnlineCheck

### 程序功能
批量查询检测SolusVM面板内的主机在线状态。
支持使用代理服务器。
检查结束后，将检查结果输出至xlsx文件内。

### 开发平台
开发环境：Ubuntu + Python 2.7
兼容环境：理论兼容所有Linux + Python 2.7平台。
        Windows平台可以才用Cygwin来运行（已测试）
        Bash On Windows尚未测试兼容性。
### 开发框架
采用Selenium库进行构建，Drive采用Firefox进行，内建profile和Drive程序。
若Drive与运行机Firefox版本不符，可自行替换并调试。

### 配置
由于本程序支持代理服务器，可根据以下内容修改配置文件 
<code>_config.yml</code> 文件内容如下：
```yml
#代理IP
ProxyIP: 
#代理端口 
ProxyPort: 
#需要检测的VPS后台登陆地址信息
VPS1:
  - 后台1
  - 访问地址 例如 http://www.xxx.com:1234/
  - 用户名
  - 密码
```

如果需要使用代理服务器，则将代理服务器IP地址及代理端口填写到配置文件的<code>ProxyIP</code>及<code>ProxyPort</code>字段

若不需要使用代理服务器，请将<code>main.py</code>中的
<code>profile.set_preference('network.proxy.type', 1)</code>
修改为
<code>profile.set_preference('network.proxy.type', 0)</code>
同时配置文件的代理服务器配置部分保留为空。

本程序支持多个面板轮流检测，可以在配置文件内配置，参考配置如下：
```
VPS1:
  - SolusVM-1
  - https://www.abc.com:1234/
  - admin
  - 000000
VPS2:
  - SolusVM-2
  - https://www.def.com:5678/
  - admin
  - 000000
```

