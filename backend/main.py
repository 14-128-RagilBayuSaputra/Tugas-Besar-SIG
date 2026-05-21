from fastapi import FastAPI
from database import get_db_connection

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