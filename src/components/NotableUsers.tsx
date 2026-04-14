import { motion } from "framer-motion";
import { Users, Quote, Star } from "lucide-react";
import { notableUsers } from "../data";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

function formatFollowers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export default function NotableUsers() {
  return (
    <section className="section" id="notable-users">
      <motion.h2
        className="section-title"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5 }}
      >
        Starred by Industry Leaders
      </motion.h2>
      <motion.p
        className="section-subtitle"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Recognized by developers, security researchers, MVPs, and content creators worldwide
      </motion.p>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 400px), 1fr))",
          gap: 24,
        }}
      >
        {notableUsers.map((user) => {
          const highlightStyle: React.CSSProperties = user.highlight
            ? {
                borderColor: "rgba(251, 191, 36, 0.45)",
                boxShadow:
                  "0 0 0 1px rgba(251, 191, 36, 0.2), 0 0 32px rgba(251, 191, 36, 0.15)",
                background:
                  "linear-gradient(180deg, rgba(251, 191, 36, 0.04) 0%, var(--bg-card) 60%)",
              }
            : {};

          return (
            <motion.a
              key={user.login}
              href={`https://github.com/${user.login}`}
              target="_blank"
              rel="noopener noreferrer"
              variants={item}
              whileHover={{ y: -6, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                textDecoration: "none",
                color: "inherit",
                position: "relative",
                overflow: "hidden",
                ...highlightStyle,
              }}
            >
              {user.highlight && (
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    background: "rgba(251, 191, 36, 0.12)",
                    color: "var(--yellow)",
                    border: "1px solid rgba(251, 191, 36, 0.35)",
                  }}
                >
                  <Star size={12} fill="currentColor" /> Featured
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <img
                  src={`https://github.com/${user.login}.png`}
                  alt={user.name}
                  loading="lazy"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    border: user.highlight
                      ? "2px solid rgba(251, 191, 36, 0.5)"
                      : "2px solid var(--border)",
                    background: "var(--bg-secondary)",
                    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                  }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      lineHeight: 1.25,
                    }}
                  >
                    {user.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--accent-bright)",
                      fontWeight: 500,
                      marginTop: 2,
                    }}
                  >
                    {user.title}
                  </div>
                  {user.company && (
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      @ {user.company}
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <Users size={14} />
                {formatFollowers(user.followers)} followers
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "14px 16px",
                  background: "rgba(129, 140, 248, 0.06)",
                  border: "1px solid rgba(129, 140, 248, 0.12)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                  color: "var(--text-secondary)",
                }}
              >
                <Quote
                  size={16}
                  style={{
                    color: "var(--accent)",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                />
                <span>{user.quote}</span>
              </div>
            </motion.a>
          );
        })}
      </motion.div>
    </section>
  );
}
