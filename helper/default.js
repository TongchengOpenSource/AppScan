// https://github.com/zhengjim/camille

// 绕过TracerPid检测
var ByPassTracerPid = function () {
    var fgetsPtr = Module.findExportByName('libc.so', 'fgets');
    var fgets = new NativeFunction(fgetsPtr, 'pointer', ['pointer', 'int', 'pointer']);
    Interceptor.replace(fgetsPtr, new NativeCallback(function (buffer, size, fp) {
        var retval = fgets(buffer, size, fp);
        var bufstr = Memory.readUtf8String(buffer);
        if (bufstr.indexOf('TracerPid:') > -1) {
            Memory.writeUtf8String(buffer, 'TracerPid:\t0');
            console.log('tracerpid replaced: ' + Memory.readUtf8String(buffer));
        }
        return retval;
    }, 'pointer', ['pointer', 'int', 'pointer']));
};

// 获取调用链
function getStackTrace() {
    var Exception = Java.use('java.lang.Exception');
    var ins = Exception.$new('Exception');
    var straces = ins.getStackTrace();
    if (undefined == straces || null == straces) {
        return;
    }
    var result = '';
    for (var i = 0; i < straces.length; i++) {
        var str = '   ' + straces[i].toString();
        result += str + '\r\n';
    }
    Exception.$dispose();
    return result;
}

function get_format_time() {
    var myDate = new Date();

    return myDate.getFullYear() + '-' + myDate.getMonth() + '-' + myDate.getDate() + ' ' + myDate.getHours() + ':' + myDate.getMinutes() + ':' + myDate.getSeconds();
}

//告警发送
function alertSend(action, messages, arg) {
    var _time = get_format_time();
    send({
        'type': 'method_result',
        'time': _time,
        'action': action,
        'messages': messages,
        'arg': arg,
        'stacks': getStackTrace()
    });
}

// 抓包信息发送
function requestSend(action, messages, arg) {
    var _time = get_format_time();
    send({
        'type': 'request_result',
        'time': _time,
        'action': action,
        'messages': messages,
        'arg': arg,
        'stacks': getStackTrace()
    }, arg);
}

// 增强健壮性，避免有的设备无法使用 Array.isArray 方法
if (!Array.isArray) {
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}

// hook方法
function hookMethod(targetClass, targetMethod, targetArgs, action, messages) {
    try {
        var _Class = Java.use(targetClass);
    } catch (e) {
        return false;
    }

    if (targetMethod == '$init') {
        var overloadCount = _Class.$init.overloads.length;
        for (var i = 0; i < overloadCount; i++) {
            _Class.$init.overloads[i].implementation = function () {
                var temp = this.$init.apply(this, arguments);
                // 是否含有需要过滤的参数
                var argumentValues = Object.values(arguments);
                if (Array.isArray(targetArgs) && targetArgs.length > 0 && !targetArgs.every(item => argumentValues.includes(item))) {
                    return null;
                }
                var arg = '';
                for (var j = 0; j < arguments.length; j++) {
                    arg += '参数' + j + '：' + JSON.stringify(arguments[j]) + '\r\n';
                }
                if (arg.length == 0) arg = '无参数';
                else arg = arg.slice(0, arg.length - 1);
                alertSend(action, messages, arg);
                return temp;
            }
        }
    } else {
        try {
            var overloadCount = _Class[targetMethod].overloads.length;
        } catch (e) {
            console.log(e)
            console.log('[*] hook(' + targetMethod + ')方法失败,请检查该方法是否存在！！！');
            return false;
        }
        for (var i = 0; i < overloadCount; i++) {
            _Class[targetMethod].overloads[i].implementation = function () {
                var temp = this[targetMethod].apply(this, arguments);
                // 是否含有需要过滤的参数
                var argumentValues = Object.values(arguments);
                if (Array.isArray(targetArgs) && targetArgs.length > 0 && !targetArgs.every(item => argumentValues.includes(item))) {
                    return null;
                }
                var arg = '';
                for (var j = 0; j < arguments.length; j++) {
                    arg += '参数' + j + '：' + JSON.stringify(arguments[j]) + '\r\n';
                }
                if (arg.length == 0) arg = '无参数';
                else arg = arg.slice(0, arg.length - 1);
                alertSend(action, messages, arg);
                return temp;
            }
        }
    }
    return true;
}

// hook方法(去掉不存在方法）
function hook(targetClass, methodData) {
    try {
        var _Class = Java.use(targetClass);
    } catch (e) {
        return false;
    }
    var methods = _Class.class.getDeclaredMethods();
    _Class.$dispose;
    // 排查掉不存在的方法，用于各个android版本不存在方法报错问题。
    methodData.forEach(function (methodData) {
        for (var i in methods) {
            if (methods[i].toString().indexOf('.' + methodData['methodName'] + '(') != -1 || methodData['methodName'] == '$init') {
                hookMethod(targetClass, methodData['methodName'], methodData['args'], methodData['action'], methodData['messages']);
                break;
            }
        }
    });
}

// hook获取其他app信息api，排除app自身
function hookApplicationPackageManagerExceptSelf(targetMethod, action) {
    var _ApplicationPackageManager = Java.use('android.app.ApplicationPackageManager');
    try {
        try {
            var overloadCount = _ApplicationPackageManager[targetMethod].overloads.length;
        } catch (e) {
            return false;
        }
        for (var i = 0; i < overloadCount; i++) {
            _ApplicationPackageManager[targetMethod].overloads[i].implementation = function () {
                var temp = this[targetMethod].apply(this, arguments);
                var arg = '';
                for (var j = 0; j < arguments.length; j++) {
                    if (j === 0) {
                        var string_to_recv;
                        send({'type': 'app_name', 'data': arguments[j]});
                        // recv(function (received_json_object) {
                        //     string_to_recv = received_json_object.my_data;
                        // }).wait();
                        // TODO 模拟器适配
                        recv(function (received_json_object) {
                            string_to_recv = received_json_object.my_data;
                        });
                    }
                    arg += '参数' + j + '：' + JSON.stringify(arguments[j]) + '\r\n';
                }
                if (arg.length == 0) arg = '无参数';
                else arg = arg.slice(0, arg.length - 1);
                if (string_to_recv) {
                    alertSend(action, targetMethod + '获取的数据为：' + temp, arg);
                }
                return temp;
            }
        }
    } catch (e) {
        console.log(e);
        return
    }


}

// 申请权限
function checkRequestPermission() {
    var action = '申请权限';

    //老项目
    hook('android.support.v4.app.ActivityCompat', [
        {'methodName': 'requestPermissions', 'action': action, 'messages': '申请具体权限看"参数1"'}
    ]);

    hook('androidx.core.app.ActivityCompat', [
        {'methodName': 'requestPermissions', 'action': action, 'messages': '申请具体权限看"参数1"'}
    ]);
}

// 获取电话相关信息
function getPhoneState() {
    var action = '获取电话相关信息';

    hook('android.telephony.TelephonyManager', [
        // Android 8.0
        {'methodName': 'getDeviceId', 'action': action, 'messages': '获取IMEI'},
        // Android 8.1、9   android 10获取不到
        {'methodName': 'getImei', 'action': action, 'messages': '获取IMEI'},

        {'methodName': 'getMeid', 'action': action, 'messages': '获取MEID'},
        {'methodName': 'getLine1Number', 'action': action, 'messages': '获取电话号码标识符'},
        {'methodName': 'getSimSerialNumber', 'action': action, 'messages': '获取IMSI/iccid'},
        {'methodName': 'getSubscriberId', 'action': action, 'messages': '获取IMSI'},
        {'methodName': 'getSimOperator', 'action': action, 'messages': '获取MCC/MNC'},
        {'methodName': 'getNetworkOperator', 'action': action, 'messages': '获取MCC/MNC'},
        {'methodName': 'getSimCountryIso', 'action': action, 'messages': '获取SIM卡国家代码'},

        {'methodName': 'getCellLocation', 'action': action, 'messages': '获取电话当前位置信息'},
        {'methodName': 'getAllCellInfo', 'action': action, 'messages': '获取电话当前位置信息'},
        {'methodName': 'requestCellInfoUpdate', 'action': action, 'messages': '获取基站信息'},
        {'methodName': 'getServiceState', 'action': action, 'messages': '获取sim卡是否可用'},
    ]);

    // 电信卡cid lac
    hook('android.telephony.cdma.CdmaCellLocation', [
        {'methodName': 'getBaseStationId', 'action': action, 'messages': '获取基站cid信息'},
        {'methodName': 'getNetworkId', 'action': action, 'messages': '获取基站lac信息'}
    ]);

    // 移动联通卡 cid/lac
    hook('android.telephony.gsm.GsmCellLocation', [
        {'methodName': 'getCid', 'action': action, 'messages': '获取基站cid信息'},
        {'methodName': 'getLac', 'action': action, 'messages': '获取基站lac信息'}
    ]);

    // 短信
    hook('android.telephony.SmsManager', [
        {'methodName': 'sendTextMessageInternal', 'action': action, 'messages': '获取短信信息-发送短信'},
        {'methodName': 'getDefault', 'action': action, 'messages': '获取短信信息-发送短信'},
        {'methodName': 'sendTextMessageWithSelfPermissions', 'action': action, 'messages': '获取短信信息-发送短信'},
        {'methodName': 'sendMultipartTextMessageInternal', 'action': action, 'messages': '获取短信信息-发送短信'},
        {'methodName': 'sendDataMessage', 'action': action, 'messages': '获取短信信息-发送短信'},
        {'methodName': 'sendDataMessageWithSelfPermissions', 'action': action, 'messages': '获取短信信息-发送短信'},
    ]);

}

// 系统信息(AndroidId/标识/content敏感信息)
function getSystemData() {
    var action = '获取系统信息';

    hook('android.provider.MediaStore.Images.Media', [
        {'methodName': 'query', 'action': action, 'messages': '获取相册信息'},
    ]);

    hook('android.provider.Settings$Secure', [
        {'methodName': 'getString', 'args': ['android_id'], 'action': action, 'messages': '获取安卓ID'}
    ]);
    hook('android.provider.Settings$System', [
        {'methodName': 'getString', 'args': ['android_id'], 'action': action, 'messages': '获取安卓ID'}
    ]);
    // hook('android.provider.Settings$NameValueCache', [
    //     {'methodName': 'getStringForUser', 'action': action, 'messages': '获取安卓ID'},
    // ]);



    hook('android.os.Build', [
        {'methodName': 'getSerial', 'action': action, 'messages': '获取设备序列号'},
    ]);

    hook('android.app.admin.DevicePolicyManager', [
        {'methodName': 'getWifiMacAddress', 'action': action, 'messages': '获取mac地址'},
    ]);

    hook('android.content.ClipboardManager', [
        {'methodName': 'getPrimaryClip', 'action': action, 'messages': '读取剪切板信息'},
        {'methodName': 'setPrimaryClip', 'action': action, 'messages': '写入剪切板信息'},
    ]);

    hook('android.telephony.UiccCardInfo', [
        {'methodName': 'getIccId', 'action': action, 'messages': '读取手机IccId信息'},
    ]);

    //小米
    hook('com.android.id.impl.IdProviderImpl', [
        {'methodName': 'getUDID', 'action': action, 'messages': '读取小米手机UDID'},
        {'methodName': 'getOAID', 'action': action, 'messages': '读取小米手机OAID'},
        {'methodName': 'getVAID', 'action': action, 'messages': '读取小米手机VAID'},
        {'methodName': 'getAAID', 'action': action, 'messages': '读取小米手机AAID'},
    ]);

    //三星
    hook('com.samsung.android.deviceidservice.IDeviceIdService$Stub$Proxy', [
        {'methodName': 'getOAID', 'action': action, 'messages': '读取三星手机OAID'},
        {'methodName': 'getVAID', 'action': action, 'messages': '读取三星手机VAID'},
        {'methodName': 'getAAID', 'action': action, 'messages': '读取三星手机AAID'},
    ]);

    hook('repeackage.com.samsung.android.deviceidservice.IDeviceIdService$Stub$Proxy', [
        {'methodName': 'getOAID', 'action': action, 'messages': '读取三星手机OAID'},
        {'methodName': 'getVAID', 'action': action, 'messages': '读取三星手机VAID'},
        {'methodName': 'getAAID', 'action': action, 'messages': '读取三星手机AAID'},
    ]);

    //获取content敏感信息
    try {
        // 通讯录内容
        var ContactsContract = Java.use('android.provider.ContactsContract');
        var contact_authority = ContactsContract.class.getDeclaredField('AUTHORITY').get('java.lang.Object');
    } catch (e) {
        console.log(e)
    }
    try {
        // 日历内容
        var CalendarContract = Java.use('android.provider.CalendarContract');
        var calendar_authority = CalendarContract.class.getDeclaredField('AUTHORITY').get('java.lang.Object');
    } catch (e) {
        console.log(e)
    }
    try {
        // 浏览器内容
        var BrowserContract = Java.use('android.provider.BrowserContract');
        var browser_authority = BrowserContract.class.getDeclaredField('AUTHORITY').get('java.lang.Object');
    } catch (e) {
        console.log(e)
    }
    try {
        // 相册内容
        var MediaStore = Java.use('android.provider.MediaStore');
        var media_authority = MediaStore.class.getDeclaredField('AUTHORITY').get('java.lang.Object');
    } catch (e) {
        console.log(e)
    }
    try {
        var ContentResolver = Java.use('android.content.ContentResolver');
        var queryLength = ContentResolver.query.overloads.length;
        for (var i = 0; i < queryLength; i++) {
            ContentResolver.query.overloads[i].implementation = function () {
                var temp = this.query.apply(this, arguments);
                if (arguments[0].toString().indexOf(contact_authority) != -1) {
                    alertSend(action, '获取手机通信录内容', '');
                } else if (arguments[0].toString().indexOf(calendar_authority) != -1) {
                    alertSend(action, '获取日历内容', '');
                } else if (arguments[0].toString().indexOf(browser_authority) != -1) {
                    alertSend(action, '获取浏览器内容', '');
                } else if (arguments[0].toString().indexOf(media_authority) != -1) {
                    alertSend(action, '获取相册内容', '');
                }
                return temp;
            }
        }
    } catch (e) {
        console.log(e);
        return
    }
}

//获取其他app信息
function getPackageManager() {
    var action = '获取其他app信息';

    hook('android.content.pm.PackageManager', [
        {'methodName': 'getInstalledPackages', 'action': action, 'messages': 'APP获取了其他app信息'},
        {'methodName': 'getInstalledApplications', 'action': action, 'messages': 'APP获取了其他app信息'}
    ]);

    hook('android.app.ApplicationPackageManager', [
        {'methodName': 'getInstalledPackages', 'action': action, 'messages': 'APP获取了其他app信息'},
        {'methodName': 'getInstalledApplications', 'action': action, 'messages': 'APP获取了其他app信息'},
        {'methodName': 'queryIntentActivities', 'action': action, 'messages': 'APP获取了其他app信息'},
    ]);

    hook('android.app.ActivityManager', [
        {'methodName': 'getRunningAppProcesses', 'action': action, 'messages': '获取了正在运行的App'},
        {'methodName': 'getRunningServiceControlPanel', 'action': action, 'messages': '获取了正在运行的服务面板'},
    ]);
    hook('android.app.ApplicationPackageManager', [
        {'methodName': 'getPackageInfoAsUser', 'action': action, 'messages': '获取已安装的app信息'},
    ])

    //需排除应用本身
    hookApplicationPackageManagerExceptSelf('getApplicationInfo', action);
    hookApplicationPackageManagerExceptSelf('getPackageInfoAsUser', action);
    hookApplicationPackageManagerExceptSelf('getInstallerPackageName', action);
}

// 获取位置信息
function getGSP() {
    var action = '获取位置信息';

    hook('android.location.LocationManager', [
        {'methodName': 'requestLocationUpdates', 'action': action, 'messages': action},
        {'methodName': 'getLastKnownLocation', 'action': action, 'messages': action},
        {'methodName': 'getBestProvider', 'action': action, 'messages': action},
        {'methodName': 'getGnssHardwareModelName', 'action': action, 'messages': action},
        {'methodName': 'getGnssYearOfHardware', 'action': action, 'messages': action},
        {'methodName': 'getProvider', 'action': action, 'messages': action},
        {'methodName': 'requestSingleUpdate', 'action': action, 'messages': action},
        {'methodName': 'getCurrentLocation', 'action': action, 'messages': action},
    ]);

    hook('android.location.Location', [
        {'methodName': 'getAccuracy', 'action': action, 'messages': action},
        {'methodName': 'getAltitude', 'action': action, 'messages': action},
        {'methodName': 'getBearing', 'action': action, 'messages': action},
        {'methodName': 'getBearingAccuracyDegrees', 'action': action, 'messages': action},
        {'methodName': 'getElapsedRealtimeNanos', 'action': action, 'messages': action},
        {'methodName': 'getExtras', 'action': action, 'messages': action},
        {'methodName': 'getLatitude', 'action': action, 'messages': action},
        {'methodName': 'getLongitude', 'action': action, 'messages': action},
        {'methodName': 'getProvider', 'action': action, 'messages': action},
        {'methodName': 'getSpeed', 'action': action, 'messages': action},
        {'methodName': 'getSpeedAccuracyMetersPerSecond', 'action': action, 'messages': action},
        {'methodName': 'getTime', 'action': action, 'messages': action},
        {'methodName': 'getVerticalAccuracyMeters', 'action': action, 'messages': action},
    ]);

    hook('android.location.Geocoder', [
        {'methodName': 'getFromLocation', 'action': action, 'messages': action},
        {'methodName': 'getFromLocationName', 'action': action, 'messages': action},
    ]);

}

// 调用摄像头(hook，防止静默拍照)
function getCamera() {
    var action = '调用摄像头';

    hook('android.hardware.Camera', [
        {'methodName': 'open', 'action': action, 'messages': action},
    ]);

    hook('android.hardware.camera2.CameraManager', [
        {'methodName': 'openCamera', 'action': action, 'messages': action},
    ]);

    hook('androidx.camera.core.ImageCapture', [
        {'methodName': 'takePicture', 'action': action, 'messages': '调用摄像头拍照'},
    ]);

}

//获取网络信息
function getNetwork() {
    var action = '获取网络信息';

    hook('android.net.wifi.WifiInfo', [
        {'methodName': 'getMacAddress', 'action': action, 'messages': '获取Mac地址'},
        {'methodName': 'getSSID', 'action': action, 'messages': '获取wifi SSID'},
        {'methodName': 'getBSSID', 'action': action, 'messages': '获取wifi BSSID'},
    ]);

    hook('android.net.wifi.WifiManager', [
        {'methodName': 'getConnectionInfo', 'action': action, 'messages': '获取wifi信息'},
        {'methodName': 'getConfiguredNetworks', 'action': action, 'messages': '获取wifi信息'},
        {'methodName': 'getScanResults', 'action': action, 'messages': '获取wifi信息'},
        {'methodName': 'getWifiState', 'action': action, 'messages': '获取wifi状态信息'},
    ]);

    hook('java.net.InetAddress', [
        {'methodName': 'getHostAddress', 'action': action, 'messages': '获取IP地址'},
        {'methodName': 'getAddress', 'action': action, 'messages': '获取网络address信息'},
        {'methodName': 'getHostName', 'action': action, 'messages': '获取网络hostname信息'},
    ]);

    hook('java.net.Inet4Address', [
        {'methodName': 'getHostAddress', 'action': action, 'messages': '获取IP地址'},
    ]);

    hook('java.net.Inet6Address', [
        {'methodName': 'getHostAddress', 'action': action, 'messages': '获取IP地址'},
    ]);

    hook('java.net.NetworkInterface', [
        {'methodName': 'getHardwareAddress', 'action': action, 'messages': '获取Mac地址'}
    ]);

    hook('android.net.NetworkInfo', [
        {'methodName': 'getType', 'action': action, 'messages': '获取网络类型'},
        {'methodName': 'getTypeName', 'action': action, 'messages': '获取网络类型名称'},
        {'methodName': 'getExtraInfo', 'action': action, 'messages': '获取网络名称'},
        {'methodName': 'isAvailable', 'action': action, 'messages': '获取网络是否可用'},
        {'methodName': 'isConnected', 'action': action, 'messages': '获取网络是否连接'},
    ]);

    hook('android.net.ConnectivityManager', [
        {'methodName': 'getActiveNetworkInfo', 'action': action, 'messages': '获取网络状态信息'},
    ]);

    hook('java.net.InetSocketAddress', [
        {'methodName': 'getHostAddress', 'action': action, 'messages': '获取网络hostaddress信息'},
        {'methodName': 'getAddress', 'action': action, 'messages': '获取网络address信息'},
        {'methodName': 'getHostName', 'action': action, 'messages': '获取网络hostname信息'},
    ]);

    // ip地址
    try {
        var _WifiInfo = Java.use('android.net.wifi.WifiInfo');
        //获取ip
        _WifiInfo.getIpAddress.implementation = function () {
            var temp = this.getIpAddress();
            var _ip = new Array();
            _ip[0] = (temp >>> 24) >>> 0;
            _ip[1] = ((temp << 8) >>> 24) >>> 0;
            _ip[2] = (temp << 16) >>> 24;
            _ip[3] = (temp << 24) >>> 24;
            var _str = String(_ip[3]) + "." + String(_ip[2]) + "." + String(_ip[1]) + "." + String(_ip[0]);
            alertSend(action, '获取IP地址：' + _str, '');
            return temp;
        }
    } catch (e) {
        console.log(e)
    }
}

//获取蓝牙设备信息
function getBluetooth() {
    var action = '获取蓝牙设备信息';

    hook('android.bluetooth.BluetoothDevice', [
        {'methodName': 'getName', 'action': action, 'messages': '获取蓝牙设备名称'},
        {'methodName': 'getAddress', 'action': action, 'messages': '获取蓝牙设备mac'},
    ]);

    hook('android.bluetooth.BluetoothAdapter', [
        {'methodName': 'getName', 'action': action, 'messages': '获取蓝牙设备名称'}
    ]);
}

//读写文件
function getFileMessage() {
    var action = '文件操作';

    hook('java.io.RandomAccessFile', [
        {'methodName': '$init', 'action': action, 'messages': 'RandomAccessFile写文件'}
    ]);
    // hook('java.io.File', [
    //     {'methodName': 'mkdirs', 'action': action, 'messages': '尝试写入sdcard创建小米市场审核可能不通过'},
    //     {'methodName': 'mkdir', 'action': action, 'messages': '尝试写入sdcard创建小米市场审核可能不通过'}
    // ]);
}

//获取麦克风信息
function getMedia() {
    var action = '获取麦克风'

    hook('android.media.MediaRecorder', [
        {'methodName': 'start', 'action': action, 'messages': '获取麦克风'},
    ]);
    hook('android.media.AudioRecord', [
        {'methodName': 'startRecording', 'action': action, 'messages': '获取麦克风'},
    ]);
}

//获取传感器信息
function getSensor() {
    var action = '获取传感器信息'

    hook('android.hardware.SensorManager', [
        {'methodName': 'getSensorList', 'action': action, 'messages': '获取传感器信息'},
    ]);

}

function customHook() {
    var action = '用户自定义hook';

    //自定义hook函数，可自行添加。格式如下：
    // hook('com.zhengjim.myapplication.HookTest', [
    //     {'methodName': 'getPassword', 'action': action, 'messages': '获取zhengjim密码'},
    //     {'methodName': 'getUser', 'action': action, 'messages': '获取zhengjim用户名'},
    // ]);
}

function useModule(moduleList) {
    var _module = {
        'permission': [checkRequestPermission],
        'phone': [getPhoneState],
        'system': [getSystemData],
        'app': [getPackageManager],
        'location': [getGSP],
        'network': [getNetwork],
        'camera': [getCamera],
        'bluetooth': [getBluetooth],
        'file': [getFileMessage],
        'media': [getMedia],
        'sensor': [getSensor],
        'custom': [customHook]
    };
    var _m = Object.keys(_module);
    var tmp_m = []
    if (moduleList['type'] !== 'all') {
        var input_module_data = moduleList['data'].split(',');
        for (i = 0; i < input_module_data.length; i++) {
            if (_m.indexOf(input_module_data[i]) === -1) {
                send({'type': 'noFoundModule', 'data': input_module_data[i]})
            } else {
                tmp_m.push(input_module_data[i])
            }
        }
    }
    switch (moduleList['type']) {
        case 'use':
            _m = tmp_m;
            break;
        case 'nouse':
            for (var i = 0; i < input_module_data.length; i++) {
                for (var j = 0; j < _m.length; j++) {
                    if (_m[j] == input_module_data[i]) {
                        _m.splice(j, 1);
                        j--;
                    }
                }
            }
            break;
    }
    send({'type': 'loadModule', 'data': _m})
    if (_m.length !== 0) {
        for (i = 0; i < _m.length; i++) {
            for (j = 0; j < _module[_m[i]].length; j++) {
                _module[_m[i]][j]();
            }
        }
    }
}

function main() {
    try {
        // Java.perform(function () {
        //     console.log('[*] ' + get_format_time() + ' 隐私合规检测敏感接口开始监控...');
        //     send({"type": "isHook"})
        //     console.log('[*] ' + get_format_time() + ' 检测到安卓版本：' + Java.androidVersion);
        //     var moduleList;
        //     recv(function (received_json_object) {
        //         moduleList = received_json_object.use_module;
        //     }).wait();
        //     useModule(moduleList);
        // });
        // TODO 模拟器适配
        Java.perform(function () {
            console.log('[*] ' + get_format_time() + ' 隐私合规检测敏感接口开始监控...');
            send({"type": "isHook"})
            console.log('[*] ' + get_format_time() + ' 检测到安卓版本：' + Java.androidVersion);
            useModule({"type": "all"});
        });
    } catch (e) {
        console.log(e)
    }
}


// https://github.com/r0ysue/r0capture

/**
 * Initializes 'addresses' dictionary and NativeFunctions.
 */
"use strict";
rpc.exports = {
    setssllib: function (name) {
        console.log("setSSLLib => " + name);
        libname = name;
        initializeGlobals();
        return;
    },
};

var addresses = {};
var SSL_get_fd = null;
var SSL_get_session = null;
var SSL_SESSION_get_id = null;
var getpeername = null;
var getsockname = null;
var ntohs = null;
var ntohl = null;
var SSLstackwrite = null;
var SSLstackread = null;

var libname = "*libssl*";

function uuid(len, radix) {
    var chars =
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split(
            ""
        );
    var uuid = [],
        i;
    radix = radix || chars.length;

    if (len) {
        // Compact form
        for (i = 0; i < len; i++) uuid[i] = chars[0 | (Math.random() * radix)];
    } else {
        // rfc4122, version 4 form
        var r;

        // rfc4122 requires these characters
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = "-";
        uuid[14] = "4";

        // Fill in random data. At i==19 set the high bits of clock sequence as
        // per rfc4122, sec. 4.1.5
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | (Math.random() * 16);
                uuid[i] = chars[i == 19 ? (r & 0x3) | 0x8 : r];
            }
        }
    }

    return uuid.join("");
}

function return_zero(args) {
    return 0;
}

function initializeGlobals() {
    var resolver = new ApiResolver("module");
    var exps = [
        [
            Process.platform == "darwin" ? "*libboringssl*" : "*libssl*",
            [
                "SSL_read",
                "SSL_write",
                "SSL_get_fd",
                "SSL_get_session",
                "SSL_SESSION_get_id",
            ],
        ], // for ios and Android
        [
            Process.platform == "darwin" ? "*libsystem*" : "*libc*",
            ["getpeername", "getsockname", "ntohs", "ntohl"],
        ],
    ];
    // console.log(exps)
    for (var i = 0; i < exps.length; i++) {
        var lib = exps[i][0];
        var names = exps[i][1];
        for (var j = 0; j < names.length; j++) {
            var name = names[j];
            // console.log("exports:" + lib + "!" + name)
            var matches = resolver.enumerateMatchesSync(
                "exports:" + lib + "!" + name
            );
            if (matches.length == 0) {
                if (name == "SSL_get_fd") {
                    addresses["SSL_get_fd"] = 0;
                    continue;
                }
                throw "Could not find " + lib + "!" + name;
            } else if (matches.length != 1) {
                // Sometimes Frida returns duplicates.
                var address = 0;
                var s = "";
                var duplicates_only = true;
                for (var k = 0; k < matches.length; k++) {
                    if (s.length != 0) {
                        s += ", ";
                    }
                    s += matches[k].name + "@" + matches[k].address;
                    if (address == 0) {
                        address = matches[k].address;
                    } else if (!address.equals(matches[k].address)) {
                        duplicates_only = false;
                    }
                }
                if (!duplicates_only) {
                    throw (
                        "More than one match found for " +
                        lib +
                        "!" +
                        name +
                        ": " +
                        s
                    );
                }
            }
            addresses[name] = matches[0].address;
        }
    }
    if (addresses["SSL_get_fd"] == 0) {
        SSL_get_fd = return_zero;
    } else {
        SSL_get_fd = new NativeFunction(addresses["SSL_get_fd"], "int", [
            "pointer",
        ]);
    }
    SSL_get_session = new NativeFunction(
        addresses["SSL_get_session"],
        "pointer",
        ["pointer"]
    );
    SSL_SESSION_get_id = new NativeFunction(
        addresses["SSL_SESSION_get_id"],
        "pointer",
        ["pointer", "pointer"]
    );
    getpeername = new NativeFunction(addresses["getpeername"], "int", [
        "int",
        "pointer",
        "pointer",
    ]);
    getsockname = new NativeFunction(addresses["getsockname"], "int", [
        "int",
        "pointer",
        "pointer",
    ]);
    ntohs = new NativeFunction(addresses["ntohs"], "uint16", ["uint16"]);
    ntohl = new NativeFunction(addresses["ntohl"], "uint32", ["uint32"]);
}
initializeGlobals();

function ipToNumber(ip) {
    var num = 0;
    if (ip == "") {
        return num;
    }
    var aNum = ip.split(".");
    if (aNum.length != 4) {
        return num;
    }
    num += parseInt(aNum[0]) << 0;
    num += parseInt(aNum[1]) << 8;
    num += parseInt(aNum[2]) << 16;
    num += parseInt(aNum[3]) << 24;
    num = num >>> 0; //这个很关键，不然可能会出现负数的情况
    return num;
}

/**
 * Returns a dictionary of a sockfd's "src_addr", "src_port", "dst_addr", and
 * "dst_port".
 * @param {int} sockfd The file descriptor of the socket to inspect.
 * @param {boolean} isRead If true, the context is an SSL_read call. If
 *     false, the context is an SSL_write call.
 * @return {dict} Dictionary of sockfd's "src_addr", "src_port", "dst_addr",
 *     and "dst_port".
 */
function getPortsAndAddresses(sockfd, isRead) {
    var message = {};
    var src_dst = ["src", "dst"];
    for (var i = 0; i < src_dst.length; i++) {
        if ((src_dst[i] == "src") ^ isRead) {
            var sockAddr = Socket.localAddress(sockfd);
        } else {
            var sockAddr = Socket.peerAddress(sockfd);
        }
        if (sockAddr == null) {
            // 网络超时or其他原因可能导致socket被关闭
            message[src_dst[i] + "_port"] = 0;
            message[src_dst[i] + "_addr"] = 0;
        } else {
            message[src_dst[i] + "_port"] = sockAddr.port & 0xffff;
            message[src_dst[i] + "_addr"] = ntohl(
                ipToNumber(sockAddr.ip.split(":").pop())
            );
        }
    }
    return message;
}
/**
 * Get the session_id of SSL object and return it as a hex string.
 * @param {!NativePointer} ssl A pointer to an SSL object.
 * @return {dict} A string representing the session_id of the SSL object's
 *     SSL_SESSION. For example,
 *     "59FD71B7B90202F359D89E66AE4E61247954E28431F6C6AC46625D472FF76336".
 */
function getSslSessionId(ssl) {
    var session = SSL_get_session(ssl);
    if (session == 0) {
        return 0;
    }
    var len = Memory.alloc(4);
    var p = SSL_SESSION_get_id(session, len);
    len = Memory.readU32(len);
    var session_id = "";
    for (var i = 0; i < len; i++) {
        // Read a byte, convert it to a hex string (0xAB ==> "AB"), and append
        // it to session_id.
        session_id += (
            "0" + Memory.readU8(p.add(i)).toString(16).toUpperCase()
        ).substr(-2);
    }
    return session_id;
}

Interceptor.attach(addresses["SSL_read"], {
    onEnter: function (args) {
        var message = getPortsAndAddresses(SSL_get_fd(args[0]), true);
        message["ssl_session_id"] = getSslSessionId(args[0]);
        message["function"] = "SSL_read";
        message["stack"] = SSLstackread;
        this.message = message;
        this.buf = args[1];
    },
    onLeave: function (retval) {
        retval |= 0; // Cast retval to 32-bit integer.
        if (retval <= 0) {
            return;
        }
        requestSend("request", this.message, Memory.readByteArray(this.buf, retval));
    },
});

Interceptor.attach(addresses["SSL_write"], {
    onEnter: function (args) {
        var message = getPortsAndAddresses(SSL_get_fd(args[0]), false);
        message["ssl_session_id"] = getSslSessionId(args[0]);
        message["function"] = "SSL_write";
        message["stack"] = SSLstackwrite;
        requestSend("request", message, Memory.readByteArray(args[1], parseInt(args[2])));
    },
    onLeave: function (retval) {},
});

if (Java.available) {
    Java.perform(function () {
        function storeP12(pri, p7, p12Path, p12Password) {
            var X509Certificate = Java.use(
                "java.security.cert.X509Certificate"
            );
            var p7X509 = Java.cast(p7, X509Certificate);
            var chain = Java.array("java.security.cert.X509Certificate", [
                p7X509,
            ]);
            var ks = Java.use("java.security.KeyStore").getInstance(
                "PKCS12",
                "BC"
            );
            ks.load(null, null);
            ks.setKeyEntry(
                "client",
                pri,
                Java.use("java.lang.String").$new(p12Password).toCharArray(),
                chain
            );
            try {
                var out = Java.use("java.io.FileOutputStream").$new(p12Path);
                ks.store(
                    out,
                    Java.use("java.lang.String").$new(p12Password).toCharArray()
                );
            } catch (exp) {
                console.log(exp);
            }
        }
        //在服务器校验客户端的情形下，帮助dump客户端证书，并保存为p12的格式，证书密码为r0ysue
        Java.use(
            "java.security.KeyStore$PrivateKeyEntry"
        ).getPrivateKey.implementation = function () {
            var result = this.getPrivateKey();
            var packageName = Java.use("android.app.ActivityThread")
                .currentApplication()
                .getApplicationContext()
                .getPackageName();
            storeP12(
                this.getPrivateKey(),
                this.getCertificate(),
                "/sdcard/Download/" + packageName + uuid(10, 16) + ".p12",
                "r0ysue"
            );
            var message = {};
            message["function"] =
                "dumpClinetCertificate=>" +
                "/sdcard/Download/" +
                packageName +
                uuid(10, 16) +
                ".p12" +
                "   pwd: r0ysue";
            message["stack"] = Java.use("android.util.Log").getStackTraceString(
                Java.use("java.lang.Throwable").$new()
            );
            var data = Memory.alloc(1);
            requestSend("request", message, Memory.readByteArray(data, 1));
            return result;
        };
        Java.use(
            "java.security.KeyStore$PrivateKeyEntry"
        ).getCertificateChain.implementation = function () {
            var result = this.getCertificateChain();
            var packageName = Java.use("android.app.ActivityThread")
                .currentApplication()
                .getApplicationContext()
                .getPackageName();
            storeP12(
                this.getPrivateKey(),
                this.getCertificate(),
                "/sdcard/Download/" + packageName + uuid(10, 16) + ".p12",
                "r0ysue"
            );
            var message = {};
            message["function"] =
                "dumpClinetCertificate=>" +
                "/sdcard/Download/" +
                packageName +
                uuid(10, 16) +
                ".p12" +
                "   pwd: r0ysue";
            message["stack"] = Java.use("android.util.Log").getStackTraceString(
                Java.use("java.lang.Throwable").$new()
            );
            var data = Memory.alloc(1);
            requestSend("request", message, Memory.readByteArray(data, 1));
            return result;
        };

        //SSLpinning helper 帮助定位证书绑定的关键代码a
        Java.use("java.io.File").$init.overload(
            "java.io.File",
            "java.lang.String"
        ).implementation = function (file, cert) {
            var result = this.$init(file, cert);
            var stack = Java.use("android.util.Log").getStackTraceString(
                Java.use("java.lang.Throwable").$new()
            );
            if (
                file.getPath().indexOf("cacert") >= 0 &&
                stack.indexOf(
                    "X509TrustManagerExtensions.checkServerTrusted"
                ) >= 0
            ) {
                var message = {};
                message["function"] =
                    "SSLpinning position locator => " +
                    file.getPath() +
                    " " +
                    cert;
                message["stack"] = stack;
                var data = Memory.alloc(1);
                requestSend("request", message, Memory.readByteArray(data, 1));
            }
            return result;
        };

        Java.use("java.net.SocketOutputStream").socketWrite0.overload(
            "java.io.FileDescriptor",
            "[B",
            "int",
            "int"
        ).implementation = function (fd, bytearry, offset, byteCount) {
            var result = this.socketWrite0(fd, bytearry, offset, byteCount);
            var message = {};
            message["function"] = "HTTP_send";
            message["ssl_session_id"] = "";
            message["src_addr"] = ntohl(
                ipToNumber(
                    this.socket.value
                        .getLocalAddress()
                        .toString()
                        .split(":")[0]
                        .split("/")
                        .pop()
                )
            );
            message["src_port"] = parseInt(
                this.socket.value.getLocalPort().toString()
            );
            message["dst_addr"] = ntohl(
                ipToNumber(
                    this.socket.value
                        .getRemoteSocketAddress()
                        .toString()
                        .split(":")[0]
                        .split("/")
                        .pop()
                )
            );
            message["dst_port"] = parseInt(
                this.socket.value
                    .getRemoteSocketAddress()
                    .toString()
                    .split(":")
                    .pop()
            );
            message["stack"] = Java.use("android.util.Log")
                .getStackTraceString(Java.use("java.lang.Throwable").$new())
                .toString();
            var ptr = Memory.alloc(byteCount);
            for (var i = 0; i < byteCount; ++i)
                Memory.writeS8(ptr.add(i), bytearry[offset + i]);
            requestSend("request", message, Memory.readByteArray(ptr, byteCount));
            return result;
        };
        Java.use("java.net.SocketInputStream").socketRead0.overload(
            "java.io.FileDescriptor",
            "[B",
            "int",
            "int",
            "int"
        ).implementation = function (fd, bytearry, offset, byteCount, timeout) {
            var result = this.socketRead0(
                fd,
                bytearry,
                offset,
                byteCount,
                timeout
            );
            var message = {};
            message["function"] = "HTTP_recv";
            message["ssl_session_id"] = "";
            message["src_addr"] = ntohl(
                ipToNumber(
                    this.socket.value
                        .getRemoteSocketAddress()
                        .toString()
                        .split(":")[0]
                        .split("/")
                        .pop()
                )
            );
            message["src_port"] = parseInt(
                this.socket.value
                    .getRemoteSocketAddress()
                    .toString()
                    .split(":")
                    .pop()
            );
            message["dst_addr"] = ntohl(
                ipToNumber(
                    this.socket.value
                        .getLocalAddress()
                        .toString()
                        .split(":")[0]
                        .split("/")
                        .pop()
                )
            );
            message["dst_port"] = parseInt(this.socket.value.getLocalPort());
            message["stack"] = Java.use("android.util.Log")
                .getStackTraceString(Java.use("java.lang.Throwable").$new())
                .toString();
            if (result > 0) {
                var ptr = Memory.alloc(result);
                for (var i = 0; i < result; ++i)
                    Memory.writeS8(ptr.add(i), bytearry[offset + i]);
                requestSend("request", message, Memory.readByteArray(ptr, result));
            }
            return result;
        };

        if (parseFloat(Java.androidVersion) > 8) {
            Java.use(
                "com.android.org.conscrypt.ConscryptFileDescriptorSocket$SSLOutputStream"
            ).write.overload("[B", "int", "int").implementation = function (
                bytearry,
                int1,
                int2
            ) {
                var result = this.write(bytearry, int1, int2);
                SSLstackwrite = Java.use("android.util.Log")
                    .getStackTraceString(Java.use("java.lang.Throwable").$new())
                    .toString();
                return result;
            };
            Java.use(
                "com.android.org.conscrypt.ConscryptFileDescriptorSocket$SSLInputStream"
            ).read.overload("[B", "int", "int").implementation = function (
                bytearry,
                int1,
                int2
            ) {
                var result = this.read(bytearry, int1, int2);
                SSLstackread = Java.use("android.util.Log")
                    .getStackTraceString(Java.use("java.lang.Throwable").$new())
                    .toString();
                return result;
            };
        } else {
            Java.use(
                "com.android.org.conscrypt.OpenSSLSocketImpl$SSLOutputStream"
            ).write.overload("[B", "int", "int").implementation = function (
                bytearry,
                int1,
                int2
            ) {
                var result = this.write(bytearry, int1, int2);
                SSLstackwrite = Java.use("android.util.Log")
                    .getStackTraceString(Java.use("java.lang.Throwable").$new())
                    .toString();
                return result;
            };
            Java.use(
                "com.android.org.conscrypt.OpenSSLSocketImpl$SSLInputStream"
            ).read.overload("[B", "int", "int").implementation = function (
                bytearry,
                int1,
                int2
            ) {
                var result = this.read(bytearry, int1, int2);
                SSLstackread = Java.use("android.util.Log")
                    .getStackTraceString(Java.use("java.lang.Throwable").$new())
                    .toString();
                return result;
            };
        }
    });
}

// 绕过TracerPid检测 默认关闭，有必要时再自行打开
// setImmediate(ByPassTracerPid);

//在spawn模式下，hook系统API时如javax.crypto.Cipher建议使用setImmediate立即执行，不需要延时
//在spawn模式下，hook应用自己的函数或含壳时，建议使用setTimeout并给出适当的延时(500~5000)

// main();
// setImmediate(main);
// setTimeout(main, 3000);
