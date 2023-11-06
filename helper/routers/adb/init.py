import os
import time
import platform
import subprocess
from copy import deepcopy
from fastapi import APIRouter
from pydantic import BaseModel

from internal.response.model import (
    ApiBaseResponse,
    FAILED_PRECONDITION,
    OK,
    USB_CLOSED,
    USB_UNAUTHORIZED,
    ROOT_CLOSED,
)

router = APIRouter(prefix="/adb/init")

def detecting_phone_architecture():
    # 检测手机架构
    global frida_server
    result = subprocess.Popen(detecting_phone_architecture_cmd, stdout=subprocess.PIPE).communicate()
    outdata = result[0].decode("utf-8")
    if "arm" in outdata:
        frida_server = frida_server_arm
    elif "x86" in outdata:
        frida_server = frida_server_x86
    else:
        raise Exception("手机架构不支持", outdata)
    return frida_server

class InitItem(BaseModel):
    DevicesArchitecture: str = ""  # arm/x86
    IsRemoteDevices: bool = False  # 是否是远程设备
    RemoteDevicesIP: str  = ""  # 远程设备IP
    RemoteDevicesPort: int = ""  # 远程设备端口
    IsNeedSU: bool = True  # 是否需要su才能申请root权限(正常需要, 特殊rom不需要)

@router.post("", response_model=ApiBaseResponse, response_model_exclude_unset=False)
async def init(item: InitItem):
    res = deepcopy(OK)
    try:
        # https://github.com/zhengjim/camille/pull/32/commits/1be9236d7b0d8d4369ba0e0e84df5c660dc35c87
        # 重启一下 adb, 防止 adb 偶尔抽风
        # 停止 adb
        subprocess.call(stop_adb_cmd)
        # 启动adb
        subprocess.call(start_adb_cmd)
        time.sleep(5)
        # https://github.com/zhengjim/camille/pull/32/commits/e3084d92ba0db4206409246d5e8145c9b5820640
        subprocess.call(devices_cmd)
        # 关闭SELinux
        subprocess.call(colse_SELinux_cmd)
        # https://github.com/frida/frida/issues/1788 适配ROM
        subprocess.call(close_usap_cmd)
        # kill 可能残留的进程
        subprocess.call(kill_cmd)
        time.sleep(2)
        # 获取手机架构
        detecting_phone_architecture()
        generation_cmd()
        # 清理数据
        subprocess.call(clean_cmd)
        # 推送 frida-server 到设备
        subprocess.call(push_cmd)
        time.sleep(3)
        # 移动文件
        subprocess.call(mv_cmd)
        # 设置权限
        subprocess.call(chmod_cmd)
        # 启动
        pid = subprocess.Popen(run_cmd)
        time.sleep(5)
        pid.kill()
    except Exception as e:
        res = deepcopy(FAILED_PRECONDITION)
        res.description = "初始化错误: " + str(e)
        return res
    return res


@router.get(
    "/verify", response_model=ApiBaseResponse, response_model_exclude_unset=False
)
async def verify():
    res = deepcopy(OK)
    try:
        # 确认是否打开了 usb 调试
        result = subprocess.Popen(devices_cmd, stdout=subprocess.PIPE).communicate()
        if (
            result[0].decode("utf-8").split("\n")[1] == ""
            or result[0].decode("utf-8").split("\n")[1] == "\r"
        ):  # 兼容win
            # 未打开 USB 调试
            # 设备未连接
            res = deepcopy(USB_CLOSED)
            return res
        if result[0].decode("utf-8").split("\n")[1].split()[1] == "unauthorized":
            # 未打开 USB 调试
            # 设备未连接
            res = deepcopy(USB_UNAUTHORIZED)
            return res
        if result[0].decode("utf-8").split("\n")[1].split()[1] == "device":
            root_check = subprocess.call(root_cmd)
            if root_check != 0:
                res = deepcopy(ROOT_CLOSED)
                return res
            return res
    except Exception as e:
        res = deepcopy(FAILED_PRECONDITION)
        res.description = "api错误: " + str(e)
        return res
    return res
