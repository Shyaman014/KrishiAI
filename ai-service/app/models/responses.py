from pydantic import BaseModel


class HealthResponse(BaseModel):
    success: bool = True
    status: str
    service: str
    version: str
    timestamp: str
