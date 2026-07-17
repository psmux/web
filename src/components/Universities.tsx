import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { useLiveStats } from "../hooks/useLiveStats";

function logoUrl(domain?: string) {
  return domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : "";
}

export default function Universities() {
  const { topUniversities, universities: uniCount } = useLiveStats();
  const loop = [...topUniversities, ...topUniversities];
  // ~6s per university, 60s minimum, so scroll speed stays comfortable
  // regardless of list size.
  const marqueeDuration = Math.max(60, topUniversities.length * 6);

  return (
    <section className="section" id="universities">
      <motion.h2
        className="section-title"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5 }}
      >
        Adopted Across Top Universities
      </motion.h2>
      <motion.p
        className="section-subtitle"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Researchers and students at {uniCount}+ universities worldwide
      </motion.p>

      <style>{`
        .uni-marquee-viewport {
          position: relative;
          overflow: hidden;
          width: 100%;
          -webkit-mask-image: linear-gradient(
            90deg,
            transparent 0%,
            #000 8%,
            #000 92%,
            transparent 100%
          );
          mask-image: linear-gradient(
            90deg,
            transparent 0%,
            #000 8%,
            #000 92%,
            transparent 100%
          );
          padding: 16px 0;
        }
        .uni-marquee-track {
          display: flex;
          gap: 18px;
          width: max-content;
          animation: marquee 60s linear infinite;
        }
        .uni-marquee-viewport:hover .uni-marquee-track {
          animation-play-state: paused;
        }
        .uni-pill {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 12px 22px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 999px;
          font-size: 0.92rem;
          font-weight: 600;
          color: var(--text-secondary);
          white-space: nowrap;
          transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
          cursor: default;
        }
        .uni-pill:hover {
          background: var(--bg-card-hover);
          border-color: var(--accent);
          color: var(--accent-bright);
          box-shadow: 0 0 28px var(--accent-glow);
          transform: translateY(-3px) scale(1.04);
        }
        .uni-pill:hover .uni-logo {
          filter: brightness(1.2);
          transform: scale(1.1);
        }
        .uni-logo {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          object-fit: contain;
          background: rgba(255, 255, 255, 0.9);
          padding: 2px;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }
        .uni-pill svg {
          color: var(--accent);
          opacity: 0.75;
          flex-shrink: 0;
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="uni-marquee-viewport"
      >
        <div
          className="uni-marquee-track"
          style={{ animationDuration: `${marqueeDuration}s` }}
        >
          {loop.map((uni, i) => (
            <div key={`${uni.name}-${i}`} className="uni-pill">
              {uni.domain ? (
                <>
                  <img
                    className="uni-logo"
                    src={logoUrl(uni.domain)}
                    alt={`${uni.name} logo`}
                    loading="lazy"
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.style.display = "none";
                      const svg = img.nextElementSibling as HTMLElement | null;
                      if (svg) svg.style.display = "block";
                    }}
                  />
                  <GraduationCap size={20} style={{ display: "none" }} />
                </>
              ) : (
                <GraduationCap size={20} />
              )}
              {uni.name}
            </div>
          ))}
        </div>
      </motion.div>

      <div
        style={{
          textAlign: "center",
          marginTop: 36,
          color: "var(--text-muted)",
          fontSize: "0.85rem",
          fontFamily: "var(--font-mono)",
        }}
      >
        + many more across 4 continents
      </div>
    </section>
  );
}
