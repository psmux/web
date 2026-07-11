import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Users, X } from 'lucide-react';
import { useLiveStats, canonicalCompanyKey } from '../hooks/useLiveStats';
import { companyTiers } from '../data';
import styles from './TrustedBy.module.css';

const TIER_ORDER: Record<string, number> = { xl: 0, lg: 1, md: 2, sm: 3 };

function tierFor(name: string): 'xl' | 'lg' | 'md' | 'sm' {
  return companyTiers[canonicalCompanyKey(name)] ?? 'sm';
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
  // Most prominent brands first; adoption count only breaks ties, never shows.
  const ranked = useMemo(
    () =>
      [...topCompanies].sort((a, b) => {
        const tierDiff = TIER_ORDER[tierFor(a.name)] - TIER_ORDER[tierFor(b.name)];
        if (tierDiff !== 0) return tierDiff;
        if ((b.logoUrl ? 1 : 0) !== (a.logoUrl ? 1 : 0)) {
          return (b.logoUrl ? 1 : 0) - (a.logoUrl ? 1 : 0);
        }
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      }),
    [topCompanies]
  );
  const companies = ranked.slice(0, 36);
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
          const size = tierFor(c.name);
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
          See all {ranked.length} companies
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
                    represented by psmux stargazers worldwide
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
                {ranked.map((c) => (
                  <div className={styles.row} key={c.name}>
                    <CompanyLogo logoUrl={c.logoUrl} className={styles.rowLogo} />
                    <span className={styles.rowName}>{c.name}</span>
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
