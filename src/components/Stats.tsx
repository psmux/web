import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Star, GitFork, Users, Terminal, Palette, Keyboard, Building2, GraduationCap, FolderGit2 } from 'lucide-react';
import { useLiveStats } from '../hooks/useLiveStats';
import styles from './Stats.module.css';

type StatDef = {
  label: string;
  key: string;
  suffix?: string;
  icon: React.ComponentType<{ size?: number }>;
};

type Category = {
  title: string;
  description: string;
  tone: 'accent' | 'rust' | 'green';
  glow: string;
  stats: StatDef[];
};

const STAT_CATEGORIES: Category[] = [
  {
    title: 'GitHub',
    description: 'Open source traction',
    tone: 'accent',
    glow: 'rgba(129, 140, 248, 0.18)',
    stats: [
      { label: 'Stars', key: 'stars', icon: Star },
      { label: 'Forks', key: 'forks', icon: GitFork },
      { label: 'Contributors', key: 'contributors', icon: Users },
    ],
  },
  {
    title: 'Capabilities',
    description: 'tmux feature parity',
    tone: 'rust',
    glow: 'rgba(249, 115, 22, 0.18)',
    stats: [
      { label: 'Commands', key: 'commands', icon: Terminal },
      { label: 'Format Variables', key: 'formatVariables', suffix: '+', icon: Palette },
      { label: 'Vim Keys', key: 'vimKeys', icon: Keyboard },
    ],
  },
  {
    title: 'Community',
    description: 'Who uses psmux',
    tone: 'green',
    glow: 'rgba(52, 211, 153, 0.18)',
    stats: [
      { label: 'Companies', key: 'companiesRepresented', icon: Building2 },
      { label: 'Universities', key: 'universities', suffix: '+', icon: GraduationCap },
      { label: 'Ecosystem Repos', key: 'ecosystemRepos', icon: FolderGit2 },
    ],
  },
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
      {STAT_CATEGORIES.map((cat, ci) => (
        <motion.div
          key={cat.title}
          className={styles.category}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: ci * 0.12, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        >
          <div className={`${styles.categoryHeader} ${styles[cat.tone]}`}>
            <span className={styles.categoryTitle}>{cat.title}</span>
            <span className={styles.categoryDesc}>{cat.description}</span>
          </div>
          <div className={styles.categoryGrid}>
            {cat.stats.map((stat, si) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  className={`card ${styles.statCard} ${styles[cat.tone]}`}
                  style={{ ['--glow-color' as string]: cat.glow }}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.5, delay: ci * 0.12 + si * 0.06, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                >
                  <div className={styles.statIcon}>
                    <Icon size={20} />
                  </div>
                  <div className={styles.statValue}>
                    <Counter
                      value={liveStats[stat.key as keyof typeof liveStats] as number}
                      suffix={stat.suffix}
                    />
                  </div>
                  <div className={styles.statLabel}>{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ))}
      {liveStats.lastUpdated && (
        <div className={styles.updated}>
          Last updated {new Date(liveStats.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      )}
    </section>
  );
}
