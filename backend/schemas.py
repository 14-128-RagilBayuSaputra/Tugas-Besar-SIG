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
    kapasitas_mobil: int = Field(..., ge=0)
    kapasitas_motor: int = Field(..., ge=0)
    tarif_mobil: int = Field(..., ge=0)
    tarif_motor: int = Field(..., ge=0)
    jam_operasional: str = Field(...,default="08:00 - 22:00")