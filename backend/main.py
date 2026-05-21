from fastapi import FastAPI, HTTPException, status
from database import get_db_connection
from schemas import UserCreateSchema
import json

app = FastAPI(title="SIG parkir API", version="1.0.0")

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
            return {
                "status": "success",
                "message": "Login berhasil! Selamat datang di dashboard.",
                "user_id": user['id'],
                "email": user['email']
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