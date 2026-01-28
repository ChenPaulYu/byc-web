import { visit } from 'unist-util-visit';
import type { Node, Parent } from 'unist';

// Extract video ID from YouTube URLs
function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    // youtu.be format
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // youtube.com format
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    // youtube.com short format
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Check if text is a standalone YouTube URL
function isYouTubeUrl(text: string): boolean {
  return (
    text.includes('youtube.com') ||
    text.includes('youtu.be')
  );
}

export function remarkYoutube() {
  return (tree: Node) => {
    visit(tree, 'paragraph', (node: Node, index: number, parent: Parent | null) => {
      if (!parent || index === null) return;

      const paragraphNode = node as any;

      // Check if paragraph contains only a link with YouTube URL
      if (
        paragraphNode.children &&
        paragraphNode.children.length === 1 &&
        paragraphNode.children[0].type === 'link'
      ) {
        const link = paragraphNode.children[0];
        const url = link.url;

        if (isYouTubeUrl(url)) {
          const videoId = getYouTubeVideoId(url);

          if (videoId) {
            // Replace the paragraph with a custom JSX component
            parent.children[index] = {
              type: 'jsx',
              value: `<YouTubeEmbed videoId="${videoId}" />`,
            } as any;
          }
        }
      }

      // Also check if paragraph contains only text that is a YouTube URL
      if (
        paragraphNode.children &&
        paragraphNode.children.length === 1 &&
        paragraphNode.children[0].type === 'text'
      ) {
        const text = paragraphNode.children[0].value.trim();

        if (isYouTubeUrl(text)) {
          const videoId = getYouTubeVideoId(text);

          if (videoId) {
            parent.children[index] = {
              type: 'jsx',
              value: `<YouTubeEmbed videoId="${videoId}" />`,
            } as any;
          }
        }
      }
    });
  };
}
