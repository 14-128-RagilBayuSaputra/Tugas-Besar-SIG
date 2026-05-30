import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [mode, setMode] = useState('masuk'); 
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [tampilPassword, setTampilPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleMasuk = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const response = await axios.post('http://localhost:8000/api/auth/login', {
        email: username,
        password: password
      });

      if (response.data && response.data.access_token) {
        localStorage.setItem('token_admin', response.data.access_token);
        navigate('/dashboard');
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.detail) {
        const detailEror = error.response.data.detail;
        
        if (typeof detailEror === 'string') {
          setErrorMsg(detailEror);
        } else if (typeof detailEror === 'object') {
          const pesanPertama = detailEror[0]?.msg || JSON.stringify(detailEror);
          setErrorMsg(`Validasi Gagal: ${pesanPertama}`);
        }
      } else {
        setErrorMsg('Gagal terhubung ke server backend.');
      }
    }
  };

  const handleDaftar = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      await axios.post('http://localhost:8000/api/auth/register', {
        email: username,
        password: password
      });

      alert('Pendaftaran berhasil! Silakan masuk dengan akun baru Anda.');
      setMode('masuk'); 
      setPassword('');
    } catch (error) {
      if (error.response && error.response.data && error.response.data.detail) {
        const detailEror = error.response.data.detail;
        
        if (typeof detailEror === 'string') {
          setErrorMsg(detailEror);
        } else if (typeof detailEror === 'object') {
          const pesanPertama = detailEror[0]?.msg || JSON.stringify(detailEror);
          setErrorMsg(`Pendaftaran Gagal: ${pesanPertama}`);
        }
      } else {
        setErrorMsg('Gagal terhubung ke server backend untuk mendaftar.');
      }
    }
  };

  return (
    <div className="login-container">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

          /* RESET MARGIN LAYAR AGAR FULL SCREEN */
          body, html, #root {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }

          :root {
            --hitam: #0f172a;
            --abu-gelap: #64748b;
            --abu-muted: #94a3b8;
            --bg-halaman: #f1f5f9;
            --bg-card: #ffffff;
            --bg-input: #f8fafc;
            --border-input: #cbd5e1;
            --btn-bg: #0f172a;
            --btn-hover: #1e293b;
            --btn-text: #ffffff;
            --err-text: #ef4444;
            --err-border: #ef4444;
          }

          .login-container {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: var(--bg-halaman);
            height: 100vh;
            width: 100vw;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
          }

          .login-card {
            background: var(--bg-card);
            border: 2px solid var(--hitam);
            border-radius: 16px;
            padding: 32px 28px;
            max-width: 380px;
            width: 100%;
            box-sizing: border-box;
            box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
            display: flex;
            flex-direction: column;
          }

          .btn-back-wrapper {
            display: flex;
            justify-content: flex-start;
            margin-bottom: 24px;
          }

          .btn-back {
            background: none;
            border: 2px solid var(--hitam);
            border-radius: 8px;
            padding: 7px 14px;
            font-size: 12px;
            font-weight: 600;
            color: var(--hitam);
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
          }

          .btn-back:hover {
            background: var(--hitam);
            color: var(--btn-text);
          }

          .teks-judul {
            font-size: 22px;
            font-weight: 700;
            color: var(--hitam);
            margin: 0 0 4px 0;
            text-align: left;
          }

          .teks-subjudul {
            font-size: 13px;
            font-weight: 500;
            color: var(--abu-gelap);
            margin: 0 0 24px 0;
            text-align: left;
          }

          .tab-container {
            display: flex;
            border: 2px solid var(--hitam);
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 24px;
          }

          .tab-btn {
            flex: 1;
            height: 38px;
            font-size: 13px;
            font-weight: 700;
            border: none;
            cursor: pointer;
            transition: background 0.2s;
            font-family: inherit;
          }

          .tab-masuk {
            border-right: 2px solid var(--hitam);
          }

          .tab-aktif {
            background: var(--hitam);
            color: var(--btn-text);
          }

          .tab-pasif {
            background: var(--bg-card);
            color: var(--hitam);
          }

          .form-group {
            margin-bottom: 14px;
          }

          .form-label {
            display: block;
            font-size: 12px;
            font-weight: 700;
            color: var(--hitam);
            margin-bottom: 5px;
            text-align: left;
          }

          .input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
          }

          .input-icon {
            position: absolute;
            left: 12px;
            color: var(--abu-gelap);
            display: flex;
          }

          .input-action {
            position: absolute;
            right: 12px;
            background: none;
            border: none;
            color: var(--abu-gelap);
            cursor: pointer;
            display: flex;
            padding: 0;
          }

          .input-action:hover {
            color: var(--hitam);
          }

          .input-field {
            width: 100%;
            height: 42px;
            border-radius: 9px;
            border: 2px solid var(--border-input);
            background: var(--bg-input);
            padding: 0 38px;
            font-size: 13px;
            color: var(--hitam);
            font-family: inherit;
            font-weight: 500;
            box-sizing: border-box;
            transition: all 0.2s;
          }

          .input-field::placeholder {
            color: var(--abu-muted);
          }

          .input-field:focus {
            border-color: var(--hitam);
            background: var(--bg-card);
            outline: none;
          }

          .btn-submit {
            width: 100%;
            height: 44px;
            background: var(--btn-bg);
            color: var(--btn-text);
            border: 2px solid var(--hitam);
            border-radius: 9px;
            font-size: 14px;
            font-weight: 700;
            margin-top: 6px;
            cursor: pointer;
            font-family: inherit;
            transition: all 0.2s;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
          }

          .btn-submit:hover {
            background: var(--btn-hover);
            border-color: var(--btn-hover);
          }

          .pesan-error {
            color: var(--err-text);
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 14px;
            text-align: left;
          }
        `}
      </style>

      <div className="login-card">
        <div className="btn-back-wrapper">
          <Link to="/" className="btn-back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Kembali ke peta
          </Link>
        </div>

        <h2 className="teks-judul">Halo, Admin</h2>
        <p className="teks-subjudul">Masuk atau daftar untuk mengelola parkiran.</p>

        <div className="tab-container">
          <button 
            className={`tab-btn tab-masuk ${mode === 'masuk' ? 'tab-aktif' : 'tab-pasif'}`}
            onClick={() => { setMode('masuk'); setErrorMsg(''); }}
          >
            Masuk
          </button>
          <button 
            className={`tab-btn ${mode === 'daftar' ? 'tab-aktif' : 'tab-pasif'}`}
            onClick={() => { setMode('daftar'); setErrorMsg(''); }}
          >
            Daftar
          </button>
        </div>

        {errorMsg && <div className="pesan-error">{errorMsg}</div>}

        <form onSubmit={mode === 'masuk' ? handleMasuk : handleDaftar}>
          
          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Username kamu..." 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </span>
              <input 
                type={tampilPassword ? "text" : "password"} 
                className="input-field" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="input-action" 
                onClick={() => setTampilPassword(!tampilPassword)}
                title={tampilPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {tampilPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-submit">
            {mode === 'masuk' ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10 17 15 12 10 7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                Masuk
              </>
            ) : (
              'Daftar Sekarang'
            )}
          </button>

        </form>
      </div>
    </div>
  );
}

export default Login;