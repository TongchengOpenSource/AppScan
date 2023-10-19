# 打包文档

## helper
> 务必已经布置好了开发环境
1. 进入 helper 文件夹
2. 打开命令行
3. 执行 `pyinstaller ./main.spec`
4. 打包完成后, 会在 helper/dist 文件夹下生成文件夹, 将文件夹内的所有文件复制备用

## view
> 务必已经布置好了开发环境
1. 进入view文件夹
2. 将helper打包生成的文件夹复制到frida-helper文件夹下(mac是frida-helper-mac)
3. 打开命令行
4. 执行 `corepack enable` 开启corepack
5. 执行 `npx quasar build -m electron`
6. 打包完成后, 会在 `dist\electron\Packaged` 文件夹下生成 `appScan Setup xx.exe` 文件, 双击安装即可