import { Results } from "delib-npm";

/**
 * Recursively flattens a Results tree to a list of all statementIds.
 * Useful for comparing current vs previous results.
 */
export function flattenResults(results: Results): string[] {
  const ids: string[] = [];

  function traverse(res: Results) {
    ids.push(res.top.statementId);
    res.sub?.forEach(traverse); // Recursively go through sub-results
  }

  traverse(results);

  return ids;
}
