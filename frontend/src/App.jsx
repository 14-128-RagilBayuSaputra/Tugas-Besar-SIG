import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import Dashboard from './Dashboard';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './Login';
import L from 'leaflet'; 

const pinSVG = (warna) => `
  <svg width="32" height="32" viewBox="0 0 24 24" fill="${warna}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3" fill="white"></circle>
  </svg>
`;

const ikonTersedia = new L.divIcon({
  className: 'custom-pin',
  html: pinSVG('#16a34a'),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const ikonPenuh = new L.divIcon({
  className: 'custom-pin',
  html: pinSVG('#0f172a'),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
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


const FilterPill = ({ label, value, state, setState }) => {
  const isActive = state === value;
  return (
    <button
      onClick={() => setState(value)}
      style={{
        padding: '5px 12px',
        borderRadius: '6px',
        border: '1.5px solid',
        borderColor: isActive ? '#0f172a' : '#e2e8f0',
        backgroundColor: isActive ? '#0f172a' : '#f8fafc',
        color: isActive ? '#ffffff' : '#475569',
        fontSize: '12px',
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
    <div style={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden', fontFamily: '"Plus Jakarta Sans", sans-serif', backgroundColor: '#dce8f0' }}>
      
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
          
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
          #root { width: 100%; height: 100%; }

          /* TWEAKS POPUP LEAFLET AGAR MATCH MOCKUP USER */
          .leaflet-popup-content-wrapper {
            padding: 0 !important;
            overflow: hidden !important;
            border: 2px solid #0f172a !important;
            border-radius: 12px !important;
            box-shadow: 4px 4px 0 rgba(15, 23, 42, 0.15) !important;
          }
          .leaflet-popup-content { margin: 0 !important; width: 230px !important; }
          .leaflet-popup-tip-container { display: none; /* Sembunyikan panah */ }
          
          .topbar-input::placeholder { color: #94a3b8; }
        `}
      </style>

      <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px', zIndex: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'auto' }}>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'white', borderRadius: '8px', border: '2px solid #0f172a', padding: '0 14px', height: '42px', width: '270px', boxSizing: 'border-box' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Cari lokasi parkir..."
                value={kataKunci}
                onChange={(e) => setKataKunci(e.target.value)}
                className="topbar-input"
                style={{ flex: '1', height: '100%', border: 'none', outline: 'none', backgroundColor: 'transparent', color: '#0f172a', fontFamily: 'inherit', fontWeight: '500', fontSize: '13px' }}
              />
            </div>
            
            <button 
              onClick={() => setTampilFilter(!tampilFilter)}
              style={{ backgroundColor: tampilFilter ? '#0f172a' : 'white', color: tampilFilter ? 'white' : '#0f172a', border: '2px solid #0f172a', borderRadius: '8px', height: '42px', width: '42px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
              title="Filter"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
            </button>
          </div>

          {tampilFilter && (
            <div style={{ width: '270px', border: '2px solid #0f172a', borderRadius: '12px', backgroundColor: 'white', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
              <div style={{ padding: '12px 14px', borderBottom: '2px solid #0f172a', fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                Filter Pencarian
              </div>
              
              <div style={{ padding: '14px' }}>
                
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '8px' }}>Jenis Kendaraan</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <FilterPill label="Semua" value="Semua" state={filterKendaraan} setState={setFilterKendaraan} />
                    <FilterPill label="Motor" value="Motor" state={filterKendaraan} setState={setFilterKendaraan} />
                    <FilterPill label="Mobil" value="Mobil" state={filterKendaraan} setState={setFilterKendaraan} />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '8px' }}>Jarak dari Lokasi Saya</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <FilterPill label="< 1km" value="<1km" state={filterJarak} setState={setFilterJarak} />
                    <FilterPill label="1 - 5 km" value="1-5km" state={filterJarak} setState={setFilterJarak} />
                    <FilterPill label="> 5 km" value=">5km" state={filterJarak} setState={setFilterJarak} />
                    <FilterPill label="Semua jarak" value="Semua" state={filterJarak} setState={setFilterJarak} />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '8px' }}>Kisaran Tarif per Jam</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <FilterPill label="Gratis" value="Gratis" state={filterTarif} setState={setFilterTarif} />
                    <FilterPill label="Rp 0 - 3.000" value="0-3000" state={filterTarif} setState={setFilterTarif} />
                    <FilterPill label="Rp > 3.000" value=">3000" state={filterTarif} setState={setFilterTarif} />
                    <FilterPill label="Semua tarif" value="Semua" state={filterTarif} setState={setFilterTarif} />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '8px' }}>Status Parkiran</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <FilterPill label="Semua" value="Semua" state={filterStatus} setState={setFilterStatus} />
                    <FilterPill label="Tersedia" value="Tersedia" state={filterStatus} setState={setFilterStatus} />
                    <FilterPill label="Penuh" value="Penuh" state={filterStatus} setState={setFilterStatus} />
                  </div>
                </div>

                <button 
                  onClick={resetSemuaFilter}
                  style={{ width: '100%', height: '36px', border: '2px solid #0f172a', borderRadius: '7px', background: 'white', color: '#0f172a', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                >
                  Reset Filter
                </button>

              </div>
            </div>
          )}
        </div>

        <div style={{ pointerEvents: 'auto' }}>
          <Link 
            to="/login" 
            style={{ display: 'flex', alignItems: 'center', height: '42px', padding: '0 16px', backgroundColor: 'white', color: '#0f172a', textDecoration: 'none', border: '2px solid #0f172a', borderRadius: '8px', fontSize: '12px', fontWeight: '700', fontFamily: 'inherit', transition: 'all 0.2s' }}
            onMouseOver={(e) => { e.target.style.backgroundColor = '#0f172a'; e.target.style.color = 'white'; }}
            onMouseOut={(e) => { e.target.style.backgroundColor = 'white'; e.target.style.color = '#0f172a'; }}
          >
            Login Admin
          </Link>
        </div>

      </div>

      <button
        onClick={dapatkanLokasiSaya}
        style={{
          position: 'absolute', bottom: '30px', right: '30px', zIndex: 1000, width: '45px', height: '45px',
          backgroundColor: '#0f172a', color: 'white', border: '2px solid white', borderRadius: '50%',
          cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', transition: 'transform 0.2s'
        }}
        onMouseOver={(e) => e.target.style.transform = 'scale(1.08)'}
        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        title="Temukan Lokasi Saya"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle>
        </svg>
      </button>

      <MapContainer center={posisiPeta} zoom={zoomAwal} zoomControl={false} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <KameraPetaHandler posisi={posisiPeta} />

        {titikUser && (
          <Marker position={titikUser} icon={ikonLokasiUser}>
            <Popup>
              <div style={{ background: '#0f172a', padding: '12px', color: 'white', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}>
                Lokasi Anda Saat Ini
              </div>
            </Popup>
          </Marker>
        )}
        
        {lahanTersaring.map((spot) => (
          <Marker key={spot.id} position={[spot.latitude, spot.longitude]} icon={spot.status === 'Tersedia' ? ikonTersedia : ikonPenuh}>
            <Popup>
              <div>
                
                <div style={{ background: '#0f172a', padding: '12px 14px', color: 'white' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700' }}>{spot.nama_lokasi}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {spot.deskripsi || 'Tanpa keterangan'}
                  </div>
                </div>

                <div style={{ padding: '12px 14px', backgroundColor: '#ffffff' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ 
                      fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', 
                      background: spot.status === 'Tersedia' ? '#dcfce7' : '#fef3c7', 
                      color: spot.status === 'Tersedia' ? '#15803d' : '#b45309', 
                      border: spot.status === 'Tersedia' ? '1px solid #bbf7d0' : '1px solid #fde68a' 
                    }}>
                      {spot.status === 'Tersedia' ? 'TERSEDIA' : 'PENUH'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
                      {spot.jarak_meter || spot.distance ? `${Math.round(spot.jarak_meter || spot.distance)} meter` : '-'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '7px', padding: '7px 9px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{spot.kapasitas_motor}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>Slot Motor</div>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '7px', padding: '7px 9px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{spot.kapasitas_mobil}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>Slot Mobil</div>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '7px', padding: '7px 10px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>MOTOR</div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>Rp {spot.tarif_motor?.toLocaleString('id-ID')}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>MOBIL</div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>Rp {spot.tarif_mobil?.toLocaleString('id-ID')}</div>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '7px', padding: '6px 10px', fontSize: '11px', color: '#475569', marginBottom: '12px' }}>
                    Jam operasional: <strong>{spot.jam_operasional || 'Tidak tentu'}</strong>
                  </div>
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