import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Users, X } from 'lucide-react';
import { useLiveStats } from '../hooks/useLiveStats';
import styles from './TrustedBy.module.css';

const SIZE_BY_NAME: Record<string, 'xl' | 'lg' | 'md' | 'sm'> = {
  Microsoft: 'xl',
  Google: 'xl',
  Meta: 'lg',
  IBM: 'lg',
  Sony: 'lg',
  'NTT Data': 'lg',
  Nexon: 'md',
  Agoda: 'md',
  'Serasa Experian': 'md',
  Fiverr: 'md',
  'CI&T': 'md',
};

function sizeFor(name: string, count: number): 'xl' | 'lg' | 'md' | 'sm' {
  if (SIZE_BY_NAME[name]) return SIZE_BY_NAME[name];
  if (count >= 8) return 'xl';
  if (count >= 4) return 'lg';
  if (count >= 2) return 'md';
  return 'sm';
}

function CompanyLogo({
  logoUrl,
  className,
}: {
  logoUrl?: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!logoUrl || failed) {
    return <Building2 className={className} aria-hidden />;
  }
  return (
    <img
      className={className}
      src={logoUrl}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

export default function TrustedBy() {
  const { topCompanies, companiesRepresented } = useLiveStats();
  const companies = topCompanies.slice(0, 36);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!showAll) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAll(false);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [showAll]);

  return (
    <section className={styles.wrap}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.6 }}
      >
        <div className={styles.eyebrow}>Trusted By</div>
        <h2 className={styles.title}>
          Engineers at World-Class Companies
        </h2>
      </motion.div>

      <div className={styles.cloud}>
        {companies.map((c, i) => {
          const size = sizeFor(c.name, c.count);
          return (
            <motion.div
              key={c.name}
              className={`${styles.company} ${styles[size]}`}
              initial={{ opacity: 0, y: 18, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              whileHover={{ scale: 1.08 }}
              transition={{
                duration: 0.55,
                delay: i * 0.04,
                ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
              }}
            >
              {c.logoUrl && (
                <img
                  className={styles.logo}
                  src={c.logoUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <span className={styles.name}>{c.name}</span>
              <span className={styles.count}>{c.count}</span>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        className={styles.moreRow}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <button
          type="button"
          className={styles.moreBtn}
          onClick={() => setShowAll(true)}
        >
          <Users size={16} />
          See all {topCompanies.length} companies
        </button>
      </motion.div>

      <AnimatePresence>
        {showAll && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowAll(false)}
            role="dialog"
            aria-modal="true"
            aria-label="All companies using psmux"
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <div>
                  <div className={styles.modalTitle}>
                    Companies using psmux
                  </div>
                  <div className={styles.modalSub}>
                    {companiesRepresented.toLocaleString('en-US')} companies
                    represented by stargazers · top {topCompanies.length} by
                    engineer count
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => setShowAll(false)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className={styles.modalList}>
                {topCompanies.map((c, i) => (
                  <div className={styles.row} key={c.name}>
                    <span className={styles.rowRank}>{i + 1}</span>
                    <CompanyLogo logoUrl={c.logoUrl} className={styles.rowLogo} />
                    <span className={styles.rowName}>{c.name}</span>
                    <span className={styles.rowCount}>
                      {c.count} {c.count === 1 ? 'engineer' : 'engineers'}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
