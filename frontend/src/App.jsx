import react from 'react';
import {MapContainer, TileLayer} from 'react-leaflet';

function App(){
  const posisilampung = [-5.4294, 105.2611];
  const zoomAwal = 13;
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      
      <MapContainer 
        center={posisilampung} 
        zoom={zoomAwal} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true} 
      >
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

      </MapContainer>

    </div>
  );
}
export default App;