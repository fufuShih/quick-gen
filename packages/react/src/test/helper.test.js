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

    it('should return true for a wrapped component (forwardRef)', () => {
      const node = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'forwardRef' },
        arguments: [
          {
            type: 'ArrowFunctionExpression',
            body: { type: 'JSXElement' }
          }
        ]
      };
      expect(isReactComponent(node)).toBe(true);
    });

    it('should return true for a FunctionExpression returning JSX', () => {
      const node = {
        type: 'FunctionExpression',
        body: {
          type: 'BlockStatement',
          body: [
            {
              type: 'ReturnStatement',
              argument: { type: 'JSXElement' }
            }
          ]
        }
      };
      expect(isReactComponent(node)).toBe(true);
    });

    it('should return true when JSX is returned in an if/else block', () => {
      const node = {
        type: 'FunctionDeclaration',
        body: {
          type: 'BlockStatement',
          body: [
            {
              type: 'IfStatement',
              test: { type: 'Identifier', name: 'condition' },
              consequent: {
                type: 'BlockStatement',
                body: [
                  {
                    type: 'ReturnStatement',
                    argument: { type: 'JSXElement' }
                  }
                ]
              },
              alternate: {
                type: 'BlockStatement',
                body: [
                  {
                    type: 'ReturnStatement',
                    argument: { type: 'JSXElement' }
                  }
                ]
              }
            }
          ]
        }
      };
      expect(isReactComponent(node)).toBe(true);
    });

    it('should return true when JSX is in a conditional expression', () => {
      const node = {
        type: 'ArrowFunctionExpression',
        body: {
          type: 'ConditionalExpression',
          test: { type: 'Identifier', name: 'condition' },
          consequent: { type: 'JSXElement' },
          alternate: { type: 'JSXElement' }
        }
      };
      expect(isReactComponent(node)).toBe(true);
    });

    it('should return true when JSX is in a logical expression', () => {
      const node = {
        type: 'ArrowFunctionExpression',
        body: {
          type: 'LogicalExpression',
          operator: '&&',
          left: { type: 'Identifier', name: 'condition' },
          right: { type: 'JSXElement' }
        }
      };
      expect(isReactComponent(node)).toBe(true);
    });

    it('should return true when JSX is in a switch statement', () => {
      const node = {
        type: 'FunctionDeclaration',
        body: {
          type: 'BlockStatement',
          body: [
            {
              type: 'SwitchStatement',
              discriminant: { type: 'Identifier', name: 'value' },
              cases: [
                {
                  type: 'SwitchCase',
                  test: { type: 'StringLiteral', value: 'test' },
                  consequent: [
                    {
                      type: 'ReturnStatement',
                      argument: { type: 'JSXElement' }
                    }
                  ]
                }
              ]
            }
          ]
        }
      };
      expect(isReactComponent(node)).toBe(true);
    });
  });

  describe('generateJsDoc', () => {
    it('should generate JSDoc with given props (no spread)', () => {
      const doc = generateJsDoc('MyComponent', ['foo', 'bar'], false, 'props');
      
      // First block: typedef declarations
      expect(doc).toContain('@generated');
      expect(doc).toContain('@typedef {any} AutoGen');
      expect(doc).toContain('@typedef {{');
      expect(doc).toContain('foo: AutoGen');
      expect(doc).toContain('bar: AutoGen');
      expect(doc).toContain('}} MyComponentProps');

      // Second block: type declaration
      expect(doc).toContain('@type {(props: MyComponentProps) => JSX.Element}');
    });

    it('should generate JSDoc with explicit spread prop', () => {
      const doc = generateJsDoc('MyComponent', ['foo', '...rest'], false, 'props');
      
      // Check normal and spread props in typedef
      expect(doc).toContain('foo: AutoGen');
      expect(doc).toContain('rest?: AutoGen');
      expect(doc).toContain('}} MyComponentProps');
    });

    it('should generate JSDoc with fallback spread when hasSpreadProps is true', () => {
      const doc = generateJsDoc('MyComponent', ['foo', 'bar'], true, 'props');
      
      // Check normal props and [x: string] syntax for unknown spread
      expect(doc).toContain('foo: AutoGen');
      expect(doc).toContain('bar: AutoGen');
      expect(doc).toContain('[x: string]: AutoGen');
    });

    it('should use custom param name in type declaration', () => {
      const doc = generateJsDoc('MyComponent', ['foo'], false, 'data');
      
      // Check if the type declaration uses the custom param name
      expect(doc).toContain('@type {(data: MyComponentProps) => JSX.Element}');
    });

    it('should use "props" as default param name if not provided', () => {
      const doc = generateJsDoc('MyComponent', ['foo'], false);
      
      // Check if the type declaration uses the default "props"
      expect(doc).toContain('@type {(props: MyComponentProps) => JSX.Element}');
    });
  });
});
