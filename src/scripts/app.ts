import type { Embed, Mode, SendResult, SendOptions } from '../types';
import { render, esc } from './markdown';

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;
const input = (id: string) => $<HTMLInputElement>(id);

let mode: Mode = 'bot';

const content = $<HTMLTextAreaElement>('content');
const FIELDS = ['token', 'channel', 'hook', 'uname', 'avatar'] as const;
const STORAGE_KEY = 'discord-sender-settings';

/* ---------- Preview + counter ---------- */
function update(): void {
  const text = content.value;
  $('pMd').innerHTML = render(text);
  $('count').textContent = `${text.length} / 2000`;
  $('count').classList.toggle('over', text.length > 2000);

  const title = input('eTitle').value;
  const desc = $<HTMLTextAreaElement>('eDesc').value;
  const footer = input('eFooter').value;
  const image = input('eImage').value.trim();
  const imageOk = /^https?:\/\//.test(image);

  $('pEmbed').hidden = !(title || desc || footer || imageOk);
  $('pEmbed').style.borderLeftColor = input('eColor').value;
  $('pET').textContent = title;
  $('pET').hidden = !title;
  $('pED').innerHTML = render(desc);
  $('pEF').textContent = footer;
  $('pEF').hidden = !footer;
  const img = $<HTMLImageElement>('pEI');
  img.hidden = !imageOk;
  if (imageOk) img.src = image;

  const isHook = mode === 'hook';
  const name =
    (isHook && input('uname').value.trim()) ||
    (isHook ? 'Webhook' : 'Your bot');
  $('pName').textContent = name;
  $('pTag').textContent = isHook ? 'WEBHOOK' : 'APP';
  const avatar = input('avatar').value.trim();
  $('pAvatar').innerHTML =
    isHook && /^https?:\/\//.test(avatar)
      ? `<img src="${esc(avatar)}" alt="">`
      : esc(name[0].toUpperCase());
}

$('pTime').textContent =
  'Today at ' +
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
document.addEventListener('input', update);

for (const id of ['pMd', 'pED']) {
  $(id).addEventListener('click', (e) => {
    const el = e.target as HTMLElement;
    if (el.classList.contains('spoiler')) el.classList.toggle('open');
  });
}

/* ---------- Toolbar + emoji row ---------- */
$('tools').addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (!btn) return;
  const { selectionStart: a, selectionEnd: z, value: v } = content;

  if (btn.dataset.prefix !== undefined) {
    const prefix = btn.dataset.prefix;
    const lineStart = v.lastIndexOf('\n', a - 1) + 1;
    content.value = v.slice(0, lineStart) + prefix + v.slice(lineStart);
    content.setSelectionRange(a + prefix.length, z + prefix.length);
  } else {
    const pre = btn.dataset.pre ?? '';
    const post = btn.dataset.post ?? '';
    const selected = v.slice(a, z);
    content.value = v.slice(0, a) + pre + selected + post + v.slice(z);
    content.setSelectionRange(a + pre.length, a + pre.length + selected.length);
  }
  content.focus();
  update();
});

for (const emoji of [
  '🎉',
  '✅',
  '❌',
  '🚀',
  '🔥',
  '⭐',
  '💬',
  '📢',
  '⚠️',
  '💡',
  '❤️',
  '👍',
  '👀',
  '🎮',
  '🔔',
  '🛠️',
]) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = emoji;
  b.title = `Insert ${emoji}`;
  b.addEventListener('click', () => {
    const p = content.selectionStart;
    content.value =
      content.value.slice(0, p) +
      emoji +
      content.value.slice(content.selectionEnd);
    content.focus();
    content.setSelectionRange(p + emoji.length, p + emoji.length);
    update();
  });
  $('emojis').appendChild(b);
}

/* ---------- Connection panel ---------- */
function setMode(m: Mode): void {
  mode = m;
  $('modeBot').setAttribute('aria-pressed', String(m === 'bot'));
  $('modeHook').setAttribute('aria-pressed', String(m === 'hook'));
  $('botFields').hidden = m !== 'bot';
  $('hookFields').hidden = m !== 'hook';
  save();
  update();
}
$('modeBot').addEventListener('click', () => setMode('bot'));
$('modeHook').addEventListener('click', () => setMode('hook'));

$('showTok').addEventListener('click', () => {
  const reveal = input('token').type === 'password';
  input('token').type = reveal ? 'text' : 'password';
  input('hook').type = reveal ? 'text' : 'password';
  $('showTok').textContent = reveal ? 'Hide' : 'Show';
});

function save(): void {
  try {
    if (input('remember').checked) {
      const data: Record<string, unknown> = { mode };
      for (const f of FIELDS) data[f] = input(f).value;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* storage unavailable: ignore */
  }
  $('rememberWarn').hidden = !input('remember').checked;
}
input('remember').addEventListener('change', save);
for (const f of FIELDS) input(f).addEventListener('input', save);

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
  if (saved) {
    for (const f of FIELDS) input(f).value = saved[f] ?? '';
    input('remember').checked = true;
    $('rememberWarn').hidden = false;
    setMode(saved.mode === 'hook' ? 'hook' : 'bot');
  }
} catch {
  /* ignore corrupt storage */
}

/* ---------- Send ---------- */
function showStatus(kind: 'ok' | 'err' | '', message = ''): void {
  const el = $('status');
  el.className = kind ? `status ${kind}` : 'status';
  el.textContent = message;
}

function buildEmbed(): Embed | undefined {
  const embed: Embed = {};
  const title = input('eTitle').value;
  const desc = $<HTMLTextAreaElement>('eDesc').value;
  const footer = input('eFooter').value;
  const image = input('eImage').value.trim();
  if (title) embed.title = title;
  if (desc) embed.description = desc;
  if (footer) embed.footer = { text: footer };
  if (/^https?:\/\//.test(image)) embed.image = { url: image };
  if (!Object.keys(embed).length) return undefined;
  embed.color = parseInt(input('eColor').value.slice(1), 16);
  return embed;
}

async function send(): Promise<void> {
  const button = $('send') as HTMLButtonElement;
  button.disabled = true;
  button.textContent = 'Sending…';
  showStatus('');
  try {
    const options: SendOptions = {
      mode,
      token: input('token').value,
      channelId: input('channel').value,
      webhookUrl: input('hook').value,
      username: input('uname').value,
      avatarUrl: input('avatar').value,
      content: content.value,
      embed: buildEmbed(),
      allowPings: input('pings').checked,
    };
    const response = await fetch('/api/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });
    const result: SendResult = await response.json();
    showStatus(
      result.ok ? 'ok' : 'err',
      result.ok ? `Sent. Message ID: ${result.id}` : result.error,
    );
  } catch {
    showStatus(
      'err',
      'Could not reach the server. Check your connection and try again.',
    );
  } finally {
    button.disabled = false;
    button.textContent = 'Send message';
  }
}

$('send').addEventListener('click', send);
content.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') send();
});

update();
