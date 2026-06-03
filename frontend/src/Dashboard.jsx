import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const ikonParkirBiru = new L.divIcon({
  className: 'custom-p-marker',
  html: `<div style="
    width: 28px; height: 28px; background-color: #0f172a; border: 2px solid white; 
    border-radius: 8px; display: flex; justify-content: center; align-items: center; 
    color: white; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    font-family: 'Plus Jakarta Sans', sans-serif;
  ">P</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

const ikonParkirBaru = new L.divIcon({
  className: 'custom-p-new',
  html: `<div style="
    width: 28px; height: 28px; background-color: #dc2626; border: 2px solid white; 
    border-radius: 8px; display: flex; justify-content: center; align-items: center; 
    color: white; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px rgba(0,0,0,0.4);
    font-family: 'Plus Jakarta Sans', sans-serif;
  ">P</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

const ikonLokasiUser = new L.divIcon({
  className: 'custom-user-marker',
  html: `<div style="
    width: 16px; height: 16px; background-color: #ef4444; border-radius: 50%; 
    border: 3px solid white; box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
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
  const [editIdSpot, setEditIdSpot] = useState(null); 

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
        alert("Gagal mengakses GPS. Pastikan izin lokasi di browser sudah diaktifkan.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  function KlikPetaHandler() {
    useMapEvents({
      click(e) {
        if (!editIdSpot) {
          setLatTerpilih(e.latlng.lat.toFixed(6));
          setLngTerpilih(e.latlng.lng.toFixed(6));
        }
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

  const bukaFormEdit = (spot) => {
    setEditIdSpot(spot.id);
    setNamaLokasi(spot.nama_lokasi);
    setDeskripsi(spot.deskripsi || '');
    setLatTerpilih(spot.latitude);
    setLngTerpilih(spot.longitude);
    setKapasitasMotor(spot.kapasitas_motor);
    setKapasitasMobil(spot.kapasitas_mobil);
    setTarifMotor(spot.tarif_motor);
    setTarifMobil(spot.tarif_mobil);
    setJamOperasional(spot.jam_operasional || '08:00 - 22:00');
    
    setTampilMenu(false);
    setPosisiPeta([parseFloat(spot.latitude) + 0.003, parseFloat(spot.longitude)]);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token_admin');
    
    const statusSaatIni = editIdSpot 
      ? lahanSaya.find(s => s.id === editIdSpot)?.status || 'Tersedia' 
      : 'Tersedia';

    const payload = {
      nama_lokasi: namaLokasi,
      deskripsi: deskripsi,
      latitude: parseFloat(latTerpilih),
      longitude: parseFloat(lngTerpilih),
      kapasitas_motor: parseInt(kapasitasMotor),
      kapasitas_mobil: parseInt(kapasitasMobil),
      tarif_motor: parseInt(tarifMotor),
      tarif_mobil: parseInt(tarifMobil),
      jam_operasional: jamOperasional,
      status: statusSaatIni
    };

    try {
      if (editIdSpot) {
        await axios.put(`http://localhost:8000/api/parking/${editIdSpot}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLahanSaya(lahanSaya.map(spot => spot.id === editIdSpot ? { ...spot, ...payload } : spot));
        alert('Data parkiran berhasil diperbarui!');
      } else {
        const response = await axios.post('http://localhost:8000/api/parking', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data && response.data.data) {
          setLahanSaya([...lahanSaya, response.data.data]);
        }
      }
      tutupForm();
    } catch (error) {
      alert('Gagal menyimpan data. Periksa keselarasan format objek payload.');
      console.error(error);
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
    setEditIdSpot(null); 
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
      if (editIdSpot === idSpot) tutupForm(); 
    } catch (error) {
      alert('Gagal menghapus lahan parkir.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token_admin');
    navigate('/');
  };

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#f8fafc', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
          #root { width: 100%; height: 100%; }

          :root {
            --hitam: #0f172a;
            --hitam-hover: #1e293b;
            --teks-label: #475569;
            --teks-muted: #94a3b8;
            --teks-lokasi: #94a3b8;
            --bg-card: #ffffff;
            --bg-input: #f8fafc;
            --border-normal: #e2e8f0;
            --border-input: #e2e8f0;
            
            --buka-bg: #dcfce7; --buka-text: #15803d; --buka-border: #bbf7d0;
            --penuh-bg: #fef3c7; --penuh-text: #b45309; --penuh-border: #fde68a;
          }

          .leaflet-popup-content-wrapper {
            border: 2px solid var(--hitam) !important;
            border-radius: 12px !important;
            box-shadow: 4px 4px 0 rgba(15,23,42,1) !important;
            padding: 0 !important;
          }
          .leaflet-popup-content { margin: 0 !important; width: 260px !important; }
          .leaflet-popup-tip-container { display: none; }

          .topbar-btn {
            height: 38px; border-radius: 8px; border: 2px solid var(--hitam);
            font-size: 12px; font-weight: 700; padding: 0 14px; background: white;
            color: var(--hitam); cursor: pointer; display: flex; align-items: center;
            justify-content: center; gap: 6px; transition: all 0.2s; font-family: inherit;
          }
          .topbar-btn:hover { background: var(--hitam); color: white; }
          .topbar-danger { color: #dc2626; border-color: #dc2626; }
          .topbar-danger:hover { background: #dc2626; color: white; border-color: #dc2626; }

          .drawer-left {
            position: absolute; top: 0; left: 0; bottom: 0; width: 300px;
            border-right: 2px solid var(--hitam); background: var(--bg-card);
            z-index: 1000; display: flex; flex-direction: column;
            box-shadow: 4px 0 15px rgba(0,0,0,0.05); transition: transform 0.3s ease;
          }
          
          .drawer-header {
            padding: 16px 16px 12px; border-bottom: 2px solid var(--hitam);
            display: flex; justify-content: space-between; align-items: center;
          }

          .admin-badge { background: var(--hitam); color: white; font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 6px; }
          .count-badge { background: #f1f5f9; color: var(--hitam); border: 1.5px solid var(--hitam); font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 20px; }
          .drawer-body { padding: 12px; overflow-y: auto; flex: 1; background: #f8fafc; }

          .park-card {
            background: var(--bg-card); border: 1.5px solid var(--border-normal);
            border-radius: 10px; padding: 12px 14px; margin-bottom: 8px; transition: border-color 0.2s;
          }
          .park-card:hover { border-color: var(--hitam); }

          .card-title { font-size: 13px; font-weight: 700; color: var(--hitam); margin-bottom: 2px; }
          .card-desc { font-size: 11px; color: var(--teks-lokasi); margin-bottom: 10px; }

          .status-pill { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 20px; letter-spacing: 0.03em; }
          .status-buka { background: var(--buka-bg); color: var(--buka-text); border: 1px solid var(--buka-border); }
          .status-penuh { background: var(--penuh-bg); color: var(--penuh-text); border: 1px solid var(--penuh-border); }

          .meta-chip {
            background: #f8fafc; border: 1px solid var(--border-normal); border-radius: 6px;
            padding: 4px 8px; font-size: 10px; color: var(--teks-label); display: flex; gap: 4px;
          }
          .meta-chip strong { color: var(--hitam); }

          .action-btn {
            height: 30px; border-radius: 7px; border: 1.5px solid; font-size: 11px; font-weight: 700;
            background: white; cursor: pointer; flex: 1; transition: all 0.2s; font-family: inherit;
          }
          .btn-edit { color: var(--hitam); border-color: var(--hitam); }
          .btn-edit:hover { background: var(--hitam); color: white; }
          .btn-status { color: #16a34a; border-color: #16a34a; }
          .btn-status:hover { background: #16a34a; color: white; }
          .btn-hapus { color: #dc2626; border-color: #dc2626; }
          .btn-hapus:hover { background: #dc2626; color: white; }

          .popup-wrapper { padding: 16px; background: white; border-radius: 10px; }
          .popup-label { font-size: 11px; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; color: var(--teks-label); margin-bottom: 4px; display: block; }
          .popup-input { height: 34px; border-radius: 7px; border: 1.5px solid var(--border-input); font-size: 12px; padding: 0 10px; width: 100%; box-sizing: border-box; font-family: inherit; color: var(--hitam); background: var(--bg-input); outline: none; transition: border 0.2s; }
          .popup-input:focus { border-color: var(--hitam); background: white; }
          .popup-submit { height: 36px; border-radius: 8px; background: var(--hitam); color: white; border: none; font-weight: 700; cursor: pointer; width: 100%; font-family: inherit; margin-top: 10px;}

          @media (max-width: 768px) {
            .drawer-left { width: 82vw !important; max-width: 320px !important; }
            .leaflet-popup-content { width: 240px !important; }
            .popup-wrapper { padding: 12px !important; }
            .popup-input { height: 32px !important; font-size: 11px !important; }
            .park-card { padding: 10px 12px !important; }
            .card-title { font-size: 12px !important; line-height: 1.3 !important; }
            .card-desc { font-size: 10px !important; margin-bottom: 8px !important; }
            .park-card div[style*="display: 'flex'"] { flex-wrap: wrap !important; gap: 4px !important; }
            .meta-chip { padding: 3px 6px !important; font-size: 9px !important; }
            .action-btn { height: 28px !important; font-size: 10px !important; padding: 0 4px !important; }
            .topbar-btn { height: 34px !important; padding: 0 10px !important; font-size: 11px !important; }
          }
        `}
      </style>

      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000, display: 'flex', gap: '8px' }}>
        <button onClick={handleLogout} className="topbar-btn topbar-danger">Keluar</button>
        <button onClick={() => setTampilMenu(!tampilMenu)} className="topbar-btn" title="Toggle Sidebar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </div>

      <div className="drawer-left" style={{ transform: tampilMenu ? 'translateX(0)' : 'translateX(-100%)' }}>
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="admin-badge">Mode Admin</span>
            <span className="count-badge">{lahanSaya.length}</span>
          </div>
          <button onClick={() => setTampilMenu(false)} className="topbar-btn" style={{ padding: '0', width: '30px', height: '30px', border: '1.5px solid' }}>X</button>
        </div>
        
        <div className="drawer-body">
          {lahanSaya.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', marginTop: '20px' }}>Belum ada data parkir.</p>
          ) : (
            lahanSaya.map((spot) => (
              <div key={spot.id} className="park-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <div className="card-title">{spot.nama_lokasi}</div>
                    <div className="card-desc">{spot.deskripsi || "Tanpa keterangan"}</div>
                  </div>
                  <span className={`status-pill ${spot.status === 'Tersedia' ? 'status-buka' : 'status-penuh'}`} style={{ whiteSpace: 'nowrap' }}>
                    {spot.status === 'Tersedia' ? 'BUKA' : 'PENUH'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span className="meta-chip">Motor <strong>{spot.kapasitas_motor}</strong></span>
                  <span className="meta-chip">Mobil <strong>{spot.kapasitas_mobil}</strong></span>
                  <span className="meta-chip">Rp <strong>{spot.tarif_motor}</strong></span>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => bukaFormEdit(spot)} className="action-btn btn-edit">Edit</button>
                  <button onClick={() => gantiStatusLahan(spot.id, spot.status)} className="action-btn btn-status">Status</button>
                  <button onClick={() => handleHapusLahan(spot.id)} className="action-btn btn-hapus">Hapus</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <button
        onClick={dapatkanLokasiSaya}
        style={{
          position: 'absolute', bottom: '30px', right: '30px', zIndex: 1000, width: '45px', height: '45px',
          backgroundColor: '#0f172a', color: 'white', border: '2px solid white', borderRadius: '50%',
          cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', transition: 'all 0.2s'
        }}
        title="Temukan Lokasi Saya"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
      </button>

      <MapContainer center={posisiPeta} zoom={15} zoomControl={false} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <KlikPetaHandler />
        <KameraPetaHandler posisi={posisiPeta} />

        {titikUser && (
          <Marker position={titikUser} icon={ikonLokasiUser}>
            <Popup><div style={{ textAlign: 'center', fontWeight: 'bold', color: '#dc2626', fontFamily: 'inherit' }}>Lokasi Admin</div></Popup>
          </Marker>
        )}

        {lahanSaya.map((spot) => (
          spot.id !== editIdSpot && (
            <Marker key={spot.id} position={[spot.latitude, spot.longitude]} icon={ikonParkirBiru}>
              <Popup>
                <div style={{ textAlign: 'center', fontFamily: 'inherit', fontWeight: 'bold' }}>{spot.nama_lokasi}</div>
              </Popup>
            </Marker>
          )
        ))}

        {latTerpilih && lngTerpilih && (
          <Marker position={[latTerpilih, lngTerpilih]} ref={formMarkerRef} icon={ikonParkirBaru}>
            <Popup autoPan={true} closeButton={false}>
              <div className="popup-wrapper">
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1.5px solid #e2e8f0' }}>
                  {editIdSpot ? ' Edit Lokasi Parkir' : ' Tambah Lokasi Baru'}
                </div>
                
                <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <label className="popup-label">Nama Lokasi</label>
                    <input type="text" className="popup-input" placeholder="Gedung F..." value={namaLokasi} onChange={(e) => setNamaLokasi(e.target.value)} required />
                  </div>
                  
                  <div>
                    <label className="popup-label">Deskripsi / Jalan</label>
                    <input type="text" className="popup-input" placeholder="Jl. Raya Utama..." value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} required />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ flex: 1 }}>
                      <label className="popup-label">Kap. Motor</label>
                      <input type="number" className="popup-input" placeholder="0" value={kapasitasMotor} onChange={(e) => setKapasitasMotor(e.target.value)} required />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="popup-label">Kap. Mobil</label>
                      <input type="number" className="popup-input" placeholder="0" value={kapasitasMobil} onChange={(e) => setKapasitasMobil(e.target.value)} required />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ flex: 1 }}>
                      <label className="popup-label">Tarif Motor</label>
                      <input type="number" className="popup-input" placeholder="0" value={tarifMotor} onChange={(e) => setTarifMotor(e.target.value)} required />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="popup-label">Tarif Mobil</label>
                      <input type="number" className="popup-input" placeholder="0" value={tarifMobil} onChange={(e) => setTarifMobil(e.target.value)} required />
                    </div>
                  </div>

                  <div>
                    <label className="popup-label">Jam Operasional</label>
                    <input type="text" className="popup-input" placeholder="06:00 - 22:00" value={jamOperasional} onChange={(e) => setJamOperasional(e.target.value)} required />
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <button type="submit" className="popup-submit" style={{ flex: 2, margin: 0 }}>Simpan</button>
                    <button type="button" onClick={tutupForm} className="action-btn btn-edit" style={{ flex: 1, height: '36px' }}>Batal</button>
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