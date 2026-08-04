function paramTableRow(p) {
  const name = p.optional ? `\`${p.name}\` *(optional${p.defaultValue ? `, default: ${p.defaultValue}` : ''})*` : `\`${p.name}\``;
  return `| ${name} | ${p.type} | ${p.description || '—'} |`;
}

function routeSection(route, changeLabel) {
  const lines = [];
  lines.push(`### ${route.method} \`${route.path}\`${changeLabel ? ` ${changeLabel}` : ''}`);
  lines.push('');
  if (route.jsdoc.description) {
    lines.push(route.jsdoc.description);
    lines.push('');
  }
  if (route.jsdoc.params.length > 0) {
    lines.push('| Parameter | Type | Description |');
    lines.push('|---|---|---|');
    route.jsdoc.params.forEach((p) => lines.push(paramTableRow(p)));
    lines.push('');
  }
  if (route.jsdoc.returns) {
    const r = route.jsdoc.returns;
    lines.push(`**Returns** ${r.status ? `\`${r.status}\`` : ''} ${r.type} — ${r.description}`);
    lines.push('');
  }
  return lines.join('\n');
}

/**
 * Renders a full Markdown document for a diff result, grouped by
 * added / changed / removed so a reviewer can see exactly what needs attention.
 */
function generateMarkdown(diffResult, meta = {}) {
  const { added, removed, changed, unchanged } = diffResult;
  const lines = [];

  lines.push(`# API Documentation Update`);
  lines.push('');
  if (meta.fromRef && meta.toRef) {
    lines.push(`_Generated from diff between \`${meta.fromRef}\` and \`${meta.toRef}\`_`);
    lines.push('');
  }

  if (added.length === 0 && changed.length === 0 && removed.length === 0) {
    lines.push('No route changes detected between these two versions.');
    return lines.join('\n');
  }

  lines.push(`**Summary:** ${added.length} added, ${changed.length} changed, ${removed.length} removed, ${unchanged.length} unchanged.`);
  lines.push('');

  if (added.length > 0) {
    lines.push('## New Endpoints');
    lines.push('');
    added.forEach((route) => {
      lines.push(routeSection(route, '🆕'));
      lines.push('');
    });
  }

  if (changed.length > 0) {
    lines.push('## Changed Endpoints');
    lines.push('');
    changed.forEach(({ before, after }) => {
      lines.push(routeSection(after, '✏️ *(signature changed)*'));

      const beforeParamNames = new Set(before.jsdoc.params.map((p) => p.name));
      const afterParamNames = new Set(after.jsdoc.params.map((p) => p.name));
      const newParams = [...afterParamNames].filter((n) => !beforeParamNames.has(n));
      const removedParams = [...beforeParamNames].filter((n) => !afterParamNames.has(n));

      if (newParams.length > 0) {
        lines.push(`> **What changed:** added parameter${newParams.length > 1 ? 's' : ''} ${newParams.map((n) => `\`${n}\``).join(', ')}.`);
        lines.push('');
      }
      if (removedParams.length > 0) {
        lines.push(`> **What changed:** removed parameter${removedParams.length > 1 ? 's' : ''} ${removedParams.map((n) => `\`${n}\``).join(', ')}.`);
        lines.push('');
      }
    });
  }

  if (removed.length > 0) {
    lines.push('## Removed Endpoints');
    lines.push('');
    lines.push('> ⚠️ These endpoints existed in the previous version and were not found in the current one. Confirm this is intentional before publishing.');
    lines.push('');
    removed.forEach((route) => {
      lines.push(`- **${route.method} \`${route.path}\`** — ${route.jsdoc.description || 'no description available'}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

module.exports = { generateMarkdown };
