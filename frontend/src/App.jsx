import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import Dashboard from './Dashboard';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './Login';
import L from 'leaflet'; 

const FilterPill = ({ label, value, state, setState, activeColor = '#2563eb' }) => {
  const isActive = state === value;
  return (
    <button
      onClick={() => setState(value)}
      style={{
        padding: '8px 18px',
        borderRadius: '25px',
        border: isActive ? `1px solid ${activeColor}` : '1px solid #d1d5db',
        backgroundColor: isActive ? activeColor : 'white',
        color: isActive ? 'white' : '#4b5563',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: '"Plus Jakarta Sans", sans-serif'
      }}
    >
      {label}
    </button>
  );
};

function KameraPetaHandler({ posisi }) {
  const map = useMap();
  useEffect(() => {
    if (posisi) {
      map.flyTo(posisi, 15, { animate: true, duration: 1.5 });
    }
  }, [posisi, map]);
  return null;
}

// MEMBUAT CUSTOM ICON LOKASI USER (Titik Merah GPS)
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

function PetaUtama() {
  const zoomAwal = 13; 
  const koordinatLampung = [-5.4294, 105.2611];
  
  const [posisiPeta, setPosisiPeta] = useState(koordinatLampung);
  const [titikUser, setTitikUser] = useState(null); 

  const [daftarParkir, setDaftarParkir] = useState([]);
  const [kataKunci, setKataKunci] = useState('');
  const [tampilFilter, setTampilFilter] = useState(false);
  
  const [filterKendaraan, setFilterKendaraan] = useState('Semua');
  const [filterJarak, setFilterJarak] = useState('Semua');
  const [filterTarif, setFilterTarif] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');

  const muatDataParkir = async (lat, lng) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/parking/nearest?lat=${lat}&lng=${lng}`);
      if (response.data && response.data.data) {
        setDaftarParkir(response.data.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data dari backend:", error);
    }
  };

  useEffect(() => {
    muatDataParkir(koordinatLampung[0], koordinatLampung[1]);
  }, []);

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
        muatDataParkir(lat, lng);
      },
      (error) => {
        console.error(error);
        alert("Gagal mengakses GPS. Pastikan izin lokasi (Location/GPS) di browser sudah diaktifkan.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const lahanTersaring = daftarParkir.filter((spot) => {
    const cocokNama = spot.nama_lokasi.toLowerCase().includes(kataKunci.toLowerCase());

    let cocokKendaraan = true;
    if (filterKendaraan === 'Mobil') cocokKendaraan = spot.kapasitas_mobil > 0;
    if (filterKendaraan === 'Motor') cocokKendaraan = spot.kapasitas_motor > 0;

    let cocokJarak = true;
    const jarakAsli = spot.distance || spot.jarak_meter || 0; 
    if (filterJarak === '<1km') cocokJarak = jarakAsli < 1000;
    if (filterJarak === '1-5km') cocokJarak = jarakAsli >= 1000 && jarakAsli <= 5000;
    if (filterJarak === '>5km') cocokJarak = jarakAsli > 5000;

    let cocokTarif = true;
    if (filterTarif === 'Gratis') {
      cocokTarif = spot.tarif_motor === 0 && spot.tarif_mobil === 0;
    } else if (filterTarif === '0-3000') {
      cocokTarif = spot.tarif_motor <= 3000 || spot.tarif_mobil <= 3000;
    } else if (filterTarif === '>3000') {
      cocokTarif = spot.tarif_motor > 3000 || spot.tarif_mobil > 3000;
    }

    let cocokStatus = true;
    if (filterStatus === 'Tersedia') cocokStatus = spot.status === 'Tersedia';
    if (filterStatus === 'Penuh') cocokStatus = spot.status === 'Penuh';

    return cocokNama && cocokKendaraan && cocokJarak && cocokTarif && cocokStatus;
  });

  const resetSemuaFilter = () => {
    setFilterKendaraan('Semua');
    setFilterJarak('Semua');
    setFilterTarif('Semua');
    setFilterStatus('Semua');
  };

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');`}
      </style>

      <Link 
        to="/login" 
        style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000, padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', textDecoration: 'none', borderRadius: '12px', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontFamily: 'inherit' }}
      >
        Login Admin
      </Link>

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

      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        width: '90%',
        maxWidth: '380px',
        display: 'flex',
        flexDirection: 'column', 
        gap: '12px'
      }}>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'white',
          borderRadius: '30px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          padding: '8px 18px',
          boxSizing: 'border-box',
          width: '100%'
        }}>
          <button 
            onClick={() => setTampilFilter(!tampilFilter)}
            style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#4b5563', padding: '5px 12px 5px 0', display: 'flex', alignItems: 'center' }}
            title="Buka Filter"
          >
            ☰
          </button>
          <input
            type="text"
            placeholder="Cari lokasi parkir..."
            value={kataKunci}
            onChange={(e) => setKataKunci(e.target.value)}
            style={{ flex: '1', padding: '10px 0', fontSize: '15px', border: 'none', outline: 'none', backgroundColor: 'transparent', color: '#1f2937', fontFamily: 'inherit', fontWeight: '500' }}
          />
        </div>

        {tampilFilter && (
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', maxHeight: '75vh', overflowY: 'auto' }}>
            
            <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '20px', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', marginBottom: '16px', letterSpacing: '0.5px' }}>JENIS KENDARAAN</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <FilterPill label="Semua" value="Semua" state={filterKendaraan} setState={setFilterKendaraan} activeColor="#2563eb" />
                <FilterPill label="Motor" value="Motor" state={filterKendaraan} setState={setFilterKendaraan} activeColor="#2563eb" />
                <FilterPill label="Mobil" value="Mobil" state={filterKendaraan} setState={setFilterKendaraan} activeColor="#2563eb" />
              </div>
            </div>

            <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '20px', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', marginBottom: '16px', letterSpacing: '0.5px' }}>JARAK DARI LOKASI SAYA</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <FilterPill label="< 1km" value="<1km" state={filterJarak} setState={setFilterJarak} activeColor="#4b5563" />
                <FilterPill label="1 - 5 km" value="1-5km" state={filterJarak} setState={setFilterJarak} activeColor="#4b5563" />
                <FilterPill label="> 5 km" value=">5km" state={filterJarak} setState={setFilterJarak} activeColor="#4b5563" />
                <FilterPill label="Semua jarak" value="Semua" state={filterJarak} setState={setFilterJarak} activeColor="#4b5563" />
              </div>
            </div>

            <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '20px', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', marginBottom: '16px', letterSpacing: '0.5px' }}>KISARAN TARIF PER JAM</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <FilterPill label="Gratis" value="Gratis" state={filterTarif} setState={setFilterTarif} activeColor="#4b5563" />
                <FilterPill label="Rp 0 - 3.000" value="0-3000" state={filterTarif} setState={setFilterTarif} activeColor="#4b5563" />
                <FilterPill label="Rp > 3.000" value=">3000" state={filterTarif} setState={setFilterTarif} activeColor="#4b5563" />
                <FilterPill label="Semua tarif" value="Semua" state={filterTarif} setState={setFilterTarif} activeColor="#4b5563" />
              </div>
            </div>

            <div style={{ paddingBottom: '15px', marginBottom: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#6b7280', marginBottom: '16px', letterSpacing: '0.5px' }}>STATUS PARKIRAN</div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <FilterPill label="Semua" value="Semua" state={filterStatus} setState={setFilterStatus} activeColor="#4b5563" />
                <FilterPill label="Tersedia" value="Tersedia" state={filterStatus} setState={setFilterStatus} activeColor="#4b5563" />
                <FilterPill label="Penuh" value="Penuh" state={filterStatus} setState={setFilterStatus} activeColor="#4b5563" />
              </div>
            </div>

            <div>
              <button 
                onClick={resetSemuaFilter}
                style={{ width: '100%', padding: '14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', borderRadius: '14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', fontFamily: 'inherit', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              >
                <span style={{ color: '#2563eb' }}>🔄</span> Reset Semua Filter
              </button>
            </div>

          </div>
        )}

      </div>

      <MapContainer center={posisiPeta} zoom={zoomAwal} zoomControl={false} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <KameraPetaHandler posisi={posisiPeta} />

        {titikUser && (
          <Marker position={titikUser} icon={ikonLokasiUser}>
            <Popup>
              <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#dc2626', fontFamily: 'inherit' }}>
                📍 Anda berada di sini!
              </div>
            </Popup>
          </Marker>
        )}
        
        {lahanTersaring.map((spot) => (
          <Marker key={spot.id} position={[spot.latitude, spot.longitude]}>
            <Popup>
              <div style={{ fontFamily: 'inherit', minWidth: '200px' }}>
                <h3 style={{ margin: '0 0 5px 0', color: '#1e3a8a' }}>{spot.nama_lokasi}</h3>
                <p style={{ margin: '0 0 10px 0', color: '#4b5563', fontSize: '13px' }}>{spot.deskripsi}</p>
                
                <hr style={{ border: '0', borderTop: '1px solid #e5e7eb', margin: '10px 0' }} />

                <div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><strong>Tarif Motor:</strong></span>
                    <span>Rp{spot.tarif_motor?.toLocaleString('id-ID') || '0'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#6b7280', paddingLeft: '18px' }}>Sisa Kapasitas:</span>
                    <strong>{spot.kapasitas_motor ?? '0'} Slot</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span> <strong>Tarif Mobil:</strong></span>
                    <span>Rp{spot.tarif_mobil?.toLocaleString('id-ID') || '0'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#6b7280', paddingLeft: '18px' }}>Sisa Kapasitas:</span>
                    <strong>{spot.kapasitas_mobil ?? '0'} Slot</strong>
                  </div>

                  <div style={{ marginTop: '5px', padding: '4px', backgroundColor: '#f3f4f6', borderRadius: '4px', textAlign: 'center', fontSize: '11px' }}>
                     <strong>Jam Operasional:</strong> {spot.jam_operasional || 'Tidak Tentu'}
                  </div>
                </div>

                <hr style={{ border: '0', borderTop: '1px solid #e5e7eb', margin: '10px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <span>Status: 
                    <strong style={{ color: spot.status === 'Tersedia' ? '#10b981' : '#ef4444', marginLeft: '4px' }}>
                      {spot.status}
                    </strong>
                  </span>
                  <span style={{ color: '#6b7280' }}>
                     {spot.jarak_meter || spot.distance ? `${Math.round(spot.jarak_meter || spot.distance)} meter` : 'Peta Digeser'}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PetaUtama />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;