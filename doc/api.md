# helper API

## base 结构
```json
{
    "code": 200, // 200成功
    "status": "OK", // 接口调用状态, 通过状态可以判断接口调用状态和错误类型
    "description": "请求成功", // 详细的调用信息, 错误时这里展示错误详细信息
    "timestamp": 1668596772, // 返回时间戳
    "detail": [], // 结果
    "count": 0 // detail 数量
}
```

## HTTP
> 127.0.0.1:8848

### 判断手机 USB/ROOT 权限
> 判断手机是否开启 USB 调试
>
> 判断手机是否授权本设备 USB 调试
>
> 判断手机 ROOT 权限状态

curl --location --request GET '127.0.0.1:8848/api/v1/adb/init/verify'

result.status:

- "OK": 验证通过
- "USB_CLOSED": 设备未连接或未开启 USB 调试
- "USB_UNAUTHORIZED": 未授权 USB 调试
- "ROOT_CLOSED": 未开启或未授权 ROOT

### 初始化手机
> 清理可能存在的 frida-server 老进程
>
> 推送新的 frida-server
>
> 启动 frida-server

curl --location --request POST '127.0.0.1:8848/api/v1/adb/init'

### 获取 App 列表
> 获取 app 信息
curl --location --request GET '127.0.0.1:8848/api/v1/frida/app'

```json
{
    "name": "浏览器",  // app名称
    "package": "com.android.browser",  // 包名
    "version": "17.1.7",  // 版本
    "icon":  "data:image/png;base64",  // b64图像
}
```

### 通过HTTP进行调试(GET)
`http://127.0.0.1:8848/api/v1/frida/hook?app=com.autonavi.minimap&sleep=2&mode=default`

## websocket
> ws://127.0.0.1:8848

### hook
> ws://127.0.0.1:8848/api/v1/frida/hook/ws

### 开始 hook
```json
{
    "type": "start", // 开始hook
    "app": "com.tongcheng.android", // 包名
    "sleep": 2,  // 时间
    "script": "xxxxx" // hook 脚本
}
```

### hook 实时回调
```json
{
    "type": "method_result", // method_result: hook方法回调结果, request_result: 抓包结果, frida_error: frida错误信息
    "data": {} // frida-server 返回的数据
}
```

### 停止 hook
- 断开 ws 连接
- `{"type": "stop"}`

## frida直接测试

`frida -U -f com.tongcheng.android --no-pause -t 10 -l test.js -o test.log`
