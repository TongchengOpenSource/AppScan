import frida
import base64
from copy import deepcopy
from frida.core import Device
from fastapi import APIRouter
from internal.frida.device import get_device

from internal.response.model import ApiBaseResponse, FAILED_PRECONDITION, OK

router = APIRouter(prefix="/frida/app")

is_first = True


@router.get("", response_model=ApiBaseResponse, response_model_exclude_unset=False)
async def getApps():
    res = deepcopy(OK)
    packages = {}
    global is_first
    if is_first == True:
        is_first = False
        res = deepcopy(FAILED_PRECONDITION)
        res.description = "未找到设备: " + "需要初始化"
        return res
    try:
        try:
            device = frida.get_usb_device(timeout=5)
            # device = get_device()
        except:
            device = frida.get_remote_device()
        apps = device.enumerate_applications(scope="full")
    except Exception as e:
        res = deepcopy(FAILED_PRECONDITION)
        res.description = "未找到设备: " + str(e)
        return res
    for i in apps:
        if i.identifier in packages:
            continue
        packages[i.identifier] = 2
        if len(i.parameters["icons"]) != 0:
            i.parameters["icons"][0]["image"] = (
                "data:image/"
                + i.parameters["icons"][0]["format"]
                + ";base64,"
                + base64.b64encode(i.parameters["icons"][0]["image"]).decode("utf-8")
            )
            res.detail.append(
                {
                    "name": i.name,
                    "package": i.identifier,
                    "version": i.parameters["version"],
                    "icon": i.parameters["icons"][0]["image"],
                }
            )
        else:
            res.detail.append(
                {
                    "name": i.name,
                    "package": i.identifier,
                    "version": i.parameters["version"],
                    "icon": "",
                }
            )
    res.count = len(apps)
    return res
