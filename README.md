<h1 align="center">
  <a href="https://github.com/tongcheng-security-team/Appscan"><img src="images/AppScan.png" width="30%"  alt="AppScan"></a>
</h1>

---

<h4 align="center">安全隐私卫士（AppScan）一款免费的企业级自动化隐私检测工具。</h4>

## 背景

&emsp;&emsp;随着移动互联网的高速发展，各公司对保护用户的个人隐私安全意识也在愈发重视。但是在实际业务场景中受限于代码开发质量或因产品设计不谨慎等原因，APP难免会引入一些违规收集的合规问题，因此各公司也在加大人力进行合规风险检测，不过随着业务不断发展、功能的频繁迭代更新，导致人工检测成本突增并且很多功能无法检测覆盖，基于以上背景，我们自研了AppScan这款隐私合规检测工具，它是一款基于动态分析，可以精准定位APP的违规风险点的自动化隐私检测工具，能够大大提高了合规检测的效率。

&emsp;&emsp;AppScan作为一款免费工具，可以帮助大家便捷、高效、全面的完成合规检测，但是由于AppScan还是一个刚孵化的产品，在自动化等方面还没有很完善，我们希望可以吸取大家在使用过程中发现的问题以及优化的建议，帮助AppScan一起成长。

## AppScan优点

+ 全面性: &ensp;从信息收集、权限申请及数据传输等多个维度，实现对APP个人信息合规的全面检测。
+ 规范性: &ensp;全面覆盖《App违法违规收集使用个人信息行为认定方法》、国家标准GB/T35273《信息安全技术 个人信息安全规范》、《中华人民共和国网络安全法》等主流安全检测标准。
+ 高效性: &ensp;可帮助APP开发公司及开发者快速对APP进行日常合规检测，深度挖掘隐私合规风险点、快速处理大批量App，替代人工翻查代码，降低时间与人力成本，显著提升检测效率。
+ 易用性: &ensp;无需环境搭配、开箱即用。

> 温馨提示：AppScan代码将在后续开源。点个star，敬请期待🌟🌟🌟

## 安装指南

⬇️[下载地址](https://github.com/tongcheng-security-team/AppScan/releases)

## 使用文档

🏠[使用文档](https://appscan.ly.com)

## 系统展示

* 连接展示

![!连接展示](./images/connect.png)

* 结果展示

![!结果展示](./images/dashboard.png)

## 支持的环境
- windows: 10及以上
- macOs: 11.0及以上
- android: 8.x及以上
- app: 64位/未加固(有时候引入的第三方sdk也会自带一些反检测功能)

## 高级设置
高级设置中包含了appScan的引擎相关设置, 如您在使用appScan时出现问题可尝试修改, 如可以正常使用强烈建议不要修改其中配置
- 检测引擎: 默认使用通用引擎,如出现app闪退和抓取不到数据等异常情况可尝试使用特殊引擎(特殊引擎会导致通用引擎下运行正常的某些app出现闪退, 提示安装包损坏等问题)
- 等待时间: 检测引擎插桩在app启动时的插桩时机, 默认0s即启动时立刻插桩, 如出现插桩失败获取不到数据时可尝试放开时间, 建议在2-3s内尝试

## 报错提交
如您在使用appScan时遇到问题, 欢迎点击软件左下角的 `...` 更多按钮, 选择 报错提交 项, 然后输入联系方式与错误描述, 点击提交按钮, 会将您的运行日志和相关信息提交给我们, 我们会及时处理并与你联系.

## 注意事项

### appScan运行需要清空手机目录 `/data/local/tmp/` 下的所有文件
因运行需要, 目前appScan在初始化过程中需要清空手机目录 `/data/local/tmp/` 下的所有文件, 如您有重要文件在此目录下, 请先自行备份, 防止丢失, 感谢理解

### 360安全管家会导致appScan无法运行
有用户反馈360杀毒软件会自动清理appScan的内部可执行文件,导致appScan无法正常运行
请您注意把appScan加入白名单或者暂时关闭杀软, 防止此类现象发生.

### 不再维护安卓8.0以下版本
我们发现, 安卓8.0以下的adb命令有所限制, 比如adb命令的长度无法超过32 [android - How can I overcome the property length limitation of the "adb shell setprop" - Stack Overflow](https://stackoverflow.com/questions/5068305/how-can-i-overcome-the-property-length-limitation-of-the-adb-shell-setprop). 因此, 经评估后, 我们决定不再维护安卓8.0以下的版本.
这并不代表appScan无法运行在安卓8.0以下版本, 你依旧可以使用安卓8.0以下系统, 但是我们不保证功能的可用性, 请知悉

### 关闭Magisk Hide
Magisk(面具)是时下流行的root管理软件, 我们测试发现, frida在附加进程时, 与Magisk的hide设置冲突, 因此在使用本软件之前, 如果你的Magisk版本小于3.24,请先关闭Magisk的Hide选项, 在Magisk>设置>Magisk Hide
[Frida and MagiskHide | Markuta](https://markuta.com/frida-and-magisk-hide/)

### 部分手机弹窗提示 Waiting For Debug
我们发现, 部分手机系统在运行appScan时会出现 Waiting for Debug 弹窗, 但是因为无法复现, 所以目前难以定位问题, 目前已知的会出现此问题的系统有:
- 魅族x8 安卓版本8.1.0

如你有同样的问题. 请及时与我们联系, 我们正在排查问题发生的原因以便解决此问题.

## 联系我们
<figure>
  <figcaption>加管理微信，拉你进群交流</figcaption>
  <img src="./images/wechat.jpg" width="200px" />
  <figcaption>同程安全应急响应中心-公众号</figcaption>
  <img src="./images/wx_group.png" width="200px" />
</figure>

## 特别致谢

> 开发过程中参考了以下项目的部分代码，特别在此致谢

* https://github.com/zhengjim/camille
* https://github.com/quasarframework/quasar

> appScan的功能更新需要适配流行的安卓版本, 开发者的机器有限, 感谢社区伙伴们的帮助, 提供了更多的安卓版本与机型进行测试,  同时积极的反馈问题. 
> 这里列举了部分积极帮助我们进行测试的人员名单(微信id). 感谢伙伴们的付出, 帮助appScan成长
- wenxuanxiaomu
- FW5215118
- mOan1215
- wxid_yrhfgzsdjoj422
