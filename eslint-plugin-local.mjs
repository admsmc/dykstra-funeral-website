/**
 * Custom ESLint Rules for Mock Data Detection
 * 
 * Detects hardcoded mock data patterns in production code to ensure
 * all pages properly use backend APIs instead of local mock arrays.
 */

/**
 * Rule: no-mock-data-in-pages
 * Detects mock data patterns in page components
 */
const noMockDataInPages = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded mock data in page components',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      mockDataDetected: 'Hardcoded mock data detected. Use API endpoints via tRPC instead. Pattern: {{pattern}}',
      mockCommentDetected: 'TODO comment indicates mock data usage. Remove mock data and wire to backend API.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();
    const isPageFile = filename.includes('/app/staff/') && filename.endsWith('/page.tsx');
    const isComponentFile = filename.includes('/components/') && filename.endsWith('.tsx');
    
    // Only check page and component files
    if (!isPageFile && !isComponentFile) {
      return {};
    }

    return {
      // Detect: const mockData = [...]
      VariableDeclarator(node) {
        if (
          node.id.type === 'Identifier' &&
          node.id.name.toLowerCase().includes('mock') &&
          node.init &&
          node.init.type === 'ArrayExpression' &&
          node.init.elements.length > 0
        ) {
          context.report({
            node,
            messageId: 'mockDataDetected',
            data: {
              pattern: `const ${node.id.name} = [...]`,
            },
          });
        }
      },

      // Detect TODO comments about mock data
      Program(node) {
        const sourceCode = context.getSourceCode();
        const comments = sourceCode.getAllComments();
        
        comments.forEach(comment => {
          const commentText = comment.value.toLowerCase();
          if (
            (commentText.includes('mock') && commentText.includes('data')) ||
            (commentText.includes('todo') && commentText.includes('mock')) ||
            (commentText.includes('replace') && commentText.includes('mock'))
          ) {
            context.report({
              loc: comment.loc,
              messageId: 'mockCommentDetected',
            });
          }
        });
      },
    };
  },
};

/**
 * Rule: no-mock-data-in-routers
 * Warns about mock data in tRPC routers (softer warning - acceptable during development)
 */
const noMockDataInRouters = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Warn about mock data in tRPC routers',
      category: 'Best Practices',
      recommended: false,
    },
    messages: {
      mockReturnDetected: 'Router returns hardcoded mock data. Replace with Prisma query for production. Comment: "{{comment}}"',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();
    const isRouterFile = filename.includes('/routers/') && filename.endsWith('.router.ts');
    
    // Only check router files
    if (!isRouterFile) {
      return {};
    }

    return {
      // Detect comments with "Mock" in router return statements
      ReturnStatement(node) {
        const sourceCode = context.getSourceCode();
        const comments = sourceCode.getCommentsBefore(node);
        
        comments.forEach(comment => {
          const commentText = comment.value.trim();
          if (commentText.toLowerCase().includes('mock')) {
            context.report({
              node,
              messageId: 'mockReturnDetected',
              data: {
                comment: commentText.substring(0, 60) + (commentText.length > 60 ? '...' : ''),
              },
            });
          }
        });
      },
    };
  },
};

/**
 * Rule: require-api-usage-in-pages
 * Ensures pages are using tRPC API calls
 */
const requireApiUsageInPages = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ensure pages use tRPC API calls',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      missingApiCall: 'Page component should use at least one tRPC API call (api.*.use*). Verify this is not using hardcoded data.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();
    const isPageFile = filename.includes('/app/staff/') && filename.endsWith('/page.tsx');
    
    // Only check page files
    if (!isPageFile) {
      return {};
    }

    let hasApiCall = false;
    let hasMockData = false;

    return {
      // Detect: api.*.useQuery() or api.*.useMutation()
      MemberExpression(node) {
        if (
          node.object.type === 'MemberExpression' &&
          node.object.object.type === 'Identifier' &&
          node.object.object.name === 'api' &&
          node.property.type === 'Identifier' &&
          (node.property.name.startsWith('use') || node.property.name === 'trpc')
        ) {
          hasApiCall = true;
        }
      },

      // Detect mock data arrays
      VariableDeclarator(node) {
        if (
          node.id.type === 'Identifier' &&
          (node.id.name.toLowerCase().includes('mock') ||
           node.id.name.toLowerCase().includes('dummy')) &&
          node.init &&
          node.init.type === 'ArrayExpression'
        ) {
          hasMockData = true;
        }
      },

      'Program:exit'() {
        // Warn if page has mock data but no API calls
        if (hasMockData && !hasApiCall) {
          context.report({
            loc: { line: 1, column: 0 },
            messageId: 'missingApiCall',
          });
        }
      },
    };
  },
};

// Export plugin
export default {
  rules: {
    'no-mock-data-in-pages': noMockDataInPages,
    'no-mock-data-in-routers': noMockDataInRouters,
    'require-api-usage-in-pages': requireApiUsageInPages,
  },
};
