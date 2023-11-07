import os
import time
import platform
import subprocess
from copy import deepcopy
from fastapi import APIRouter
from pydantic import BaseModel
from .command import Command

from internal.response.model import (
    ApiBaseResponse,
    FAILED_PRECONDITION,
    OK,
    USB_CLOSED,
    USB_UNAUTHORIZED,
    ROOT_CLOSED,
)

router = APIRouter(prefix="/adb/init")

class DevicesOptionItem(BaseModel):
    DevicesArchitecture: str = ""  # arm/x86
    IsRemoteDevices: bool = False  # 是否是远程设备
    RemoteDevicesIP: str  = ""  # 远程设备IP
    RemoteDevicesPort: int = ""  # 远程设备端口
    IsNeedSU: bool = True  # 是否需要su才能申请root权限(正常需要, 特殊rom不需要)

@router.post("", response_model=ApiBaseResponse, response_model_exclude_unset=False)
async def init(item: DevicesOptionItem):
    res = deepcopy(OK)
    try:
        cmd = Command(
            item.DevicesArchitecture, 
            item.IsRemoteDevices, 
            item.RemoteDevicesIP, 
            item.RemoteDevicesPort, 
            item.IsNeedSU
            )
        cmd.detecting()
        # https://github.com/zhengjim/camille/pull/32/commits/1be9236d7b0d8d4369ba0e0e84df5c660dc35c87
        # 重启一下 adb, 防止 adb 偶尔抽风
        # 停止 adb
        subprocess.call(cmd.stop_adb_cmd)
        # 启动adb
        subprocess.call(cmd.start_adb_cmd)
        time.sleep(3)
        if item.IsRemoteDevices:
            subprocess.call(cmd.connect_remote_cmd)
            time.sleep(3)
        # https://github.com/zhengjim/camille/pull/32/commits/e3084d92ba0db4206409246d5e8145c9b5820640
        subprocess.call(cmd.devices_cmd)
        # 关闭SELinux
        subprocess.call(cmd.colse_SELinux_cmd)
        # https://github.com/frida/frida/issues/1788 适配ROM
        subprocess.call(cmd.close_usap_cmd)
        # kill 可能残留的进程
        subprocess.call(cmd.kill_cmd)
        time.sleep(2)
        # 清理数据
        subprocess.call(cmd.clean_cmd)
        # 推送 frida-server 到设备
        subprocess.call(cmd.push_cmd)
        time.sleep(3)
        # 移动文件
        subprocess.call(cmd.mv_cmd)
        # 设置权限
        subprocess.call(cmd.chmod_cmd)
        # 启动
        pid = subprocess.Popen(cmd.run_cmd)
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
async def verify(item: DevicesOptionItem):
    res = deepcopy(OK)
    try:
        cmd = Command(
            item.DevicesArchitecture, 
            item.IsRemoteDevices, 
            item.RemoteDevicesIP, 
            item.RemoteDevicesPort, 
            item.IsNeedSU
            )
        cmd.detecting()
        # https://github.com/zhengjim/camille/pull/32/commits/1be9236d7b0d8d4369ba0e0e84df5c660dc35c87
        # 重启一下 adb, 防止 adb 偶尔抽风
        # 停止 adb
        subprocess.call(cmd.stop_adb_cmd)
        # 启动adb
        subprocess.call(cmd.start_adb_cmd)
        time.sleep(3)
        if item.IsRemoteDevices:
            subprocess.call(cmd.connect_remote_cmd)
            time.sleep(3)
        # 确认是否打开了 usb 调试
        result = subprocess.Popen(cmd.devices_cmd, stdout=subprocess.PIPE).communicate()
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
            root_check = subprocess.call(cmd.root_cmd)
            if root_check != 0:
                res = deepcopy(ROOT_CLOSED)
                return res
            return res
    except Exception as e:
        res = deepcopy(FAILED_PRECONDITION)
        res.description = "api错误: " + str(e)
        return res
    return res
