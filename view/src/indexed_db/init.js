import { Dexie } from "dexie";
//
// Declare Database
//
const db = new Dexie("app-scan");

// 初始化数据库
function init() {
  try {
    // 创建表
    // 检测记录
    db.version(1).stores({
      records:
        "++id,createdAt,updatedAt,status,appName,appPackage,version,icon,result",
      method:
        "++id,createdAt,updatedAt,*recordsID,*main,action,question,data,*type",
      request:
        "++id,createdAt,updatedAt,*recordsID,type,status,code,*host,method,request_body,response_body,*session_id,*http_id",
      mark: "id,createdAt,updatedAt,result",
    });
  } catch (e) {
    alert(`Error: ${e}`);
  }
}

init();

export { db };
