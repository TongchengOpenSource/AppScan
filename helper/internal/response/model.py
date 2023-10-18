from pydantic import BaseModel
import time


class ApiBaseResponse(BaseModel):
    code: int
    status: str
    description: str
    timestamp: int = int(time.time())
    detail: list = []
    count: int = 0


# 通用的错误信息


# 没有错误。
OK = ApiBaseResponse(
    code=200,
    status="OK",
    description="请求成功",
)

# 客户端发送的数据包含非法参数。查看错误消息和错误详情来获取更多的信息。
INVALID_ARGUMENT = ApiBaseResponse(
    code=400,
    status="INVALID_ARGUMENT",
    description="请求参数错误",
)

# 现在的系统状态不可以执行当前的请求，例如删除一个非空的目录。
FAILED_PRECONDITION = ApiBaseResponse(
    code=400,
    status="FAILED_PRECONDITION",
    description="无法执行客户端请求",
)

# 客户端指定了一个非法的范围。
OUT_OF_RANGE = ApiBaseResponse(
    code=400,
    status="OUT_OF_RANGE",
    description="客户端越限访问",
)

# 因为缺失的，失效的或者过期的OAuth令牌，请求未能通过身份认证。
UNAUTHENTICATED = ApiBaseResponse(
    code=401,
    status="UNAUTHENTICATED",
    description="身份验证失败",
)

# 客户端没有足够的权限。这可能是因为OAuth令牌没有正确的作用域，或者客户端没有权限，或者是API对客户端代码禁用了。
PERMISSION_DENIED = ApiBaseResponse(
    code=403,
    status="PERMISSION_DENIED",
    description="客户端权限不足",
)

# 特定的资源没有被找到或者请求因为某些未被公开的原因拒绝（例如白名单）。
NOT_FOUND = ApiBaseResponse(
    code=404,
    status="NOT_FOUND",
    description="资源不存在",
)

# 并发冲突，如读 - 修改 - 写冲突。
ABORTED = ApiBaseResponse(
    code=409,
    status="ABORTED",
    description="数据处理冲突",
)

# 客户端尝试新建的资源已经存在了。
ALREADY_EXISTS = ApiBaseResponse(
    code=409,
    status="ALREADY_EXISTS",
    description="资源已存在",
)

# 资源配额不足或达不到速率限制。
RESOURCE_EXHAUSTED = ApiBaseResponse(
    code=429,
    status="RESOURCE_EXHAUSTED",
    description="资源配额不足或达不到速率限制",
)

# 请求被客户端取消了。
CANCELLED = ApiBaseResponse(
    code=499,
    status="CANCELLED",
    description="请求被客户端取消了",
)

# 不可恢复的数据丢失或数据损坏。 客户端应该向用户报告错误。
DATA_LOSS = ApiBaseResponse(
    code=500,
    status="DATA_LOSS",
    description="处理数据发生错误",
)

# 未知的服务端出错，通常是由于服务器出现bug了。
UNKNOWN = ApiBaseResponse(
    code=500,
    status="UNKNOWN",
    description="服务器未知错误",
)

# 服务器内部错误。通常是由于服务器出现bug了。
INTERNAL = ApiBaseResponse(
    code=500,
    status="INTERNAL",
    description="服务器内部错误",
)

# API方法没有被服务器实现。
NOT_IMPLEMENTED = ApiBaseResponse(
    code=501,
    status="NOT_IMPLEMENTED",
    description="API不存在",
)

# 服务不可用。通常是由于服务器宕机了。
UNAVAILABLE = ApiBaseResponse(
    code=503,
    status="UNAVAILABLE",
    description="服务不可用",
)

# 请求超过了截止日期。 只有当调用者设置的截止日期比方法的默认截止日期更短（服务器没能够在截止日期之前处理完请求）并且请求没有在截止日期内完成时，才会发生这种情况。
DEALINE_EXCEED = ApiBaseResponse(
    code=504,
    status="DEALINE_EXCEED",
    description="请求超时",
)

# 自定义
USB_CLOSED = ApiBaseResponse(
    code=400,
    status="USB_CLOSED",
    description="设备未连接或未开启 USB 调试",
)

USB_UNAUTHORIZED = ApiBaseResponse(
    code=400,
    status="USB_UNAUTHORIZED",
    description="未授权 USB 调试",
)

ROOT_CLOSED = ApiBaseResponse(
    code=400,
    status="ROOT_CLOSED",
    description="未开启或未授权 ROOT",
)
