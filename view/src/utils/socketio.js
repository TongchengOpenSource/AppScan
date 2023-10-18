import { api } from "boot/axios";
import { io } from "socket.io-client";

let socket = null;

function init () {
  socket = io(`${api.defaults.baseURL}/ws`, {
    transports: ["websocket"],
  });
}

function connect () {
  socket.connect();
}

function disconnect () {
  socket.disconnect();
}

// 除了客户端和服务器端主动关闭，其他的都会自动连接的，
// socket.on("disconnect", (reason) => {
//   if (reason === "io server disconnect") {
//     // the disconnection was initiated by the server, you need to reconnect manually
//     socket.connect();
//   }
//   // else the socket will automatically try to reconnect
// });

// 发送内容给服务端
function send (event, data) {
  if (socket == null) {
    init();
  }
  socket.emit(event, data);
}

function receive (event, callback) {
  if (socket == null) {
    init();
  }
  socket.off(event);
  socket.on(event, (data) => {
    callback(data);
  });
}

export default { send, receive, init };
