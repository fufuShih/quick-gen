const fs = require('fs');
const glob = require('glob');
const babel = require('@babel/core');
const MagicString = require('magic-string');
const {
  isReactComponent,
  generateJsDoc,
  generateTsType,
  getPropsTypeName,
  parseQuickGenJsDoc,
} = require('./helper');
const { parseJSDoc, updateParsedJSDoc, serializeJSDoc } = require('./jsdoc-parser');

const DEFAULT_EXTENSIONS = ['js', 'jsx', 'ts', 'tsx'];
const OUTPUT_MODES = new Set(['jsdoc', 'type', 'both']);

/**
 * @typedef {Object} ComponentInfo
 * @property {string} name
 * @property {Set<string>} props
 * @property {boolean} hasSpreadProps
 * @property {string} paramName
 */

/**
 * @param {import('@babel/core').NodePath} path
 * @returns {boolean}
 */
function isInsideAnotherReactComponent(path) {
  return !!path.findParent((parentPath) => {
    if (parentPath === path) return false;
    return isReactComponent(parentPath.node);
  });
}

/**
 * @param {import('@babel/core').types.ObjectProperty} prop
 * @returns {string|null}
 */
function getObjectPropertyName(prop) {
  if (!prop || !prop.key) return null;

  if (prop.key.type === 'Identifier') {
    return prop.key.name;
  }

  if (
    prop.key.type === 'StringLiteral' ||
    prop.key.type === 'NumericLiteral'
  ) {
    return String(prop.key.value);
  }

  return null;
}

/**
 * @param {import('@babel/core').types.MemberExpression} node
 * @returns {string|null}
 */
function getMemberPropertyName(node) {
  if (!node || !node.property) return null;

  if (!node.computed && node.property.type === 'Identifier') {
    return node.property.name;
  }

  if (
    node.computed &&
    (node.property.type === 'StringLiteral' || node.property.type === 'NumericLiteral')
  ) {
    return String(node.property.value);
  }

  return null;
}

/**
 * @param {import('@babel/core').NodePath} path
 * @param {ComponentInfo} componentInfo
 */
function analyzeComponent(path, componentInfo) {
  let paramName = null;
  if (path.node.params && path.node.params[0]) {
    const firstParam = path.node.params[0];
    if (firstParam.type === 'Identifier') {
      paramName = firstParam.name;
      path.traverse({
        VariableDeclarator(childPath) {
          const init = childPath.node.init;
          if (init && init.name === firstParam.name) {
            const id = childPath.node.id;
            if (id.type === 'ObjectPattern') {
              id.properties.forEach(prop => {
                if (prop.type === 'ObjectProperty') {
                  const propName = getObjectPropertyName(prop);
                  if (propName) componentInfo.props.add(propName);
                } else if (prop.type === 'RestElement') {
                  componentInfo.hasSpreadProps = true;
                  componentInfo.props.add('...' + prop.argument.name);
                }
              });
            }
          }
        }
      });
    }

    if (firstParam.type === 'ObjectPattern') {
      firstParam.properties.forEach(prop => {
        if (prop.type === 'ObjectProperty') {
          const propName = getObjectPropertyName(prop);
          if (propName) componentInfo.props.add(propName);
        } else if (prop.type === 'RestElement') {
          componentInfo.hasSpreadProps = true;
          componentInfo.props.add('...' + prop.argument.name);
        }
      });
    }
  }

  componentInfo.paramName = paramName || 'props';

  path.traverse({
    MemberExpression(childPath) {
      if (componentInfo.paramName && childPath.node.object.name === componentInfo.paramName) {
        const propName = getMemberPropertyName(childPath.node);
        if (propName) componentInfo.props.add(propName);
      }
    },
    SpreadElement(childPath) {
      if (componentInfo.paramName && childPath.node.argument.name === componentInfo.paramName) {
        componentInfo.hasSpreadProps = true;
      }
    }
  });

  console.log('Analyzing component:', componentInfo.name);
  console.log('Found props:', Array.from(componentInfo.props));
}

/**
 * @param {Object} comment
 * @returns {boolean}
 */
function isJSDoc(comment) {
  return comment.type === 'CommentBlock' && comment.value.trim().startsWith('*');
}

/**
 * @param {string|string[]} value
 * @returns {string[]}
 */
function normalizeExtensions(value) {
  const extensions = Array.isArray(value)
    ? value
    : String(value || DEFAULT_EXTENSIONS.join(',')).split(',');

  const normalizedExtensions = extensions
    .map(extension => String(extension).trim().replace(/^\./, ''))
    .filter(Boolean);

  return normalizedExtensions.length > 0 ? normalizedExtensions : DEFAULT_EXTENSIONS;
}

/**
 * @param {object} options
 * @returns {{
 *   extensions: string[],
 *   output: 'jsdoc'|'type'|'both',
 *   convertJsDocToType: boolean,
 *   keepJsDoc: boolean,
 *   typeSuffix: string,
 *   exportTypes: boolean,
 *   update: boolean
 * }}
 */
function normalizeGenerateDocsOptions(options = {}) {
  const output = OUTPUT_MODES.has(options.output)
    ? options.output
    : (options.convertJsDocToType ? 'type' : 'jsdoc');

  return {
    extensions: normalizeExtensions(options.extensions),
    output,
    convertJsDocToType: !!options.convertJsDocToType,
    keepJsDoc: !!options.keepJsDoc,
    typeSuffix: options.typeSuffix || 'Props',
    exportTypes: !!options.exportTypes,
    update: !!options.update
  };
}

/**
 * @param {string[]} extensions
 * @returns {string}
 */
function createGlobPattern(extensions) {
  if (extensions.length === 1) {
    return `**/*.${extensions[0]}`;
  }

  return `**/*.{${extensions.join(',')}}`;
}

/**
 * @param {object} options
 * @returns {boolean}
 */
function shouldGenerateJsDoc(options) {
  return options.output === 'jsdoc' || options.output === 'both';
}

/**
 * @param {object} options
 * @returns {boolean}
 */
function shouldGenerateTsType(options) {
  return options.output === 'type' ||
    options.output === 'both' ||
    options.convertJsDocToType;
}

/**
 * @param {Array<{type: string, value: string, start?: number, end?: number}>} comments
 * @returns {Array<{type: string, value: string, start?: number, end?: number}>}
 */
function getLeadingJSDocs(comments = []) {
  return comments.filter(isJSDoc);
}

/**
 * @param {Array<{type: string, value: string, start?: number, end?: number}>} comments
 * @returns {{type: string, value: string, start?: number, end?: number}|null}
 */
function findQuickGenJsDoc(comments = []) {
  return comments.find(comment => parseQuickGenJsDoc(comment.value)) || null;
}

/**
 * @param {Array<{type: string, value: string, start?: number, end?: number}>} comments
 * @returns {{type: string, value: string, start?: number, end?: number}|null}
 */
function findGeneratedTypedefJsDoc(comments = []) {
  return comments.find(comment => comment.value.includes('@generated') && parseJSDoc(comment.value)) || null;
}

/**
 * @param {Array<{type: string, value: string, start?: number, end?: number}>} comments
 * @param {string} componentName
 * @param {string} typeSuffix
 * @returns {Array<{type: string, value: string, start?: number, end?: number}>}
 */
function findGeneratedCompanionJsDocs(comments, componentName, typeSuffix) {
  const typeName = getPropsTypeName(componentName, typeSuffix);

  return comments.filter(comment => {
    return comment.value.includes('@type') && comment.value.includes(typeName);
  });
}

/**
 * @param {Set<string>} typeNames
 * @param {string} componentName
 * @param {object} options
 * @returns {boolean}
 */
function hasExistingPropsType(typeNames, componentName, options) {
  return typeNames.has(getPropsTypeName(componentName, options.typeSuffix));
}

/**
 * @param {Set<string>} typeNames
 * @param {string} componentName
 * @param {object} options
 */
function markPropsTypeAsExisting(typeNames, componentName, options) {
  typeNames.add(getPropsTypeName(componentName, options.typeSuffix));
}

/**
 * @param {string} propName
 * @returns {string}
 */
function normalizeGeneratedPropName(propName) {
  if (propName === '[x: string]') {
    return '...rest';
  }

  return String(propName || '').replace(/^\[|\]$/g, '');
}

/**
 * @param {string} type
 * @returns {string}
 */
function normalizeGeneratedPropType(type) {
  return type === 'AutoGen' ? '*' : type;
}

/**
 * @param {string} commentValue
 * @param {string} componentName
 * @returns {{name: string, props: Array<{name: string, type: string, spread?: boolean}>, hasSpreadProps: boolean}|null}
 */
function parseGeneratedTypedefInfo(commentValue, componentName) {
  const parsedDoc = parseJSDoc(commentValue);
  if (!parsedDoc) {
    return null;
  }

  const props = [];
  let hasSpreadProps = false;

  parsedDoc.props.forEach(prop => {
    const normalizedName = normalizeGeneratedPropName(prop.name);
    if (!normalizedName) return;

    if (normalizedName.startsWith('...')) {
      hasSpreadProps = true;
      return;
    }

    props.push({
      name: normalizedName,
      type: normalizeGeneratedPropType(prop.type)
    });
  });

  if (commentValue.includes('[x: string]:')) {
    hasSpreadProps = true;
  }

  return {
    name: componentName,
    props,
    hasSpreadProps
  };
}

/**
 * @param {string[]} props
 * @param {boolean} hasSpreadProps
 * @returns {string[]}
 */
function getPropsForGeneratedJSDocUpdate(props, hasSpreadProps) {
  const normalizedProps = props.map(prop => {
    return prop.startsWith('...') ? prop.slice(3) : prop;
  });

  if (hasSpreadProps && !props.some(prop => prop.startsWith('...'))) {
    normalizedProps.push('[x: string]');
  }

  return normalizedProps;
}

/**
 * @param {object} state
 * @param {number} start
 * @param {number} end
 * @param {string} text
 */
function queueReplace(state, start, end, text) {
  state.modifications.push({ type: 'remove', start, end });
  state.modifications.push({ type: 'insert', start, text });
}

/**
 * @param {object} state
 * @param {Array<{type: string, value: string, start?: number, end?: number}>} comments
 */
function queueRemoveComments(state, comments) {
  const seen = new Set();

  comments.forEach(comment => {
    if (
      typeof comment.start !== 'number' ||
      typeof comment.end !== 'number' ||
      seen.has(comment.start)
    ) {
      return;
    }

    seen.add(comment.start);
    state.modifications.push({
      type: 'remove',
      start: comment.start,
      end: comment.end
    });
  });
}

/**
 * @param {object} state
 * @param {object} insertionNode
 * @param {ComponentInfo} componentInfo
 */
function queueComponentOutput(state, insertionNode, componentInfo) {
  const options = state.options;
  const leadingJSDocs = getLeadingJSDocs(insertionNode.leadingComments || []);
  const firstJSDoc = leadingJSDocs[0] || null;
  const quickGenJSDoc = findQuickGenJsDoc(leadingJSDocs);
  const generatedTypedefJSDoc = findGeneratedTypedefJsDoc(leadingJSDocs);
  const existingJSDoc = quickGenJSDoc || generatedTypedefJSDoc || firstJSDoc;
  const quickGenInfo = quickGenJSDoc ? parseQuickGenJsDoc(quickGenJSDoc.value) : null;
  const generatedTypedefInfo = generatedTypedefJSDoc
    ? parseGeneratedTypedefInfo(generatedTypedefJSDoc.value, componentInfo.name)
    : null;
  const analyzedInfo = {
    name: componentInfo.name,
    props: Array.from(componentInfo.props),
    hasSpreadProps: componentInfo.hasSpreadProps
  };
  const infoForType = quickGenInfo || generatedTypedefInfo || analyzedInfo;
  const textParts = [];

  if (
    shouldGenerateTsType(options) &&
    infoForType &&
    !hasExistingPropsType(state.existingTypeNames, infoForType.name, options)
  ) {
    textParts.push(generateTsType(
      infoForType.name,
      infoForType.props,
      infoForType.hasSpreadProps,
      {
        typeSuffix: options.typeSuffix,
        exportTypes: options.exportTypes
      }
    ));
    markPropsTypeAsExisting(state.existingTypeNames, infoForType.name, options);
  }

  if (
    generatedTypedefJSDoc &&
    options.update &&
    shouldGenerateJsDoc(options) &&
    typeof generatedTypedefJSDoc.start === 'number' &&
    typeof generatedTypedefJSDoc.end === 'number'
  ) {
    const parsedDoc = parseJSDoc(generatedTypedefJSDoc.value);
    if (parsedDoc) {
      updateParsedJSDoc(
        parsedDoc,
        getPropsForGeneratedJSDocUpdate(
          Array.from(componentInfo.props),
          componentInfo.hasSpreadProps
        )
      );
      queueReplace(
        state,
        generatedTypedefJSDoc.start,
        generatedTypedefJSDoc.end,
        serializeJSDoc(parsedDoc)
      );
    }
  } else if (shouldGenerateJsDoc(options) && !existingJSDoc) {
    textParts.push(generateJsDoc(
      componentInfo.name,
      Array.from(componentInfo.props),
      componentInfo.hasSpreadProps,
      componentInfo.paramName
    ));
  }

  if (
    existingJSDoc &&
    (quickGenInfo || generatedTypedefInfo) &&
    options.convertJsDocToType &&
    !options.keepJsDoc
  ) {
    const docsToRemove = [existingJSDoc];
    if (generatedTypedefJSDoc) {
      docsToRemove.push(
        ...findGeneratedCompanionJsDocs(
          leadingJSDocs,
          componentInfo.name,
          options.typeSuffix
        )
      );
    }
    queueRemoveComments(state, docsToRemove);
  }

  if (textParts.length === 0) {
    return;
  }

  const start = existingJSDoc && typeof existingJSDoc.start === 'number'
    ? existingJSDoc.start
    : insertionNode.start;

  if (typeof start === 'number') {
    const generatedText = textParts.join('\n\n');
    const hasOnlyTypeOutput = textParts.length === 1 && /^\s*(export\s+)?type\s/.test(generatedText);

    state.modifications.push({
      type: 'insert',
      start,
      text: `${generatedText}${hasOnlyTypeOutput ? '\n\n' : '\n'}`
    });
  }
}

/**
 * @type {import('@babel/core').PluginObj}
 */
function reactJsDocPlugin(pluginOptions = {}) {
  const options = normalizeGenerateDocsOptions(pluginOptions);

  return {
    pre() {
      this.modifications = [];
      this.existingTypeNames = new Set();
      this.options = options;
    },
    visitor: {
      Program: {
        enter(path) {
          path.traverse({
            TSTypeAliasDeclaration: (typePath) => {
              if (typePath.node.id?.name) {
                this.existingTypeNames.add(typePath.node.id.name);
              }
            },
            TSInterfaceDeclaration: (interfacePath) => {
              if (interfacePath.node.id?.name) {
                this.existingTypeNames.add(interfacePath.node.id.name);
              }
            }
          });
        }
      },

      CallExpression(path) {
        const callee = path.node.callee;
        if (
          callee.type !== 'Identifier' ||
          (callee.name !== 'memo' && callee.name !== 'forwardRef')
        ) {
          return;
        }

        const wrappedFn = path.node.arguments[0];
        if (!wrappedFn) return;
        if (!isReactComponent(wrappedFn)) return;
        if (isInsideAnotherReactComponent(path)) return;

        const declaratorPath = path.findParent(parentPath => parentPath.isVariableDeclarator());
        if (!declaratorPath) return;

        const declarationPath = declaratorPath.parentPath;
        let insertionNode;
        if (
          declarationPath.parentPath &&
          declarationPath.parentPath.isExportNamedDeclaration()
        ) {
          insertionNode = declarationPath.parentPath.node;
        } else if (declarationPath.isVariableDeclaration()) {
          insertionNode = declarationPath.node;
        }
        if (!insertionNode) return;

        const componentName = declaratorPath.node.id.type === 'Identifier'
          ? declaratorPath.node.id.name
          : `AnonymousComponent_${Date.now()}`;
        const componentInfo = {
          name: componentName,
          props: new Set(),
          hasSpreadProps: false,
          paramName: 'props'
        };

        analyzeComponent(path.get('arguments.0'), componentInfo);
        queueComponentOutput(this, insertionNode, componentInfo);
      },

      FunctionDeclaration(path) {
        if (path.findParent((parentPath) => parentPath.isExportDefaultDeclaration())) return;
        if (!isReactComponent(path.node)) return;
        if (isInsideAnotherReactComponent(path)) return;
        if (!path.node.id) return;

        const componentName = path.node.id.name;
        const componentInfo = {
          name: componentName,
          props: new Set(),
          hasSpreadProps: false,
          paramName: 'props'
        };

        analyzeComponent(path, componentInfo);

        let insertionNode = path.node;
        if (path.parentPath && path.parentPath.isExportNamedDeclaration()) {
          insertionNode = path.parentPath.node;
        }

        queueComponentOutput(this, insertionNode, componentInfo);
      },

      ArrowFunctionExpression(path) {
        if (path.findParent((parentPath) => parentPath.isExportDefaultDeclaration())) return;
        if (!isReactComponent(path.node)) return;
        if (isInsideAnotherReactComponent(path)) return;

        const declaratorPath = path.findParent(parentPath => parentPath.isVariableDeclarator());
        if (!declaratorPath) return;

        const declarationPath = declaratorPath.parentPath;
        let insertionNode;

        if (declarationPath.parentPath && declarationPath.parentPath.isExportNamedDeclaration()) {
          insertionNode = declarationPath.parentPath.node;
        } else if (declarationPath.isVariableDeclaration()) {
          insertionNode = declarationPath.node;
        }

        if (!insertionNode) return;

        const componentName = declaratorPath.node.id.type === 'Identifier'
          ? declaratorPath.node.id.name
          : `AnonymousComponent_${Date.now()}`;
        const componentInfo = {
          name: componentName,
          props: new Set(),
          hasSpreadProps: false,
          paramName: 'props'
        };

        analyzeComponent(path, componentInfo);
        queueComponentOutput(this, insertionNode, componentInfo);
      },

      ExportDefaultDeclaration(path) {
        const decl = path.node.declaration;
        if (
          decl.type !== 'ArrowFunctionExpression' &&
          decl.type !== 'FunctionDeclaration' &&
          decl.type !== 'FunctionExpression'
        ) {
          return;
        }

        if (!isReactComponent(decl)) return;
        if (isInsideAnotherReactComponent(path.get('declaration'))) return;

        const componentName = decl.id ? decl.id.name : 'DefaultExportComponent';
        const componentInfo = {
          name: componentName,
          props: new Set(),
          hasSpreadProps: false,
          paramName: 'props'
        };

        analyzeComponent(path.get('declaration'), componentInfo);
        queueComponentOutput(this, path.node, componentInfo);
      }
    },
    post(file) {
      file.metadata.modifications = this.modifications;
      file.metadata.insertionPoints = this.modifications
        .filter(modification => modification.type === 'insert');
    }
  };
}

/**
 * @param {string} code
 * @param {number} end
 * @returns {number}
 */
function extendRemovalEnd(code, end) {
  if (code[end] === '\r' && code[end + 1] === '\n') {
    return end + 2;
  }

  if (code[end] === '\n') {
    return end + 1;
  }

  return end;
}

async function generateDocs(directory, options = {}) {
  try {
    const generateOptions = normalizeGenerateDocsOptions(options);
    const globPattern = createGlobPattern(generateOptions.extensions);

    console.log('🔍 Scanning directory:', directory);
    const files = glob.sync(globPattern, {
      cwd: directory,
      absolute: true
    });

    if (files.length === 0) {
      console.log('⚠️ No React source files found');
      return;
    }

    console.log(`📝 Found ${files.length} files...`);

    let processedFiles = 0;
    let modifiedFiles = 0;
    let errorFiles = 0;
    let skippedFiles = 0;

    for (const file of files) {
      const code = fs.readFileSync(file, 'utf-8');
      try {
        const result = await babel.transformAsync(code, {
          filename: file,
          plugins: [reactJsDocPlugin(generateOptions)],
          parserOpts: {
            plugins: ['jsx', 'typescript'],
            sourceType: 'module',
            comments: true,
            tokens: true,
            ranges: true
          },
          babelrc: false,
          configFile: false
        });

        const modifications = result.metadata.modifications || [];
        const insertionPoints = modifications.filter(modification => modification.type === 'insert');
        const removals = modifications.filter(modification => modification.type === 'remove');
        processedFiles++;

        if (modifications.length > 0) {
          console.log(`Found ${modifications.length} modifications in ${file}`);

          removals.sort((a, b) => b.start - a.start);
          insertionPoints.sort((a, b) => b.start - a.start);

          const s = new MagicString(code);

          for (const removal of removals) {
            s.remove(removal.start, extendRemovalEnd(code, removal.end));
          }

          for (const point of insertionPoints) {
            s.prependLeft(point.start, point.text);
          }

          fs.writeFileSync(file, s.toString(), 'utf-8');
          console.log(`✅ Processed: ${file}`);
          modifiedFiles++;
        } else {
          skippedFiles++;
          console.log(`⏭️ Skipped: ${file} (no changes needed)`);
        }
      } catch (err) {
        console.error(`❌ Error processing ${file}:`, err.message);
        errorFiles++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`Total files scanned: ${files.length}`);
    console.log(`Successfully processed: ${processedFiles}`);
    console.log(`Files modified: ${modifiedFiles}`);
    console.log(`Files skipped: ${skippedFiles}`);
    console.log(`Files with errors: ${errorFiles}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

module.exports = {
  generateDocs,
  reactJsDocPlugin
};
