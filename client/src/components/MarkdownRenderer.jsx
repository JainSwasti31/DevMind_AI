/**
 * Lightweight Markdown renderer — no external lib needed.
 * Handles: fenced code blocks, inline code, bold, headings, bullet lists, line breaks.
 */

function MarkdownRenderer({ content, className = '' }) {
  const segments = parseMarkdown(content);
  return (
    <div className={`prose-devmind ${className}`}>
      {segments.map((seg, i) => renderSegment(seg, i))}
    </div>
  );
}

function renderSegment(seg, key) {
  switch (seg.type) {
    case 'code-block':
      return (
        <pre key={key} className="my-3 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
          <code>{seg.content}</code>
        </pre>
      );
    case 'heading':
      return <Heading key={key} level={seg.level} text={seg.text} />;
    case 'bullet':
      return (
        <ul key={key} className="my-2 list-disc space-y-1 pl-5 text-slate-200">
          {seg.items.map((item, j) => (
            <li key={j}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    case 'paragraph':
      return (
        <p key={key} className="my-2 leading-7 text-slate-200">
          {renderInline(seg.text)}
        </p>
      );
    default:
      return null;
  }
}

function Heading({ level, text }) {
  const classes = {
    1: 'text-2xl font-bold text-white mt-6 mb-2',
    2: 'text-xl font-semibold text-white mt-5 mb-2',
    3: 'text-lg font-semibold text-cyan-300 mt-4 mb-1',
  };
  const cls = classes[level] || classes[3];
  if (level === 1) return <h1 className={cls}>{text}</h1>;
  if (level === 2) return <h2 className={cls}>{text}</h2>;
  return <h3 className={cls}>{text}</h3>;
}

/**
 * Render inline markdown: bold (**text**), inline code (`code`), plain text.
 */
function renderInline(text) {
  const parts = [];
  const re = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  let last = 0;
  let match;
  let idx = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(<span key={idx++}>{text.slice(last, match.index)}</span>);
    if (match[0].startsWith('**')) {
      parts.push(<strong key={idx++} className="font-semibold text-white">{match[2]}</strong>);
    } else {
      parts.push(
        <code key={idx++} className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-cyan-300">
          {match[3]}
        </code>
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(<span key={idx++}>{text.slice(last)}</span>);
  return parts;
}

/**
 * Parse markdown string into a list of typed segment objects.
 */
function parseMarkdown(text) {
  const lines = text.split('\n');
  const segments = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      segments.push({ type: 'code-block', content: codeLines.join('\n') });
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.*)/);
    if (headingMatch) {
      segments.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2] });
      i++;
      continue;
    }

    // Bullet list — collect consecutive bullet lines
    if (line.match(/^[-*]\s+/)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^[-*]\s+/)) {
        items.push(lines[i].replace(/^[-*]\s+/, ''));
        i++;
      }
      segments.push({ type: 'bullet', items });
      continue;
    }

    // Empty line — skip
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph — collect until blank line or heading/code fence
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('```') &&
      !lines[i].match(/^#{1,3}\s/) &&
      !lines[i].match(/^[-*]\s+/)
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      segments.push({ type: 'paragraph', text: paraLines.join(' ') });
    }
  }

  return segments;
}

export default MarkdownRenderer;
