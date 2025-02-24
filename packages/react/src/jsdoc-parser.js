/**
 * @typedef {{
 *  name: string,
 *  type: string
 * }} ParsedProp
 */

/**
 * @typedef {{
 *  hasGenerated: boolean,
 *  typedefName: string,
 *  props: ParsedProp[],
 *  otherContent: string
 * }} ParsedJSDoc
 */

/**
 * Parses JSDoc comment block into structured data
 * @param {string} jsDocText 
 * @returns {ParsedJSDoc}
 */
function parseJSDoc(jsDocText) {
  const hasGenerated = jsDocText.includes('@generated');
  
  // Extract typedef name and props
  const typedefMatch = jsDocText.match(/@typedef\s*{{\s*([\s\S]*?)}}(.*?)Props/);
  if (!typedefMatch) {
    return null;
  }

  const typedefName = (typedefMatch[2] || '').trim() + 'Props';
  const propsText = typedefMatch[1];

  // Parse props and their types
  const props = [];
  const propLines = propsText.split('\n');
  
  for (const line of propLines) {
    const propMatch = line.match(/\s*(\[?[\w.]+\]?)\s*:\s*([\w<>[\]|]+)/);
    if (propMatch) {
      props.push({
        name: propMatch[1],
        type: propMatch[2].trim()
      });
    }
  }

  return {
    hasGenerated,
    typedefName,
    props,
    otherContent: jsDocText.replace(typedefMatch[0], '') // Store other content
  };
}

/**
 * Updates parsed JSDoc with new props while preserving non-AutoGen types
 * @param {ParsedJSDoc} parsedDoc 
 * @param {string[]} currentProps 
 */
function updateParsedJSDoc(parsedDoc, currentProps) {
  // Keep track of existing props and their types
  const existingProps = new Map(
    parsedDoc.props.map(p => [p.name, p.type])
  );

  // Filter out removed AutoGen props
  parsedDoc.props = parsedDoc.props.filter(prop => {
    if (prop.type !== 'AutoGen') {
      return true; // Keep non-AutoGen props
    }
    return currentProps.includes(prop.name.replace(/^\[|\]$/g, '')); 
  });

  // Add new props as AutoGen
  for (const propName of currentProps) {
    if (!existingProps.has(propName)) {
      parsedDoc.props.push({
        name: propName,
        type: 'AutoGen'
      });
    }
  }
}

/**
 * Converts parsed JSDoc back to string format
 * @param {ParsedJSDoc} parsedDoc 
 * @returns {string}
 */
function serializeJSDoc(parsedDoc) {
  const timestamp = Date.now();
  let output = '/**\n';
  output += ` * @generated ${timestamp}\n`;
  output += ` * @typedef {any} AutoGen\n`;
  output += ` *\n`;
  output += ` * @typedef {{\n`;
  
  // Add props
  for (const prop of parsedDoc.props) {
    output += ` *  ${prop.name}: ${prop.type},\n`;
  }
  
  output += ` * }} ${parsedDoc.typedefName}\n`;
  
  // Add back other content
  if (parsedDoc.otherContent) {
    output += parsedDoc.otherContent;
  }
  
  output += ' */';
  return output;
}

module.exports = {
  parseJSDoc,
  updateParsedJSDoc,
  serializeJSDoc
}; 
