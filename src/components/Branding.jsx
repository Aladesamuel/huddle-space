import React from 'react';
import { Infinity } from 'lucide-react';

const LOGO_SRC = "file:///C:/Users/HP/.gemini/antigravity/brain/9c30d3be-eaf8-49c6-a49c-40ed1a19b35a/guddl_logo_transparent_final_1773058028928.png";

export default function Branding({ size = 42, spacing = 24, showText = true, showIcon = true }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      {showIcon && (
        <img 
          src={LOGO_SRC} 
          alt="Guddl." 
          style={{ 
            height: size * 1.8, 
            marginBottom: spacing,
            objectFit: 'contain'
          }} 
        />
      )}
      {!showIcon && showText && (
        <h1 style={{ 
          fontSize: size, 
          fontWeight: 900, 
          letterSpacing: -1.5, 
          color: 'var(--text-ash)', 
          margin: 0 
        }}>
          Guddl.
        </h1>
      )}
    </div>
  );
}

export function MiniBranding({ size = 28 }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img 
              src={LOGO_SRC} 
              alt="Guddl." 
              style={{ 
                height: size, 
                objectFit: 'contain'
              }} 
            />
        </div>
    );
}
