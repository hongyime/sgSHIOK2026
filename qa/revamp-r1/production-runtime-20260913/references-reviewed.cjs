'use strict';

const { createRequire } = require('node:module');
const { resolve } = require('node:path');
const req = createRequire(resolve(__dirname, '../../../web/package.json'));
const acorn = req('./node_modules/next/dist/compiled/acorn/acorn.js');
const postcss = req('postcss');
const tokenize = req('postcss/lib/tokenize');
const valueParser = req('./node_modules/next/dist/compiled/postcss-value-parser/index.js');
const ORIGIN = 'https://sgshiok.vercel.app';
const LIMITS = Object.freeze({ textBytes: 4 * 1024 * 1024, tokens: 500000,
  nodes: 500000, depth: 256, urls: 5000, unresolved: 1000 });
const EXT = '(?:mjs|js|css|woff2?|ttf|otf|png|jpe?g|svg|webp|avif|ico)';
const FILE = new RegExp('^[A-Za-z0-9_-][A-Za-z0-9_.-]*\\.' + EXT + '$');
const HINT = /^(?:static\/|\/_next\/|\/maplibre\/|\.{1,2}\/|https?:\/\/|\/\/|data:|blob:)/;
const RESOURCE = /\.[A-Za-z0-9]{1,12}(?:[?#].*)?$/;
const fail = code => { throw Object.assign(new Error(code), { code }); };

function sourceUrl(source) {
  if (typeof source !== 'string' || source.length > 512 || !/^\/[A-Za-z0-9_./-]+$/.test(source) ||
      source.includes('//') || source.split('/').some(p => p === '.' || p === '..')) fail('REFERENCES_SOURCE');
  return new URL(source, ORIGIN);
}

// Bare CSS names are URLs only inside url()/@import. Bare JS specifiers are not URL paths.
function allowed(reference, source, context = 'explicit') {
  const base = sourceUrl(source);
  if (!['explicit', 'module', 'css'].includes(context)) fail('REFERENCES_CONTEXT');
  if (typeof reference !== 'string' || reference.length > 512 ||
      /[\\\s\u0000-\u001f\u007f%?#]/.test(reference)) return null;
  let candidate = reference;
  if (context !== 'css' && candidate.startsWith('static/')) candidate = '/_next/' + candidate;
  const absolute = candidate.startsWith('/_next/static/') || candidate.startsWith('/maplibre/') || candidate.startsWith(ORIGIN + '/');
  const relative = /^(?:\.\/|\.\.\/)/.test(candidate);
  if (!absolute && !(context === 'module' && relative) && context !== 'css') return null;
  if (candidate.startsWith('//')) return null;
  let url;
  try { url = new URL(candidate, base); } catch { return null; }
  if (url.origin !== ORIGIN || url.username || url.password || url.search || url.hash) return null;
  const parts = url.pathname.slice(1).split('/');
  if (parts.some(p => !/^[A-Za-z0-9_-][A-Za-z0-9_.-]*$/.test(p) || p.endsWith('.') ||
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p))) return null;
  if (!FILE.test(parts.at(-1))) return null;
  if (url.pathname.startsWith('/_next/static/')) return url.pathname;
  if (/^\/maplibre\/\d+\.\d+\.\d+\/.+\.(?:mjs|js)$/.test(url.pathname)) return url.pathname;
  return null;
}

function staticString(node) {
  if (node?.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0].value.cooked;
  return undefined;
}

function memberName(node) {
  if (node?.type === 'Identifier') return node.name;
  if (node?.type === 'MemberExpression') return node.computed ? staticString(node.property) : node.property.name;
}

function importMetaUrl(node) {
  return node?.type === 'MemberExpression' && memberName(node) === 'url' &&
    node.object.type === 'MetaProperty' && node.object.meta.name === 'import' && node.object.property.name === 'meta';
}

function cssString(raw, unquoted = false) {
  let value = '';
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c !== '\\') {
      if (unquoted && /[\s"'()]/.test(c)) return null;
      value += c;
      continue;
    }
    if (++i >= raw.length) return null;
    if (/[\n\r\f]/.test(raw[i])) {
      if (unquoted) return null;
      if (raw[i] === '\r' && raw[i + 1] === '\n') i++;
      continue;
    }
    if (/[\da-f]/i.test(raw[i])) {
      let digits = raw[i];
      while (digits.length < 6 && /[\da-f]/i.test(raw[i + 1] || '')) digits += raw[++i];
      const point = parseInt(digits, 16);
      if (!point || point > 0x10ffff || (point >= 0xd800 && point <= 0xdfff)) return null;
      value += String.fromCodePoint(point);
      if (/[\t\n\r\f ]/.test(raw[i + 1] || '')) {
        i++;
        if (raw[i] === '\r' && raw[i + 1] === '\n') i++;
      }
    } else value += raw[i];
  }
  return value;
}

function references(source, text, overrides = {}) {
  sourceUrl(source);
  const limits = { ...LIMITS };
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) fail('REFERENCES_LIMIT_OPTION');
  for (const [key, value] of Object.entries(overrides)) {
    if (!Object.hasOwn(LIMITS, key) || !Number.isSafeInteger(value) || value < 1 || value > LIMITS[key]) fail('REFERENCES_LIMIT_OPTION');
    limits[key] = value;
  }
  if (typeof text !== 'string') fail('REFERENCES_TEXT');
  if (text.length > limits.textBytes || Buffer.byteLength(text, 'utf8') > limits.textBytes) fail('REFERENCES_TEXT_LIMIT');
  const urls = new Set(), unresolved = [], embedded = { dataUrls: 0 };
  const issue = (kind, offset, value) => {
    if (unresolved.length >= limits.unresolved) fail('REFERENCES_UNRESOLVED_LIMIT');
    unresolved.push({ kind, offset, expression: String(value ?? '').slice(0, 180) });
  };
  const record = (value, context, offset, required = true) => {
    if (typeof value === 'string' && /^data:/i.test(value)) { embedded.dataUrls++; return; }
    const url = allowed(value, source, context);
    if (url) {
      urls.add(url);
      if (urls.size > limits.urls) fail('REFERENCES_URL_LIMIT');
    } else if (required) issue('reference_not_captured', offset, value);
  };
  const expression = (node, context, kind) => {
    const value = staticString(node);
    if (typeof value === 'string') record(value, context, node.start);
    else issue(kind, node?.start ?? 0, node && text.slice(node.start, node.end));
  };

  if (/\.(?:mjs|js)$/.test(source)) {
    let count = 0, depth = 0;
    const lexer = acorn.tokenizer(text, { ecmaVersion: 'latest', sourceType: 'module' });
    for (;;) {
      const token = lexer.getToken(), label = token.type.label;
      if (label === 'eof') break;
      if (++count > limits.tokens) fail('REFERENCES_TOKEN_LIMIT');
      if (['(', '[', '{', '${'].includes(label) && ++depth > limits.depth) fail('REFERENCES_DEPTH_LIMIT');
      if ([')', ']', '}'].includes(label)) depth--;
    }
    const stack = [{ node: acorn.parse(text, { ecmaVersion: 'latest', sourceType: 'module' }), suppress: false }];
    let nodes = 0;
    while (stack.length) {
      const { node, suppress, parent } = stack.pop();
      if (++nodes > limits.nodes) fail('REFERENCES_NODE_LIMIT');
      let hide = suppress;
      if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration', 'ImportExpression'].includes(node.type) && node.source) {
        expression(node.source, 'module', 'computed_import'); hide = true;
      } else if (node.type === 'NewExpression' && memberName(node.callee) === 'URL') {
        if (importMetaUrl(node.arguments[1])) expression(node.arguments[0], 'module', 'computed_url');
        else {
          const value = staticString(node.arguments[0]);
          // Only an absolute URL is independent of a missing/computed constructor base.
          if (typeof value === 'string' && value.startsWith(ORIGIN + '/')) record(value, 'explicit', node.start);
          else issue('url_base_unresolved', node.start, text.slice(node.start, node.end));
        }
        hide = true;
      } else if (['CallExpression', 'NewExpression'].includes(node.type)) {
        const name = memberName(node.callee);
        if (name === 'importScripts') {
          for (const argument of node.arguments) expression(argument, 'module', 'computed_import_scripts');
          hide = true;
        } else if (['fetch', 'Worker', 'SharedWorker', 'register'].includes(name)) {
          const argument = node.arguments[0];
          if (!(argument?.type === 'NewExpression' && memberName(argument.callee) === 'URL')) {
            expression(argument, 'explicit', 'computed_' + name.toLowerCase());
          }
          hide = true;
        } else if (name === 'setAttribute' && ['src', 'href'].includes(staticString(node.arguments[0]))) {
          expression(node.arguments[1], 'explicit', 'computed_attribute'); hide = true;
        }
      } else if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression' &&
          ['src', 'href', 'workerUrl'].includes(memberName(node.left))) {
        expression(node.right, 'explicit', 'computed_attribute'); hide = true;
      } else if (node.type === 'Property' && parent?.type === 'ObjectExpression' && node.kind === 'init' && !node.method &&
          ['src', 'href', 'workerUrl'].includes(node.computed ? staticString(node.key) : memberName(node.key) ?? staticString(node.key))) {
        expression(node.value, 'explicit', 'computed_attribute'); hide = true;
      }
      if (node.type === 'BinaryExpression' || (node.type === 'TemplateLiteral' && node.expressions.length)) {
        if (!suppress && parent?.type !== 'BinaryExpression') {
          const snippet = text.slice(node.start, node.end);
          if (/(?:static\/|\/_next\/|\/maplibre\/|https?:|\.\.?\/|\.(?:m?js|css)["'`])/.test(snippet)) {
            issue('computed_url_fragment', node.start, snippet);
          }
        }
        hide = true;
      }
      const value = staticString(node);
      if (!hide && typeof value === 'string' && HINT.test(value)) {
        if (/^data:/i.test(value) || allowed(value, source)) record(value, 'explicit', node.start);
        else if (RESOURCE.test(value)) issue('unbound_url_literal', node.start, value);
      }
      for (const value of Object.values(node)) {
        if (Array.isArray(value)) {
          for (let i = value.length - 1; i >= 0; i--) if (value[i]?.type) stack.push({ node: value[i], suppress: hide, parent: node });
        } else if (value?.type) stack.push({ node: value, suppress: hide, parent: node });
      }
    }
  } else if (source.endsWith('.css')) {
    const lexer = tokenize(new postcss.Input(text));
    let count = 0, depth = 0;
    while (!lexer.endOfFile()) {
      const token = lexer.nextToken();
      if (++count > limits.tokens) fail('REFERENCES_TOKEN_LIMIT');
      if (['(', '{', '['].includes(token[0]) && ++depth > limits.depth) fail('REFERENCES_DEPTH_LIMIT');
      if ([')', '}', ']'].includes(token[0])) depth--;
    }
    const pending = [postcss.parse(text)];
    let nodes = 0;
    while (pending.length) {
      const node = pending.pop();
      if (++nodes > limits.nodes) fail('REFERENCES_NODE_LIMIT');
      for (let i = (node.nodes?.length || 0) - 1; i >= 0; i--) pending.push(node.nodes[i]);
      const isImport = node.type === 'atrule' && cssString(node.name)?.toLowerCase() === 'import';
      if (node.type !== 'decl' && !isImport) continue;
      const raw = isImport ? node.raws.params?.raw ?? node.params : node.raws.value?.raw ?? node.value;
      const base = node.source.start.offset + (isImport
        ? 1 + node.name.length + (node.raws.afterName || '').length
        : node.prop.length + (node.raws.between || ':').length);
      const parts = valueParser(raw).nodes;
      if (isImport) {
        const first = parts.find(part => !['space', 'comment'].includes(part.type));
        if (first?.type === 'string') record(cssString(first.value), 'css', base + first.sourceIndex);
        else if (!(first?.type === 'function' && cssString(first.value)?.toLowerCase() === 'url')) {
          issue('css_import_unresolved', base, raw);
        }
      }
      const values = parts.map(part => ({ part, level: 1 })).reverse();
      while (values.length) {
        const { part, level } = values.pop();
        if (++nodes > limits.nodes) fail('REFERENCES_NODE_LIMIT');
        if (level > limits.depth) fail('REFERENCES_DEPTH_LIMIT');
        if (part.unclosed) fail('REFERENCES_CSS_VALUE_SYNTAX');
        const name = cssString(part.value)?.toLowerCase(), offset = base + part.sourceIndex;
        const snippet = raw.slice(part.sourceIndex, part.sourceEndIndex);
        if (part.type === 'word' && name === 'url') issue('css_url_syntax', offset, snippet);
        if (part.type !== 'function') continue;
        if (name === 'url') {
          const children = part.nodes.filter(child => child.type !== 'space');
          const child = children[0];
          // Generic/mixed-case functions tokenize slashes separately; preserve the parser-delimited body.
          const body = snippet.slice(snippet.indexOf('(') + 1, -1).trim();
          const value = children.length === 1 && child.type === 'string'
            ? cssString(child.value) : !body.includes('/*') ? cssString(body, true) : null;
          if (value == null || value === '') issue('css_url_unresolved', offset, snippet);
          else record(value, 'css', offset);
          continue;
        }
        if (['image-set', '-webkit-image-set'].includes(name)) issue('css_image_set_unresolved', offset, snippet);
        for (let i = part.nodes.length - 1; i >= 0; i--) values.push({ part: part.nodes[i], level: level + 1 });
      }
    }
  }
  return { urls: [...urls].sort(), unresolved, embedded, closureComplete: false };
}

module.exports = { allowed, references, LIMITS };
