import { isValidElement, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import {
  ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, ChevronRight, ChevronUp, Copy,
  ExternalLink, Search, Terminal,
} from "lucide-react";
import "./docs.css";

type DocHeading = { depth: number; text: string };
type Doc = {
  slug: string;
  title: string;
  description: string;
  group: string;
  headings: DocHeading[];
  markdown: string;
  sourceUrl: string;
};
type DocsBundle = { generated: string; source: string; docs: Doc[] };

let bundleCache: DocsBundle | null = null;

function useDocsBundle(): DocsBundle | null {
  const [bundle, setBundle] = useState<DocsBundle | null>(bundleCache);
  useEffect(() => {
    if (bundleCache) return;
    fetch("/docs.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: DocsBundle | null) => {
        if (data && Array.isArray(data.docs)) {
          bundleCache = data;
          setBundle(data);
        }
      })
      .catch(() => {});
  }, []);
  return bundle;
}

function setMeta(doc: Doc | null) {
  const title = doc
    ? `${doc.title} | psmux Docs`
    : "Documentation | psmux, the Native tmux for Windows";
  const description = doc?.description
    ? doc.description
    : "Official psmux documentation: configuration, keybindings, tmux compatibility, scripting, control mode, plugins, and integrations for the native Windows terminal multiplexer.";
  const url = doc
    ? `https://psmux.pages.dev/docs/${doc.slug}`
    : "https://psmux.pages.dev/docs";

  document.title = title;
  const ensure = (selector: string, create: () => HTMLElement) => {
    let el = document.head.querySelector(selector) as HTMLElement | null;
    if (!el) {
      el = create();
      document.head.appendChild(el);
    }
    return el;
  };
  ensure('meta[name="description"]', () => {
    const m = document.createElement("meta");
    m.setAttribute("name", "description");
    return m;
  }).setAttribute("content", description);
  ensure('link[rel="canonical"]', () => {
    const l = document.createElement("link");
    l.setAttribute("rel", "canonical");
    return l;
  }).setAttribute("href", url);

  // TechArticle + breadcrumb structured data for the current doc.
  document.getElementById("docs-jsonld")?.remove();
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "docs-jsonld";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline: doc ? doc.title : "psmux Documentation",
        description,
        url,
        inLanguage: "en",
        isPartOf: { "@id": "https://psmux.pages.dev/#website" },
        about: { "@id": "https://psmux.pages.dev/#software" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "psmux", item: "https://psmux.pages.dev/" },
          { "@type": "ListItem", position: 2, name: "Docs", item: "https://psmux.pages.dev/docs" },
          ...(doc ? [{ "@type": "ListItem", position: 3, name: doc.title, item: url }] : []),
        ],
      },
    ],
  });
  document.head.appendChild(script);
}

// A block longer than this many lines opens folded, showing the first
// COLLAPSED_LINES with a "show all" control, so a page that carries a full
// script reads as prose with code you can open, not as a wall of code.
const COLLAPSE_AFTER = 16;
const COLLAPSED_LINES = 10;

const LANGUAGE_LABELS: Record<string, string> = {
  powershell: "PowerShell", ps1: "PowerShell", pwsh: "PowerShell",
  bash: "Bash", sh: "Shell", shell: "Shell", zsh: "zsh",
  console: "Terminal", text: "Text", plaintext: "Text", txt: "Text",
  tmux: "tmux config", conf: "Config", ini: "Config",
  json: "JSON", jsonc: "JSON", yaml: "YAML", yml: "YAML", toml: "TOML",
  python: "Python", py: "Python", rust: "Rust", rs: "Rust",
  typescript: "TypeScript", ts: "TypeScript", javascript: "JavaScript", js: "JavaScript",
  go: "Go", c: "C", cpp: "C++", cs: "C#", vim: "Vim", lua: "Lua", batch: "Batch", cmd: "Batch", dos: "Batch",
};

// Plain text of a React subtree, so a block's line count is known at render
// time without touching the DOM (rehype-highlight splits code into spans).
function nodeText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (isValidElement<{ children?: React.ReactNode }>(node)) return nodeText(node.props.children);
  return "";
}

function languageOf(children: React.ReactNode): string {
  if (!isValidElement<{ className?: string }>(children)) return "";
  const m = /language-([\w+-]+)/.exec(children.props.className ?? "");
  if (!m) return "";
  const key = m[1].toLowerCase();
  return LANGUAGE_LABELS[key] ?? key.toUpperCase();
}

function CodeBlock(props: React.HTMLAttributes<HTMLPreElement>) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { children, ...rest } = props;
  const label = languageOf(children);
  const lines = useMemo(
    () => nodeText(children).replace(/\n$/, "").split("\n").length,
    [children]
  );

  const foldable = lines > COLLAPSE_AFTER;
  const folded = foldable && !expanded;

  return (
    <div className={`docs-pre-wrap${label ? " has-label" : ""}${folded ? " folded" : ""}`}>
      {label && <span className="docs-pre-label">{label}</span>}
      <pre
        ref={ref}
        {...rest}
        style={folded ? { maxHeight: `calc(${COLLAPSED_LINES} * 1.6em + 32px)` } : undefined}
      >
        {children}
      </pre>
      {foldable && (
        <button
          type="button"
          className="docs-fold-btn"
          aria-expanded={!folded}
          onClick={() => setExpanded((v) => !v)}
        >
          {folded ? (
            <>
              <ChevronDown size={14} /> Show all {lines} lines
            </>
          ) : (
            <>
              <ChevronUp size={14} /> Collapse
            </>
          )}
        </button>
      )}
      <button
        type="button"
        className="docs-copy-btn"
        aria-label="Copy code"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(ref.current?.textContent ?? "");
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          } catch {
            /* noop */
          }
        }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
}

const RAW_DOCS = "https://raw.githubusercontent.com/psmux/psmux/master/docs/";
const REPO_BLOB = "https://github.com/psmux/psmux/blob/master/";

// Resolve a relative markdown link against the folder of the page it appears
// on. Docs live in docs/ and docs/tutorials/, so a tutorial links to
// "../scripting.md" and a top level page links to "tutorials/x.md"; both must
// land on the site page when it exists, or on GitHub when it does not
// (llms.txt, README.md, anything outside docs/). Returns a site path, an
// absolute URL, or null when the href is not a relative path at all. A
// relative link to something that is not a page (a script, llms.txt) goes to
// the file on GitHub rather than dangling.
function resolveDocLink(href: string, fromSlug: string, known: Set<string>): string | null {
  const m = href.match(/^(?!https?:|mailto:|#|\/)([^#?]+)(#[\w-]*)?$/i);
  if (!m) return null;
  const parts = fromSlug.includes("/") ? fromSlug.split("/").slice(0, -1) : [];
  let escaped = 0; // how far above docs/ the path climbed
  for (const seg of m[1].split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") {
      if (parts.length) parts.pop();
      else escaped++;
      continue;
    }
    parts.push(seg);
  }
  const joined = parts.join("/");
  const slug = joined.replace(/\.md$/i, "");
  if (escaped === 0 && /\.md$/i.test(joined) && known.has(slug)) return `/docs/${slug}${m[2] ?? ""}`;
  const repoPath = escaped > 0 ? joined : `docs/${joined}`;
  return `${REPO_BLOB}${repoPath}${m[2] ?? ""}`;
}

export default function DocsPage() {
  const bundle = useDocsBundle();
  // Nested slugs (tutorials/getting-started-windows) come in through the splat.
  const params = useParams();
  const slug = (params["*"] ?? "").replace(/\/+$/, "") || undefined;
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [toc, setToc] = useState<{ id: string; text: string; depth: number }[]>([]);
  const [activeId, setActiveId] = useState("");
  const contentRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const docs = useMemo(() => bundle?.docs ?? [], [bundle]);
  const doc = useMemo(
    () => docs.find((d) => d.slug === slug) ?? docs[0] ?? null,
    [docs, slug]
  );
  const docIndex = doc ? docs.indexOf(doc) : -1;

  const groups = useMemo(() => {
    const out: { title: string; docs: Doc[] }[] = [];
    for (const d of docs) {
      const g = out.find((x) => x.title === d.group);
      if (g) g.docs.push(d);
      else out.push({ title: d.group, docs: [d] });
    }
    return out;
  }, [docs]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return docs
      .map((d) => {
        let score = 0;
        if (d.title.toLowerCase().includes(q)) score += 5;
        const heading = d.headings.find((h) => h.text.toLowerCase().includes(q));
        if (heading) score += 3;
        if (d.markdown.toLowerCase().includes(q)) score += 1;
        return { d, score, heading };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [docs, query]);

  useEffect(() => {
    setMeta(doc);
  }, [doc]);

  // Redirect bad slugs to the docs home once the bundle is known.
  useEffect(() => {
    if (bundle && slug && !docs.some((d) => d.slug === slug)) {
      navigate("/docs", { replace: true });
    }
  }, [bundle, slug, docs, navigate]);

  // Build the on page TOC from the rendered headings, then scroll spy.
  useEffect(() => {
    const root = contentRef.current;
    if (!root || !doc) return;
    const nodes = Array.from(root.querySelectorAll("h2, h3"));
    setToc(
      nodes.map((n) => ({
        id: n.id,
        text: n.textContent ?? "",
        depth: n.tagName === "H2" ? 2 : 3,
      }))
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveId(e.target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );
    nodes.forEach((n) => observer.observe(n));
    if (window.location.hash) {
      root.querySelector(window.location.hash)?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
    return () => observer.disconnect();
  }, [doc]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const knownSlugs = useMemo(() => new Set(docs.map((d) => d.slug)), [docs]);
  const currentSlug = doc?.slug ?? "";
  const markdownComponents = useMemo(
    () => ({
      pre: CodeBlock,
      a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
        const { href = "", children, ...rest } = props;
        const resolved = resolveDocLink(href, currentSlug, knownSlugs);
        if (resolved && resolved.startsWith("/docs/")) {
          return (
            <Link to={resolved} {...rest}>
              {children}
            </Link>
          );
        }
        if (resolved) {
          return (
            <a href={resolved} {...rest} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          );
        }
        const external = /^https?:/i.test(href);
        return (
          <a
            href={href}
            {...rest}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {children}
          </a>
        );
      },
      img: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
        const { src = "", alt = "", ...rest } = props;
        const resolved = /^https?:/i.test(String(src)) ? src : RAW_DOCS + src;
        return <img src={resolved as string} alt={alt} loading="lazy" {...rest} />;
      },
      table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
        <div className="docs-table-wrap">
          <table {...props} />
        </div>
      ),
    }),
    [currentSlug, knownSlugs]
  );

  return (
    <div className="docs-page">
      <header className="docs-header">
        <Link to="/" className="docs-brand">
          <Terminal size={18} />
          psmux
          <span className="docs-brand-sep">/</span>
          <BookOpen size={15} />
          Docs
        </Link>
        <div className="docs-search">
          <Search size={15} />
          <input
            ref={searchRef}
            type="search"
            placeholder="Search docs...  ( / )"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search documentation"
          />
          {results.length > 0 && (
            <div className="docs-search-results" role="listbox">
              {results.map(({ d, heading }) => (
                <button
                  key={d.slug}
                  type="button"
                  onClick={() => {
                    setQuery("");
                    navigate(`/docs/${d.slug}`);
                  }}
                >
                  <span className="docs-search-title">{d.title}</span>
                  {heading && (
                    <span className="docs-search-hit">
                      <ChevronRight size={12} /> {heading.text}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <a
          className="docs-gh"
          href="https://github.com/psmux/psmux"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="psmux on GitHub"
        >
          GitHub <ExternalLink size={14} />
        </a>
      </header>

      <div className="docs-shell">
        <nav className="docs-sidebar" aria-label="Documentation">
          {groups.map((g) => (
            <div key={g.title} className="docs-group">
              <div className="docs-group-title">{g.title}</div>
              {g.docs.map((d) => (
                <Link
                  key={d.slug}
                  to={`/docs/${d.slug}`}
                  className={`docs-nav-link${d.slug === doc?.slug ? " active" : ""}`}
                >
                  {d.title}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <main className="docs-content" ref={contentRef}>
          {!bundle && <div className="docs-loading">Loading documentation...</div>}
          {bundle && doc && (
            <>
              <div className="docs-crumbs">
                <Link to="/">Home</Link>
                <ChevronRight size={13} />
                <Link to="/docs">Docs</Link>
                <ChevronRight size={13} />
                <span>{doc.group}</span>
              </div>
              <article className="docs-article">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSlug, rehypeHighlight]}
                  components={markdownComponents}
                >
                  {doc.markdown}
                </ReactMarkdown>
              </article>
              <div className="docs-footer">
                <a
                  href={doc.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="docs-edit"
                >
                  <ExternalLink size={14} /> Edit this page on GitHub
                </a>
                <div className="docs-pager">
                  {docIndex > 0 && (
                    <Link className="docs-pager-link" to={`/docs/${docs[docIndex - 1].slug}`}>
                      <ArrowLeft size={15} />
                      <span>
                        <small>Previous</small>
                        {docs[docIndex - 1].title}
                      </span>
                    </Link>
                  )}
                  {docIndex >= 0 && docIndex < docs.length - 1 && (
                    <Link
                      className="docs-pager-link next"
                      to={`/docs/${docs[docIndex + 1].slug}`}
                    >
                      <span>
                        <small>Next</small>
                        {docs[docIndex + 1].title}
                      </span>
                      <ArrowRight size={15} />
                    </Link>
                  )}
                </div>
                {bundle.generated && (
                  <div className="docs-generated">
                    Synced from{" "}
                    <a href={bundle.source} target="_blank" rel="noopener noreferrer">
                      psmux/psmux docs
                    </a>{" "}
                    on {new Date(bundle.generated).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </main>

        <aside className="docs-toc" aria-label="On this page">
          {toc.length > 1 && (
            <>
              <div className="docs-toc-title">On this page</div>
              {toc.map((t) => (
                <a
                  key={t.id}
                  href={`#${t.id}`}
                  className={`docs-toc-link depth-${t.depth}${t.id === activeId ? " active" : ""}`}
                >
                  {t.text}
                </a>
              ))}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
