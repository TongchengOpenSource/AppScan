const Checking = 1;
const Checked = 2;

import { db } from "./init";

// 检测记录(app)入库
async function startPrivacyCheck(appName, appPackage, version, icon) {
  var now = parseInt(new Date().getTime() / 1000);
  var id = await db.records.add({
    createdAt: now,
    updatedAt: now,
    status: Checking,
    appName: appName,
    appPackage: appPackage,
    version: version,
    icon: icon,
  });
  return id;
}

// 检测记录(app)入库
async function stopPrivacyCheck(id) {
  var now = parseInt(new Date().getTime() / 1000);
  await db.records.update(id, {
    updatedAt: now,
    status: Checked,
  });
  return id;
}

// 获取检测记录(app)
// 不带分页
async function getPrivacy() {
  return await db.records.reverse().sortBy("id");
}

// 删除record
async function deleteRecords(id) {
  return await db.records.delete(id);
}

// 获取检测记录
async function getRecord(id) {
  return await db.records.get(Number(id));
}

export {
  startPrivacyCheck,
  getPrivacy,
  stopPrivacyCheck,
  deleteRecords,
  getRecord,
};
