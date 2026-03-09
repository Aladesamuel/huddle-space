import React from 'react';
import { Infinity } from 'lucide-react';

export default function Branding({ size = 42, fontSize = 42, iconSize = 42, showIcon = true, showText = true, color = 'var(--blue)', spacing = 28, rotate = -5 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      {showIcon && (
        <div style={{
          width: size * 1.9, height: size * 1.9, borderRadius: size * 0.57,
          background: color, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: spacing,
          boxShadow: `0 ${size * 0.28}px ${size * 0.95}px var(--blue-glow)`,
          transform: `rotate(${rotate}deg)`
        }}>
          <Infinity size={iconSize} color="#fff" strokeWidth={2.5} />
        </div>
      )}
      {showText && (
        <h1 style={{ 
          fontSize: fontSize, 
          fontWeight: 900, 
          letterSpacing: -1.5, 
          color: 'var(--text)', 
          margin: 0,
          fontFamily: "'Inter', sans-serif"
        }}>
          Guddl.
        </h1>
      )}
    </div>
  );
}

export function MiniBranding({ size = 24, fontSize = 20, iconSize = 16, color = 'var(--blue)' }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
                width: size * 1.5, height: size * 1.5, borderRadius: size * 0.4,
                background: color, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 ${size * 0.15}px ${size * 0.5}px var(--blue-glow)`,
                transform: 'rotate(-5deg)'
            }}>
                <Infinity size={iconSize} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: fontSize, fontWeight: 900, letterSpacing: -0.5, color: 'var(--text)' }}>
                Guddl.
            </span>
        </div>
    );
}
