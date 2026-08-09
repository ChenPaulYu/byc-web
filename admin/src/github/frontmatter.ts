/**
 * Parses and serializes the lightweight frontmatter used by admin content files.
 * Reads: Markdown strings and metadata supplied by the admin API layer.
 */

export function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  const yamlStr = match[1];
  const content = match[2];

  // Simple YAML parser for flat and array values
  const data: Record<string, unknown> = {};
  const lines = yamlStr.split('\n');
  let currentKey = '';

  for (const line of lines) {
    const kvMatch = line.match(/^(\w[\w\s]*?):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      let value: unknown = kvMatch[2].trim();

      // Remove surrounding quotes
      if (typeof value === 'string' && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
        value = (value as string).slice(1, -1);
      }
      // Parse booleans
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      // Parse numbers
      else if (typeof value === 'string' && /^\d+$/.test(value)) value = parseInt(value);
      // Parse inline arrays [a, b, c]
      else if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(s => {
          s = s.trim();
          if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) s = s.slice(1, -1);
          return s;
        }).filter(Boolean);
      }
      // Empty value starts a list or nested object
      else if (value === '') value = [];

      data[key] = value;
      currentKey = key;
    } else if (line.match(/^\s+-\s+(.*)$/)) {
      // Array item
      const itemMatch = line.match(/^\s+-\s+(.*)$/);
      if (itemMatch && currentKey) {
        if (!Array.isArray(data[currentKey])) data[currentKey] = [];
        let val: unknown = itemMatch[1].trim();
        if (typeof val === 'string' && ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))) {
          val = (val as string).slice(1, -1);
        }
        (data[currentKey] as unknown[]).push(val);
      }
    }
  }

  return { data, content };
}

export function stringifyFrontmatter(content: string, metadata: Record<string, unknown>): string {
  let yaml = '---\n';
  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      yaml += `${key}: [${value.map(v => `"${v}"`).join(', ')}]\n`;
    } else if (typeof value === 'string') {
      yaml += `${key}: "${value}"\n`;
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      yaml += `${key}: ${value}\n`;
    }
  }
  yaml += '---\n';
  return yaml + content;
}
