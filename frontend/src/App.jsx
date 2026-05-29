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

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      
      <Link 
        to="/login" 
        style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000, padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
      >
        Login Admin
      </Link>

      <MapContainer center={posisiLampung} zoom={zoomAwal} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
{daftarParkir.map((spot) => (
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
             {spot.distance ? `${Math.round(spot.distance)} meter` : 'Peta Digeser'}
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