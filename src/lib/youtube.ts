/**
 * YouTube Video Information Utilities
 */

/**
 * Extract YouTube video ID from URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Get YouTube video thumbnail URL
 */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

/**
 * Fetch YouTube video metadata using oEmbed API
 */
export async function fetchYouTubeMetadata(url: string): Promise<{
  title: string;
  thumbnailUrl: string;
  authorName?: string;
} | null> {
  try {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return null;
    }

    // Use YouTube oEmbed API (no API key required)
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

    const response = await fetch(oembedUrl);

    if (!response.ok) {
      console.error('YouTube oEmbed API error:', response.status);
      return null;
    }

    const data = await response.json();

    return {
      title: data.title || '',
      thumbnailUrl: data.thumbnail_url || getYouTubeThumbnail(videoId),
      authorName: data.author_name || undefined,
    };
  } catch (error) {
    console.error('Failed to fetch YouTube metadata:', error);
    return null;
  }
}

/**
 * Parse ISO 8601 duration to seconds
 * Example: PT1H2M10S -> 3730 seconds
 */
export function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}
