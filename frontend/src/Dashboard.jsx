import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const ikonParkirBiru = new L.divIcon({
  className: 'custom-p-marker',
  html: `<div style="
    width: 28px; 
    height: 28px; 
    background-color: #2563eb; 
    border: 2px solid white; 
    border-radius: 8px; 
    display: flex; 
    justify-content: center; 
    align-items: center; 
    color: white; 
    font-weight: bold; 
    font-size: 14px; 
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    font-family: 'Plus Jakarta Sans', sans-serif;
  ">P</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

const ikonParkirBaru = new L.divIcon({
  className: 'custom-p-new',
  html: `<div style="
    width: 28px; 
    height: 28px; 
    background-color: #dc2626; 
    border: 2px solid white; 
    border-radius: 8px; 
    display: flex; 
    justify-content: center; 
    align-items: center; 
    color: white; 
    font-weight: bold; 
    font-size: 14px; 
    box-shadow: 0 4px 6px rgba(0,0,0,0.4);
    font-family: 'Plus Jakarta Sans', sans-serif;
  ">P</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

const ikonLokasiUser = new L.divIcon({
  className: 'custom-user-marker',
  html: `<div style="
    width: 16px; 
    height: 16px; 
    background-color: #ef4444; 
    border-radius: 50%; 
    border: 3px solid white; 
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -11]
});

function KameraPetaHandler({ posisi }) {
  const map = useMap();
  useEffect(() => {
    if (posisi) {
      map.flyTo(posisi, 16, { animate: true, duration: 1.5 });
    }
  }, [posisi, map]);
  return null;
}

function Dashboard() {
  const posisiItera = [-5.3582, 105.3148];
  const [posisiPeta, setPosisiPeta] = useState(posisiItera);
  const [titikUser, setTitikUser] = useState(null);

  const [lahanSaya, setLahanSaya] = useState([]);
  const navigate = useNavigate();
  const [tampilMenu, setTampilMenu] = useState(false);

  const [namaLokasi, setNamaLokasi] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [latTerpilih, setLatTerpilih] = useState('');
  const [lngTerpilih, setLngTerpilih] = useState('');
  const [kapasitasMotor, setKapasitasMotor] = useState(0);
  const [kapasitasMobil, setKapasitasMobil] = useState(0);
  const [tarifMotor, setTarifMotor] = useState(0);
  const [tarifMobil, setTarifMobil] = useState(0);
  const [jamOperasional, setJamOperasional] = useState('08:00 - 22:00'); 

  const formMarkerRef = useRef(null);

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

  useEffect(() => {
    if (latTerpilih && lngTerpilih && formMarkerRef.current) {
      formMarkerRef.current.openPopup();
    }
  }, [latTerpilih, lngTerpilih]);

  const dapatkanLokasiSaya = () => {
    if (!navigator.geolocation) {
      alert("Browser kamu tidak mendukung akses lokasi/GPS.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setTitikUser([lat, lng]);
        setPosisiPeta([lat, lng]);
      },
      (error) => {
        console.error(error);
        alert("Gagal mengakses GPS. Pastikan izin lokasi (Location/GPS) di browser sudah diaktifkan.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  function KlikPetaHandler() {
    useMapEvents({
      click(e) {
        setLatTerpilih(e.latlng.lat.toFixed(6));
        setLngTerpilih(e.latlng.lng.toFixed(6));
      },
    });
    return null;
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
      
      if (response.data && response.data.data) {
        setLahanSaya([...lahanSaya, response.data.data]);
      }
      tutupForm();
    } catch (error) {
      alert('Gagal menambahkan lahan parkir baru. Periksa kesesuaian data.');
    }
  };

  const tutupForm = () => {
    setNamaLokasi('');
    setDeskripsi('');
    setLatTerpilih('');
    setLngTerpilih('');
    setKapasitasMotor(0);
    setKapasitasMobil(0);
    setTarifMotor(0);
    setTarifMobil(0);
    setJamOperasional('08:00 - 22:00');
  };

  const handleHapusLahan = async (idSpot) => {
    const konfirmasi = window.confirm("Yakin ingin menghapus lahan parkir ini secara permanen?");
    if (!konfirmasi) return; 
    const token = localStorage.getItem('token_admin');

    try {
      await axios.delete(`http://localhost:8000/api/parking/${idSpot}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLahanSaya(lahanSaya.filter(spot => spot.id !== idSpot));
    } catch (error) {
      alert('Gagal menghapus lahan parkir.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token_admin');
    navigate('/');
  };

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#f0f4f8', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }
          #root {
            width: 100%;
            height: 100%;
          }
        `}
      </style>

      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1000, display: 'flex', gap: '15px' }}>
        <button 
          onClick={() => setTampilMenu(!tampilMenu)}
          style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
           🛡️ Mode Admin
        </button>
        <button 
          onClick={handleLogout} 
          style={{ padding: '10px 20px', backgroundColor: 'white', color: '#dc2626', border: '1px solid #fee2e2', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
          🚪 Keluar
        </button>
      </div>

      <button
        onClick={dapatkanLokasiSaya}
        style={{
          position: 'absolute',
          bottom: '30px',
          right: '30px',
          zIndex: 1000,
          width: '50px',
          height: '50px',
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '50%',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '24px'
        }}
        title="Temukan Lokasi Saya"
      >
        🎯
      </button>

      {tampilMenu && (
        <div style={{ position: 'absolute', top: '75px', left: '20px', zIndex: 1000, width: '350px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1f2937', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            <span style={{ color: '#2563eb' }}>🅿️</span> Kelola Parkiran ({lahanSaya.length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {lahanSaya.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Belum ada data parkir.</p>
            ) : (
              lahanSaya.map((spot) => (
                <div key={spot.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid #f3f4f6', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                    <div style={{ minWidth: '40px', height: '40px', backgroundColor: '#eff6ff', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px' }}>
                      🚗
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', overflow: 'hidden' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '170px', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                        {spot.nama_lokasi}
                      </div>
                      <div style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '12px', display: 'inline-block', marginTop: '4px', fontWeight: 'bold', backgroundColor: spot.status === 'Tersedia' ? '#d1fae5' : '#fef2f2', color: spot.status === 'Tersedia' ? '#059669' : '#dc2626', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                        {spot.status === 'Tersedia' ? 'Buka' : 'Penuh'}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => gantiStatusLahan(spot.id, spot.status)} style={{ width: '32px', height: '32px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px' }} title="Ubah Status">
                      🔄
                    </button>
                    <button onClick={() => handleHapusLahan(spot.id)} style={{ width: '32px', height: '32px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px' }} title="Hapus">
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <MapContainer center={posisiPeta} zoom={15} zoomControl={false} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <KlikPetaHandler />
        <KameraPetaHandler posisi={posisiPeta} />

        {titikUser && (
          <Marker position={titikUser} icon={ikonLokasiUser}>
            <Popup>
              <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#dc2626', fontFamily: 'inherit' }}>
                📍 Posisi Anda Saat Ini
              </div>
            </Popup>
          </Marker>
        )}

        {lahanSaya.map((spot) => (
          <Marker key={spot.id} position={[spot.latitude, spot.longitude]} icon={ikonParkirBiru}>
            <Popup>
              <div style={{ textAlign: 'center', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                <strong style={{ color: '#1e3a8a' }}>{spot.nama_lokasi}</strong>
                <p style={{ margin: '5px 0', fontSize: '12px', color: spot.status === 'Tersedia' ? '#059669' : '#dc2626', fontWeight: 'bold' }}>
                  {spot.status}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {latTerpilih && lngTerpilih && (
          <Marker position={[latTerpilih, lngTerpilih]} ref={formMarkerRef} icon={ikonParkirBaru}>
            <Popup autoPan={true} closeButton={false}>
              <div style={{ width: '240px', fontFamily: '"Plus Jakarta Sans", sans-serif', padding: '5px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#1f2937', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
                  <span style={{ color: '#dc2626' }}>📍</span> Tambah lokasi baru
                </h4>
                
                <form onSubmit={handleTambahLahan} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#6b7280', marginBottom: '2px', display: 'block' }}>Nama Lokasi</label>
                    <input type="text" placeholder="Contoh: Parkiran Gedung F" value={namaLokasi} onChange={(e) => setNamaLokasi(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', backgroundColor: '#f9fafb', color: '#1f2937', boxSizing: 'border-box', fontFamily: 'inherit' }} required />
                  </div>
                  
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#6b7280', marginBottom: '2px', display: 'block' }}>Deskripsi / Patokan</label>
                    <textarea placeholder="Contoh: Dekat kantin..." value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', backgroundColor: '#f9fafb', color: '#1f2937', height: '40px', boxSizing: 'border-box', fontFamily: 'inherit' }} required />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#6b7280', display: 'block' }}>Kap. Motor</label>
                      <input type="number" placeholder="0" value={kapasitasMotor} onChange={(e) => setKapasitasMotor(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', backgroundColor: '#f9fafb', color: '#1f2937', boxSizing: 'border-box', fontFamily: 'inherit' }} required />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#6b7280', display: 'block' }}>Kap. Mobil</label>
                      <input type="number" placeholder="0" value={kapasitasMobil} onChange={(e) => setKapasitasMobil(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', backgroundColor: '#f9fafb', color: '#1f2937', boxSizing: 'border-box', fontFamily: 'inherit' }} required />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#6b7280', display: 'block' }}>Tarif Motor (Rp)</label>
                      <input type="number" placeholder="0" value={tarifMotor} onChange={(e) => setTarifMotor(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', backgroundColor: '#f9fafb', color: '#1f2937', boxSizing: 'border-box', fontFamily: 'inherit' }} required />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#6b7280', display: 'block' }}>Tarif Mobil (Rp)</label>
                      <input type="number" placeholder="0" value={tarifMobil} onChange={(e) => setTarifMobil(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', backgroundColor: '#f9fafb', color: '#1f2937', boxSizing: 'border-box', fontFamily: 'inherit' }} required />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 'bold', color: '#6b7280', marginBottom: '2px', display: 'block' }}>Jam Operasional</label>
                    <input type="text" placeholder="06:00 - 22:00" value={jamOperasional} onChange={(e) => setJamOperasional(e.target.value)} style={{ width: '100%', padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', backgroundColor: '#f9fafb', color: '#1f2937', boxSizing: 'border-box', fontFamily: 'inherit' }} required />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                    <button type="submit" style={{ flex: 1, padding: '8px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', fontFamily: 'inherit' }}>Simpan</button>
                    <button type="button" onClick={tutupForm} style={{ padding: '8px', backgroundColor: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', fontFamily: 'inherit' }}>Batal</button>
                  </div>

                </form>
              </div>
            </Popup>
          </Marker>
        )}

      </MapContainer>
    </div>
  );
}

export default Dashboard;