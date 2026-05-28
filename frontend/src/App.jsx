import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

function App() {
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
    <div style={{ height: '100vh', width: '100%' }}>
      
      <MapContainer 
        center={posisiLampung} 
        zoom={zoomAwal} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true} 
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {daftarParkir.map((spot) => (
          <Marker 
            key={spot.id} 
            position={[spot.latitude, spot.longitude]}
          >
            <Popup>
              <div style={{ fontSize: '14px' }}>
                <h3 style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{spot.nama_lokasi}</h3>
                <p style={{ margin: '0 0 5px 0' }}>{spot.deskripsi}</p>
                <hr style={{ margin: '5px 0' }} />
                <strong>Status: </strong> 
                <span style={{ color: spot.status === 'Tersedia' ? 'green' : 'red', fontWeight: 'bold' }}>
                  {spot.status}
                </span>
                <br />
                <small style={{ color: '#666' }}>
                    Jarak: {spot.distance_meters || spot.distance || spot.jarak ? Math.round(spot.distance_meters || spot.distance || spot.jarak) : '0'} meter
                </small>
              </div>
            </Popup>
          </Marker>
        ))}

      </MapContainer>

    </div>
  );
}

export default App;