import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import './Admin.css';

function AdminLogin() {
  const [password, setPassword] = useState('');
  const { login, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (login(password)) {
      navigate('/');
    }
  };

  return (
    <div className="admin-container">
      <h1>Espace Administrateur</h1>
      {isAdmin ? (
        <div className="admin-section">
          <p>Vous êtes actuellement connecté en tant qu'administrateur.</p>
          <p>Des boutons <strong>"+"</strong> apparaissent désormais directement sur les sections de votre portfolio (Skills, Professional Journey, Projets) pour vous permettre d'ajouter du contenu en un clic.</p>
          <button onClick={logout} className="submit-btn" style={{marginTop: '20px'}}>Se déconnecter</button>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="admin-form" style={{maxWidth: '400px'}}>
          <p style={{color: '#9ca3af', marginBottom: '15px'}}>Entrez le mot de passe administrateur (par défaut : <code>admin123</code>)</p>
          <input 
            type="password" 
            placeholder="Mot de passe" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button type="submit" className="submit-btn">Se connecter</button>
        </form>
      )}
    </div>
  );
}

export default AdminLogin;