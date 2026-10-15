import type { SendOptions, SendResult } from '../../types';

const HINTS: Record<number, string> = {
  401: 'The token was rejected. Check that you pasted the bot token (not the client secret) and that it has not been reset.',
  403: 'The bot lacks access. Make sure it is in the server and can view and send messages in that channel.',
  404: 'Channel or webhook not found. Double-check the ID or URL.',
};

export async function sendMessage(o: SendOptions): Promise<SendResult> {
  if (!o.content.trim() && !o.embed)
    return { ok: false, error: 'Write a message or add an embed first.' };
  if (o.content.length > 2000) {
    return {
      ok: false,
      error:
        'The message is over 2000 characters. Shorten it or move text into an embed description.',
    };
  }

  const payload: Record<string, unknown> = { content: o.content };
  if (!o.allowPings) payload.allowed_mentions = { parse: [] };
  if (o.embed) payload.embeds = [o.embed];

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  let url: string;

  if (o.mode === 'bot') {
    const token = o.token.trim().replace(/^Bot\s+/i, '');
    const channel = o.channelId.trim();
    if (!token || !/^\d{15,25}$/.test(channel)) {
      return {
        ok: false,
        error: 'Enter a bot token and a numeric channel ID.',
      };
    }
    url = `https://discord.com/api/v10/channels/${channel}/messages`;
    headers.Authorization = `Bot ${token}`;
  } else {
    const hook = o.webhookUrl.trim();
    if (
      !/^https:\/\/(?:\w+\.)?discord(?:app)?\.com\/api\/webhooks\//.test(hook)
    ) {
      return { ok: false, error: 'Enter a valid Discord webhook URL.' };
    }
    url = hook + (hook.includes('?') ? '&' : '?') + 'wait=true';
    if (o.username.trim()) payload.username = o.username.trim();
    if (o.avatarUrl.trim()) payload.avatar_url = o.avatarUrl.trim();
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}) as Record<string, any>);
    if (res.ok) return { ok: true, id: String(data.id ?? 'unknown') };
    if (res.status === 429) {
      return {
        ok: false,
        error: `Rate limited. Try again in ${Math.ceil(data.retry_after ?? 1)} seconds.`,
      };
    }
    const detail = data.message ? `: ${data.message}` : '';
    return {
      ok: false,
      error:
        `Discord returned ${res.status}${detail}. ${HINTS[res.status] ?? ''}`.trim(),
    };
  } catch {
    return {
      ok: false,
      error: 'The request could not be made. Check your internet connection.',
    };
  }
}
