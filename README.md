# 🗺️ Aplikasi WebGIS Lahan Parkir Multi-Admin (Bandar Lampung)

Proyek Tugas Besar Sistem Informasi Geografis (SIG) ini merupakan aplikasi manajemen lahan parkir interaktif berbasis web untuk wilayah Lampung. Aplikasi ini dirancang menggunakan arsitektur **Multi-Admin (*Data Ownership*)**, di mana setiap admin yang terautentikasi hanya dapat mengelola (tambah, ubah status, hapus) data lahan parkir milik mereka sendiri tanpa bisa mengganggu data milik admin dari kelompok lain.

### ✨ Fitur Utama Sistem:
1. **Autentikasi Keamanan:** Registrasi dan login admin menggunakan enkripsi Token JWT (*JSON Web Token*).
2. **Kalkulasi Spasial Akurat:** Fitur pencarian titik parkir terdekat dari lokasi pengguna memanfaatkan query spasial PostgreSQL/PostGIS berdasarkan koordinat bumi nyata (*real-time*).
3. **Peta Interaktif:** Visualisasi marker titik lokasi parkir di wilayah Lampung menggunakan pustaka React Leaflet.