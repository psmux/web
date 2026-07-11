// WebMCP (https://github.com/webmachinelearning/webmcp): expose site tools
// to browser AI agents via navigator.modelContext. Feature detected; a
// no-op in browsers without an agent.

type WebMcpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args?: unknown) => Promise<{ content: { type: string; text: string }[] }>;
};

function text(value: unknown) {
  return {
    content: [
      {
        type: "text",
        text: typeof value === "string" ? value : JSON.stringify(value),
      },
    ],
  };
}

const tools: WebMcpTool[] = [
  {
    name: "get_psmux_stats",
    description:
      "Live adoption statistics for psmux, the native tmux for Windows: GitHub stars, forks, contributors, companies represented, top companies, notable users, universities, ecosystem projects, and world map points. Refreshed twice weekly.",
    inputSchema: { type: "object", properties: {} },
    execute: async () => {
      const res = await fetch("/live-stats.json");
      return text(await res.json());
    },
  },
  {
    name: "list_psmux_docs",
    description:
      "List all psmux documentation pages with slug, title, and description. Use get_psmux_doc to read one.",
    inputSchema: { type: "object", properties: {} },
    execute: async () => {
      const res = await fetch("/docs.json");
      const bundle = await res.json();
      return text(
        (bundle.docs ?? []).map(
          (d: { slug: string; title: string; description: string }) => ({
            slug: d.slug,
            title: d.title,
            description: d.description,
            url: `https://psmux.pages.dev/docs/${d.slug}`,
          })
        )
      );
    },
  },
  {
    name: "get_psmux_doc",
    description:
      "Return the full markdown of one psmux documentation page by slug (e.g. keybindings, configuration, faq, claude-code).",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Doc slug from list_psmux_docs" },
      },
      required: ["slug"],
    },
    execute: async (args?: unknown) => {
      const slug = (args as { slug?: string } | undefined)?.slug ?? "";
      const res = await fetch("/docs.json");
      const bundle = await res.json();
      const doc = (bundle.docs ?? []).find(
        (d: { slug: string }) => d.slug === slug
      );
      return text(doc ? doc.markdown : `No doc found for slug "${slug}"`);
    },
  },
  {
    name: "get_psmux_install_commands",
    description:
      "Installation commands for psmux on Windows via winget, Scoop, Chocolatey, Cargo, and PowerShell.",
    inputSchema: { type: "object", properties: {} },
    execute: async () =>
      text({
        winget: "winget install psmux",
        scoop: "scoop install psmux",
        chocolatey: "choco install psmux",
        cargo: "cargo install psmux",
        powershell:
          "irm https://raw.githubusercontent.com/psmux/psmux/master/scripts/install.ps1 | iex",
        repository: "https://github.com/psmux/psmux",
      }),
  },
];

export function registerWebMcpTools() {
  try {
    const modelContext = (
      navigator as Navigator & {
        modelContext?: {
          registerTool?: (tool: WebMcpTool) => void;
          provideContext?: (ctx: { tools: WebMcpTool[] }) => void;
        };
      }
    ).modelContext;
    if (!modelContext) return;
    if (typeof modelContext.registerTool === "function") {
      for (const tool of tools) modelContext.registerTool(tool);
    } else if (typeof modelContext.provideContext === "function") {
      modelContext.provideContext({ tools });
    }
  } catch {
    // Agent integration is strictly best effort.
  }
}
