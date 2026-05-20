import os
import psycopg2 
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_PORT = os.getenv("DB_PORT")

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host = DB_HOST,
            database = DB_NAME,
            user = DB_USER, 
            password = DB_PASS,
            port = DB_PORT
        )
        return conn
    except Exception as error:
        print(f"Gagal terhubung ke database: {error}")
        return None