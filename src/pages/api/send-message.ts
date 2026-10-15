import type { APIRoute } from 'astro';
import type { SendOptions, SendResult } from '../../types';
import { sendMessage } from '../../lib/server/sendMessage';

export const prerender = false;

const json = (data: SendResult, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const origin = request.headers.get('origin');
  const requestOrigin = new URL(request.url).origin;

  if (!origin || origin !== requestOrigin) {
    return json({ ok: false, error: 'Invalid request origin.' }, 403);
  }

  const length = Number(request.headers.get('content-length') ?? 0);

  if (length > 100_000) {
    return json({ ok: false, error: 'Request body is too large.' }, 413);
  }

  let options: SendOptions;

  try {
    options = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON request.' }, 400);
  }

  if (
    !options ||
    typeof options !== 'object' ||
    !['bot', 'hook'].includes(options.mode) ||
    typeof options.content !== 'string' ||
    options.content.length > 2000 ||
    typeof options.allowPings !== 'boolean' ||
    (options.embed !== undefined &&
      (!options.embed || typeof options.embed !== 'object'))
  ) {
    return json({ ok: false, error: 'Invalid message options.' }, 400);
  }

  const stringFields = [
    'token',
    'channelId',
    'webhookUrl',
    'username',
    'avatarUrl',
  ] as const;

  if (stringFields.some((key) => typeof options[key] !== 'string')) {
    return json({ ok: false, error: 'Invalid connection settings.' }, 400);
  }

  try {
    const result = await sendMessage(options);

    return json(result);
  } catch {
    return json({ ok: false, error: 'Unable to send the message.' }, 500);
  }
};
