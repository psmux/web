import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, Copy, Check, Terminal } from 'lucide-react';

const keybindings = [
  { key: 'Prefix + c', desc: 'Create new window' },
  { key: 'Prefix + %', desc: 'Split pane left/right' },
  { key: 'Prefix + "', desc: 'Split pane top/bottom' },
  { key: 'Prefix + x', desc: 'Kill current pane' },
  { key: 'Prefix + n', desc: 'Next window' },
  { key: 'Prefix + p', desc: 'Previous window' },
  { key: 'Prefix + d', desc: 'Detach from session' },
  { key: 'Prefix + Arrow', desc: 'Navigate between panes' },
  { key: 'Prefix + z', desc: 'Toggle pane zoom' },
  { key: 'Prefix + [', desc: 'Enter copy mode' },
];

const quickCommands = [
  { cmd: 'psmux', desc: 'Start psmux' },
  { cmd: 'psmux new-session -s work', desc: 'New named session' },
  { cmd: 'psmux ls', desc: 'List sessions' },
  { cmd: 'psmux attach -t work', desc: 'Attach to session' },
  { cmd: 'psmux kill-session -t work', desc: 'Kill a session' },
];

export default function Keybindings() {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const handleCopy = async (cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedCmd(cmd);
      setTimeout(() => setCopiedCmd(null), 2000);
    } catch {
      /* noop */
    }
  };

  return (
    <section className="section" id="usage">
      <motion.h2
        className="section-title"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        Getting Started
      </motion.h2>
      <motion.p
        className="section-subtitle"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Same commands you already know from tmux. Default prefix:{' '}
        <code
          style={{
            background: 'var(--bg-card)',
            padding: '2px 8px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            color: 'var(--accent-bright)',
          }}
        >
          Ctrl+b
        </code>
      </motion.p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
          gap: 32,
        }}
      >
        {/* Quick Commands */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 20,
            }}
          >
            <Terminal size={20} style={{ color: 'var(--accent)' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Quick Commands</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {quickCommands.map((item, i) => (
              <motion.div
                key={item.cmd}
                className="card"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '14px 18px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.88rem',
                      color: 'var(--accent-bright)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <span style={{ color: 'var(--green)', marginRight: 8 }}>$</span>
                    {item.cmd}
                  </div>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      marginTop: 2,
                    }}
                  >
                    {item.desc}
                  </div>
                </div>
                <motion.button
                  onClick={() => handleCopy(item.cmd)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color:
                      copiedCmd === item.cmd
                        ? 'var(--green)'
                        : 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <AnimatePresence mode="wait">
                    {copiedCmd === item.cmd ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check size={16} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Copy size={16} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Keybindings */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 20,
            }}
          >
            <Keyboard size={20} style={{ color: 'var(--rust)' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Essential Keybindings</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {keybindings.map((kb, i) => (
              <motion.div
                key={kb.key}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'border-color 0.25s ease',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = 'var(--border-glow)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = 'var(--border)')
                }
              >
                <code
                  style={{
                    background: '#0a0a0f',
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: '0.82rem',
                    color: 'var(--accent-bright)',
                    border: '1px solid var(--border)',
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {kb.key}
                </code>
                <span
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {kb.desc}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
