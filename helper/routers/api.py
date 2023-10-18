from fastapi import APIRouter
from .frida.app import router as appRouter
from .frida.hook import router as hookRouter
from .adb.init import router as initRouter

apiV1Router = APIRouter(prefix="/api/v1")
apiV1Router.include_router(appRouter)
apiV1Router.include_router(hookRouter)
apiV1Router.include_router(initRouter)
