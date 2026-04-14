import { motion } from 'framer-motion';
import { companies } from '../data';
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

function sizeFor(name: string): 'xl' | 'lg' | 'md' | 'sm' {
  return SIZE_BY_NAME[name] ?? 'md';
}

export default function TrustedBy() {
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
          const size = sizeFor(c.name);
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
              <span className={styles.name}>{c.name}</span>
              <span className={styles.count}>{c.count}</span>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
