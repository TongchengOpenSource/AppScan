import { getMethodByRecordsID, deleteMethod } from "src/indexed_db/method";
import { deleteMark, getMark } from "src/indexed_db/mark";
import { deleteRecords } from "src/indexed_db/records";
import { deleteRequest } from "src/indexed_db/request";
import { list } from "./ruleData";
//处理生成App sdk 获取个人信息列表
export async function makeAppAndSdkGetInformation(recordIds) {
  let methods = await getMethodByRecordsID(recordIds);
  let apps = [];
  let sdks = [];
  for (let index = 0; index < methods.length; index++) {
    const method = methods[index];
    if (method.main == "main") {
      apps.push(method);
    } else {
      sdks.push(method);
    }
  }
  return { apps: apps, sdks: sdks };
}

//删除操作记录
export async function deleteRecordAll(recordIds) {
  deleteMethod(recordIds);
  deleteMark(recordIds);
  deleteRequest(recordIds);
  deleteRecords(recordIds);
}

//查询风险列表
export async function getRiskData(recordIds) {
  let data = [];
  let marks = await getMark(recordIds);
  let resultMap = {};
  if (marks.length > 0) {
    resultMap = marks[0].result;
  }

  for (let index = 0; index < list.length; index++) {
    if (resultMap[list[index].id] && list[index].option == 0) {
      list[index].options = [
        { label: list[index].okText, value: 1 },
        { label: list[index].failText, value: 0 },
        { label: "待检测", value: -1 },
      ];
      data.push(list[index]);
    }
  }
  return data;
}
