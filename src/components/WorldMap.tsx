import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { geoNaturalEarth1, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import { useLiveStats } from "../hooks/useLiveStats";
import type { MapPoint } from "../data";

const W = 960;
const H = 500;

export default function WorldMap() {
  const {
    mapPoints: points,
    companiesRepresented,
    cities,
    countries,
    continents,
  } = useLiveStats();
  const [topo, setTopo] = useState<Topology | null>(null);
  const [hovered, setHovered] = useState<MapPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const cityCount = cities ?? points.length;
  const countryCount =
    countries ?? new Set(points.map((p) => p.country).filter(Boolean)).size;
  const continentCount =
    continents ?? new Set(points.map((p) => p.continent).filter(Boolean)).size;

  useEffect(() => {
    fetch("/world-110m.json")
      .then((r) => r.json())
      .then((data: Topology) => setTopo(data));
  }, []);

  const projection = useMemo(
    () =>
      geoNaturalEarth1()
        .scale(170)
        .translate([W / 2, H / 2]),
    []
  );

  const pathGenerator = useMemo(() => geoPath(projection), [projection]);

  const countryPaths = useMemo(() => {
    if (!topo) return [];
    const geo = feature(
      topo,
      topo.objects.countries as GeometryCollection
    );
    return geo.features.map((f) => pathGenerator(f as GeoPermissibleObjects) || "");
  }, [topo, pathGenerator]);

  const projectedPoints = useMemo(
    () =>
      points.map((pt) => {
        const [x, y] = projection([pt.lng, pt.lat]) || [0, 0];
        return { ...pt, x, y };
      }),
    [projection, points]
  );

  return (
    <section className="section" id="world-map">
      <motion.h2
        className="section-title"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        A Global Community
      </motion.h2>
      <motion.p
        className="section-subtitle"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Developers, researchers, and engineers across {continentCount} continents trust psmux
      </motion.p>

      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.97 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{
          duration: 0.8,
          ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        }}
        style={{
          position: "relative",
          width: "100%",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(99, 102, 241, 0.07) 0%, #0c0c16 60%, #0a0a0f 100%)",
          border: "1px solid var(--border)",
          boxShadow: "0 0 100px rgba(99, 102, 241, 0.06)",
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: "auto", display: "block" }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="dot-glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="dot-glow-lg">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="map-vignette" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="100%" stopColor="#0a0a0f" />
            </radialGradient>
          </defs>

          {/* Graticule-style grid */}
          {Array.from({ length: 19 }, (_, i) => {
            const lng = -180 + i * 20;
            const coords: [number, number][] = Array.from({ length: 61 }, (_, j) => {
              const lat = -60 + j * 2;
              return projection([lng, lat]) as [number, number];
            }).filter(Boolean);
            return (
              <path
                key={`vlng-${i}`}
                d={`M ${coords.map((c) => `${c[0]},${c[1]}`).join(" L ")}`}
                fill="none"
                stroke="rgba(129, 140, 248, 0.04)"
                strokeWidth={0.4}
              />
            );
          })}
          {Array.from({ length: 7 }, (_, i) => {
            const lat = -60 + i * 20;
            const coords: [number, number][] = Array.from({ length: 181 }, (_, j) => {
              const lng = -180 + j * 2;
              return projection([lng, lat]) as [number, number];
            }).filter(Boolean);
            return (
              <path
                key={`hlat-${i}`}
                d={`M ${coords.map((c) => `${c[0]},${c[1]}`).join(" L ")}`}
                fill="none"
                stroke="rgba(129, 140, 248, 0.04)"
                strokeWidth={0.4}
              />
            );
          })}

          {/* Country shapes */}
          {countryPaths.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="rgba(129, 140, 248, 0.06)"
              stroke="rgba(129, 140, 248, 0.12)"
              strokeWidth={0.5}
            />
          ))}

          {/* Vignette overlay */}
          <rect width={W} height={H} fill="url(#map-vignette)" />

          {/* Data points */}
          {projectedPoints.map((pt, i) => {
            const r =
              pt.size === "lg" ? 6 : pt.size === "md" ? 4.5 : 3;
            const color = pt.color || "#818cf8";
            const delay = i * 0.15;

            return (
              <g
                key={`${pt.label}-${i}`}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => {
                  setHovered(pt);
                  if (containerRef.current) {
                    const rect = containerRef.current.getBoundingClientRect();
                    const scaleX = rect.width / W;
                    const scaleY = rect.height / H;
                    setTooltipPos({
                      x: pt.x * scaleX,
                      y: pt.y * scaleY,
                    });
                  }
                }}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Outer expanding ring */}
                <circle cx={pt.x} cy={pt.y} fill="none" stroke={color}>
                  <animate
                    attributeName="r"
                    values={`${r};${r * 4};${r}`}
                    dur="3.5s"
                    begin={`${delay}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.45;0;0.45"
                    dur="3.5s"
                    begin={`${delay}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="stroke-width"
                    values="1.2;0.15;1.2"
                    dur="3.5s"
                    begin={`${delay}s`}
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Second ring offset */}
                <circle cx={pt.x} cy={pt.y} fill="none" stroke={color}>
                  <animate
                    attributeName="r"
                    values={`${r};${r * 3};${r}`}
                    dur="3.5s"
                    begin={`${delay + 1.2}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.3;0;0.3"
                    dur="3.5s"
                    begin={`${delay + 1.2}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="stroke-width"
                    values="0.8;0.1;0.8"
                    dur="3.5s"
                    begin={`${delay + 1.2}s`}
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Soft glow halo */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={r * 3}
                  fill={color}
                  opacity={0.08}
                  filter={pt.size === "lg" ? "url(#dot-glow-lg)" : "url(#dot-glow)"}
                />

                {/* Core dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={r}
                  fill={color}
                  opacity={0.9}
                  style={{ transition: "r 0.2s, opacity 0.2s" }}
                >
                  <animate
                    attributeName="r"
                    values={`${r};${r * 1.25};${r}`}
                    dur="2.5s"
                    begin={`${delay + 0.4}s`}
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Bright center */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={r * 0.4}
                  fill="#fff"
                  opacity={0.6}
                >
                  <animate
                    attributeName="opacity"
                    values="0.6;0.3;0.6"
                    dur="2.5s"
                    begin={`${delay}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}

          {/* Legend */}
          <g transform={`translate(20, ${H - 90})`}>
            <rect
              x={-8}
              y={-8}
              width={195}
              height={82}
              rx={8}
              fill="rgba(10, 10, 15, 0.7)"
              stroke="rgba(129, 140, 248, 0.1)"
              strokeWidth={0.5}
            />
            {[
              { color: "#60a5fa", label: "Big Tech" },
              { color: "#f97316", label: "Asia Tech Hub" },
              { color: "#fbbf24", label: "University" },
              { color: "#34d399", label: "Community" },
              { color: "#f472b6", label: "Korea Hub" },
              { color: "#818cf8", label: "Developer" },
            ].map((item, i) => {
              const col = i < 3 ? 0 : 1;
              const row = i % 3;
              return (
                <g
                  key={item.label}
                  transform={`translate(${col * 96 + 4}, ${row * 20 + 6})`}
                >
                  <circle cx={6} cy={6} r={4} fill={item.color} opacity={0.85} />
                  <text
                    x={16}
                    y={10}
                    fill="rgba(160, 160, 184, 0.8)"
                    fontSize={9}
                    fontFamily="var(--font-sans)"
                  >
                    {item.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "absolute",
                left: tooltipPos.x,
                top: tooltipPos.y,
                transform: "translate(-50%, calc(-100% - 18px))",
                background: "rgba(14, 14, 22, 0.92)",
                backdropFilter: "blur(16px)",
                border: `1px solid ${hovered.color || "var(--border)"}44`,
                borderRadius: "var(--radius-sm)",
                padding: "12px 16px",
                pointerEvents: "none",
                zIndex: 10,
                minWidth: 200,
                maxWidth: 300,
                boxShadow: `0 12px 40px rgba(0, 0, 0, 0.6), 0 0 20px ${hovered.color || "var(--accent)"}22`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: hovered.color || "#818cf8",
                    boxShadow: `0 0 8px ${hovered.color || "#818cf8"}`,
                  }}
                />
                <div
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {hovered.label}
                </div>
              </div>
              <div
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                  paddingLeft: 16,
                }}
              >
                {hovered.detail}
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: -5,
                  left: "50%",
                  transform: "translateX(-50%) rotate(45deg)",
                  width: 10,
                  height: 10,
                  background: "rgba(14, 14, 22, 0.92)",
                  borderRight: `1px solid ${hovered.color || "var(--border)"}44`,
                  borderBottom: `1px solid ${hovered.color || "var(--border)"}44`,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bottom stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 40,
          marginTop: 40,
        }}
      >
        {[
          { value: `${cityCount}+`, label: "Cities" },
          { value: `${continentCount}`, label: "Continents" },
          { value: `${countryCount}+`, label: "Countries" },
          { value: companiesRepresented.toLocaleString("en-US"), label: "Companies" },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "1.6rem",
                fontWeight: 800,
                background: "var(--gradient-hero)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
