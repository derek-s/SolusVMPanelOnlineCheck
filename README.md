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
由于本程序支持代理服务器，可根据一下内容修改配置文件 <code>_config.yml</code>

