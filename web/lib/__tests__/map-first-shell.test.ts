import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));
vi.mock('next/dynamic', () => ({ default: () => () => React.createElement('div', { 'data-map-mounted': true }) }));
vi.mock('../../components/route-map-loader', () => ({
  RouteMapLoader: () => React.createElement('div', { 'data-map-mounted': true }), preloadRouteMap: vi.fn(),
}));
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
  it('server-renders a native root GET form for both Enter and the submit button', () => {
    const html = renderToStaticMarkup(React.createElement(Home));
    const form = html.match(/<form\b[^>]*>[\s\S]*?<\/form>/)?.[0];
    expect(form).toBeDefined();
    expect(form).toMatch(/<form\b[^>]*\baction="\/"/);
    expect(form).toMatch(/<form\b[^>]*\bmethod="get"/);
    expect(form).toMatch(/<button\b[^>]*id="postal-search-button"[^>]*type="submit"/);
    expect(form).not.toMatch(/formAction=|formMethod=|noValidate=|formNoValidate=/i);
  });
  it('server-renders one required six-digit named text control so leading zeros survive GET', () => {
    const html = renderToStaticMarkup(React.createElement(Home));
    const input = html.match(/<input\b[^>]*id="postal-search-input"[^>]*>/)?.[0];
    expect(input).toBeDefined();
    expect(input).toContain('name="postal"');
    expect(input).toContain('required=""');
    expect(input).toContain('type="text"');
    expect(input).toContain('inputMode="numeric"');
    expect(input).toContain('pattern="[0-9]{6}"');
    expect(input).toMatch(/maxLength="6"/i);
    expect(html.match(/<input\b[^>]*name="postal"/g)).toHaveLength(1);
  });
});
