/**
 * Compares two arrays of extracted routes (before/after) and classifies each
 * as added, removed, or changed (params or description differ), or unchanged.
 */
function diffRoutes(beforeRoutes, afterRoutes) {
  const beforeMap = new Map(beforeRoutes.map((r) => [r.key, r]));
  const afterMap = new Map(afterRoutes.map((r) => [r.key, r]));

  const added = [];
  const removed = [];
  const changed = [];
  const unchanged = [];

  for (const [key, afterRoute] of afterMap) {
    if (!beforeMap.has(key)) {
      added.push(afterRoute);
      continue;
    }
    const beforeRoute = beforeMap.get(key);
    if (routeSignatureDiffers(beforeRoute, afterRoute)) {
      changed.push({ before: beforeRoute, after: afterRoute });
    } else {
      unchanged.push(afterRoute);
    }
  }

  for (const [key, beforeRoute] of beforeMap) {
    if (!afterMap.has(key)) {
      removed.push(beforeRoute);
    }
  }

  return { added, removed, changed, unchanged };
}

function routeSignatureDiffers(a, b) {
  const paramsA = JSON.stringify(a.jsdoc.params.map((p) => [p.name, p.type, p.optional]).sort());
  const paramsB = JSON.stringify(b.jsdoc.params.map((p) => [p.name, p.type, p.optional]).sort());
  return paramsA !== paramsB || a.jsdoc.description !== b.jsdoc.description;
}

module.exports = { diffRoutes };
