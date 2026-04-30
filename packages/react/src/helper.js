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

/**
 * @param {string} componentName
 * @param {string} typeSuffix
 * @returns {string}
 */
function getPropsTypeName(componentName, typeSuffix = 'Props') {
  const cleanedName = String(componentName || 'Component')
    .replace(/^_+/, '')
    .replace(/[^\w$]/g, '');

  const safeName = /^[A-Za-z_$]/.test(cleanedName)
    ? cleanedName
    : `_${cleanedName || 'Component'}`;

  return `${safeName}${typeSuffix}`;
}

/**
 * @param {string} name
 * @returns {string}
 */
function formatTypePropertyName(name) {
  if (/^[A-Za-z_$][\w$]*$/.test(name)) {
    return name;
  }

  return JSON.stringify(name);
}

/**
 * @param {string} type
 * @returns {string}
 */
function jsDocTypeToTsType(type) {
  const rawType = String(type || '*')
    .trim()
    .replace(/^!/, '')
    .replace(/=$/, '');

  if (!rawType || rawType === '*' || rawType === '?') {
    return 'any';
  }

  const unionType = rawType.replace(/^\((.*)\)$/, '$1');
  if (unionType.includes('|')) {
    return unionType
      .split('|')
      .map(part => jsDocTypeToTsType(part))
      .join(' | ');
  }

  const genericType = rawType.match(/^(Array|Object)\.?\<(.+)\>$/);
  if (genericType && genericType[1] === 'Array') {
    return `${jsDocTypeToTsType(genericType[2])}[]`;
  }

  if (genericType && genericType[1] === 'Object') {
    const [keyType = 'string', valueType = 'any'] = genericType[2]
      .split(',')
      .map(part => part.trim());

    return `Record<${jsDocTypeToTsType(keyType)}, ${jsDocTypeToTsType(valueType)}>`;
  }

  if (rawType.endsWith('[]')) {
    return `${jsDocTypeToTsType(rawType.slice(0, -2))}[]`;
  }

  const knownTypes = {
    '*': 'any',
    object: 'Record<string, any>',
    Object: 'Record<string, any>',
    function: '(...args: any[]) => any',
    Function: '(...args: any[]) => any',
    boolean: 'boolean',
    Boolean: 'boolean',
    string: 'string',
    String: 'string',
    number: 'number',
    Number: 'number',
    bigint: 'bigint',
    BigInt: 'bigint',
    symbol: 'symbol',
    Symbol: 'symbol',
    undefined: 'undefined',
    null: 'null',
    void: 'void',
    JSXElement: 'JSX.Element',
    'JSX.Element': 'JSX.Element',
    ReactNode: 'React.ReactNode',
    'React.Node': 'React.ReactNode',
    'React.ReactNode': 'React.ReactNode'
  };

  return knownTypes[rawType] || rawType;
}

/**
 * @param {string|{name: string, type?: string, spread?: boolean}} prop
 * @returns {{name: string, type: string, spread: boolean}}
 */
function normalizeTsProp(prop) {
  if (typeof prop === 'string') {
    return {
      name: prop.replace(/^\.\.\./, ''),
      type: 'any',
      spread: prop.startsWith('...')
    };
  }

  return {
    name: prop.name.replace(/^\.\.\./, ''),
    type: jsDocTypeToTsType(prop.type || '*'),
    spread: !!prop.spread || prop.name.startsWith('...')
  };
}

/**
 * @param {string} componentName
 * @param {Array<string|{name: string, type?: string, spread?: boolean}>} props
 * @param {boolean} hasSpreadProps
 * @param {{typeSuffix?: string, exportTypes?: boolean}} [options]
 * @returns {string}
 */
function generateTsType(componentName, props, hasSpreadProps, options = {}) {
  const typeName = getPropsTypeName(componentName, options.typeSuffix || 'Props');
  const exportPrefix = options.exportTypes ? 'export ' : '';
  const normalizedProps = props.map(normalizeTsProp);
  const normalProps = normalizedProps.filter(prop => !prop.spread);
  const needsIndexSignature = hasSpreadProps || normalizedProps.some(prop => prop.spread);
  const seenProps = new Set();

  let typeDefinition = `${exportPrefix}type ${typeName} = {\n`;

  normalProps.forEach(prop => {
    if (!prop.name || seenProps.has(prop.name)) return;
    seenProps.add(prop.name);
    typeDefinition += `  ${formatTypePropertyName(prop.name)}?: ${prop.type};\n`;
  });

  if (needsIndexSignature) {
    typeDefinition += `  [key: string]: any;\n`;
  }

  typeDefinition += `};`;

  return typeDefinition;
}

/**
 * @param {string} target
 * @returns {{target: string, optional: boolean}}
 */
function normalizeJsDocParamTarget(target) {
  let normalized = String(target || '').trim();
  let optional = false;

  if (normalized.startsWith('[') && normalized.endsWith(']')) {
    optional = true;
    normalized = normalized.slice(1, -1);

    const defaultValueIndex = normalized.indexOf('=');
    if (defaultValueIndex !== -1) {
      normalized = normalized.slice(0, defaultValueIndex);
    }
  }

  return { target: normalized, optional };
}

/**
 * @param {string} commentValue
 * @returns {{name: string, paramName: string, props: Array<{name: string, type: string, spread?: boolean}>, hasSpreadProps: boolean}|null}
 */
function parseQuickGenJsDoc(commentValue) {
  const componentMatch = String(commentValue || '').match(/@component\s+([A-Za-z_$][\w$]*)/);
  if (!componentMatch) {
    return null;
  }

  const componentInfo = {
    name: componentMatch[1],
    paramName: 'props',
    props: [],
    hasSpreadProps: false
  };

  const paramPattern = /@param\s+\{([^}]+)\}\s+([^\s]+)(?:\s+-?\s*(.*))?/g;
  let match;

  while ((match = paramPattern.exec(commentValue)) !== null) {
    const jsDocType = match[1];
    const { target } = normalizeJsDocParamTarget(match[2]);

    if (!target.includes('.')) {
      componentInfo.paramName = target || componentInfo.paramName;
      continue;
    }

    const [paramName, ...propPathParts] = target.split('.');
    const propName = propPathParts.join('.');
    if (!propName) continue;

    componentInfo.paramName = paramName || componentInfo.paramName;

    if (propName.startsWith('...') || (propName === 'rest' && jsDocType.toLowerCase() === 'object')) {
      componentInfo.hasSpreadProps = true;
      continue;
    }

    componentInfo.props.push({
      name: propName,
      type: jsDocTypeToTsType(jsDocType)
    });
  }

  return componentInfo;
}

module.exports = {
  isReactComponent,
  generateJsDoc,
  generateTsType,
  getPropsTypeName,
  parseQuickGenJsDoc,
  jsDocTypeToTsType
};
