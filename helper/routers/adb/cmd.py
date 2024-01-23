import os
import platform

class Cmd:
    def __init__(self, architecture: str, adbuser: str) -> None:
        self.architecture = architecture
        self.adbuser = adbuser
        # default(win)
        self._adb_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "static", "windows", "adb.exe"))
        # mac
        if platform.system().lower() == "darwin":
            self._adb_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'static', 'darwin', 'adb'))
        if self.architecture == "arm64":
            self._frida_server = "hluda-server-arm64"
        elif self.architecture == "x86":
            self._frida_server = "hluda-server-x86"
