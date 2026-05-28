import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [lahanSaya, setLahanSaya] = useState([]);
  const [namaAdmin, setNamaAdmin] = useState('Admin');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token_admin');

    if (!token) {
      alert('Akses ditolak! Anda harus login terlebih dahulu.');
      navigate('/login');
      return;
    }

    const ambilDataLahanSaya = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/parking/my-spots', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data && response.data.data) {
          setLahanSaya(response.data.data);
        }
      } catch (error) {
        console.error("Gagal mengambil data dashboard:", error);
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token_admin');
          navigate('/login');
        }
      }
    };

    ambilDataLahanSaya();
  }, [navigate]);

  const gantiStatusLahan = async (idSpot, statusSaatIni) => {
    const token = localStorage.getItem('token_admin');
    
    const statusBaru = statusSaatIni === 'Tersedia' ? 'Penuh' : 'Tersedia';

    try {
      await axios.patch(
        `http://localhost:8000/api/parking/${idSpot}/status?new_status=${statusBaru}`, 
        {}, 
        { 
          headers: { 
            Authorization: `Bearer ${token}` 
          } 
        }
      );

      setLahanSaya(lahanSaya.map(spot => 
        spot.id === idSpot ? { ...spot, status: statusBaru } : spot
      ));
    } catch (error) {
      console.error("Eror detail saat patch status:", error.response?.data);
      alert('Gagal mengubah status lahan parkir.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token_admin'); 
    alert('Anda telah keluar.');
    navigate('/'); 
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>Dashboard Pengelolaan Lahan Parkir</h2>
        <button onClick={handleLogout} style={{ padding: '10px 15px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
          Logout
        </button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginBottom: '15px' }}>Daftar Lahan Parkir Milik Anda</h3>
        
        {lahanSaya.length === 0 ? (
          <p style={{ color: '#666' }}>Anda belum memiliki atau mendaftarkan lokasi parkir.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px' }}>Nama Lokasi</th>
                <th style={{ padding: '12px' }}>Deskripsi</th>
                <th style={{ padding: '12px' }}>Status Saat Ini</th>
                <th style={{ padding: '12px' }}>Aksi Sakelar</th>
              </tr>
            </thead>
            <tbody>
              {lahanSaya.map((spot) => (
                <tr key={spot.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{spot.nama_lokasi}</td>
                  <td style={{ padding: '12px' }}>{spot.deskripsi}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '5px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold', backgroundColor: spot.status === 'Tersedia' ? '#d1fae5' : '#fee2e2', color: spot.status === 'Tersedia' ? '#065f46' : '#991b1b' }}>
                      {spot.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button 
                      onClick={() => gantiStatusLahan(spot.id, spot.status)}
                      style={{ padding: '6px 12px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                    >
                      Set Jadi {spot.status === 'Tersedia' ? 'Penuh' : 'Tersedia'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Dashboard;