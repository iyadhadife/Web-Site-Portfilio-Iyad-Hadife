import React, { useState } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const success = await login(password);
    if (success) {
      navigate('/admin');
    } else {
      setError('Mot de passe incorrect.');
    }
  };

  return (
    <div className="admin-login-container" style={{ maxWidth: '400px', margin: '80px auto', padding: '20px' }}>
      <h2>Administration</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Mot de passe :</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
        <button type="submit" style={{ padding: '10px 15px', cursor: 'pointer' }}>
          Se connecter
        </button>
      </form>
    </div>
  );
}