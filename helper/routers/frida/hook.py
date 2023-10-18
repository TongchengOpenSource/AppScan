import json
import os
import shutil
import logging
import platform
from internal.hook.hook import FridaHook
from fastapi import APIRouter
from typing import Optional
import threading
import asyncio
import socketio
from bidict import bidict
from queue import Queue


router = APIRouter(prefix="/frida/hook")


frida_so = "gadget-android-arm64.so"
frida_so_path = (
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    + os.sep
    + "static"
    + os.sep
    + frida_so
)
home_path = os.path.join(os.path.expanduser("~"), ".cache", "frida")
home_path1 = os.path.join(
    os.path.expanduser("~"),
    "AppData",
    "Local",
    "Microsoft",
    "Windows",
    "INetCache",
    "frida",
)

# default
js_default_path = (
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    + os.sep
    + "default.js"
)  # default windows
if platform.system().lower() == "darwin":
    # mac 环境
    js_default_path = (
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
        + os.sep
        + "default.js"
    )

# custom
js_custom_path = (
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    + os.sep
    + "custom.js"
)  # default windows
if platform.system().lower() == "darwin":
    # mac 环境
    js_custom_path = (
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
        + os.sep
        + "custom.js"
    )


sio = socketio.AsyncServer(
    async_mode="asgi", cors_allowed_origins="*", namespaces="/api/v1/ws"
)


async def hook(sid, data):
    if data["type"] == "start":
        if hooking.is_hooking(sid=sid, app=data["app"]):
            await sio.emit(
                event="hook_result",
                to=sid,
                data={
                    "success": False,
                    "status": 1001,
                    "message": "该 APP 已经检测, 请不要重复检测",
                },
                namespace=sio.namespaces,
            )
            return
        if not os.path.isdir(home_path):
            os.makedirs(home_path)
        shutil.copy(frida_so_path, home_path)
        if not os.path.isdir(home_path1):
            os.makedirs(home_path1)
        shutil.copy(frida_so_path, home_path1)
        q: Queue = Queue()
        f: Optional[FridaHook] = None
        # 启动hook
        # js切换
        js = ""
        if data["mode"] == None:
            data["mode"] = "default"
        if data["mode"] == "default":
            with open(js_default_path, "r", encoding="utf-8") as fr:
                js = fr.read()
        if data["mode"] == "custom":
            with open(js_custom_path, "r", encoding="utf-8") as fr:
                js = fr.read()

        f = FridaHook(q, data["app"], js, data["sleep"], False)
        f.start()
        hook_thread = threading.Thread(
            name="send_data_thread", target=send_data_thread, args=(sid, q), daemon=True
        )
        hook_thread.start()
        hooking.start(
            sid=sid, app=data["app"], data={"q": q, "f": f, "hook_thread": hook_thread}
        )
    elif data["type"] == "stop":
        # 停止 hook
        d = hooking.get_data(sid=sid, app="")
        if d:
            # # d["f"].stop()
            threading.Thread(
                name="stop_hook_thread", target=d["f"].stop, args=(), daemon=True
            ).start()
        hooking.stop(sid=sid, app="")


sio.on("hook_manager", handler=hook, namespace=sio.namespaces)


# 开始连接


async def connect(sid, environ):
    pass


sio.on("connect", handler=connect, namespace=sio.namespaces)

# 断开连接


async def disconnect(sid):
    d = hooking.get_data(sid=sid, app="")
    if d != None:
        d["f"].stop()
        hooking.stop(sid=sid, app="")


sio.on("disconnect", handler=disconnect, namespace=sio.namespaces)


# verify


class Hooking:
    def __init__(self) -> None:
        self._ing = bidict()
        self._data = {}

    def is_hooking(self, sid: str, app: str) -> bool:
        return (sid in self._ing.keys()) or (app in self._ing.inverse.keys())

    def start(self, sid: str, app: str, data: dict):
        self._ing[sid] = app
        self._data[sid] = data

    def stop(self, sid: str, app: str) -> None:
        if sid != "" and sid in self._ing.keys():
            del self._ing[sid]
        elif app != "" and app in self._ing.inverse.keys():
            sid = self._ing.inverse[app]
            del self._ing.inverse[app]
            del self._data[sid]

    def get_data(self, sid: str, app: str):
        if sid != "":
            return self._data.get(sid)
        if app != "":
            sid = self._ing.inverse[app]
            return self._data[sid]


hooking = Hooking()

# 发送结果


async def send_data(sid: str, queue: Queue):
    while 1:
        data = queue.get()
        # print(data)
        if data["type"] == "manager" and data["data"] == "stop":
            await sio.emit(
                event="stop_check",
                to=sid,
                data={
                    "success": True,
                    "status": 200,
                    "message": "停止成功",
                },
                namespace=sio.namespaces,
            )
            hooking.stop(sid=sid, app="")
            return
        elif data["type"] == "frida_error":
            logging.error(data)
            # frida 运行时出现错误
            await sio.emit(
                event="hook_result",
                to=sid,
                data={
                    "success": False,
                    "status": 1002,
                    "message": data["data"]["description"]
                    if "description" in data["data"]
                    else data["data"],
                    "result": data["data"],
                },
                namespace=sio.namespaces,
            )
            hooking.stop(sid=sid, app="")
        elif data["type"] == "helper_error":
            logging.error(data)
            # frida 运行时出现错误
            await sio.emit(
                event="hook_result",
                to=sid,
                data={
                    "success": False,
                    "status": 1001,
                    "message": "检测任务下发失败",
                    "result": data["data"],
                },
                namespace=sio.namespaces,
            )
            hooking.stop(sid=sid, app="")
        else:
            await sio.emit(
                event="hook_result",
                to=sid,
                data={
                    "success": True,
                    "status": 200,
                    "message": "OK",
                    "result": data["data"],
                },
                namespace=sio.namespaces,
            )


def send_data_thread(sid: str, queue: Queue):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(send_data(sid=sid, queue=queue))
    loop.close()


# hook 控制

asgi = socketio.ASGIApp(sio)


from internal.response.model import ApiBaseResponse, FAILED_PRECONDITION, OK
from copy import deepcopy


@router.get("", response_model=ApiBaseResponse, response_model_exclude_unset=False)
async def getApps(app: str, sleep: int, mode: str):
    if not os.path.isdir(home_path):
        os.makedirs(home_path)
    shutil.copy(frida_so_path, home_path)
    if not os.path.isdir(home_path1):
        os.makedirs(home_path1)
    shutil.copy(frida_so_path, home_path1)
    q: Queue = Queue()
    f: Optional[FridaHook] = None
    # 启动hook
    # js切换
    js = ""
    if mode == "":
        mode = "default"
    if mode == "default":
        with open(js_default_path, "r", encoding="utf-8") as fr:
            js = fr.read()
    if mode == "custom":
        with open(js_custom_path, "r", encoding="utf-8") as fr:
            js = fr.read()

    f = FridaHook(q, app, js, sleep, False)
    f.start()
    hook_thread = threading.Thread(
        name="send_data_thread", target=send_data_thread, args=(app, q), daemon=True
    )
    hook_thread.start()
    hooking.start(sid=app, app=app, data={"q": q, "f": f, "hook_thread": hook_thread})
    return deepcopy(OK)
