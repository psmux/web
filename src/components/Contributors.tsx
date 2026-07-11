import { motion } from "framer-motion";
import { GitCommitHorizontal, Heart } from "lucide-react";
import { useLiveStats } from "../hooks/useLiveStats";

export default function Contributors() {
  const { topContributors, contributors: contributorCount } = useLiveStats();

  return (
    <section className="section" id="contributors">
      <motion.h2
        className="section-title"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        Built by the Community
      </motion.h2>
      <motion.p
        className="section-subtitle"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {contributorCount} contributors shaping the native tmux experience on
        Windows
      </motion.p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 200px), 1fr))",
          gap: 20,
        }}
      >
        {topContributors.map((c, i) => {
          const highlight = i < 2;
          return (
            <motion.a
              key={c.login}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              whileHover={{ y: -6 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                padding: "26px 18px",
                textDecoration: "none",
                color: "inherit",
                border: highlight
                  ? "1px solid rgba(129, 140, 248, 0.45)"
                  : undefined,
                boxShadow: highlight
                  ? "0 0 32px rgba(129, 140, 248, 0.12)"
                  : undefined,
              }}
            >
              <div style={{ position: "relative" }}>
                <img
                  src={c.avatarUrl}
                  alt={`${c.login} avatar`}
                  loading="lazy"
                  decoding="async"
                  width={72}
                  height={72}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    border: highlight
                      ? "2px solid var(--accent-bright)"
                      : "2px solid var(--border)",
                    objectFit: "cover",
                  }}
                />
                {highlight && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: -4,
                      right: -4,
                      display: "grid",
                      placeItems: "center",
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "var(--gradient-hero)",
                      color: "#fff",
                    }}
                  >
                    <Heart size={12} fill="currentColor" />
                  </div>
                )}
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "0.98rem",
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {c.login}
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <GitCommitHorizontal size={14} />
                {c.contributions.toLocaleString("en-US")} commits
              </div>
            </motion.a>
          );
        })}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{
          textAlign: "center",
          marginTop: 36,
          fontSize: "0.9rem",
          color: "var(--text-muted)",
        }}
      >
        Want to see your face here?{" "}
        <a
          href="https://github.com/psmux/psmux"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--accent-bright)", textDecoration: "none" }}
        >
          Contributions are welcome
        </a>
      </motion.p>
    </section>
  );
}
