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
  for (const st of statements) {
    if (
      st.type === 'ReturnStatement' &&
      st.argument &&
      (containsJSX(st.argument) || isWrappedComponent(st.argument))
    ) {
      return true;
    }

    if (st.type === 'IfStatement') {
      if (
        st.consequent &&
        st.consequent.type === 'ReturnStatement' &&
        st.consequent.argument &&
        (containsJSX(st.consequent.argument) || isWrappedComponent(st.consequent.argument))
      ) {
        return true;
      }
      
      if (st.consequent && st.consequent.type === 'IfStatement') {
        if (hasReturnStatementWithJSX([st.consequent], containsJSX, isWrappedComponent)) {
          return true;
        }
      }
      
      if (
        st.consequent?.type === 'BlockStatement' &&
        hasReturnStatementWithJSX(st.consequent.body, containsJSX, isWrappedComponent)
      ) {
        return true;
      }
      
      if (st.alternate) {
        if (
          st.alternate.type === 'ReturnStatement' &&
          st.alternate.argument &&
          (containsJSX(st.alternate.argument) || isWrappedComponent(st.alternate.argument))
        ) {
          return true;
        }
        
        if (st.alternate.type === 'IfStatement') {
          if (hasReturnStatementWithJSX([st.alternate], containsJSX, isWrappedComponent)) {
            return true;
          }
        }
        
        if (
          st.alternate.type === 'BlockStatement' &&
          hasReturnStatementWithJSX(st.alternate.body, containsJSX, isWrappedComponent)
        ) {
          return true;
        }
      }
    }

    if (st.type === 'ForStatement' || st.type === 'WhileStatement') {
      if (
        st.body?.type === 'BlockStatement' &&
        hasReturnStatementWithJSX(st.body.body, containsJSX, isWrappedComponent)
      ) {
        return true;
      }
    }

    if (st.type === 'SwitchStatement') {
      for (const cs of st.cases) {
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
 * @param {string} paramName
 * @param {string[]} props
 * @param {boolean} hasSpreadProps
 * @returns {string}
 */
function generateJsDoc(componentName, paramName, props, hasSpreadProps) {
  let doc = '';
  doc += `/**\n`;
  doc += ` * @generated ${Date.now()}\n`;
  doc += ` * @component ${componentName.replace(/^_+/, '')}\n`;
  doc += ` *\n`;
  doc += ` * @param {Object} ${paramName} Component props\n`;
  
  const normalProps = props.filter(prop => !prop.startsWith('...'));
  const spreadProps = props.find(prop => prop.startsWith('...'));
  
  normalProps.forEach(prop => {
    doc += ` * @param {*} ${paramName}.${prop} - [auto generate]\n`;
  });

  if (spreadProps) {
    const restName = spreadProps.slice(3);
    doc += ` * @param {Object} ${paramName}.${restName} - [auto generate]\n`;
  } else if (hasSpreadProps) {
    doc += ` * @param {Object} ${paramName}.rest - [auto generate]\n`;
  }

  doc += ` * @returns {JSX.Element} React component\n`;
  doc += ` */`;
  
  return doc;
}

module.exports = {
  isReactComponent,
  generateJsDoc
};
