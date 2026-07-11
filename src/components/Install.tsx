import { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Package, Box, Candy, Copy, Check } from 'lucide-react';
import { packageManagers } from '../data';
import { useLiveStats } from '../hooks/useLiveStats';

const iconMap: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  terminal: Terminal,
  package: Package,
  box: Box,
  candy: Candy,
};

const accentFor = (name: string): string => {
  if (name === 'winget') return '#60a5fa';
  if (name === 'Scoop') return '#34d399';
  if (name === 'Cargo') return '#f97316';
  return '#f472b6';
};

const Install = () => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const { latestVersion } = useLiveStats();

  const handleCopy = async (command: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      setCopiedIdx(null);
    }
  };

  return (
    <section className="section" id="install">
      <motion.h2
        className="section-title"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        Install in Seconds
      </motion.h2>
      <motion.p
        className="section-subtitle"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Available on every major Windows package manager
      </motion.p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
          gap: 24,
        }}
      >
        {packageManagers.map((pm, idx) => {
          const Icon = iconMap[pm.icon] ?? Terminal;
          const accent = accentFor(pm.name);
          const copied = copiedIdx === idx;
          return (
            <motion.div
              key={pm.name}
              className="card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.08 }}
              whileHover={{ y: -4 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    display: 'grid',
                    placeItems: 'center',
                    background: `${accent}20`,
                    border: `1px solid ${accent}55`,
                    color: accent,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Icon size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{pm.name}</div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {pm.versions.replace('{v}', latestVersion)}
                  </div>
                </div>
              </div>

              <div
                className="hide-scrollbar"
                style={{
                  background: '#0a0a0f',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'clamp(0.78rem, 1.2vw, 0.88rem)',
                  color: 'var(--text-primary)',
                  overflowX: 'auto',
                  whiteSpace: 'nowrap',
                  transition: 'border-color 0.3s ease',
                }}
              >
                <span style={{ color: accent, marginRight: 8 }}>$</span>
                {pm.command}
              </div>

              <motion.button
                onClick={() => handleCopy(pm.command, idx)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${copied ? 'var(--green)' : 'var(--border)'}`,
                  background: copied ? 'var(--green-glow)' : 'transparent',
                  color: copied ? 'var(--green)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy command'}
              </motion.button>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default Install;
