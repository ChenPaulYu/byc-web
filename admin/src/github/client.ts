/**
 * Owns the GitHub repository transport used by the admin API.
 * Reads: GitHub repository settings from Vite environment variables.
 */

export const GITHUB_API = 'https://api.github.com';
export const OWNER = import.meta.env?.VITE_GITHUB_OWNER || 'ChenPaulYu';
export const REPO = import.meta.env?.VITE_GITHUB_REPO || 'byc-web';
export const BRANCH = import.meta.env?.VITE_GITHUB_BRANCH || 'main';

const TOKEN = import.meta.env?.VITE_GITHUB_TOKEN || '';

export async function ghRequest(url: string, options?: RequestInit) {
  const res = await fetch(`${GITHUB_API}${url}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || res.statusText);
  }
  return res.json();
}

export async function getFileContent(path: string): Promise<{ content: string; sha: string }> {
  const data = await ghRequest(`/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`);
  const binary = atob(data.content.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  const decoded = new TextDecoder().decode(bytes);
  return { content: decoded, sha: data.sha };
}

export async function putFile(path: string, content: string, message: string, sha?: string): Promise<void> {
  const body: Record<string, unknown> = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch: BRANCH,
  };
  if (sha) body.sha = sha;
  await ghRequest(`/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteFile(path: string, message: string): Promise<void> {
  const { sha } = await getFileContent(path);
  await ghRequest(`/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'DELETE',
    body: JSON.stringify({ message, sha, branch: BRANCH }),
  });
}

export async function listDir(path: string): Promise<string[]> {
  try {
    const data = await ghRequest(`/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`);
    if (!Array.isArray(data)) return [];
    return data.filter((f: any) => f.type === 'file').map((f: any) => f.name);
  } catch {
    return [];
  }
}
