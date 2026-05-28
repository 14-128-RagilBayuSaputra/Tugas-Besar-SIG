import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login(){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [pesanEror, setPesanEror] = useState('');
    const navigate = useNavigate();
    const handleLogin = async (e) => {
        e.preventDefault();
        setPesanEror('');

        try {
            const response = await axios.post('http://localhost:8000/api/auth/login',{
                username: username,
                password: password 
            });

            if (response.data && response.data.access_token) {
                localStorage.setItem('token_admin', response.data.access_token);
                alert('Login berhasil');
                navigate('/dashboard');
            }
        }catch (error) {
            if (error.response && error.response.data.detail){
                setPesanEror(error.response.data.deail);
            }else {
                setPesanEror('gagal terhubung ke database');
            }
        }
    };

return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f3f4f6' }}>
      <form onSubmit={handleLogin} style={{ padding: '30px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '300px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Login Admin SIG</h2>
        
        {pesanEror && <p style={{ color: 'red', fontSize: '14px', textAlign: 'center' }}>{pesanEror}</p>}

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Username</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            required 
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            required 
          />
        </div>

        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Masuk
        </button>
      </form>
    </div>
  );
}

export default Login;