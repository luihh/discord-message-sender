export type Mode = 'bot' | 'hook';

export interface Embed {
  title?: string;
  description?: string;
  color?: number;
  footer?: { text: string };
  image?: { url: string };
}

export interface SendOptions {
  mode: Mode;
  token: string;
  channelId: string;
  webhookUrl: string;
  username: string;
  avatarUrl: string;
  content: string;
  embed?: Embed;
  allowPings: boolean;
}

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; error: string };
