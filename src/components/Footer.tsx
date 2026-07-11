import { motion } from 'framer-motion';
import { ArrowRight, ExternalLink, BookOpen, Package, Candy } from 'lucide-react';
import { useLiveStats } from '../hooks/useLiveStats';

const Footer = () => {
  const { stars } = useLiveStats();
  return (
    <footer
      style={{
        background:
          'linear-gradient(180deg, var(--bg-primary) 0%, #12121a 40%, #1a1a2e 100%)',
        borderTop: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes psmux-cta-pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(129, 140, 248, 0.55), 0 0 40px rgba(129, 140, 248, 0.35);
          }
          50% {
            box-shadow: 0 0 0 14px rgba(129, 140, 248, 0), 0 0 70px rgba(129, 140, 248, 0.6);
          }
        }
        .psmux-cta-btn {
          animation: psmux-cta-pulse 2.4s ease-in-out infinite;
        }
        .psmux-cta-btn:hover {
          transform: translateY(-3px) scale(1.03) !important;
        }
        .psmux-cta-btn:active {
          transform: translateY(0) scale(0.98) !important;
        }
        .psmux-footer-link {
          transition: all 0.25s ease;
          border-radius: 8px;
          padding: 8px 12px;
        }
        .psmux-footer-link:hover {
          background: rgba(129, 140, 248, 0.08);
          color: var(--accent-bright) !important;
          transform: translateY(-1px);
        }
      `}</style>

      <div
        style={{
          maxWidth: 'var(--content-width)',
          margin: '0 auto',
          padding: '120px 48px 48px',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 900,
            lineHeight: 1.15,
            marginBottom: 18,
            background: 'var(--gradient-hero)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Ready to upgrade your Windows terminal?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            fontSize: 'clamp(1rem, 1.8vw, 1.2rem)',
            color: 'var(--text-secondary)',
            maxWidth: 660,
            margin: '0 auto 48px',
          }}
        >
          Join {stars.toLocaleString('en-US')}+ developers who've made the switch to native tmux on Windows
        </motion.p>

        <motion.a
          href="https://github.com/psmux/psmux"
          target="_blank"
          rel="noopener noreferrer"
          className="psmux-cta-btn"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '20px 44px',
            borderRadius: 999,
            background: 'var(--gradient-hero)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '1.15rem',
            textDecoration: 'none',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          Get Started
          <ArrowRight size={20} />
        </motion.a>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 4,
            marginTop: 64,
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
          }}
        >
          <FooterLink
            href="https://github.com/psmux/psmux"
            icon={<ExternalLink size={16} />}
            label="GitHub"
          />
          <Sep />
          <FooterLink
            href="/docs"
            icon={<BookOpen size={16} />}
            label="Documentation"
          />
          <Sep />
          <FooterLink
            href="https://crates.io/crates/psmux"
            icon={<Package size={16} />}
            label="crates.io"
          />
          <Sep />
          <FooterLink
            href="https://community.chocolatey.org/packages/psmux"
            icon={<Candy size={16} />}
            label="Chocolatey"
          />
        </motion.div>

        <div
          className="divider"
          style={{ margin: '48px auto 28px', maxWidth: 500 }}
        />

        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            letterSpacing: '0.02em',
          }}
        >
          Built with <span style={{ color: 'var(--rust)' }}>Rust</span>. Loved by developers.
        </p>
      </div>
    </footer>
  );
};

const Sep = () => (
  <span
    aria-hidden
    style={{ color: 'var(--text-muted)', padding: '0 2px' }}
  >
    |
  </span>
);

const FooterLink = ({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="psmux-footer-link"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      color: 'var(--text-secondary)',
      textDecoration: 'none',
    }}
  >
    {icon}
    {label}
  </a>
);

export default Footer;
