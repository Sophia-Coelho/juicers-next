import React from 'react';

/** Toast — confirmação flutuante no rodapé. */
export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div
      className="jc-toast-anim"
      style={{
        position: 'fixed',
        bottom: 26,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 70,
        background: '#e2e2e2',
        border: '1px solid #d0d0d0',
        borderRadius: 12,
        padding: '13px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: '0 16px 40px -16px rgba(0,0,0,.7)',
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3fb950" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="M22 4L12 14.01l-3-3" />
      </svg>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0f0f0f' }}>{message}</span>
    </div>
  );
}
