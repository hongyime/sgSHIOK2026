import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));
vi.mock('next/dynamic', () => ({ default: () => () => React.createElement('div', { 'data-map-mounted': true }) }));
import Home, { DataDetails } from '../../app/page';

describe('map-first home shell', () => {
  it('mounts a basemap without a selected postal or geometry', () => {
    const html = renderToStaticMarkup(React.createElement(Home));
    expect(html).toContain('data-map-mounted="true"');
    expect(html).not.toContain('Map hidden for faster loading');
  });
  it('puts postal search in the top-left stack and uses an accessible icon submit', () => {
    const html = renderToStaticMarkup(React.createElement(Home));
    expect(html).toMatch(/aria-label="Postal-code search"[\s\S]*?<h1[\s\S]*?SHIOK[\s\S]*?<form/);
    expect(html).toMatch(/id="postal-search-button"[^>]*aria-label="Search postal code"/);
    expect(html).toMatch(/id="postal-search-input"[^>]*inputMode="numeric"/);
    expect(html).not.toMatch(/>Search<\/button>/);
    expect(html).toMatch(/data-map-overlay="top-left"[\s\S]*?aria-label="Postal-code search"/);
  });
  it('has one collapsed About data disclosure at the map bottom', () => {
    const html = renderToStaticMarkup(React.createElement(Home));
    expect(html.match(/<summary>About data<\/summary>/g)).toHaveLength(1);
    expect(html).toMatch(/data-map-overlay="bottom"[\s\S]*?<summary>About data<\/summary>/);
    const details = renderToStaticMarkup(React.createElement(DataDetails, { manifest: null }));
    expect(details).not.toMatch(/<details[^>]* open/);
    expect(details).toContain('ATTRIBUTION.md');
  });
});
