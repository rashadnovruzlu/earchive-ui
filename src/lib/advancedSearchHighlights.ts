const allowedHighlightTagPattern = /&lt;(\/?)em&gt;/gi;

export const FILE_HIGHLIGHT_SNIPPET_LIMIT = 3;

export type DisplayFileHighlight = {
  fileId: string;
  fileName: string;
  highlights: string[];
};

export function sanitizeHighlightHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(allowedHighlightTagPattern, '<$1em>');
}

export function getVisibleSnippets(highlights: string[], expanded: boolean, limit = FILE_HIGHLIGHT_SNIPPET_LIMIT): string[] {
  return expanded ? highlights : highlights.slice(0, limit);
}

export function hasHiddenSnippets(highlights: string[], limit = FILE_HIGHLIGHT_SNIPPET_LIMIT): boolean {
  return highlights.length > limit;
}

export function mergeFileHighlights(
  fileIds: string[],
  fileNames: string[],
  fileHighlights?: Array<{ fileId: string; fileName: string; highlights: string[] }>
): DisplayFileHighlight[] {
  const highlightMap = new Map((fileHighlights || []).map((item) => [item.fileId, item]));
  const ordered: DisplayFileHighlight[] = fileIds.map((fileId, index) => {
    const match = highlightMap.get(fileId);
    return {
      fileId,
      fileName: match?.fileName || fileNames[index] || fileId,
      highlights: match?.highlights || []
    };
  });

  for (const item of fileHighlights || []) {
    if (!ordered.some((entry) => entry.fileId === item.fileId)) {
      ordered.push({
        fileId: item.fileId,
        fileName: item.fileName,
        highlights: item.highlights
      });
    }
  }

  return ordered;
}
