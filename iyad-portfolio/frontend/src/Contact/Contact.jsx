import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import './Contact.css';

function Contact() {
  const [contactData, setContactData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');

  const fetchContact = () => {
    fetch('http://localhost:5000/api/portfolio')
      .then((res) => res.json())
      .then((data) => {
        const info = data.contactInfo || {};
        setContactData(info);
        setEmail(info.email || '');
        setPhone(info.phone || '');
        setAddress(info.address || '');
        setLinkedin(info.linkedin || '');
        setGithub(info.github || '');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchContact();
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    const updatedInfo = { email, phone, address, linkedin, github };

    fetch('http://localhost:5000/api/contact', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedInfo)
    })
      .then((res) => {
        if (res.ok) {
          alert("Informations de contact mises à jour !");
          setIsEditing(false);
          fetchContact();
        } else {
          alert("Erreur lors de la sauvegarde.");
        }
      });
  };

  if (loading) return <div className="state-container"><div className="loader"></div>Chargement...</div>;

  return (
    <div className="contact-page">
      <div className="contact-header">
        <h2>Contact Me</h2>
        <p>N'hésitez pas à me contacter pour toute opportunité ou collaboration.</p>
        
        {isAdmin && !isEditing && (
          <button className="edit-mode-btn" onClick={() => setIsEditing(true)}>
            ✎ Modifier les informations
          </button>
        )}
      </div>

      <div className="contact-card-container">
        {isEditing ? (
          <form onSubmit={handleSave} className="contact-edit-form">
            <h3>Modifier les coordonnées</h3>
            <div className="form-group">
              <label>Adresse Email :</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Numéro de téléphone :</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Adresse postale :</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Lien LinkedIn :</label>
              <input type="text" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Lien GitHub :</label>
              <input type="text" value={github} onChange={(e) => setGithub(e.target.value)} />
            </div>
            <div className="form-actions">
              <button type="submit" className="save-changes-btn">💾 Enregistrer</button>
              <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>Annuler</button>
            </div>
          </form>
        ) : (
          <div className="contact-info-grid">
            <div className="contact-item">
              <span className="contact-icon">📧</span>
              <div>
                <h4>Email</h4>
                <a href={`mailto:${contactData.email}`}>{contactData.email}</a>
              </div>
            </div>

            <div className="contact-item">
              <span className="contact-icon">📞</span>
              <div>
                <h4>Téléphone</h4>
                <a href={`tel:${contactData.phone}`}>{contactData.phone}</a>
              </div>
            </div>

            <div className="contact-item">
              <span className="contact-icon">📍</span>
              <div>
                <h4>Adresse postale</h4>
                <p>{contactData.address}</p>
              </div>
            </div>

            <div className="contact-item">
              <span className="contact-icon">🌐</span>
              <div>
                <h4>Réseaux & Profils</h4>
                <div className="social-links">
                  {contactData.linkedin && <a href={contactData.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
                  {contactData.github && <a href={contactData.github} target="_blank" rel="noreferrer">GitHub</a>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Contact;