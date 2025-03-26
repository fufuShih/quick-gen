/**
 * @param {import('@babel/core').Node} node
 * @returns {boolean}
 */
function containsJSX(node) {
  if (!node) return false;

  const isJSX = (type) => {
    return type === 'JSXElement' || 
           type === 'JSXFragment' || 
           type === 'JSXText';
  };

  if (isJSX(node.type)) {
    return true;
  }

  if (node.type === 'ConditionalExpression') {
    return containsJSX(node.consequent) || containsJSX(node.alternate);
  }

  if (node.type === 'LogicalExpression') {
    return containsJSX(node.left) || containsJSX(node.right);
  }

  if (node.type === 'SequenceExpression') {
    return node.expressions.some(expr => containsJSX(expr));
  }

  if (node.type === 'ParenthesizedExpression') {
    return containsJSX(node.expression);
  }

  return false;
}

/**
 * @param {import('@babel/core').types.Statement[]} statements
 * @param {Function} containsJSX
 * @param {Function} isWrappedComponent
 * @returns {boolean}
 */
function hasReturnStatementWithJSX(statements, containsJSX, isWrappedComponent) {
  for (const statement of statements) {
    if (
      statement.type === 'ReturnStatement' &&
      statement.argument &&
      (containsJSX(statement.argument) || isWrappedComponent(statement.argument))
    ) {
      return true;
    }

    if (statement.type === 'IfStatement') {
      if (
        statement.consequent &&
        statement.consequent.type === 'ReturnStatement' &&
        statement.consequent.argument &&
        (containsJSX(statement.consequent.argument) || isWrappedComponent(statement.consequent.argument))
      ) {
        return true;
      }
      
      if (statement.consequent && statement.consequent.type === 'IfStatement') {
        if (hasReturnStatementWithJSX([statement.consequent], containsJSX, isWrappedComponent)) {
          return true;
        }
      }
      
      if (
        statement.consequent?.type === 'BlockStatement' &&
        hasReturnStatementWithJSX(statement.consequent.body, containsJSX, isWrappedComponent)
      ) {
        return true;
      }
      
      if (statement.alternate) {
        if (
          statement.alternate.type === 'ReturnStatement' &&
          statement.alternate.argument &&
          (containsJSX(statement.alternate.argument) || isWrappedComponent(statement.alternate.argument))
        ) {
          return true;
        }
        
        if (statement.alternate.type === 'IfStatement') {
          if (hasReturnStatementWithJSX([statement.alternate], containsJSX, isWrappedComponent)) {
            return true;
          }
        }
        
        if (
          statement.alternate.type === 'BlockStatement' &&
          hasReturnStatementWithJSX(statement.alternate.body, containsJSX, isWrappedComponent)
        ) {
          return true;
        }
      }
    }

    if (statement.type === 'ForStatement' || statement.type === 'WhileStatement') {
      if (
        statement.body?.type === 'BlockStatement' &&
        hasReturnStatementWithJSX(statement.body.body, containsJSX, isWrappedComponent)
      ) {
        return true;
      }
    }

    if (statement.type === 'SwitchStatement') {
      for (const cs of statement.cases) {
        if (
          cs.consequent &&
          hasReturnStatementWithJSX(cs.consequent, containsJSX, isWrappedComponent)
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * @param {import('@babel/core').Node} node
 * @returns {boolean}
 */
function isWrappedComponent(node) {
  if (node.type === 'CallExpression') {
    const callee = node.callee;
    if (
      callee.type === 'Identifier' &&
      (callee.name === 'memo' || callee.name === 'forwardRef')
    ) {
      const args = node.arguments;
      return args.length > 0 && isReactComponent(args[0]);
    }
  }
  return false;
}

/**
 * @param {import('@babel/core').Node} node
 * @returns {boolean}
 */
function isReactComponent(node) {
  if (!node) return false;

  if (isWrappedComponent(node)) {
    return true;
  }

  if (
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'FunctionExpression'
  ) {
    if (containsJSX(node.body)) {
      return true;
    }
    if (node.body?.type === 'BlockStatement') {
      return hasReturnStatementWithJSX(node.body.body, containsJSX, isWrappedComponent);
    }
  }

  if (node.type === 'FunctionDeclaration') {
    if (node.body && node.body.type === 'BlockStatement') {
      return hasReturnStatementWithJSX(node.body.body, containsJSX, isWrappedComponent);
    }
  }

  return false;
}

/**
 * @param {string} componentName
 * @param {string[]} props
 * @param {boolean} hasSpreadProps
 * @param {string} [paramName='props']
 * @returns {string}
 */
function generateJsDoc(componentName, props, hasSpreadProps, paramName = 'props') {
  const name = componentName.replace(/^_+/, '');
  const timestamp = Date.now();

  // Analyze normal props vs spread props
  const normalProps = [];
  let restPropName = null;

  props.forEach((p) => {
    if (p.startsWith('...')) {
      restPropName = p.slice(3);
    } else {
      normalProps.push(p);
    }
  });

  // First block: typedef declarations
  let docBlock1 = `/**\n`;
  docBlock1 += ` * @generated ${timestamp}\n`;
  docBlock1 += ` * @typedef {any} AutoGen\n`;
  docBlock1 += ` *\n`;
  docBlock1 += ` * @typedef {{\n`;

  // Add normal props
  normalProps.forEach((prop) => {
    docBlock1 += ` *  ${prop}: AutoGen,\n`;
  });

  // Add rest props
  if (restPropName) {
    docBlock1 += ` *  ${restPropName}?: AutoGen,\n`;
  } else if (hasSpreadProps) {
    docBlock1 += ` *  [x: string]: AutoGen,\n`;
  }

  docBlock1 += ` * }} ${name}Props\n`;
  docBlock1 += ` */`;

  // Second block: component type declaration - use paramName here
  let docBlock2 = `/** @type {(${paramName}: ${name}Props) => JSX.Element} */`;

  return docBlock1 + `\n\n` + docBlock2;
}

module.exports = {
  isReactComponent,
  generateJsDoc
};
