import { motion } from "framer-motion";
import { ExternalLink, Package } from "lucide-react";
import { useLiveStats } from "../hooks/useLiveStats";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

type Category = "official" | "claude-code" | "tool" | string;

function categoryStyle(category: Category): React.CSSProperties {
  switch (category) {
    case "official":
      return {
        background: "var(--green-glow)",
        color: "var(--green)",
        border: "1px solid rgba(52, 211, 153, 0.35)",
      };
    case "claude-code":
      return {
        background: "rgba(96, 165, 250, 0.15)",
        color: "var(--blue)",
        border: "1px solid rgba(96, 165, 250, 0.35)",
      };
    default:
      return {
        background: "var(--rust-glow)",
        color: "var(--rust)",
        border: "1px solid rgba(249, 115, 22, 0.35)",
      };
  }
}

function categoryLabel(category: Category): string {
  switch (category) {
    case "official": return "Official";
    case "claude-code": return "Claude Code";
    default: return "Tool";
  }
}

export default function Ecosystem() {
  const { ecosystemProjects, ecosystemRepos } = useLiveStats();
  return (
    <section className="section" id="ecosystem">
      <motion.h2
        className="section-title"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5 }}
      >
        A Growing Ecosystem
      </motion.h2>
      <motion.p
        className="section-subtitle"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {ecosystemRepos}+ projects, plugins, and integrations built around <span className="hl-psmux">psmux</span>
      </motion.p>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))",
          gap: 24,
        }}
      >
        {ecosystemProjects.map((project) => (
          <motion.a
            key={`${project.author}/${project.name}`}
            href={`https://github.com/${project.author}/${project.name}`}
            target="_blank"
            rel="noopener noreferrer"
            variants={item}
            whileHover={{ y: -6, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="card"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              textDecoration: "none",
              color: "inherit",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  ...categoryStyle(project.category),
                }}
              >
                <Package size={12} />
                {categoryLabel(project.category)}
              </div>
              <ExternalLink size={16} style={{ color: "var(--text-muted)", transition: "color 0.2s" }} />
            </div>

            <div>
              <div
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                  wordBreak: "break-word",
                }}
              >
                {project.name}
              </div>
              <div
                style={{
                  fontSize: "0.82rem",
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                by{" "}
                <span style={{ color: "var(--accent-bright)" }}>
                  {project.author}
                </span>
              </div>
            </div>

            <div
              style={{
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                flex: 1,
              }}
            >
              {project.description}
            </div>


          </motion.a>
        ))}
      </motion.div>
    </section>
  );
}
