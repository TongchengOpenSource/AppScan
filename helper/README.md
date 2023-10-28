# app-scan-view-helper

# python version

3.10.X

# frida version

> <https://github.com/hzzheyang/strongR-frida-android/releases>

16.1.4

# adb version

> <https://developer.android.com/studio/releases/platform-tools>

RC34.0.5

# powered by

<https://github.com/zhengjim/camille>

1d2417586edc3ad72e074ada7708a4b25df8d36c

<https://github.com/r0ysue/r0capture>

dde9db09281715eb636bd87faec2bba8878a4b1e


# helper build

pip install -r requirements.txt

pyinstaller ./main.spec

# server start

adb shell "su -c '/data/local/tmp/frida-server-arm64 &'"

# kill frida-server

> <https://blog.csdn.net/yizhuanlu9607/article/details/85101860>

adb shell "su -c 'killall -9 frida-server-arm64'"
