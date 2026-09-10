import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GlobalError from '../../app/global-error';

function button(node: ReactNode): ReactElement<{onClick: () => void; type: string}> | undefined {
  if (!isValidElement<{children?: ReactNode}>(node)) return undefined;
  if (node.type === 'button') return node as ReactElement<{onClick: () => void; type: string}>;
  for (const child of Children.toArray(node.props.children)) {
    const found = button(child); if (found) return found;
  }
  return undefined;
}

describe('global error recovery', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('renders an independent accessible document, not a GET form that drops the query', () => {
    const html = renderToStaticMarkup(<GlobalError />);
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<main');
    expect(html).toContain('Reload page');
    expect(html).toContain('type="button"');
    expect(html).not.toContain('<form');
    expect(html).not.toContain('setTimeout');
  });

  it.each(['/?postal=018956','/?postal=018956#compare=018956,018990','/?debugMap=1#postal=018956'])('explicit reload preserves %s', path => {
    const location = Object.freeze({href:'https://example.invalid'+path,reload:vi.fn()});
    vi.stubGlobal('window',{location});
    const element = GlobalError();
    expect(location.reload).not.toHaveBeenCalled();
    button(element)!.props.onClick();
    expect(location.reload).toHaveBeenCalledExactlyOnceWith();
    expect(location.href).toBe('https://example.invalid'+path);
  });
});
