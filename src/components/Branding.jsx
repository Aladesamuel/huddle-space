import React from 'react';
import { Infinity } from 'lucide-react';

export default function Branding({ size = 42, fontSize = 42, showIcon = true, showText = true, spacing = 24 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      {showIcon && (
        <div style={{
          width: size * 1.5, height: size * 1.5,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: spacing,
          position: 'relative'
        }}>
          {/* Multi-colored Infinity Gradient Effect */}
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Infinity 
              size={size * 1.2} 
              style={{ 
                stroke: 'url(#guddl-gradient)',
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))'
              }} 
              strokeWidth={3}
            />
            {/* SVG Gradient Definition */}
            <svg width="0" height="0" style={{ position: 'absolute' }}>
              <defs>
                <linearGradient id="guddl-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="var(--blue)" />
                  <stop offset="25%"  stopColor="var(--red)" />
                  <stop offset="70%"  stopColor="var(--amber)" />
                  <stop offset="100%" stopColor="var(--green)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      )}
      {showText && (
        <h1 style={{ 
          fontSize: fontSize, 
          fontWeight: 900, 
          letterSpacing: -1.5, 
          color: 'var(--text-ash)', 
          margin: 0,
          fontFamily: "'Inter', sans-serif"
        }}>
          Guddl.
        </h1>
      )}
    </div>
  );
}

export function MiniBranding({ size = 20, fontSize = 18 }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Infinity 
                    size={size} 
                    style={{ stroke: 'url(#guddl-gradient-mini)' }} 
                    strokeWidth={3}
                />
                <svg width="0" height="0" style={{ position: 'absolute' }}>
                    <defs>
                        <linearGradient id="guddl-gradient-mini" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%"   stopColor="var(--blue)" />
                            <stop offset="25%"  stopColor="var(--red)" />
                            <stop offset="70%"  stopColor="var(--amber)" />
                            <stop offset="100%" stopColor="var(--green)" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
            <span style={{ fontSize: fontSize, fontWeight: 900, letterSpacing: -0.5, color: 'var(--text-ash)' }}>
                Guddl.
            </span>
        </div>
    );
}
