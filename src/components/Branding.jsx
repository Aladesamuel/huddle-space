import React from 'react';
import { Infinity } from 'lucide-react';

const GuddlIcon = ({ size = 24 }) => (
  <svg 
    width={size * 1.5} 
    height={size} 
    viewBox="0 0 36 18" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <defs>
      <linearGradient id="guddl-infinity-grad" x1="0" y1="9" x2="36" y2="9" gradientUnits="userSpaceOnUse">
        <stop offset="0%"   stopColor="#4285F4" />
        <stop offset="35%"  stopColor="#EA4335" />
        <stop offset="70%"  stopColor="#FBBC05" />
        <stop offset="100%" stopColor="#34A853" />
      </linearGradient>
    </defs>
    <path 
      d="M18 9c-2.5-3.5-5-5.5-8.5-5.5a5.5 5.5 0 1 0 0 11c3.5 0 6-2 8.5-5.5Zm0 0c2.5 3.5 5 5.5 8.5 5.5a5.5 5.5 0 1 0 0-11c-3.5 0-6 2-8.5 5.5Z" 
      stroke="url(#guddl-infinity-grad)" 
      strokeWidth="4" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export default function Branding({ size = 42, spacing = 24, showText = true, showIcon = true }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      {showIcon && (
        <div style={{ marginBottom: spacing, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GuddlIcon size={size * 1.5} />
        </div>
      )}
      {showText && (
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <h1 style={{ 
            fontSize: size, 
            fontWeight: 900, 
            letterSpacing: -1.5, 
            color: 'var(--text-ash)', 
            margin: 0,
            lineHeight: 1
          }}>
            Guddl.
          </h1>
        </div>
      )}
    </div>
  );
}

export function MiniBranding({ size = 28 }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <GuddlIcon size={size} />
            <span style={{ 
              fontSize: size * 0.8, 
              fontWeight: 900, 
              letterSpacing: -0.5, 
              color: 'var(--text-ash)', 
              lineHeight: 1 
            }}>
                Guddl.
            </span>
        </div>
    );
}
