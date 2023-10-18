import frida
from threading import Event
from frida.core import Device


def get_device() -> Device:
    mgr = frida.get_device_manager()
    changed = Event()

    def on_changed():
        changed.set()

    mgr.on("changed", on_changed)
    device = None
    while device is None:
        devices = [dev for dev in mgr.enumerate_devices() if dev.type == "usb"]
        if len(devices) == 0:
            print("Waiting for usb device...")
            changed.wait()
        else:
            device = devices[0]
    mgr.off("changed", on_changed)
    return device
