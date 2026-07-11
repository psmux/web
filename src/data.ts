export const latestVersion = "3.3.2";

export const stats = {
  stars: 1259,
  forks: 89,
  contributors: 8,
  commands: 76,
  formatVariables: 126,
  vimKeys: 53,
  issues: 37,
  packageManagers: 5,
  companiesRepresented: 247,
  universities: 33,
  ecosystemRepos: 30,
};

export const companies = [
  { name: "Microsoft", count: 13, logo: "microsoft" },
  { name: "Google", count: 3, logo: "google" },
  { name: "IBM", count: 2, logo: "ibm" },
  { name: "Meta", count: 1, logo: "meta" },
  { name: "Alibaba", count: 1, logo: "alibaba" },
  { name: "Tencent", count: 1, logo: "tencent" },
  { name: "Sony", count: 1, logo: "sony" },
  { name: "Broadcom", count: 1, logo: "broadcom" },
  { name: "Siemens", count: 1, logo: "siemens" },
  { name: "Visa", count: 1, logo: "visa" },
  { name: "Unity", count: 1, logo: "unity" },
  { name: "Foxconn", count: 1, logo: "foxconn" },
  { name: "Bilibili", count: 1, logo: "bilibili" },
  { name: "Worldline", count: 1, logo: "worldline" },
  { name: "Fraunhofer", count: 1, logo: "fraunhofer" },
  { name: "NTT Data", count: 1, logo: "nttdata" },
  { name: "Nexon", count: 1, logo: "nexon" },
  { name: "NHN", count: 1, logo: "nhn" },
  { name: "Agoda", count: 1, logo: "agoda" },
  { name: "Seegene", count: 1, logo: "seegene" },
  { name: "Accelleron", count: 1, logo: "accelleron" },
  { name: "Serasa Experian", count: 1, logo: "experian" },
  { name: "Cricut", count: 1, logo: "cricut" },
  { name: "BSH", count: 1, logo: "bsh" },
  { name: "CI&T", count: 1, logo: "cit" },
  { name: "Fiverr", count: 1, logo: "fiverr" },
];

export const notableUsers = [
  {
    login: "Jaykul",
    name: "Joel Bennett",
    followers: 462,
    title: "15x Microsoft MVP for PowerShell",
    company: "loanDepot",
    highlight: true,
    quote: "Principal DevOps engineer and the most decorated PowerShell community member.",
  },
  {
    login: "joshmedeski",
    name: "Josh Medeski",
    followers: 595,
    title: "Terminal Tooling Content Creator",
    company: "",
    highlight: true,
    quote: "Influential neovim/tmux/fish content creator with a massive terminal-focused audience.",
  },
  {
    login: "jeffersongoncalves",
    name: "Jefferson Goncalves",
    followers: 5356,
    title: "Full-Stack Developer",
    company: "",
    highlight: false,
    quote: "One of Brazil's most followed Laravel/PHP developers on GitHub.",
  },
  {
    login: "Yeachan-Heo",
    name: "Bellman",
    followers: 3689,
    title: "Quantitative Trading Leader",
    company: "",
    highlight: false,
    quote: "Leader of Korea's largest quantitative trading community.",
  },
  {
    login: "pcaversaccio",
    name: "pcaversaccio",
    followers: 2116,
    title: "Security & Crypto Researcher",
    company: "",
    highlight: false,
    quote: "Prolific smart contract security researcher and auditor.",
  },
  {
    login: "tangxiaofeng7",
    name: "tangxiaofeng7",
    followers: 1309,
    title: "Security Researcher",
    company: "",
    highlight: false,
    quote: "Well-known security researcher based in China.",
  },
  {
    login: "andfanilo",
    name: "Fanilo Andrianasolo",
    followers: 713,
    title: "AI/Cloud Engineer & YouTuber",
    company: "Worldline",
    highlight: false,
    quote: "Streamlit content creator and AI/Cloud engineer at Worldline.",
  },
  {
    login: "VonC",
    name: "VonC",
    followers: 479,
    title: "StackOverflow Legend",
    company: "",
    highlight: false,
    quote: "Legendary StackOverflow answerer for git/GitHub since 2009.",
  },
  {
    login: "amrbashir",
    name: "amrbashir",
    followers: 508,
    title: "Open Source Contributor",
    company: "",
    highlight: false,
    quote: "Core Tauri framework contributor and OSS enthusiast.",
  },
  {
    login: "shunkakinoki",
    name: "shunkakinoki",
    followers: 870,
    title: "Web3 Developer",
    company: "0xSequence",
    highlight: false,
    quote: "Building the future of web3 infrastructure at Sequence.",
  },
];

export const universities = [
  { name: "Peking University", domain: "pku.edu.cn" },
  { name: "Zhejiang University", domain: "zju.edu.cn" },
  { name: "KAIST", domain: "kaist.ac.kr" },
  { name: "Yonsei University", domain: "yonsei.ac.kr" },
  { name: "TU Graz", domain: "tugraz.at" },
  { name: "Ohio State University", domain: "osu.edu" },
  { name: "Texas A&M", domain: "tamu.edu" },
  { name: "Sun Yat-sen University", domain: "sysu.edu.cn" },
  { name: "Tongji University", domain: "tongji.edu.cn" },
  { name: "Warsaw University of Technology", domain: "pw.edu.pl" },
  { name: "Hong Kong Polytechnic", domain: "polyu.edu.hk" },
  { name: "Chinese Academy of Sciences", domain: "cas.cn" },
  { name: "Kyung Hee University", domain: "khu.ac.kr" },
  { name: "Beijing Jiaotong University", domain: "bjtu.edu.cn" },
  { name: "Wuhan University", domain: "whu.edu.cn" },
  { name: "Sichuan University", domain: "scu.edu.cn" },
  { name: "Harbin Engineering University", domain: "hrbeu.edu.cn" },
];

export const ecosystemProjects = [
  {
    name: "claude-psmux-team",
    author: "gonnector",
    stars: 5,
    description: "Native Windows Claude Code agent team split panes",
    category: "claude-code",
  },
  {
    name: "psmux-restore",
    author: "tarikguney",
    stars: 0,
    description: "Go CLI to save/restore psmux sessions",
    category: "tool",
  },
  {
    name: "tmux-streamdeck",
    author: "tarikguney",
    stars: 0,
    description: "Stream Deck plugin supporting psmux",
    category: "tool",
  },
  {
    name: "wt-psmux",
    author: "tobiowo",
    stars: 0,
    description: "Patched Windows Terminal with psmux session sync",
    category: "tool",
  },
  {
    name: "psmux-claude-skill",
    author: "Oruga420",
    stars: 1,
    description: "Slash command for psmux + Agent Teams",
    category: "claude-code",
  },
  {
    name: "claude-manager",
    author: "raphaelbgr",
    stars: 0,
    description: "Fleet session manager for Claude Code on psmux",
    category: "claude-code",
  },
  {
    name: "neovim-configuration-windows",
    author: "jack-work",
    stars: 0,
    description: "Neovim integration with psmux (lua/psmux/init.lua)",
    category: "tool",
  },
  {
    name: "psmux-plugins",
    author: "psmux",
    stars: 7,
    description: "Official plugin ecosystem — nord theme, sensible, etc.",
    category: "official",
  },
  {
    name: "Tmux-Plugin-Panel",
    author: "psmux",
    stars: 0,
    description: "TUI plugin manager for tmux/psmux",
    category: "official",
  },
  {
    name: "pstop",
    author: "psmux",
    stars: 0,
    description: "htop-style process viewer, psmux-aware",
    category: "official",
  },
];

// "{v}" is replaced at render time with the live latest release version.
export const packageManagers = [
  {
    name: "PowerShell",
    command: "irm https://raw.githubusercontent.com/psmux/psmux/master/scripts/install.ps1 | iex",
    versions: "One-liner install · v{v}",
    icon: "terminal",
  },
  {
    name: "winget",
    command: "winget install psmux",
    versions: "up to v{v}",
    icon: "terminal",
  },
  {
    name: "Scoop",
    command: "scoop install psmux",
    versions: "Main bucket + 10+ third-party",
    icon: "package",
  },
  {
    name: "Cargo",
    command: "cargo install psmux",
    versions: "crates.io · v{v}",
    icon: "box",
  },
  {
    name: "Chocolatey",
    command: "choco install psmux",
    versions: "up to v{v}",
    icon: "candy",
  },
];

export const features = [
  { label: "Commands", value: "76", detail: "tmux-compatible commands" },
  { label: "Format Variables", value: "126+", detail: "for status line customization" },
  { label: "Vim Keys", value: "53", detail: "copy-mode keybindings" },
  { label: "Zero WSL", value: "Native", detail: "No WSL, Cygwin, or MSYS2" },
  { label: "Built in", value: "Rust", detail: "Safe, fast, native Windows" },
  { label: "Reads", value: ".tmux.conf", detail: "Your existing config works" },
];

export type MapPoint = {
  lat: number;
  lng: number;
  label: string;
  detail: string;
  size?: "lg" | "md" | "sm";
  color?: string;
  country?: string;
  continent?: string;
};

export const mapPoints: MapPoint[] = [
  { lat: 47.6, lng: -122.3, label: "Redmond / Seattle", detail: "Microsoft (11 engineers)", size: "lg", color: "#60a5fa", country: "United States", continent: "North America" },
  { lat: 37.4, lng: -122.1, label: "Mountain View", detail: "Google (tobiowo)", size: "md", color: "#34d399", country: "United States", continent: "North America" },
  { lat: 34.0, lng: -118.2, label: "Los Angeles", detail: "Tim Kersey (@thisisartium)", size: "sm", country: "United States", continent: "North America" },
  { lat: 40.7, lng: -74.0, label: "New York", detail: "Microsoft (j7nw4r)", size: "sm", color: "#60a5fa", country: "United States", continent: "North America" },
  { lat: 39.7, lng: -105.0, label: "Denver", detail: "Visa (RitwikAwasthi)", size: "sm", country: "United States", continent: "North America" },
  { lat: 40.0, lng: -83.0, label: "Ohio", detail: "Ohio State University", size: "sm", color: "#fbbf24", country: "United States", continent: "North America" },
  { lat: 30.6, lng: -96.3, label: "Texas", detail: "Texas A&M Transportation Institute", size: "sm", color: "#fbbf24", country: "United States", continent: "North America" },
  { lat: -23.5, lng: -46.6, label: "Sao Paulo, Brazil", detail: "jeffersongoncalves (5.3k followers) + Serpro", size: "md", color: "#34d399", country: "Brazil", continent: "South America" },
  { lat: -27.8, lng: -64.3, label: "Argentina", detail: "Leandro Torrez (contributor)", size: "sm", country: "Argentina", continent: "South America" },
  { lat: 55.7, lng: 12.6, label: "Copenhagen", detail: "Microsoft (giulioungaretti)", size: "sm", color: "#60a5fa", country: "Denmark", continent: "Europe" },
  { lat: 55.5, lng: 9.5, label: "Denmark", detail: "Unity (hknielsen)", size: "sm", country: "Denmark", continent: "Europe" },
  { lat: 41.4, lng: 2.2, label: "Barcelona", detail: "IBM (lordrip)", size: "sm", country: "Spain", continent: "Europe" },
  { lat: 53.3, lng: -6.3, label: "Ireland", detail: "IBM (gridhawk)", size: "sm", country: "Ireland", continent: "Europe" },
  { lat: 49.0, lng: 12.1, label: "Regensburg", detail: "Broadcom (c-berger)", size: "sm", country: "Germany", continent: "Europe" },
  { lat: 48.8, lng: 11.0, label: "Munich area", detail: "Siemens + Fraunhofer + Bosch", size: "md", country: "Germany", continent: "Europe" },
  { lat: 47.1, lng: 15.4, label: "Graz, Austria", detail: "TU Graz", size: "sm", color: "#fbbf24", country: "Austria", continent: "Europe" },
  { lat: 52.2, lng: 21.0, label: "Warsaw", detail: "Warsaw University of Technology", size: "sm", color: "#fbbf24", country: "Poland", continent: "Europe" },
  { lat: 37.9, lng: 23.7, label: "Athens", detail: "National University of Athens", size: "sm", color: "#fbbf24", country: "Greece", continent: "Europe" },
  { lat: 48.9, lng: 2.3, label: "Paris", detail: "Worldline (andfanilo) + Guerbet", size: "sm", country: "France", continent: "Europe" },
  { lat: 30.0, lng: 31.2, label: "Cairo, Egypt", detail: "amrbashir (Tauri contributor, 508 followers)", size: "sm", country: "Egypt", continent: "Africa" },
  { lat: 31.2, lng: 121.5, label: "Shanghai", detail: "Google + Tongji University + multiple devs", size: "lg", color: "#f97316", country: "China", continent: "Asia" },
  { lat: 39.9, lng: 116.4, label: "Beijing", detail: "Peking University + Beijing Jiaotong", size: "md", color: "#fbbf24", country: "China", continent: "Asia" },
  { lat: 30.3, lng: 120.2, label: "Hangzhou", detail: "Alibaba (Sovea) + Zhejiang University", size: "md", color: "#f97316", country: "China", continent: "Asia" },
  { lat: 22.5, lng: 114.1, label: "Shenzhen", detail: "Foxconn + Tencent + Bilibili", size: "md", color: "#f97316", country: "China", continent: "Asia" },
  { lat: 23.1, lng: 113.3, label: "Guangzhou", detail: "Sun Yat-sen University", size: "sm", color: "#fbbf24", country: "China", continent: "Asia" },
  { lat: 30.6, lng: 114.3, label: "Wuhan", detail: "Wuhan University", size: "sm", color: "#fbbf24", country: "China", continent: "Asia" },
  { lat: 30.7, lng: 104.1, label: "Chengdu", detail: "Sichuan University", size: "sm", color: "#fbbf24", country: "China", continent: "Asia" },
  { lat: 45.8, lng: 126.5, label: "Harbin", detail: "Harbin Engineering University", size: "sm", color: "#fbbf24", country: "China", continent: "Asia" },
  { lat: 36.4, lng: 127.0, label: "South Korea", detail: "KAIST + Kyung Hee + Yonsei + Bellman (3.7k)", size: "lg", color: "#f472b6", country: "South Korea", continent: "Asia" },
  { lat: 35.7, lng: 139.7, label: "Tokyo", detail: "Sony Semiconductor + backspacetokyo", size: "md", color: "#a5b4fc", country: "Japan", continent: "Asia" },
  { lat: 22.3, lng: 114.2, label: "Hong Kong", detail: "Hong Kong Polytechnic University", size: "sm", color: "#fbbf24", country: "Hong Kong", continent: "Asia" },
  { lat: -6.2, lng: 106.8, label: "Indonesia", detail: "Universitas Indonesia + UNESA", size: "sm", color: "#fbbf24", country: "Indonesia", continent: "Asia" },
];

export const crossRepoMentions = [
  {
    repo: "anthropics/claude-code",
    issues: ["#34150", "#42848", "#43840", "#24384"],
    context: "Agent Teams on Windows — psmux is the recommended multiplexer",
  },
  {
    repo: "ScoopInstaller/Main",
    issues: ["#7811"],
    context: "Request to add psmux to Scoop main bucket",
  },
  {
    repo: "joshmedeski/sesh",
    issues: ["#358"],
    context: "tmux session wrapper compatibility with psmux",
  },
  {
    repo: "PowerShell/PowerShell",
    issues: ["#26944"],
    context: "Official discussion: Native Tmux for PowerShell",
  },
  {
    repo: "FrancisVarga/zed",
    issues: ["#4", "#11"],
    context: "Research and bundle psmux for Windows agent team support",
  },
];

export const dotfilesRepos = [
  { repo: "Graham42/windows-dot-files", detail: "setup-psmux.ps1" },
  { repo: "yukimemi/dotfiles", detail: "dot_psmux.conf" },
  { repo: "aglowinthefield/dotfiles", detail: "psmux-sensible plugin" },
  { repo: "mejares-jamesmichael/windows-dotfiles", detail: ".tmux.conf" },
  { repo: "sgruendel/dotfiles", detail: "install_tools.ps1" },
  { repo: "erasin/dotfiles", detail: "wincli.md" },
  { repo: "cmaughan/vimsetup", detail: "install.bat + CLAUDE.md" },
  { repo: "knaka/src", detail: "profile.ps1 + main.ahk" },
  { repo: "john-mutuma/vim-editor", detail: "install.ps1 + AGENTS.md" },
  { repo: "mattcargile/dotfiles", detail: "scoop_export.json" },
  { repo: "yak1ex/configurator", detail: "scoopfile.base.json" },
  { repo: "rynsy/dotfiles", detail: "research notes" },
  { repo: "zero8urn/.dotfiles", detail: "windows setup guide" },
  { repo: "hanthor/bluefin-cli", detail: "windows_mapping.json" },
  { repo: "BobKerns/tmux-demo", detail: "Windows PSMUX guide" },
];
