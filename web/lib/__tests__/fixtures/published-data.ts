import files from './published-walks.json';

// Deliberately independent of web/public/data and the caller's working directory.
// Source identities and field reductions are in published-walks.provenance.json.
export function readPublishedFixture<T>(path: string): T {
  const fixtures: Record<string, unknown> = files;
  if (!Object.hasOwn(fixtures, path)) {
    throw new Error(`Published test fixture is missing: ${path}`);
  }
  return structuredClone(fixtures[path]) as T;
}
