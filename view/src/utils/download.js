import FileSaver from "file-saver";
import { utils, write } from "xlsx";

export function exportJson2Excel(data, fileName, sheetName) {
  const sheet = utils.json_to_sheet(data);
  return FileSaver.saveAs(
    new Blob([sheet2Blob(sheet, sheetName)], {
      type: "application/octet-stream;charset=utf-8",
    }),
    fileName
  );
}

function sheet2Blob(sheet, sheetName) {
  sheetName = sheetName || "sheet1";
  const workbook = {
    SheetNames: [sheetName],
    Sheets: {},
  };
  workbook.Sheets[sheetName] = sheet;
  // 生成excel的配置项
  const wopts = {
    bookType: "xlsx", // 要生成的文件类型
    bookSST: false, // 是否生成Shared String Table，官方解释是，如果开启生成速度会下降，但在低版本IOS设备上有更好的兼容性
    type: "binary",
  };
  const wbout = write(workbook, wopts);
  const blob = new Blob([string2ArrayBuffer(wbout)], {
    type: "application/octet-stream",
  });
  return blob;
}

// 字符串转ArrayBuffer
function string2ArrayBuffer(s) {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < s.length; ++i) {
    view[i] = s.charCodeAt(i) & 0xff;
  }
  return buf;
}

export function formatSize(limit) {
  if (!limit || Number(limit) == 0) return "";
  limit = Number(limit);
  // 将size B转换成 M
  var size = "";
  if (limit < 1 * 1024) {
    //小于1KB，则转化成B
    size = limit.toFixed(2) + "B";
  } else if (limit < 1 * 1024 * 1024) {
    //小于1MB，则转化成KB
    size = (limit / 1024).toFixed(2) + "KB";
  } else if (limit < 1 * 1024 * 1024 * 1024) {
    //小于1GB，则转化成MB
    size = (limit / (1024 * 1024)).toFixed(2) + "MB";
  } else {
    //其他转化成GB
    size = (limit / (1024 * 1024 * 1024)).toFixed(2) + "GB";
  }

  var sizeStr = size + ""; //转成字符串
  var index = sizeStr.indexOf("."); //获取小数点处的索引
  var dou = sizeStr.substr(index + 1, 2); //获取小数点后两位的值
  if (dou == "00") {
    //判断后两位是否为00，如果是则删除00
    return sizeStr.substring(0, index) + sizeStr.substr(index + 3, 2);
  }
  return size;
}
