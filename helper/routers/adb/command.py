import os
import platform

class Command:
    def __init__(self, Architecture: str, IsRemoteDevices: bool, RemoteDevicesIP: str, RemoteDevicesPort: int, IsNeedSU: bool):
        # 用户手动配置
        self._devices_architecture = Architecture
        self._is_remote_devices = IsRemoteDevices
        self._remote_devices_ip = RemoteDevicesIP
        self._remote_devices_port = RemoteDevicesPort
        self._is_need_su = IsNeedSU

        # 对外暴露的command
        self.stop_adb_cmd = ""
        self.start_adb_cmd = ""
        self.devices_cmd = ""
        self.colse_SELinux_cmd = ""
        self.close_usap_cmd = ""
        self.kill_cmd = ""
        self.clean_cmd = ""
        self.push_cmd = ""
        self.mv_cmd = ""
        self.chmod_cmd = ""
        self.run_cmd = ""
    
    # 根据配置生成合适的cmd命令
    def detecting(self):
        # 根据本机os生成adb路径
        adb_path = ""
        if platform.system().lower() == "darwin":
            # mac 环境
            adb_path = (
                os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
                + os.sep
                + "static"
                + os.sep
                + "darwin"
                + os.sep
                + "adb"
            )
        else:
            adb_path = (
                os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
                + os.sep
                + "static"
                + os.sep
                + "windows"
                + os.sep
                + "adb.exe"
            )
        # 目前可以确定的命令
        self.stop_adb_cmd = [adb_path, "kill-server"]
        self.start_adb_cmd = [adb_path, "start-server"]
        # 根据设备架构生成frida_server路径
        frida_server = ""
        if self._devices_architecture == "x86":
            frida_server = "hluda-server-x86"
        elif self._devices_architecture == "arm":
            frida_server = "hluda-server-arm64"
        # 生成frida_server路径
        frida_path = (
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
            + os.sep
            + "static"
            + os.sep
            + frida_server
        )



