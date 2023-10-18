import { io } from "socket.io-client";
import { data } from "./hook_data";
import { startPrivacyCheck } from "src/indexed_db/records";
import { insertMethodResult } from "src/indexed_db/method";
import { sdk } from "../utils/sdk";

const socket = io("http://127.0.0.1:8848/api/v1/ws", {
  transports: ["websocket"],
});

// 连接服务端
function connect () {
  socket.on("connect", () => {
    alert("已连接服务端");
  });
}

// 开始 hook
function runHook () {
  // 扫描记录入库
  startPrivacyCheck().then((id) => {
    // 返回的id插入数据时有用
    // console.log(id);
  });
  // 发送启动请求
  socket.emit("hook_manager", JSON.stringify(data));
}

// 监听结果
socket.on("hook_result", (data) => {
  // console.log(data);
  var result = JSON.parse(data);
  if (result.type == "helper_error") {
    // error
  } else if (result.type == "helper_success") {
    // hook 成功
    alert("hook success");
  } else {
    // 添加新的数据
    var main = "main";
    for (let index = 0; index < sdk.length; index++) {
      const element = sdk[index];
      if (result.message.payload.stacks.indexOf(element.package_name) !== -1) {
        // 是第三方 sdk
        main = element.package_name;
      }
    }
    insertMethodResult(
      1,
      main,
      result.message.payload.messages,
      result.message.payload.stacks
    );
  }
});

export { connect, runHook };
