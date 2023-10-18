import { db } from "./init";

let pageSize = 10;

async function insertMarkResult(recordsID, result) {
  var now = parseInt(new Date().getTime() / 1000);
  return await db.mark.add({
    id: recordsID,
    createdAt: now,
    updatedAt: now,
    result: result,
  });
}

async function upsertMarkResult(id, ruleId, option, suggest) {
  var now = parseInt(new Date().getTime() / 1000);
  let update = { updatedAt: now };
  update["result." + ruleId + ".option"] = option;
  update["result." + ruleId + ".suggest"] = suggest;
  return await db.mark.update(id, update);
}

// 查询打标数据
async function getMark(recordsID, startID, page) {
  // 多条件查询需要联合索引, 比较麻烦, 这里先代码进行筛选
  var datas = await db.mark
    .where({
      id: recordsID,
    })
    .reverse()
    .sortBy("id");
  var searchData = [];
  if (startID) {
    for (let index = 0; index < datas.length; index++) {
      const element = datas[index];
      if (element.id > startID) {
        searchData.push(element);
      }
    }
  } else {
    searchData = datas;
  }

  if (page != undefined) {
    // 分页
    searchData = searchData.slice((page - 1) * pageSize, page * pageSize);
  }
  return searchData;
}

//删除打标数据
async function deleteMark(recordsID) {
  return await db.mark.delete(recordsID);
}

export { insertMarkResult, upsertMarkResult, getMark, deleteMark };
