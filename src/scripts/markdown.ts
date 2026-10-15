export const esc = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function inline(s: string): string {
  return s
    .replace(
      /&lt;(a?):(\w+):(\d+)&gt;/g,
      (_m, a, name, id) =>
        `<img class="emoji" alt=":${name}:" src="https://cdn.discordapp.com/emojis/${id}.${a ? 'gif' : 'png'}?size=48">`,
    )
    .replace(/&lt;@&amp;(\d+)&gt;/g, '<span class="mention">@role</span>')
    .replace(/&lt;@!?(\d+)&gt;/g, '<span class="mention">@user</span>')
    .replace(/&lt;#(\d+)&gt;/g, '<span class="mention">#channel</span>')
    .replace(/@(everyone|here)\b/g, '<span class="mention">@$1</span>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>',
    )
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/\*(?!\s)(.+?)\*/g, '<i>$1</i>')
    .replace(/(^|[^\w])_(?!\s)(.+?)_(?=[^\w]|$)/g, '$1<i>$2</i>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/\|\|(.+?)\|\|/g, '<span class="spoiler">$1</span>');
}

export function render(src: string): string {
  // Code is pulled out first so nothing inside it gets formatted.
  const stash: string[] = [];
  const keep = (html: string): string => `\u0000${stash.push(html) - 1}\u0000`;

  let s = src.replace(/```(?:[\w+-]*\n)?([\s\S]*?)```/g, (_m, code: string) =>
    keep(`<pre><code>${esc(code.replace(/\n$/, ''))}</code></pre>`),
  );
  s = s.replace(/`([^`\n]+)`/g, (_m, code: string) =>
    keep(`<code>${esc(code)}</code>`),
  );
  s = esc(s);

  const out: string[] = [];
  let inList = false;
  for (const line of s.split('\n')) {
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^[-*] (.*)/))) {
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${inline(m[1])}</li>`);
      continue;
    }
    if (inList) {
      out.push('</ul>');
      inList = false;
    }

    if ((m = line.match(/^(#{1,3}) (.*)/)))
      out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`);
    else if ((m = line.match(/^-# (.*)/)))
      out.push(`<small>${inline(m[1])}</small>`);
    else if ((m = line.match(/^&gt; ?(.*)/)))
      out.push(`<blockquote>${inline(m[1])}</blockquote>`);
    else out.push(inline(line) + '<br>');
  }
  if (inList) out.push('</ul>');

  return out
    .join('')
    .replace(/\u0000(\d+)\u0000/g, (_m, i: string) => stash[Number(i)])
    .replace(/<\/pre><br>/g, '</pre>')
    .replace(/(<br>)+$/, '');
}
