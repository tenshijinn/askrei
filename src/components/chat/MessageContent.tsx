import { ExternalLink } from "lucide-react";
import { TaskPreviewCard } from "./TaskPreviewCard";

interface MessageContentProps {
  content: string;
}

const TASK_MARKER_RE = /\[\[rei-task:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]\]/gi;
const TASK_URL_RE = /https?:\/\/(?:www\.)?rei\.chat\/task\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;

export const MessageContent = ({ content }: MessageContentProps) => {
  // Extract Rei task IDs (deduped) and strip the hidden markers from displayed text.
  const taskIds: string[] = [];
  const seen = new Set<string>();
  const collect = (id: string) => {
    const lower = id.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      taskIds.push(lower);
    }
  };
  let cleanContent = content.replace(TASK_MARKER_RE, (_m, id) => {
    collect(id);
    return "";
  });
  // Also detect rei.chat/task/<id> URLs but keep the URL visible.
  for (const m of content.matchAll(TASK_URL_RE)) collect(m[1]);
  // Tidy: collapse stray double spaces left behind by stripped markers.
  cleanContent = cleanContent.replace(/[ \t]{2,}/g, " ").replace(/ \n/g, "\n");

  const parseContent = (text: string) => {
    const elements: (string | JSX.Element)[] = [];
    let keyIndex = 0;

    const lines = text.split('\n');
    
    lines.forEach((line, lineIndex) => {
      if (line.trim() === '---') {
        elements.push(
          <div key={`sep-${keyIndex++}`} className="term-divider" style={{ margin: '8px 0' }} />
        );
        return;
      }

      const titleMatch = line.match(/^(\d+)\.\s+(.+)$/);
      if (titleMatch) {
        const number = titleMatch[1];
        const titleContent = titleMatch[2];
        const parsedTitle = parseLine(titleContent, keyIndex);
        keyIndex += parsedTitle.keyCount;
        elements.push(
          <div key={`title-${keyIndex++}`} style={{ fontWeight: 500, color: '#f0ede8', marginTop: '8px' }}>
            <span style={{ background: 'hsla(18,52%,82%,0.12)', padding: '1px 4px', borderRadius: '4px' }}>
              {number}. {parsedTitle.elements}
            </span>
          </div>
        );
        if (lineIndex < lines.length - 1) elements.push('\n');
        return;
      }

      if (line.trim().startsWith('> ') && !line.trim().startsWith('>> ')) {
        const innerContent = line.trim().substring(2);
        const parsedInner = parseLine(innerContent, keyIndex);
        keyIndex += parsedInner.keyCount;
        elements.push(
          <div key={`chevron-${keyIndex++}`} style={{ display: 'flex', alignItems: 'start', gap: '8px', color: '#a09e9a' }}>
            <span style={{ color: 'hsla(18,52%,82%,0.5)' }}>▶</span>
            <span>{parsedInner.elements}</span>
          </div>
        );
        if (lineIndex < lines.length - 1) elements.push('\n');
        return;
      }

      if (line.trim().startsWith('>> ')) {
        const innerContent = line.trim().substring(3);
        const parsedInner = parseLine(innerContent, keyIndex);
        keyIndex += parsedInner.keyCount;
        elements.push(
          <div key={`action-${keyIndex++}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span style={{ color: '#e8c4b8' }}>»</span>
            <span>{parsedInner.elements}</span>
          </div>
        );
        if (lineIndex < lines.length - 1) elements.push('\n');
        return;
      }

      const parsedLine = parseLine(line, keyIndex);
      keyIndex += parsedLine.keyCount;
      elements.push(...parsedLine.elements);
      
      if (lineIndex < lines.length - 1) elements.push('\n');
    });

    return elements;
  };

  const parseLine = (line: string, startKey: number) => {
    const elements: (string | JSX.Element)[] = [];
    let keyCount = 0;

    const combinedRegex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*)/g;
    
    let lastIndex = 0;
    let match;

    while ((match = combinedRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        elements.push(line.substring(lastIndex, match.index));
      }

      const fullMatch = match[1];
      
      if (fullMatch.startsWith('[')) {
        const linkText = match[2];
        const url = match[3];
        elements.push(
          <a
            key={`link-${startKey + keyCount++}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              border: '0.5px solid hsla(18,52%,82%,0.3)',
              borderRadius: '100px',
              color: '#e8c4b8',
              fontSize: '12px',
              transition: 'border-color 0.15s',
              textDecoration: 'none',
            }}
          >
            {linkText}
            <ExternalLink style={{ width: '10px', height: '10px' }} />
          </a>
        );
      } else if (fullMatch.startsWith('**')) {
        const boldText = match[4];
        elements.push(
          <span key={`bold-${startKey + keyCount++}`} style={{ color: '#e8c4b8', fontWeight: 500 }}>
            {boldText}
          </span>
        );
      }

      lastIndex = match.index + fullMatch.length;
    }

    if (lastIndex < line.length) {
      elements.push(line.substring(lastIndex));
    }

    return { elements, keyCount };
  };

  return (
    <div style={{ whiteSpace: 'pre-wrap' }}>
      {parseContent(content)}
    </div>
  );
};
