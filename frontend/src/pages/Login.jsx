import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Church, Lock, User, AlertCircle, ArrowRight, Loader2, Shield } from 'lucide-react';
import bgImage from '../assets/newlife.jfif';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  
  // Aligned state key to 'username' to match input name and payload
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid User ID or Password. Please check your credentials.');
        }
        throw new Error(data.detail || 'Authentication failed. Please try again.');
      }

      // Safely map response payload matching CustomTokenObtainPairSerializer
      const userProfile = data.user || {
        username: credentials.username,
        designation: data.designation || 'MEMBER',
        email: data.email || ''
      };

      // Store in AuthContext & LocalStorage
      login(userProfile, {
        access: data.access,
        refresh: data.refresh
      });

      // Navigate straight to dashboard dispatcher
      navigate('/dashboard', { replace: true });

    } catch (err) {
      setError(err.message || 'Unable to connect to CCIS Backend Server. Verify Django is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      width: '100vw', height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', backgroundColor: '#020617', margin: 0, padding: 0,
      overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(2, 6, 23, 0.78)', backdropFilter: 'blur(6px)'
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '460px', padding: '24px', boxSizing: 'border-box' }}>
        <div style={{
          backgroundColor: 'rgba(12, 25, 38, 0.94)', backdropFilter: 'blur(16px)',
          borderRadius: '28px', border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '44px 36px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85)',
          color: '#ffffff', textAlign: 'left'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '72px', height: '68px', borderRadius: '20px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399',
              marginBottom: '16px', border: '1px solid rgba(52, 211, 153, 0.3)'
            }}>
              <Church size={34} />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '0', letterSpacing: '0.04em', color: '#ffffff' }}>
              NEWLIFE SDA CHURCH CCIS
            </h1>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', fontWeight: '500' }}>
              Church Clerk Information System
            </p>
          </div>

          {error && (
            <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '14px', backgroundColor: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fecdd3', fontSize: '13px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <AlertCircle size={18} style={{ color: '#fda4af', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '750', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.075em', marginBottom: '8px' }}>
                USER ID
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, paddingLeft: '16px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#059669' }}>
                  <User size={18} />
                </div>
                <input
                  type="text"
                  name="username"
                  required
                  value={credentials.username}
                  onChange={handleChange}
                  placeholder="Mwiti2026"
                  style={{
                    width: '100%', paddingLeft: '48px', paddingRight: '18px', paddingTop: '14px', paddingBottom: '14px',
                    backgroundColor: '#e8f0fe', border: 'none', borderRadius: '14px', color: '#0f172a',
                    fontWeight: '600', fontSize: '15px', boxSizing: 'border-box', outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '750', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.075em', marginBottom: '8px' }}>
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, paddingLeft: '16px', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#059669' }}>
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  value={credentials.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%', paddingLeft: '48px', paddingRight: '18px', paddingTop: '14px', paddingBottom: '14px',
                    backgroundColor: '#e8f0fe', border: 'none', borderRadius: '14px', color: '#0f172a',
                    fontWeight: '600', fontSize: '15px', boxSizing: 'border-box', outline: 'none'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%', padding: '16px', backgroundColor: '#00b894', color: '#020617',
                fontWeight: '800', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em',
                borderRadius: '14px', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px',
                opacity: isSubmitting ? 0.7 : 1, transition: 'all 0.2s ease'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>SIGNING IN...</span>
                </>
              ) : (
                <>
                  <span>LOG IN</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
            <p style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Shield size={14} style={{ color: '#10b981' }} /> Encrypted & ODPC Compliant
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;