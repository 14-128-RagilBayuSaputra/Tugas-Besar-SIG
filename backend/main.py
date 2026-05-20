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