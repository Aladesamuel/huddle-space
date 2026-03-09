import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Terminal, Server, Globe, CheckCircle, ExternalLink, Code } from 'lucide-react';
import { MiniBranding } from '../components/Branding';

export default function Docs() {
  const navigate = useNavigate();

  const steps = [
    {
      icon: <Code size={20} />,
      title: "1. Fork the Repository",
      content: "Head over to our GitHub and fork the official Guddl. repository to your own account."
    },
    {
      icon: <Server size={20} />,
      title: "2. Connect to Vercel",
      content: "Import your fork into Vercel. Select 'Vite' as the framework preset (it should be detected automatically)."
    },
    {
      icon: <Terminal size={20} />,
      title: "3. Configure Environment",
      content: "Add an environment variable: 'VITE_BRAND_SITE=false'. This tells Guddl to skip the landing page and act as a dedicated office portal."
    },
    {
      icon: <Globe size={20} />,
      title: "4. Deploy",
      content: "Hit deploy. Your team's custom office portal is now live on your own domain."
    }
  ];

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav style={{
        height: 80,
        display: 'flex',
        alignItems: 'center',
        padding: '0 5vw',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        background: 'var(--bg)',
        zIndex: 10
      }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: 0 }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', marginRight: 60 }}>
          <MiniBranding />
        </div>
      </nav>

      <main style={{ flex: 1, padding: '80px 5vw', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <header style={{ marginBottom: 64 }}>
           <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 24, letterSpacing: -1 }}>Self-Hosting Guddl.</h1>
           <p style={{ fontSize: 20, color: 'var(--text-sub)', lineHeight: 1.6 }}>
             Run your own instance of Guddl. for maximum control and privacy. We recommend using <strong>Vercel</strong> for a seamless setup experience.
           </p>
        </header>

        <section style={{ marginBottom: 80 }}>
           <div style={{ background: 'var(--bg-raised)', padding: 40, borderRadius: 32, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, color: 'var(--blue)' }}>
                 <CheckCircle size={24} />
                 <h2 style={{ fontSize: 24, fontWeight: 800 }}>Quick Start Guide</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                 {steps.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 24 }}>
                       <div style={{ 
                          width: 48, 
                          height: 48, 
                          borderRadius: 12, 
                          background: 'var(--bg)', 
                          border: '1px solid var(--border)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: 'var(--blue)',
                          flexShrink: 0
                       }}>
                          {step.icon}
                       </div>
                       <div>
                          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{step.title}</h3>
                          <p style={{ color: 'var(--text-ghost)', lineHeight: 1.6 }}>{step.content}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        <section style={{ marginBottom: 80 }}>
           <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 32 }}>Configuration</h2>
           <div style={{ background: '#0f172a', borderRadius: 24, padding: 32, color: '#f8fafc', fontFamily: 'monospace', fontSize: 14 }}>
              <div style={{ color: '#94a3b8', marginBottom: 16 }}># .env</div>
              <div><span style={{ color: '#38bdf8' }}>VITE_BRAND_SITE</span>=<span style={{ color: '#facc15' }}>false</span></div>
              <div style={{ color: '#94a3b8', marginTop: 32 }}># This setting removes the marketing landing page and </div>
              <div style={{ color: '#94a3b8' }}># makes the office creation form your primary homepage.</div>
           </div>
        </section>

        <section style={{ 
          background: 'linear-gradient(135deg, var(--blue) 0%, #1e40af 100%)', 
          borderRadius: 32, 
          padding: 48, 
          color: 'white',
          textAlign: 'center'
        }}>
           <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>Ready to go?</h2>
           <p style={{ marginBottom: 32, opacity: 0.9 }}>Join dozens of startups already using their own Guddl. instances.</p>
           <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="btn" style={{ background: 'white', color: 'var(--blue)', fontWeight: 800, padding: '16px 40px', borderRadius: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              GitHub Repo <ExternalLink size={18} />
           </a>
        </section>

        <footer style={{ marginTop: 100, borderTop: '1px solid var(--border)', paddingTop: 40, textAlign: 'center', color: 'var(--text-ghost)', fontSize: 14 }}>
           Documentation provided by Guddl. Foundation. Supported by <a href="https://Newstartlist.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>Newstartlist.com</a>.
        </footer>
      </main>
    </div>
  );
}
