import { motion } from 'framer-motion';
import { GitBranch, FolderGit2, FileCode2 } from 'lucide-react';
import { crossRepoMentions, dotfilesRepos } from '../data';

const dotfilesContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

const dotfilesItem = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const CrossRepo = () => {
  return (
    <section className="section" id="cross-repo">
      <motion.h2
        className="section-title"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        Referenced Across the Ecosystem
      </motion.h2>
      <motion.p
        className="section-subtitle"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        psmux is discussed in major open-source projects
      </motion.p>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1 } },
        }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))',
          gap: 24,
        }}
      >
        {crossRepoMentions.map((mention) => {
          const [org, name] = mention.repo.split('/');
          return (
            <motion.div
              key={mention.repo}
              className="card"
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.45 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    display: 'grid',
                    placeItems: 'center',
                    background: 'rgba(99, 102, 241, 0.12)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: 'var(--accent-bright)',
                    flexShrink: 0,
                  }}
                >
                  <FolderGit2 size={18} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '1rem',
                      fontFamily: 'var(--font-mono)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>{org}/</span>
                    <span style={{ color: 'var(--text-primary)' }}>{name}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {mention.issues.map((issue) => (
                  <a
                    key={issue}
                    href={`https://github.com/${mention.repo}/issues/${issue.replace('#', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="badge badge-accent"
                    style={{ textDecoration: 'none', fontFamily: 'var(--font-mono)' }}
                  >
                    {issue}
                  </a>
                ))}
              </div>

              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                }}
              >
                {mention.context}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Dotfiles Section */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.15 }}
        style={{ marginTop: 72 }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              display: 'grid',
              placeItems: 'center',
              background: 'var(--green-glow)',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              color: 'var(--green)',
              marginBottom: 8,
            }}
          >
            <GitBranch size={24} />
          </div>
          <h3
            style={{
              fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              textAlign: 'center',
            }}
          >
            15+ Developers Ship psmux in Their Dotfiles
          </h3>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.95rem',
              textAlign: 'center',
              maxWidth: 500,
            }}
          >
            Real developers trusting psmux as part of their daily setup
          </p>
        </div>

        <motion.div
          variants={dotfilesContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))',
            gap: 14,
          }}
        >
          {dotfilesRepos.map((df) => {
            const [owner, name] = df.repo.split('/');
            return (
              <motion.a
                key={df.repo}
                href={`https://github.com/${df.repo}`}
                target="_blank"
                rel="noopener noreferrer"
                variants={dotfilesItem}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={`https://github.com/${owner}.png`}
                  alt={owner}
                  loading="lazy"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {name}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      marginTop: 2,
                    }}
                  >
                    <FileCode2 size={10} />
                    {df.detail}
                  </div>
                </div>
              </motion.a>
            );
          })}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default CrossRepo;
