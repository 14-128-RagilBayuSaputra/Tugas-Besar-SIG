import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function Dashboard() {
  const [lahanSaya, setLahanSaya] = useState([]);
  const navigate = useNavigate();
  const [namaLokasi, setNamaLokasi] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [latTerpilih, setLatTerpilih] = useState('');
  const [lngTerpilih, setLngTerpilih] = useState('');
  const [kapasitasMotor, setKapasitasMotor] = useState(0);
  const [kapasitasMobil, setKapasitasMobil] = useState(0);
  const [tarifMotor, setTarifMotor] = useState(0);
  const [tarifMobil, setTarifMobil] = useState(0);
  const [jamOperasional, setJamOperasional] = useState('08:00 - 22:00'); 

  const posisiItera = [-5.3582, 105.3148];

  useEffect(() => {
    const token = localStorage.getItem('token_admin');
    if (!token) {
      alert('Akses ditolak! Silakan login terlebih dahulu.');
      navigate('/login');
      return;
    }

    const ambilDataLahanSaya = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/parking/my-spots', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data && response.data.data) {
          setLahanSaya(response.data.data);
        }
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      }
    };
    ambilDataLahanSaya();
  }, [navigate]);

  function KlikPetaHandler() {
    useMapEvents({
      click(e) {
        setLatTerpilih(e.latlng.lat.toFixed(6));
        setLngTerpilih(e.latlng.lng.toFixed(6));
      },
    });
    return latTerpilih && lngTerpilih ? <Marker position={[latTerpilih, lngTerpilih]} /> : null;
  }

  const gantiStatusLahan = async (idSpot, statusSaatIni) => {
    const token = localStorage.getItem('token_admin');
    const statusBaru = statusSaatIni === 'Tersedia' ? 'Penuh' : 'Tersedia';

    try {
      await axios.patch(`http://localhost:8000/api/parking/${idSpot}/status?new_status=${statusBaru}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLahanSaya(lahanSaya.map(spot => spot.id === idSpot ? { ...spot, status: statusBaru } : spot));
    } catch (error) {
      alert('Gagal mengubah status.');
    }
  };

  const handleTambahLahan = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token_admin');

    try {
      const response = await axios.post('http://localhost:8000/api/parking', {
        nama_lokasi: namaLokasi,
        deskripsi: deskripsi,
        latitude: parseFloat(latTerpilih),
        longitude: parseFloat(lngTerpilih),
        kapasitas_motor: parseInt(kapasitasMotor),
        kapasitas_mobil: parseInt(kapasitasMobil),
        tarif_motor: parseInt(tarifMotor),
        tarif_mobil: parseInt(tarifMobil),
        jam_operasional: jamOperasional,
        status: 'Tersedia' 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Lahan parkir baru berhasil ditambahkan!');
      
      if (response.data && response.data.data) {
        setLahanSaya([...lahanSaya, response.data.data]);
      }

      setNamaLokasi('');
      setDeskripsi('');
      setLatTerpilih('');
      setLngTerpilih('');
      setKapasitasMotor(0);
      setKapasitasMobil(0);
      setTarifMotor(0);
      setTarifMobil(0);
      setJamOperasional('08:00 - 22:00');
    } catch (error) {
      console.error("Detail reject dari FastAPI:", error.response?.data);
      alert('Gagal menambahkan lahan parkir baru. Periksa kesesuaian data.');
    }
  };

  const handleHapusLahan = async (idSpot) => {
    const konfirmasi = window.confirm("Yakin ingin menghapus lahan parkir ini secara permanen?");
    if (!konfirmasi) return; 
    const token = localStorage.getItem('token_admin');

    try {
      await axios.delete(`http://localhost:8000/api/parking/${idSpot}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Lahan parkir berhasil dihapus permanen!');
      setLahanSaya(lahanSaya.filter(spot => spot.id !== idSpot));
    } catch (error) {
      console.error("Gagal menghapus:", error.response?.data);
      alert('Gagal menghapus lahan parkir. Pastikan koneksi server aman.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token_admin');
    navigate('/');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Dashboard Admin - Pengelolaan Spasial Lahan Parkir</h2>
        <button onClick={handleLogout} style={{ padding: '10px 15px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
          Logout
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        <div style={{ flex: '1', minWidth: '400px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '10px' }}>Langkah 1: Klik Lokasi di Peta</h3>
          
          <div style={{ height: '250px', width: '100%', marginBottom: '20px', borderRadius: '6px', overflow: 'hidden' }}>
            <MapContainer center={posisiItera} zoom={16} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {lahanSaya.map((spot) => (
                <Marker key={spot.id} position={[spot.latitude, spot.longitude]} />
              ))}
              <KlikPetaHandler />
            </MapContainer>
          </div>

          <h3 style={{ marginBottom: '15px' }}>Langkah 2: Lengkapi Informasi Lengkap Lahan</h3>
          <form onSubmit={handleTambahLahan}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input type="text" placeholder="Latitude" value={latTerpilih} readOnly style={{ flex: '1', padding: '8px', backgroundColor: '#e5e7eb', border: '1px solid #ccc', borderRadius: '4px' }} required />
              <input type="text" placeholder="Longitude" value={lngTerpilih} readOnly style={{ flex: '1', padding: '8px', backgroundColor: '#e5e7eb', border: '1px solid #ccc', borderRadius: '4px' }} required />
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <input type="text" placeholder="Nama Lokasi (Contoh: Parkiran Gedung C)" value={namaLokasi} onChange={(e) => setNamaLokasi(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} required />
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <textarea placeholder="Deskripsi Singkat" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box', height: '50px' }} required />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <div style={{ flex: '1' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Kapasitas Motor</label>
                <input type="number" value={kapasitasMotor} onChange={(e) => setKapasitasMotor(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} required />
              </div>
              <div style={{ flex: '1' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Kapasitas Mobil</label>
                <input type="number" value={kapasitasMobil} onChange={(e) => setKapasitasMobil(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} required />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <div style={{ flex: '1' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Tarif Motor (Rp)</label>
                <input type="number" value={tarifMotor} onChange={(e) => setTarifMotor(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} required />
              </div>
              <div style={{ flex: '1' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Tarif Mobil (Rp)</label>
                <input type="number" value={tarifMobil} onChange={(e) => setTarifMobil(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} required />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Jam Operasional</label>
              <input type="text" placeholder="Contoh: 06:00 - 22:00" value={jamOperasional} onChange={(e) => setJamOperasional(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} required />
            </div>

            <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
              Simpan Lahan Parkir Baru
            </button>
          </form>
        </div>

        <div style={{ flex: '1.2', minWidth: '500px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '15px' }}>Daftar Pengelolaan Lahan Parkir Anda</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px' }}>Nama Lokasi & Detail</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Aksi Manajemen</th> 
              </tr>
            </thead>
            <tbody>
              {lahanSaya.map((spot) => (
                <tr key={spot.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>
                    <strong style={{ fontSize: '15px' }}>{spot.nama_lokasi}</strong>
                    <br /><small style={{ color: '#555' }}>{spot.deskripsi}</small>
                    <br /><small style={{ color: '#777', fontSize: '11px' }}>
                      🚗 Max: {spot.kapasitas_mobil} (Rp{spot.tarif_mobil}) | 🏍️ Max: {spot.kapasitas_motor} (Rp{spot.tarif_motor}) | 🕒 {spot.jam_operasional}
                    </small>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', backgroundColor: spot.status === 'Tersedia' ? '#d1fae5' : '#fee2e2', color: spot.status === 'Tersedia' ? '#065f46' : '#991b1b' }}>
                      {spot.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => gantiStatusLahan(spot.id, spot.status)} style={{ padding: '6px 12px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                        Set {spot.status === 'Tersedia' ? 'Penuh' : 'Tersedia'}
                      </button>
                      <button onClick={() => handleHapusLahan(spot.id)} style={{ padding: '6px 12px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;