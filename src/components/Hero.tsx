import { motion } from 'framer-motion';
import { ArrowRight, Star, Terminal, ExternalLink, BookOpen } from 'lucide-react';
import { useLiveStats } from '../hooks/useLiveStats';
import PsmuxSim from './PsmuxSim';
import styles from './Hero.module.css';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export default function Hero() {
  const liveStats = useLiveStats();
  return (
    <section className={styles.hero}>
      <div className={styles.bgGlow} />
      <div className={styles.bgGrid} />

      <div className={styles.content}>
        <motion.div
          className={styles.pill}
          initial="hidden"
          animate="show"
          custom={0}
          variants={fadeUp}
        >
          <span className={styles.pillDot} />
          v{liveStats.latestVersion} · Native Windows · No WSL Required
        </motion.div>

        <motion.h1
          className={styles.headline}
          initial="hidden"
          animate="show"
          custom={1}
          variants={fadeUp}
        >
          The Native <span className={styles.gradientText}>tmux</span>
          <br />
          for Windows
        </motion.h1>

        <motion.p
          className={styles.subline}
          initial="hidden"
          animate="show"
          custom={2}
          variants={fadeUp}
        >
          Built in <strong>Rust</strong>. Zero WSL. Full tmux compatibility.
        </motion.p>

        <motion.div
          className={styles.ctaRow}
          initial="hidden"
          animate="show"
          custom={3}
          variants={fadeUp}
        >
          <a
            href="https://github.com/psmux/psmux"
            className={styles.ctaPrimary}
            target="_blank"
            rel="noreferrer"
          >
            <Terminal size={18} />
            Get Started
            <ArrowRight size={18} />
          </a>
          <a
            href="https://github.com/psmux/psmux"
            className={styles.ctaSecondary}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={18} />
            View on GitHub
            <span className={styles.starBadge}>
              <Star size={12} fill="currentColor" />
              {liveStats.stars.toLocaleString()}
            </span>
          </a>
          <a href="/docs" className={styles.ctaSecondary}>
            <BookOpen size={18} />
            Docs
          </a>
        </motion.div>

        <motion.div
          className={styles.terminalWrap}
          initial={{ opacity: 0, y: 60, rotateX: 12 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.1, delay: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        >
          <motion.div
            className={styles.terminalGlow}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />

          <PsmuxSim version={liveStats.latestVersion} />
        </motion.div>
      </div>
    </section>
  );
}
