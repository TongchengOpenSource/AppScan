import os
import platform


frida_server_arm = "hluda-server-arm64"
frida_server_x86 = "hluda-server-x86"
# 探测系统和版本
detecting_phone_architecture_cmd = [adb_path, "shell", "su -c 'getprop ro.product.cpu.abi'"]
frida_server = frida_server_arm
frida_path = (
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    + os.sep
    + "static"
    + os.sep
    + frida_server
)
colse_SELinux_cmd = [adb_path, "shell", "su -c 'setenforce 0'"]
kill_cmd = [adb_path, "shell", "su -c 'pkill -9 hluda'"]
clean_cmd = [adb_path, "shell", "su -c 'rm -rf /data/local/tmp/*'"]
push_cmd = [adb_path, "push", frida_path, "/storage/emulated/0/{}".format(frida_server)]
mv_cmd = [
    adb_path,
    "shell",
    "su -c 'mv /storage/emulated/0/{} /data/local/tmp/'".format(frida_server),
]
chmod_cmd = [
    adb_path,
    "shell",
    "su -c 'chmod 777 /data/local/tmp/{}'".format(frida_server),
]
run_cmd = [adb_path, "shell", "su -c 'nohup /data/local/tmp/{} &'".format(frida_server)]
devices_cmd = [adb_path, "devices"]
root_cmd = [adb_path, "shell", "su -c 'exit'"]
# https://github.com/frida/frida/issues/1788
close_usap_cmd = [
    adb_path,
    "shell",
    "su -c 'setprop persist.device_config.runtime_native.usap_pool_enabled false'",
]