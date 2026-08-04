const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

// HTTP methods we recognize on an Express-style router object.
const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete']);

/**
 * Pulls structured info out of a JSDoc-style block comment attached to a route handler.
 * This is intentionally a lightweight, purpose-built extractor for the small set of tags
 * this project cares about (@route, @param, @returns) -- not a general JSDoc parser.
 */
function parseJsDocComment(commentText) {
  const lines = commentText
    .split('\n')
    .map((l) => l.replace(/^\s*\*\s?/, '').trim())
    .filter((l) => l.length > 0);

  const result = { description: '', params: [], returns: null };
  const descLines = [];

  for (const line of lines) {
    const paramMatch = line.match(/^@param\s+\{([^}]+)\}\s+(\[?[\w.]+(?:=[^\]]+)?\]?)\s*-?\s*(.*)$/);
    const returnsMatch = line.match(/^@returns?\s+\{([^}]+)\}\s+(\d+)?\s*-?\s*(.*)$/);
    const routeMatch = line.match(/^@route\s+(.*)$/);

    if (paramMatch) {
      const [, type, rawName, description] = paramMatch;
      const optional = rawName.startsWith('[');
      const cleanName = rawName.replace(/^\[|\]$/g, '');
      const [name, defaultValue] = cleanName.split('=');
      result.params.push({
        type,
        name,
        optional,
        defaultValue: defaultValue || null,
        description: description.trim(),
      });
    } else if (returnsMatch) {
      const [, type, status, description] = returnsMatch;
      result.returns = { type, status: status || null, description: description.trim() };
    } else if (routeMatch) {
      // route line already implied by the actual code; skip re-storing it
    } else if (!line.startsWith('@')) {
      descLines.push(line);
    }
  }

  result.description = descLines.join(' ').trim();
  return result;
}

/**
 * Extracts destructured parameter names from a route handler's body -- e.g.
 * `const { email, name } = req.body;` -> ['email', 'name'], tagged by source (body/query/params).
 */
function extractDestructuredParams(handlerNode) {
  const found = { body: [], query: [], params: [] };
  if (!handlerNode || !handlerNode.body || !handlerNode.body.body) return found;

  for (const stmt of handlerNode.body.body) {
    if (
      stmt.type === 'VariableDeclaration' &&
      stmt.declarations.length > 0 &&
      stmt.declarations[0].id.type === 'ObjectPattern' &&
      stmt.declarations[0].init &&
      stmt.declarations[0].init.type === 'MemberExpression'
    ) {
      const init = stmt.declarations[0].init;
      const sourceObj = init.object.name; // e.g. "req"
      const sourceProp = init.property.name; // e.g. "body", "query", "params"
      if (sourceObj !== 'req' || !found[sourceProp]) continue;

      for (const prop of stmt.declarations[0].id.properties) {
        if (prop.type === 'ObjectProperty') {
          found[sourceProp].push(prop.key.name);
        }
      }
    }
  }
  return found;
}

/**
 * Parses a JS source file and extracts every Express router.METHOD(...) call,
 * along with its JSDoc comment and the params the handler actually destructures.
 */
function extractRoutes(sourceCode) {
  const ast = parser.parse(sourceCode, {
    sourceType: 'module',
    plugins: ['jsx'],
    attachComment: true,
  });

  const routes = [];

  traverse(ast, {
    CallExpression(path) {
      const callee = path.node.callee;
      if (
        callee.type === 'MemberExpression' &&
        callee.property &&
        HTTP_METHODS.has(callee.property.name) &&
        callee.object.type === 'Identifier'
      ) {
        const method = callee.property.name.toUpperCase();
        const args = path.node.arguments;
        const routePathArg = args.find((a) => a.type === 'StringLiteral');
        const handlerArg = args.find(
          (a) => a.type === 'ArrowFunctionExpression' || a.type === 'FunctionExpression'
        );
        if (!routePathArg || !handlerArg) return;

        const routePath = routePathArg.value;

        // Leading comments are attached to the outer ExpressionStatement, not the call itself.
        let comments = path.node.leadingComments;
        if (!comments) {
          let p = path.parentPath;
          while (p && !comments) {
            comments = p.node.leadingComments;
            p = p.parentPath;
          }
        }
        const blockComment = (comments || []).find((c) => c.type === 'CommentBlock');
        const jsdoc = blockComment
          ? parseJsDocComment(blockComment.value)
          : { description: '', params: [], returns: null };

        const destructured = extractDestructuredParams(handlerArg);

        routes.push({
          method,
          path: routePath,
          key: `${method} ${routePath}`,
          jsdoc,
          destructured,
        });
      }
    },
  });

  return routes;
}

module.exports = { extractRoutes, parseJsDocComment };
