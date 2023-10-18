import { db } from "./init";
import { getSdkNameByPackage } from "src/utils/sdk";

var typeGroup = {
  获取IMEI: "IMEI",
  "获取IMSI/iccid": "IMSI",
  获取IMSI: "IMSI",
  获取电话当前位置信息: "位置",
  获取基站信息: "位置",
  获取安卓ID: "android id",
  获取设备序列号: "MAC地址",
  获取mac地址: "MAC地址",
  读取剪切板信息: "剪切板",
  获取手机通信录内容: "通讯录",
  获取日历内容: "日历",
  获取相册内容: "相册",
  APP获取了其他app信息: "已安装程序",
  获取了正在运行的App: "已安装程序",
  获取位置信息: "位置",
  调用摄像头: "拍照",
  获取Mac地址: "MAC地址",
  "获取wifi SSID": "WiFi信息",
  "获取wifi BSSID": "WiFi信息",
  获取wifi信息: "WiFi信息",
  获取Mac地址: "MAC地址",
  获取蓝牙设备mac: "MAC地址",
  获取麦克风: "申请权限",
  申请权限: "申请权限",
};

// ++id,createdAt,updatedAt,recordsID,main,action,market,data
// 插入隐私调用数据
async function insertMethodResult (recordsID, main, action, data) {
  var now = parseInt(new Date().getTime() / 1000);
  var type = "";
  if (typeGroup[action]) {
    type = typeGroup[action];
  }
  await db.method.add({
    createdAt: now,
    updatedAt: now,
    recordsID: recordsID,
    main: main,
    action: action,
    data: data,
    type: type,
  });
}

let pageSize = 10;

// 查询隐私调用数据
// 返回id从大到小的数据
// recordsID: 隐私记录 id
// startID: 最小的ID, 传0代表无限制
// type: 类型
async function getMethod (recordsID, startID, startTime, endTime, type, page) {
  // 多条件查询需要联合索引, 比较麻烦, 这里先代码进行筛选
  var datas = await db.method
    .where({
      recordsID: recordsID,
    })
    .reverse()
    .sortBy("id");
  var searchData = [];
  if (startTime == undefined) {
    startTime = 0;
  }
  if (endTime == 0 || endTime == undefined) {
    endTime = parseInt(new Date().getTime() / 1000);
  }
  for (let index = 0; index < datas.length; index++) {
    const element = datas[index];
    if (
      element.createdAt >= startTime &&
      element.createdAt <= endTime &&
      element.id > startID
    ) {
      if (type != "" && element.type != type) {
        continue;
      }
      searchData.push(element);
    }
  }
  if (page != undefined) {
    // 分页
    searchData = searchData.slice((page - 1) * pageSize, page * pageSize);
  }
  //获取sdk_name
  for (let index = 0; index < searchData.length; index++) {
    const element = searchData[index];
    searchData[index].sdk_name = getSdkNameByPackage(element.main);
  }
  return searchData;
}

async function getMethodByRecordsID (recordsID) {
  let searchData = await db.method
    .where({
      recordsID: recordsID,
    })
    .reverse()
    .sortBy("id");
  //获取sdk_name
  for (let index = 0; index < searchData.length; index++) {
    const element = searchData[index];
    searchData[index].sdk_name = getSdkNameByPackage(element.main);
  }
  return searchData;
}

// 获取数据统计
async function getGroup (recordsID, startTime, endTime) {
  // 多条件查询需要联合索引, 比较麻烦, 这里先代码进行筛选
  var datas = await db.method
    .where({
      recordsID: recordsID,
    })
    .reverse()
    .sortBy("id");
  var groupData = [
    { name: "IMEI", count: 0 },
    { name: "IMSI", count: 0 },
    { name: "位置", count: 0 },
    { name: "android id", count: 0 },
    { name: "MAC地址", count: 0 },
    { name: "剪切板", count: 0 },
    { name: "通讯录", count: 0 },
    { name: "日历", count: 0 },
    { name: "相册", count: 0 },
    { name: "已安装程序", count: 0 },
    { name: "拍照", count: 0 },
    { name: "WiFi信息", count: 0 },
    { name: "申请权限", count: 0 },
  ];
  if (startTime == undefined) {
    startTime = 0;
  }
  if (endTime == 0 || endTime == undefined) {
    endTime = parseInt(new Date().getTime() / 1000);
  }
  for (let index = 0; index < datas.length; index++) {
    const element = datas[index];
    if (element.createdAt >= startTime && element.createdAt <= endTime) {
      for (let index = 0; index < groupData.length; index++) {
        const group = groupData[index];
        if (group.name == element.type) {
          groupData[index].count += 1;
        }
      }
    }
  }
  return groupData;
}

// 打标
async function signQuestion (ID, question) {
  await db.method.update(ID, {
    question: question,
  });
}

//删除数据
async function deleteMethod (recordsID) {
  let searchData = await db.method
    .where({
      recordsID: recordsID,
    })
    .reverse()
    .sortBy("id");
  let ids = [];
  for (let index = 0; index < searchData.length; index++) {
    ids.push(searchData[index].id);
  }
  return await db.method.bulkDelete(ids);
}

export {
  insertMethodResult,
  getMethod,
  signQuestion,
  getGroup,
  getMethodByRecordsID,
  deleteMethod,
};
