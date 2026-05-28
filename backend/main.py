from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from database import get_db_connection
from schemas import UserCreateSchema, ParkingDetailCreateSchema
from auth_jwt import create_access_token, get_current_admin
from fastapi import Depends
import json

app = FastAPI(title="SIG parkir API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message" : "Selamat datang di API SIG parkir"}

@app.get("/api/test-db")
def test_database_connection():
    conn = get_db_connection()
    if conn is None:
        return {"status" : "error", "message" : "Gagal terhubung ke database. cek terminal"}
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT Version();")
        db_version = cursor.fetchone()
        cursor.close()
        conn.close()
        
        return {
            "status" : "sukses",
            "message" : "berhasil terhubung ke database",
            "database_version" : db_version[0]
        }
    except Exception as e:
        return {"status" : "error", "message" : f"terjadi kesalahan saat query: {str(e)}"}
    
@app.get("/api/parking/geojson")
def get_parking_spot_geojson():
    conn = get_db_connection()
    if conn is None:
        return {"status" : "error", "message": "Gagal terhubung ke database"}
    
    try:
        from psycopg2.extras import RealDictCursor
        cursor =  conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
            SELECT row_to_json(fc) AS geojson
            FROM (
                SELECT 'FeatureCollection' AS type, 
                       array_to_json(array_agg(f)) AS features
                FROM (
                    SELECT 'Feature' AS type,
                           ST_AsGeoJSON(s.geom)::json AS geometry,
                           row_to_json(
                               (SELECT l FROM (SELECT s.id, s.nama_lokasi, s.deskripsi, d.tarif_motor, d.tarif_mobil, d.status) l)
                           ) AS properties
                    FROM parking_spots s
                    JOIN parking_details d ON s.id = d.spot_id
                ) AS f
            ) AS fc;
        """
        
        cursor.execute(query)
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if result and result['geojson']:
            return result['geojson']
        else:
            return {"type": "FeatureCollection", "features": []}
            
    except Exception as e:
        return {"status": "error", "message": f"Gagal membuat GeoJSON: {str(e)}"}
    
@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register_admin(user_data: UserCreateSchema):
    conn = get_db_connection()
    if conn is None:
        raise HTTPException(status_code=500, detail="Gagal terhubung ke database.")
        
    try:
        from psycopg2.extras import RealDictCursor
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("SELECT id FROM users WHERE email = %s;", (user_data.email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            cursor.close()
            conn.close()
            raise HTTPException(status_code=400, detail="Email sudah terdaftar! Gunakan email lain.")
        
        query_insert = """
            INSERT INTO users (email, password_hash) 
            VALUES (%s, %s) 
            RETURNING id, email;
        """
        cursor.execute(query_insert, (user_data.email, user_data.password))
        new_user = cursor.fetchone()
        
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return {
            "status": "success",
            "message": "Akun Admin berhasil didaftarkan!",
            "data": new_user
        }
        
    except Exception as e:
        if conn:
            conn.rollback() 
        raise HTTPException(status_code=500, detail=f"Gagal registrasi: {str(e)}")

@app.post("/api/auth/login")
def login_admin(user_data: UserCreateSchema):
    conn = get_db_connection()
    if conn is None:
        raise HTTPException(status_code=500, detail="Gagal terhubung ke database.")
    
    try:
        from psycopg2.extras import RealDictCursor
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = "SELECT id, email FROM users WHERE email = %s AND password_hash = %s;"
        cursor.execute(query, (user_data.email, user_data.password))
        user = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if user:
            token_akses = create_access_token(user_id=user['id'], email=user['email'])

            return {
                "status": "success",
                "message": "Login berhasil! Selamat datang di dashboard.",
                "access_token": token_akses,
                "token_type": "bearer",
                "user": {
                    "user_id": user['id'],
                    "email": user['email']
                }
            }
        else:
            raise HTTPException(status_code=401, detail="Email atau password salah!")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan sistem: {str(e)}")
    
@app.get("/api/parking/nearest")
def get_nearest_parking(lat:float, lng:float):
    conn = get_db_connection()
    if conn is None:
        raise HTTPException(status_code=500, detail="Gagal terhubung ke database.")
    
    try:
        from psycopg2.extras import RealDictCursor
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        query = """
                SELECT
                s.id, 
                s.nama_lokasi, 
                s.deskripsi,
                ST_X(s.geom) AS longitude,
                ST_Y(s.geom) AS latitude,
                d.tarif_motor, 
                d.tarif_mobil, 
                d.status,
                ROUND(
                    ST_Distance(
                        ST_Transform(s.geom, 3857), 
                        ST_Transform(ST_SetSRID(ST_MakePoint(%s, %s), 4326), 3857)
                    )::numeric, 2
                ) AS jarak_meter
            FROM parking_spots s
            JOIN parking_details d ON s.id = d.spot_id
            ORDER BY jarak_meter ASC;
        """
        
        cursor.execute(query, (lng, lat))
        parking_list = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {
            "status": "success",
            "user_position": {"latitude": lat, "longitude": lng},
            "total_found": len(parking_list),
            "data": parking_list
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menghitung jarak spasial: {str(e)}")
    
@app.get("/api/admin/profile")
def get_admin_profile(current_admin: dict = Depends(get_current_admin)):
    return {
        "status": "success",
        "message": "Anda berhasil mengakses rute rahasia!",
        "admin_logged_in": current_admin
    }
    
@app.post("/api/parking", status_code=status.HTTP_201_CREATED)
def create_parking_spot(
    spot_data: ParkingDetailCreateSchema, 
    current_admin: dict = Depends(get_current_admin)
):
    conn = get_db_connection()
    if conn is None:
        raise HTTPException(status_code=500, detail="Gagal terhubung ke database.")
        
    try:
        from psycopg2.extras import RealDictCursor
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        admin_id = current_admin["user_id"]
        query_spot = """
            INSERT INTO parking_spots (nama_lokasi, deskripsi, geom, admin_id)
            VALUES (%s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s)
            RETURNING id;
        """
        cursor.execute(query_spot, (spot_data.nama_lokasi, spot_data.deskripsi, spot_data.longitude, spot_data.latitude, admin_id))
        new_spot = cursor.fetchone()
        spot_id = new_spot["id"]
        
        query_detail = """
            INSERT INTO parking_details (spot_id, kapasitas_motor, kapasitas_mobil, tarif_motor, tarif_mobil, jam_operasional, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s);
        """
        cursor.execute(query_detail, (
            spot_id, 
            spot_data.kapasitas_motor, 
            spot_data.kapasitas_mobil, 
            spot_data.tarif_motor, 
            spot_data.tarif_mobil, 
            spot_data.jam_operasional,
            spot_data.status
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            "status": "success",
            "message": "Lahan parkir baru berhasil ditambahkan oleh Anda!",
            "spot_id": spot_id
        }
        
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=f"Gagal menambah data parkir: {str(e)}")
    
@app.patch("/api/parking/{spot_id}/status")
def update_parking_status(
    spot_id: int, 
    new_status: str, 
    current_admin: dict = Depends(get_current_admin)
):
    conn = get_db_connection()
    if conn is None:
        raise HTTPException(status_code=500, detail="Gagal terhubung ke database.")
        
    try:
        from psycopg2.extras import RealDictCursor
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("SELECT admin_id FROM parking_spots WHERE id = %s;", (spot_id,))
        spot = cursor.fetchone()
        
        if not spot:
            raise HTTPException(status_code=404, detail="Lahan parkir tidak ditemukan.")
            
        if spot["admin_id"] != current_admin["user_id"]:
            raise HTTPException(status_code=403, detail="Akses ditolak! Anda bukan pemilik data parkir ini.")
            
        query_update = "UPDATE parking_details SET status = %s WHERE spot_id = %s;"
        cursor.execute(query_update, (new_status, spot_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"status": "success", "message": f"Status parkir berhasil diubah menjadi {new_status}!"}
        
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=f"Gagal mengubah status: {str(e)}")

@app.delete("/api/parking/{spot_id}")
def delete_parking_spot(
    spot_id: int, 
    current_admin: dict = Depends(get_current_admin)
):
    conn = get_db_connection()
    if conn is None:
        raise HTTPException(status_code=500, detail="Gagal terhubung ke database.")
        
    try:
        from psycopg2.extras import RealDictCursor
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute("SELECT admin_id FROM parking_spots WHERE id = %s;", (spot_id,))
        spot = cursor.fetchone()
        
        if not spot:
            raise HTTPException(status_code=404, detail="Lahan parkir tidak ditemukan.")
            
        if spot["admin_id"] != current_admin["user_id"]:
            raise HTTPException(status_code=403, detail="Akses ditolak! Anda tidak berhak menghapus data ini.")
            
        cursor.execute("DELETE FROM parking_details WHERE spot_id = %s;", (spot_id,))
        cursor.execute("DELETE FROM parking_spots WHERE id = %s;", (spot_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"status": "success", "message": "Lahan parkir berhasil dihapus permanen!"}
        
    except HTTPException as http_err:
        raise http_err
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=f"Gagal menghapus data: {str(e)}")
    
@app.get("/api/parking/my-spots")
def get_my_parking_spots(current_admin: dict = Depends(get_current_admin)):
    conn = get_db_connection()
    if conn is None:
        raise HTTPException(status_code=500, detail="Gagal terhubung ke database.")
        
    try:
        from psycopg2.extras import RealDictCursor
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        admin_id = current_admin["user_id"]
        
        query = """
            SELECT ps.id, ps.nama_lokasi, ps.deskripsi, ST_Y(ps.geom) as latitude, ST_X(ps.geom) as longitude,
                   pd.kapasitas_motor, pd.kapasitas_mobil, pd.tarif_motor, pd.tarif_mobil, pd.jam_operasional, pd.status
            FROM parking_spots ps
            JOIN parking_details pd ON ps.id = pd.spot_id
            WHERE ps.admin_id = %s;
        """
        cursor.execute(query, (admin_id,))
        my_spots = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return {
            "status": "success",
            "total_data": len(my_spots),
            "data": my_spots
        }
        
    except Exception as e:
        if conn:
            conn.close()
        raise HTTPException(status_code=500, detail=f"Gagal mengambil data parkir Anda: {str(e)}")