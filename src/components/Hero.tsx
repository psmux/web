import { motion } from 'framer-motion';
import { ArrowRight, Star, Terminal, ExternalLink } from 'lucide-react';
import { useLiveStats } from '../hooks/useLiveStats';
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
          v3.3.2 · Native Windows · No WSL Required
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

          <motion.div
            className={styles.terminal}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className={styles.titleBar}>
              <div className={styles.dots}>
                <div className={styles.dot} style={{ background: '#ff5f57' }} />
                <div className={styles.dot} style={{ background: '#febc2e' }} />
                <div className={styles.dot} style={{ background: '#28c840' }} />
              </div>
              <div className={styles.titleText}>psmux — PowerShell — 120×32</div>
            </div>

            <div className={styles.statusBar}>
              <span className={styles.statusSession}>[dev]</span>
              <span className={styles.window}>0:editor*</span>
              <span className={styles.windowIdle}>1:server</span>
              <span className={styles.windowIdle}>2:logs</span>
              <span className={styles.clock}>14:32</span>
            </div>

            <div className={styles.panes}>
              <div className={`${styles.pane} ${styles.paneTall}`}>
                <div className={styles.cmdLine}>
                  <span className={styles.cmt}>// src/session.rs</span>
                </div>
                <div className={styles.cmdLine}>
                  <span className={styles.kw}>pub fn</span>{' '}
                  <span className={styles.cmd}>new_session</span>(
                </div>
                <div className={styles.cmdLine}>
                  &nbsp;&nbsp;name: <span className={styles.kw}>&str</span>,
                </div>
                <div className={styles.cmdLine}>
                  &nbsp;&nbsp;cmd: <span className={styles.kw}>Option</span>
                  &lt;<span className={styles.kw}>String</span>&gt;,
                </div>
                <div className={styles.cmdLine}>
                  ) -&gt; <span className={styles.kw}>Result</span>&lt;Session&gt; &#123;
                </div>
                <div className={styles.cmdLine}>
                  &nbsp;&nbsp;<span className={styles.kw}>let</span> session ={' '}
                  <span className={styles.cmd}>Session</span>::<span className={styles.cmd}>spawn</span>(
                </div>
                <div className={styles.cmdLine}>
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className={styles.str}>"{'{}'}.psmux"</span>,
                </div>
                <div className={styles.cmdLine}>
                  &nbsp;&nbsp;&nbsp;&nbsp;name,
                </div>
                <div className={styles.cmdLine}>
                  &nbsp;&nbsp;)?;
                </div>
                <div className={styles.cmdLine}>
                  &nbsp;&nbsp;<span className={styles.ok}>Ok</span>(session)
                </div>
                <div className={styles.cmdLine}>&#125;</div>
                <div className={styles.cmdLine}>&nbsp;</div>
                <div className={styles.cmdLine}>
                  <span className={styles.muted}>~</span>
                </div>
                <div className={styles.cmdLine}>
                  <span className={styles.muted}>~</span>
                </div>
                <div className={styles.cmdLine}>
                  <span className={styles.muted}>~</span>
                </div>
              </div>

              <div className={styles.pane}>
                <div className={styles.cmdLine}>
                  <span className={styles.prompt}>PS C:\dev\psmux</span>
                  <span className={styles.promptSign}>❯</span>
                  <span className={styles.cmd}>psmux new-session -s dev</span>
                </div>
                <div className={styles.cmdLine}>
                  <span className={styles.ok}>✓</span> session{' '}
                  <span className={styles.str}>"dev"</span> created
                </div>
                <div className={styles.cmdLine}>
                  <span className={styles.prompt}>PS C:\dev\psmux</span>
                  <span className={styles.promptSign}>❯</span>
                  <span className={styles.cmd}>cargo build --release</span>
                </div>
                <div className={styles.cmdLine}>
                  <span className={styles.ok}>&nbsp;&nbsp;Compiling</span> psmux
                  v<span className={styles.num}>3.3.2</span>
                </div>
                <div className={styles.cmdLine}>
                  <span className={styles.ok}>&nbsp;&nbsp;&nbsp;Finished</span>{' '}
                  <span className={styles.muted}>release [optimized] in 12.4s</span>
                </div>
                <div className={styles.cmdLine}>
                  <span className={styles.prompt}>PS C:\dev\psmux</span>
                  <span className={styles.promptSign}>❯</span>
                  <span className={styles.cmd}>_</span>
                  <motion.span
                    className={styles.cursor}
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                </div>
              </div>

              <div className={styles.pane}>
                <div className={styles.cmdLine}>
                  <span className={styles.muted}>$ </span>
                  <span className={styles.cmd}>psmux attach -t dev</span>
                </div>
                <div className={styles.cmdLine}>
                  <span className={styles.ok}>●</span> attached
                </div>
                <div className={styles.cmdLine}>
                  <span className={styles.muted}>$ </span>
                  <span className={styles.cmd}>psmux list-windows</span>
                </div>
                <div className={styles.cmdLine}>
                  <span className={styles.num}>0</span>: editor{' '}
                  <span className={styles.muted}>(2 panes)</span>
                </div>
                <div className={styles.cmdLine}>
                  <span className={styles.num}>1</span>: server{' '}
                  <span className={styles.warn}>(running)</span>
                </div>
                <div className={styles.cmdLine}>
                  <span className={styles.num}>2</span>: logs
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
