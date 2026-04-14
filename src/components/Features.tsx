import { motion } from 'framer-motion';
import { Monitor, Zap, Target, Terminal, Mouse, ScrollText } from 'lucide-react';

const featureCards = [
  {
    icon: Monitor,
    title: 'Native Windows',
    description:
      'Built specifically for Windows 10/11. No WSL, no Cygwin, no compromises. Works perfectly with Windows Terminal, PowerShell, and cmd.exe.',
    color: '#60a5fa',
  },
  {
    icon: Zap,
    title: 'Zero Dependencies',
    description:
      'Single binary that just works. Download and run. No complex setup or additional software required.',
    color: '#fbbf24',
  },
  {
    icon: Target,
    title: 'tmux Compatible',
    description:
      'Same commands, same keybindings, zero learning curve. Your existing .tmux.conf and muscle memory work on Windows.',
    color: '#34d399',
  },
  {
    icon: Terminal,
    title: 'Multiple Aliases',
    description:
      'Use psmux, pmux, or tmux. They are all identical binaries. Choose the command that feels right for you.',
    color: '#818cf8',
  },
  {
    icon: Mouse,
    title: 'Mouse Support',
    description:
      'Full mouse support for resizing panes, selecting windows, and scrolling. Intuitive and user friendly.',
    color: '#f472b6',
  },
  {
    icon: ScrollText,
    title: 'Scrollback History',
    description:
      '1000 lines of scrollback history per pane. Never lose important terminal output again.',
    color: '#f97316',
  },
];

export default function Features() {
  return (
    <section className="section" id="features">
      <motion.h2
        className="section-title"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        Why Choose psmux?
      </motion.h2>
      <motion.p
        className="section-subtitle"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        The only terminal multiplexer built from the ground up for Windows
      </motion.p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
          gap: 24,
        }}
      >
        {featureCards.map((feat, i) => {
          const Icon = feat.icon;
          return (
            <motion.div
              key={feat.title}
              className="card"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              whileHover={{ y: -6 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  display: 'grid',
                  placeItems: 'center',
                  background: `${feat.color}18`,
                  border: `1px solid ${feat.color}40`,
                  color: feat.color,
                }}
              >
                <Icon size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{feat.title}</h3>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.95rem',
                  lineHeight: 1.65,
                }}
              >
                {feat.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
