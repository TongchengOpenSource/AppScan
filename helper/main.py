import os
import shutil
import logging
from logging.handlers import RotatingFileHandler
import uvicorn
import argparse
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.frida.hook import asgi

from routers.api import apiV1Router


def start(port: int, debug: bool):
    app = FastAPI(debug=debug)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(apiV1Router)
    app.mount("/", app=asgi, name="socket")

    uvicorn.run(app=app, host="0.0.0.0", port=port)


def copySo():
    frida_so = "gadget-android-arm64.so"
    frida_so_path = (
        os.path.abspath(os.path.dirname(__file__))
        + os.sep
        + "static"
        + os.sep
        + frida_so
    )
    home_path = os.path.join(os.path.expanduser("~"), ".cache", "frida")
    if not os.path.isdir(home_path):
        os.makedirs(home_path)
    shutil.copy(frida_so_path, home_path)
    home_path1 = os.path.join(
        os.path.expanduser("~"),
        "AppData",
        "Local",
        "Microsoft",
        "Windows",
        "INetCache",
        "frida",
    )
    if not os.path.isdir(home_path1):
        os.makedirs(home_path1)
    shutil.copy(frida_so_path, home_path1)


def cli():
    parser = argparse.ArgumentParser(description="app-scan-view-helper")
    parser.add_argument("--port", "-p", type=int, help="listen port", default=8848)
    parser.add_argument("--debug", "-d", type=bool, help="debug model", default=False)
    parser.add_argument(
        "--logfile", "-f", type=str, help="logfile path", default="frida.log"
    )
    args = parser.parse_args()
    logging_fun(args.logfile)
    start(args.port, args.debug)


def logging_fun(file: str):
    # 创建日志的记录等级
    logging.basicConfig(level=logging.INFO)
    # 创建日志记录器，指明日志保存的路径，每个日志文件的最大值，保存的日志文件个数上限
    log_handle = RotatingFileHandler(file, maxBytes=1024 * 1024 * 5, backupCount=1)
    # 创建日志记录的格式
    formatter = logging.Formatter(
        "format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s-%(funcName)s',"
    )
    # 为创建的日志记录器设置日志记录格式
    log_handle.setFormatter(formatter)
    # 为全局的日志工具对象添加日志记录器
    logging.getLogger().addHandler(log_handle)


if __name__ == "__main__":
    copySo()
    cli()
