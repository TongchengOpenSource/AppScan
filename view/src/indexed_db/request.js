import { db } from "./init";

let pageSize = 10;

async function insertRequestResult (
  recordsID,
  type,
  host,
  method,
  request_body,
  session_id,
  http_id,
  status
) {
  var now = parseInt(new Date().getTime() / 1000);
  await db.request.add({
    createdAt: now,
    updatedAt: now,
    type: type, // SSL/HTTP
    recordsID: recordsID,
    host: host,
    method: method,
    status: status,
    request_body: request_body,
    session_id: session_id,
    http_id: http_id,
  });
}

async function upsertRequestResult (
  recordsID,
  type,
  status,
  code,
  response_body,
  session_id,
  http_id
) {
  var now = parseInt(new Date().getTime() / 1000);
  if (type == "SSL") {
    // SSL
    // session_id 分辨
    var requestData = await db.request
      .where({
        session_id: session_id,
      })
      .last();
    if (requestData == undefined) {
      return;
    } else {
      await db.request.update(requestData.id, {
        updatedAt: now,
        response_body: response_body,
        status: status,
        code: code,
      });
    }
  } else if (type == "HTTP") {
    // HTTP
    // port 分辨
    var requestData = await db.request
      .where({
        http_id: http_id,
      })
      .last();
    if (requestData == undefined) {
      return;
      // });
    } else {
      await db.request.update(requestData.id, {
        updatedAt: now,
        response_body: response_body,
        status: status,
        code: code,
      });
    }
  }
}

// 查询抓包数据
async function getRequest (recordsID, startID, host, page) {
  // 多条件查询需要联合索引, 比较麻烦, 这里先代码进行筛选
  var datas = await db.request
    .where({
      recordsID: recordsID,
    })
    .reverse()
    .sortBy("id");
  var searchData = [];
  for (let index = 0; index < datas.length; index++) {
    const element = datas[index];
    if (element.id > startID) {
      if (host == undefined || host == "") {
        searchData.push(element);
      } else if (element.host == host) {
        searchData.push(element);
      }
    }
  }
  if (page != undefined) {
    // 分页
    searchData = searchData.slice((page - 1) * pageSize, page * pageSize);
  }
  return searchData;
}

async function getHost (recordsID) {
  var datas = await db.request
    .where({
      recordsID: recordsID,
    })
    .reverse()
    .sortBy("id");
  var host = [];
  for (let index = 0; index < datas.length; index++) {
    const element = datas[index];
  }
}

async function deleteRequest (recordsID) {
  var datas = await db.request
    .where({
      recordsID: recordsID,
    })
    .reverse()
    .sortBy("id");
  let ids = [];
  for (let index = 0; index < datas.length; index++) {
    ids.push(datas[index].id);
  }
  return await db.request.bulkDelete(ids);
}

export { insertRequestResult, upsertRequestResult, getRequest, deleteRequest };
