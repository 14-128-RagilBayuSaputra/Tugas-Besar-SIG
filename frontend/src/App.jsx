import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import Dashboard from './Dashboard';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './Login';

function PetaUtama() {
  const posisiLampung = [-5.4294, 105.2611];
  const zoomAwal = 13;
  const [daftarParkir, setDaftarParkir] = useState([]);
  const [kataKunci, setKataKunci] = useState('');
  const [filterKendaraan, setFilterKendaraan] = useState('Semua');
  const [filterTarif, setFilterTarif] = useState('Semua');
  
  const [tampilFilter, setTampilFilter] = useState(false);

  useEffect(() => {
    const ambilDataParkir = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/parking/nearest?lat=-5.4294&lng=105.2611');
        if (response.data && response.data.data) {
          setDaftarParkir(response.data.data);
        }
      } catch (error) {
        console.error("Gagal mengambil data dari backend:", error);
      }
    };
    ambilDataParkir();
  }, []);

  const lahanTersaring = daftarParkir.filter((spot) => {
    const cocokNama = spot.nama_lokasi.toLowerCase().includes(kataKunci.toLowerCase());

    let cocokKendaraan = true;
    if (filterKendaraan === 'Mobil') {
      cocokKendaraan = spot.kapasitas_mobil > 0;
    } else if (filterKendaraan === 'Motor') {
      cocokKendaraan = spot.kapasitas_motor > 0;
    }

    let cocokTarif = true;
    if (filterTarif === 'Gratis') {
      cocokTarif = spot.tarif_mobil === 0 && spot.tarif_motor === 0;
    } else if (filterTarif === 'Murah') {
      cocokTarif = spot.tarif_motor <= 3000 || spot.tarif_mobil <= 3000;
    }

    return cocokNama && cocokKendaraan && cocokTarif;
  });

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      
      <Link 
        to="/login" 
        style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000, padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
      >
        Login Admin
      </Link>

      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        width: '90%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column', 
        gap: '10px'
      }}>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'white',
          border: '2px solid #2563eb',
          borderRadius: '25px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
          padding: '4px 15px',
          boxSizing: 'border-box',
          width: '100%'
        }}>
          <button 
            onClick={() => setTampilFilter(!tampilFilter)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              cursor: 'pointer',
              color: '#4b5563',
              padding: '5px 10px 5px 0',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Buka Filter"
          >
            ☰
          </button>

          <input
            type="text"
            placeholder="Cari nama lokasi parkir..."
            value={kataKunci}
            onChange={(e) => setKataKunci(e.target.value)}
            style={{
              flex: '1',
              padding: '10px 0',
              fontSize: '14px',
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              color: '#1f2937' 
            }}
          />
        </div>

        {tampilFilter && (
          <div style={{
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '15px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#4b5563', borderBottom: '1px solid #e5e7eb', paddingBottom: '5px' }}>
              Filter Pencarian Spesifik
            </span>
            
            <select 
              value={filterKendaraan} 
              onChange={(e) => setFilterKendaraan(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', color: '#1f2937', backgroundColor: '#f9fafb', outline: 'none' }}
            >
              <option value="Semua">Semua Jenis Kendaraan</option>
              <option value="Mobil">Pasti Ada Slot Mobil</option>
              <option value="Motor">Pasti Ada Slot Motor</option>
            </select>

            <select 
              value={filterTarif} 
              onChange={(e) => setFilterTarif(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', color: '#1f2937', backgroundColor: '#f9fafb', outline: 'none' }}
            >
              <option value="Semua">Semua Kisaran Tarif</option>
              <option value="Murah">Parkiran Murah (≤ Rp3.000)</option>
              <option value="Gratis">Parkiran Gratis (Rp0)</option>
            </select>
          </div>
        )}

      </div>

      <MapContainer center={posisiLampung} zoom={zoomAwal} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {lahanTersaring.map((spot) => (
          <Marker key={spot.id} position={[spot.latitude, spot.longitude]}>
            <Popup>
              <div style={{ fontFamily: 'Arial, sans-serif', minWidth: '200px' }}>
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
                     {spot.jarak_meter ? `${Math.round(spot.jarak_meter)} meter` : 'Peta Digeser'}
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