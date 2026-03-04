import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    // Unauthorized emails fail silently at Supabase level (signups disabled)
    await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'Inter, sans-serif',
      background: '#f9fafb',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: '40px 48px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        minWidth: 320,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#111827' }}>
          Indie<span style={{ color: '#6366f1' }}>Go</span> 관리자
        </div>
        {submitted ? (
          <p style={{ color: '#6b7280', marginTop: 24 }}>이메일을 확인하세요 ✓</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
            <input
              type="email"
              placeholder="관리자 이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: 12,
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 0',
                borderRadius: 8,
                background: '#6366f1',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? '전송 중...' : '매직 링크 보내기'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
