// @vitest-environment jsdom
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HighlightSnippetList } from './HighlightSnippetList';

describe('HighlightSnippetList', () => {
  it('renders file snippets from provided highlights', () => {
    render(
      <HighlightSnippetList
        snippets={[
          'Birinci <em>uyğunluq</em> cümləsi.',
          'İkinci <em>uyğunluq</em> cümləsi.'
        ]}
        testIdPrefix="file-snippet"
      />
    );

    expect(screen.getByTestId('file-snippet-0').textContent).toBe('Birinci uyğunluq cümləsi.');
    expect(screen.getByTestId('file-snippet-1').textContent).toBe('İkinci uyğunluq cümləsi.');
  });

  it('renders em tags as elements instead of plain text', () => {
    render(
      <HighlightSnippetList
        snippets={['Mətn daxilində <em>vurğulanmış</em> hissə.']}
        testIdPrefix="em-snippet"
      />
    );

    const snippet = screen.getByTestId('em-snippet-0');
    const highlight = snippet.querySelector('em');

    expect(highlight).not.toBeNull();
    expect(highlight?.textContent).toBe('vurğulanmış');
    expect(snippet.textContent).toBe('Mətn daxilində vurğulanmış hissə.');
  });

  it('does not render snippet block when highlights are empty', () => {
    const { container } = render(<HighlightSnippetList snippets={[]} testIdPrefix="empty-snippet" />);

    expect(container.innerHTML).toBe('');
    expect(screen.queryByTestId('empty-snippet-block')).toBeNull();
  });

  it('expands remaining snippets when show more is clicked', () => {
    const onToggle = vi.fn();
    const snippets = [
      '1 <em>açar</em>',
      '2 <em>açar</em>',
      '3 <em>açar</em>',
      '4 <em>açar</em>'
    ];

    const { rerender } = render(
      <HighlightSnippetList snippets={snippets} expanded={false} onToggle={onToggle} testIdPrefix="expand-snippet" />
    );

    expect(screen.getByText('Daha çox göstər (1)')).not.toBeNull();
    expect(screen.queryByTestId('expand-snippet-3')).toBeNull();

    fireEvent.click(screen.getByText('Daha çox göstər (1)'));
    expect(onToggle).toHaveBeenCalledTimes(1);

    rerender(
      <HighlightSnippetList snippets={snippets} expanded onToggle={onToggle} testIdPrefix="expand-snippet" />
    );

    expect(screen.getByTestId('expand-snippet-3')).not.toBeNull();
    expect(screen.getByText('Daha az göstər')).not.toBeNull();
  });
});
