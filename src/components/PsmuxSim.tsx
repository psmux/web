import { useEffect, useRef } from 'react';
import './PsmuxSim.css';

// Animated psmux session drawn in HTML: real psmux commands, prefix key
// splits, a pstop pane and the tmux status line. Ported from the hero on
// psmux.github.io (assets/site.js, initTerm); keep the two in step.

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pad = (s: string | number, n: number) => String(s).padStart(n, ' ');

export default function PsmuxSim({ version }: { version: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = rootRef.current;
    if (!term) return;
    const panes = term.querySelector('.psim-panes') as HTMLElement;
    const P = Array.from(term.querySelectorAll('.psim-pane pre')) as HTMLElement[];
    const paneEls = Array.from(term.querySelectorAll('.psim-pane')) as HTMLElement[];
    const status = term.querySelector('.psim-status') as HTMLElement;
    const winName = term.querySelector('.psim-wactive') as HTMLElement;
    const keys = term.querySelector('.psim-keys') as HTMLElement;
    const PROMPT = '<span class="t-c">PS C:\\dev&gt;</span> ';
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let visible = true;
    let stopped = false;
    let meterTimer: number | undefined;

    const sleep = (ms: number) =>
      new Promise<void>((res, rej) => {
        let start = Date.now();
        const tick = () => {
          if (stopped) return rej('stop');
          if (!visible || document.hidden) { start += 200; window.setTimeout(tick, 200); return; }
          if (Date.now() - start >= ms) return res();
          window.setTimeout(tick, Math.min(60, ms));
        };
        tick();
      });
    const setLines = (i: number, html: string) => { P[i].innerHTML = html; };
    const cursor = () => '<span class="psim-cursor"></span>';
    const focus = (i: number) => paneEls.forEach((p, j) => p.classList.toggle('active', j === i));
    const type = async (i: number, before: string, text: string) => {
      for (let k = 1; k <= text.length; k++) {
        setLines(i, before + PROMPT + esc(text.slice(0, k)) + cursor());
        await sleep(55 + Math.random() * 40);
      }
    };
    const showKeys = async (html: string) => {
      keys.innerHTML = html;
      keys.classList.add('on');
      await sleep(1100);
      keys.classList.remove('on');
    };

    const crates = ['libc v0.2.159', 'windows-sys v0.59.0', 'crossterm v0.28.1', 'unicode-width v0.2.0',
      'portable-pty-psmux v0.9.7', 'vt100-psmux v0.16.13', 'serde v1.0.210', 'tokio v1.40.0', 'clap v4.5.20',
      'regex v1.11.0', `psmux v${version} (C:\\dev\\psmux)`];
    const compiling = (c: string) => `   <span class="t-g t-b">Compiling</span> ${c}`;
    const finished = '    <span class="t-g t-b">Finished</span> `release` profile [optimized] target(s) in 41.32s';
    const tmuxLs = 'tmux ls\nwork: 1 windows (created Thu Oct  8 14:02:11 2026) (attached)\n';

    const bar = (pct: number, width: number) => {
      const n = Math.round((pct / 100) * width);
      let s = '';
      for (let i = 0; i < width; i++) s += i < n ? '|' : ' ';
      const g = s.slice(0, Math.min(n, Math.round(width * 0.55)));
      const a = s.slice(g.length, Math.min(n, Math.round(width * 0.8)));
      const r = s.slice(g.length + a.length, n);
      return `<span class="t-g">${g}</span><span class="t-a">${a}</span><span class="t-r">${r}</span>${s.slice(n)}`;
    };
    const pstopFrame = () => {
      const pane = paneEls[1];
      const cw = parseFloat(getComputedStyle(pane).fontSize) * 0.6 || 7.8;
      const chars = Math.floor((pane.clientWidth - 24) / cw);
      const w = Math.max(4, Math.min(16, Math.floor((chars - 23) / 2)));
      const lines: string[] = [];
      for (let c = 0; c < 4; c++) {
        const a = 8 + Math.random() * 70, b = 5 + Math.random() * 60;
        lines.push(` <span class="t-c">${c}</span>[${bar(a, w)}${pad(a.toFixed(1), 5)}%]  <span class="t-c">${c + 4}</span>[${bar(b, w)}${pad(b.toFixed(1), 5)}%]`);
      }
      const mem = 38 + Math.random() * 6;
      lines.push(` <span class="t-c">Mem</span>[${bar(mem, Math.max(6, w * 2 + 4))} <span class="t-d">${(mem * 0.317).toFixed(1)}G/31.7G</span>]`);
      lines.push('');
      lines.push('<span class="psim-hdr">  PID USER     CPU% MEM% Command          </span>');
      const procs = [['9812', 'dev', 'cargo.exe'], ['10244', 'dev', 'rustc.exe'], ['4120', 'dev', 'psmux.exe'], ['7764', 'dev', 'pwsh.exe'], ['1336', 'SYSTEM', 'svchost.exe']];
      procs.forEach((p, i) => {
        const cpu = i < 2 ? 40 + Math.random() * 50 : Math.random() * 4;
        lines.push(`${pad(p[0], 5)} ${(p[1] + '      ').slice(0, 8)} ${pad(cpu.toFixed(1), 4)} ${pad((Math.random() * 3 + 0.4).toFixed(1), 4)} ${i === 2 ? `<span class="t-g">${p[2]}</span>` : p[2]}`);
      });
      return lines.join('\n');
    };

    const finalState = () => {
      panes.dataset.layout = '3';
      status.classList.add('on');
      winName.textContent = '0:pstop*';
      setLines(0, PROMPT + 'cargo build --release\n' + crates.slice(-6).map(compiling).join('\n') + '\n' + finished + '\n' + PROMPT);
      setLines(1, pstopFrame());
      setLines(2, PROMPT + tmuxLs + PROMPT + cursor());
      focus(2);
    };

    const run = async () => {
      panes.dataset.layout = '1';
      status.classList.remove('on');
      winName.textContent = '0:pwsh*';
      setLines(0, ''); setLines(1, ''); setLines(2, '');
      focus(0);
      const head = '<span class="t-d">PowerShell 7.4.6</span>\n\n';
      setLines(0, head + PROMPT + cursor());
      await sleep(900);
      await type(0, head, 'psmux new-session -s work');
      await sleep(450);
      setLines(0, PROMPT + cursor());
      status.classList.add('on');
      await sleep(900);
      await type(0, '', 'cargo build --release');
      await sleep(300);
      let out = PROMPT + 'cargo build --release\n';
      for (let i = 0; i < crates.length; i++) {
        out += compiling(crates[i]) + '\n';
        setLines(0, out.split('\n').slice(-16).join('\n'));
        await sleep(150 + Math.random() * 140);
        if (i === 5) {
          await showKeys('<kbd>Ctrl</kbd>+<kbd>b</kbd> <kbd>%</kbd><span class="what">split-window -h</span>');
          panes.dataset.layout = '2';
          focus(1);
          setLines(1, PROMPT + cursor());
          await sleep(500);
          await type(1, '', 'pstop');
          await sleep(250);
          winName.textContent = '0:pstop*';
          setLines(1, pstopFrame());
          meterTimer = window.setInterval(() => { if (visible && !document.hidden) setLines(1, pstopFrame()); }, 900);
        }
      }
      out += finished + '\n' + PROMPT;
      setLines(0, out.split('\n').slice(-16).join('\n'));
      await sleep(700);
      await showKeys('<kbd>Ctrl</kbd>+<kbd>b</kbd> <kbd>"</kbd><span class="what">split-window -v</span>');
      panes.dataset.layout = '3';
      focus(2);
      setLines(2, PROMPT + cursor());
      await sleep(500);
      await type(2, '', 'tmux ls');
      await sleep(300);
      setLines(2, PROMPT + tmuxLs + PROMPT + cursor());
      await sleep(7000);
      window.clearInterval(meterTimer);
    };

    if (reduceMotion) { finalState(); return; }

    const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; });
    io.observe(term);
    (async () => {
      while (!stopped) {
        try { await run(); } catch (e) {
          window.clearInterval(meterTimer);
          if (e !== 'stop') finalState();
          return;
        }
      }
    })();

    return () => {
      stopped = true;
      io.disconnect();
      window.clearInterval(meterTimer);
    };
  }, [version]);

  return (
    <div className="psim" ref={rootRef} aria-hidden="true">
      <div className="psim-chrome">
        <span className="psim-tab"><i></i>PowerShell</span><span>+</span>
        <span className="psim-spacer"></span>
        <span className="psim-ctl"><span></span><span></span><span></span></span>
      </div>
      <div className="psim-screen">
        <div className="psim-panes" data-layout="1">
          <div className="psim-pane p0 active"><pre></pre></div>
          <div className="psim-pane p1"><pre></pre></div>
          <div className="psim-pane p2"><pre></pre></div>
        </div>
        <div className="psim-status">
          <span>[work] <span className="psim-wactive">0:pwsh*</span></span>
          <span>"DESKTOP" 14:02 08 Oct 26</span>
        </div>
        <div className="psim-keys"></div>
      </div>
    </div>
  );
}
