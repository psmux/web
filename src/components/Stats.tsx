import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useLiveStats } from '../hooks/useLiveStats';
import styles from './Stats.module.css';

type StatDef = {
  label: string;
  key: string;
  suffix?: string;
  tone?: 'accent' | 'rust' | 'green';
  glow: string;
};

const STAT_DEFS: StatDef[] = [
  { label: 'Stars', key: 'stars', tone: 'accent', glow: 'rgba(129, 140, 248, 0.18)' },
  { label: 'Forks', key: 'forks', tone: 'accent', glow: 'rgba(129, 140, 248, 0.18)' },
  { label: 'Commands', key: 'commands', tone: 'rust', glow: 'rgba(249, 115, 22, 0.18)' },
  { label: 'Format Variables', key: 'formatVariables', suffix: '+', tone: 'rust', glow: 'rgba(249, 115, 22, 0.18)' },
  { label: 'Companies', key: 'companiesRepresented', tone: 'green', glow: 'rgba(52, 211, 153, 0.18)' },
  { label: 'Universities', key: 'universities', suffix: '+', tone: 'green', glow: 'rgba(52, 211, 153, 0.18)' },
];

function formatNumber(n: number) {
  return n.toLocaleString('en-US');
}

function Counter({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1600;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {formatNumber(display)}
      {suffix && <span className={styles.suffix}>{suffix}</span>}
    </span>
  );
}

export default function Stats() {
  const liveStats = useLiveStats();

  return (
    <section className={styles.wrap}>
      <div className={styles.grid}>
        {STAT_DEFS.map((stat, i) => (
          <motion.div
            key={stat.label}
            className={`card ${styles.statCard} ${stat.tone ? styles[stat.tone] : ''}`}
            style={{ ['--glow-color' as any]: stat.glow }}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          >
            <div className={styles.statValue}>
              <Counter
                value={liveStats[stat.key as keyof typeof liveStats] as number}
                suffix={stat.suffix}
              />
            </div>
            <div className={styles.statLabel}>{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
