from pydantic import BaseModel, Field
from typing import Optional

class UserCreateSchema(BaseModel):
    email: str = Field(..., description="Email admin")
    password: str = Field(..., min_Length=6, description="Password admin")
    
class ParkingSpotCreateSchema(BaseModel):
    nama_lokasi: str = Field(..., min_Length=3, max_Length=150)
    deskripsi: Optional[str] = None
    longitude: float = Field(..., ge=105.0, le=106.0)
    latitude: float = Field(..., ge=-6.0, le=-5.0)
    
class ParkingDetailCreateSchema(BaseModel):
    nama_lokasi: str
    deskripsi: str
    latitude: float
    longitude: float
    kapasitas_motor: int
    kapasitas_mobil: int
    tarif_motor: int
    tarif_mobil: int
    jam_operasional: str
    status: str