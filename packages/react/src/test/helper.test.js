const { isReactComponent, generateJsDoc } = require('../helper');

describe('helper.js', () => {
  describe('isReactComponent', () => {
    it('should return true for an ArrowFunctionExpression that returns JSX', () => {
      const node = {
        type: 'ArrowFunctionExpression',
        // Directly return a JSXElement
        body: { type: 'JSXElement' }
      };
      expect(isReactComponent(node)).toBe(true);
    });

    it('should return false for an ArrowFunctionExpression that does not return JSX', () => {
      const node = {
        type: 'ArrowFunctionExpression',
        // Return a pure number
        body: { type: 'NumericLiteral', value: 42 }
      };
      expect(isReactComponent(node)).toBe(false);
    });

    it('should return true for a FunctionDeclaration with a BlockStatement returning JSX', () => {
      const node = {
        type: 'FunctionDeclaration',
        body: {
          type: 'BlockStatement',
          body: [
            {
              type: 'ReturnStatement',
              argument: { type: 'JSXFragment' }
            }
          ]
        }
      };
      expect(isReactComponent(node)).toBe(true);
    });

    it('should return false for a FunctionDeclaration without any return', () => {
      const node = {
        type: 'FunctionDeclaration',
        body: {
          type: 'BlockStatement',
          body: []
        }
      };
      expect(isReactComponent(node)).toBe(false);
    });

    it('should return true for a wrapped component (memo)', () => {
      const node = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'memo' },
        arguments: [
          {
            type: 'ArrowFunctionExpression',
            body: { type: 'JSXElement' }
          }
        ]
      };
      expect(isReactComponent(node)).toBe(true);
    });
  });

  describe('generateJsDoc', () => {
    it('should generate JSDoc with given props (no spread)', () => {
      const doc = generateJsDoc('MyComponent', 'props', ['foo', 'bar'], false);
      expect(doc).toContain('@component MyComponent');
      expect(doc).toContain('@param {Object} props Component props');
      expect(doc).toContain('@param {*} props.foo - [auto generate]');
      expect(doc).toContain('@param {*} props.bar - [auto generate]');
      expect(doc).toContain('@returns {JSX.Element} React component');
    });

    it('should generate JSDoc with explicit spread prop', () => {
      const doc = generateJsDoc('MyComponent', 'props', ['foo', '...rest'], false);
      // When there is a prop starting with '...', it should use that name
      expect(doc).toContain('@param {Object} props.rest - [auto generate]');
    });

    it('should generate JSDoc with fallback spread when hasSpreadProps is true and no spread prop provided', () => {
      const doc = generateJsDoc('MyComponent', 'props', ['foo', 'bar'], true);
      expect(doc).toContain('@param {Object} props.rest - [auto generate]');
    });
  });
});
