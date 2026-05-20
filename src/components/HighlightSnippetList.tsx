import React from 'react';
import { Button, Stack, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import {
  FILE_HIGHLIGHT_SNIPPET_LIMIT,
  getVisibleSnippets,
  hasHiddenSnippets
} from '../lib/advancedSearchHighlights';

type HighlightSnippetListProps = {
  snippets: string[];
  expanded?: boolean;
  onToggle?: () => void;
  limit?: number;
  typographyVariant?: 'body2' | 'caption';
  sx?: SxProps<Theme>;
  testIdPrefix?: string;
};

const highlightSnippetStyles: SxProps<Theme> = {
  color: 'text.secondary',
  whiteSpace: 'normal',
  overflowWrap: 'anywhere',
  '& em': {
    fontStyle: 'normal',
    fontWeight: 800,
    bgcolor: '#FFF59D',
    px: 0.25,
    borderRadius: 0.5,
    color: 'text.primary'
  }
};

export function HighlightSnippetList({
  snippets,
  expanded = false,
  onToggle,
  limit = FILE_HIGHLIGHT_SNIPPET_LIMIT,
  typographyVariant = 'caption',
  sx,
  testIdPrefix = 'highlight-snippet'
}: HighlightSnippetListProps) {
  if (snippets.length === 0) {
    return null;
  }

  const visibleSnippets = getVisibleSnippets(snippets, expanded, limit);
  const canExpand = hasHiddenSnippets(snippets, limit);

  return (
    <Stack spacing={0.75} sx={sx} data-testid={`${testIdPrefix}-block`}>
      {visibleSnippets.map((snippet, index) => (
        <Typography
          key={`${testIdPrefix}-${index}`}
          variant={typographyVariant}
          sx={highlightSnippetStyles}
          dangerouslySetInnerHTML={{ __html: snippet }}
          data-testid={`${testIdPrefix}-${index}`}
        />
      ))}
      {canExpand && onToggle ? (
        <Button
          size="small"
          variant="text"
          sx={{ alignSelf: 'flex-start', px: 0, minWidth: 0 }}
          onClick={onToggle}
        >
          {expanded ? 'Daha az göstər' : `Daha çox göstər (${snippets.length - limit})`}
        </Button>
      ) : null}
    </Stack>
  );
}
