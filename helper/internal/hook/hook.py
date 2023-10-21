import time
import uuid
import frida
import logging
import traceback
from queue import Queue
from typing import Optional
from threading import Thread
from frida.core import Device, Session, Script

from .third_party_sdk import ThirdPartySdk
from .hexdump import hexdump

ssl_sessions = {}


class FridaHook:
    def _message_handler(self, message, payload):
        """消息处理"""
        if message["type"] == "error":
            self.queue.put({"type": "frida_error", "data": message})
            self.stop()
            return
        if message["type"] == "send":
            data = message["payload"]
            if data["type"] == "method_result":
                self.queue.put(
                    {
                        "type": "method_result",
                        "data": {
                            "type": "method_result",
                            "message": message,
                            "payload": payload,
                        },
                    }
                )
            elif data["type"] == "app_name":
                my_data = False if data["data"] == self.app_name else True
                self._script.post({"my_data": my_data})
            elif data["type"] == "isHook":
                self._is_hook = True
            elif data["type"] == "noFoundModule":
                self._session.detach()
            elif data["type"] == "request_result":
                gen = hexdump(payload, result="generator", only_str=True)
                str_gen = "".join(gen)
                # self.queue.put({"type": "request_result", "message": message, "payload": str_gen})
                self.queue.put(
                    {
                        "type": "request_result",
                        "data": {
                            "type": "request_result",
                            "message": message,
                            "payload": str_gen,
                        },
                    }
                )

    def _hook(self):
        try:
            device = frida.get_usb_device(timeout=5)
            pid = self.app_name if self.is_attach else device.spawn([self.app_name])
            time.sleep(1)
            self._session = device.attach(pid)
            time.sleep(1)
            if self.wait_time and self.wait_time != 0:
                self.script += "\nsetTimeout(main, {0}000);\n".format(
                    str(self.wait_time)
                )
            else:
                self.script += "\nsetImmediate(main);\n"
            self._script = self._session.create_script(self.script)

            def handler(level, text):
                logging.error(text)

            self._script.set_log_handler(handler)
            self._script.on("message", self._message_handler)
            self._script.load()
            time.sleep(1)
            try:
                if not self.is_attach:
                    device.resume(pid)
            except Exception as e:
                data = traceback.format_exc()
                logging.error(data)
                self.queue.put({"type": "helper_error", "data": data})
                self.wait_time += 1
                self.stop()
        except Exception as e:
            data = traceback.format_exc()
            logging.error(data)
            self.queue.put({"type": "helper_error", "data": data})
            self.stop()

    def start(self, join: bool = False):
        self._hook_thread.start()
        if join:
            self._hook_thread.join()

    def stop(self):
        self.queue.put({"type": "manager", "data": "stop"})
        if self._session != None:
            self._session.detach()

    def __init__(
        self,
        queue: Queue,
        app_name: str,
        script: str,
        wait_time: int = 0,
        is_attach: bool = False,
    ) -> None:
        """
        :param app_name: 包名
        :param wait_time: 延迟hook,避免加壳
        :param is_attach 使用attach hook

        :return:
        """
        self.queue: Queue = queue
        self.app_name: str = app_name
        self.script: str = script
        self.wait_time: int = wait_time
        self.is_attach: bool = is_attach
        self._id: str = uuid.uuid4().hex
        self._hook_thread: Thread = Thread(
            name="frida_hook_" + self._id, target=self._hook, args=(), daemon=True
        )
        self._is_hook: bool = False
        self._tps: ThirdPartySdk = ThirdPartySdk()  # 第三方SDK
        self._session: Optional[Session] = None
        self._device: Optional[Device] = None
        self._script: Optional[Script] = None
