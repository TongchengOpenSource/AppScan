# 开发环境搭建

## helper
### 前置条件
- 本地安装python版本为3.10.X

### 安装依赖
1. 进入helper目录
2. 打开命令行(或者使用vscode等专业软件打开文件夹)
3. 执行 `python.exe -m venv venv` 创建虚拟环境
4. 执行 `.\venv\Scripts\activate` 激活虚拟环境(如遇到权限问题请自行百度解决办法)
5. 执行 `pip install -r .\requirements.txt -i https://pypi.doubanio.com/simple` 安装依赖
6. 执行 `python main.py -p 8848` 启动服务

### 启动
> websocket 可以通过 postman 或在线网站 http://www.websocket-test.com/ 进行连接和调试
1. 根据 [api](./api.md) 进行API调试

## view
### 前置条件
- 本地安装了16.X版本的nodejs
- 本地安装了yarn

### 安装依赖
1. 进入view目录
2. 打开命令行(或者使用vscode等专业软件打开文件夹)
3. 执行 `yarn` 安装依赖

### 启动
1. 执行 `quasar dev -m electron` 启动(提示找不到quasar请使用 `npx quasar dev -m electron`)
