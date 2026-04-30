const fs = require('fs');
const path = require('path');
const os = require('os');
const { generateDocs } = require('../index');

describe('generateDocs', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const componentsDir = path.join(fixturesDir, 'components');
  const expectedDir = path.join(fixturesDir, 'expected');
  
  // Store original content of component files
  let originalContents = new Map();

  // Before all tests, store original content
  beforeAll(() => {
    const files = fs.readdirSync(componentsDir);
    files.forEach(file => {
      const content = fs.readFileSync(path.join(componentsDir, file), 'utf-8');
      originalContents.set(file, content);
    });
  });

  // After each test, restore original content
  afterEach(() => {
    for (const [file, content] of originalContents) {
      fs.writeFileSync(path.join(componentsDir, file), content);
    }
    jest.restoreAllMocks(); // Restore all mocks after each test
  });

  // Before each test, mock Date.now
  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000); // Mock Date.now()
  });

  const testCases = [
    {
      name: 'basic component',
      file: 'Button.jsx',
      description: 'Basic arrow function component with destructured props'
    },
    {
      name: 'component with props object',
      file: 'Button2.jsx',
      description: 'Component using props object with destructuring'
    },
    {
      name: 'component with spread props',
      file: 'Button3.jsx',
      description: 'Component with spread operator in props'
    },
    {
      name: 'component with rest props',
      file: 'Button4.jsx',
      description: 'Component with rest parameter in props'
    },
    {
      name: 'component with const function',
      file: 'ButtonWithConstFunction.jsx',
      description: 'Component with a const function'
    },
    {
      name: 'component with function',
      file: 'FunctionButton.jsx',
      description: 'Component with a function'
    },
    // FIXME: memo component is not working
    {
      name: 'memo component',
      file: 'MemoButton.jsx',
      description: 'React memo component'
    },
    {
      name: 'component with function',
      file: 'ComponentWithFunction.jsx',
      description: 'Component with a nested function, which should not get JSDoc'
    },
    {
      name: 'component with custom parameter name',
      file: 'ComponentParameterName.jsx',
      description: 'Component with a parameter name different from "props"'
    },
    {
      name: 'anonymous export default component',
      file: 'ComponentWithAnoymous.jsx',
      description: 'Component with an anonymous export default function'
    },
    {
      name: 'component with conditional rendering',
      file: 'ComponentWithConditional.jsx',
      description: 'Component with conditional rendering'
    },
    {
      name: 'component with conditional rendering',
      file: 'ComponentWithConditional2.jsx',
      description: 'Component with conditional rendering'
    },
    {
      name: 'component with conditional rendering',
      file: 'ComponentWithConditional3.jsx',
      description: 'Component with conditional rendering'
    },
    {
      name: 'component with default function',
      file: 'ComponentDefaultFunction.jsx',
      description: 'Component with default function'
    },
    {
      name: 'typescript component',
      file: 'TypeScriptButton.tsx',
      description: 'Component in a TSX file'
    },
  ];

  testCases.forEach(({ name, file, description }) => {
    it(`should generate JSDoc for ${name}: ${description}`, async () => {
      // Run the generator
      await generateDocs(componentsDir);
      
      // Read the generated and expected content
      const actual = fs.readFileSync(path.join(componentsDir, file), 'utf-8');
      const expected = fs.readFileSync(path.join(expectedDir, file), 'utf-8');
      
      // Normalize line endings for comparison
      const normalizedActual = actual.replace(/\r\n/g, '\n');
      const normalizedExpected = expected.replace(/\r\n/g, '\n');
      
      // Compare the results
      expect(normalizedActual).toBe(normalizedExpected);
    });
  });

  it('should not modify files with existing JSDoc', async () => {
    const file = 'ButtonWithJSDoc.jsx';
    const initialContent = fs.readFileSync(path.join(componentsDir, file), 'utf-8');
    
    await generateDocs(componentsDir);
    
    const actual = fs.readFileSync(path.join(componentsDir, file), 'utf-8');
    expect(actual).toBe(initialContent);
  });

  it('should handle multiple components in a single file', async () => {
    const file = 'MultipleComponents.jsx';
    
    await generateDocs(componentsDir);
    
    const actual = fs.readFileSync(path.join(componentsDir, file), 'utf-8');
    const expected = fs.readFileSync(path.join(expectedDir, file), 'utf-8');
    
    const normalizedActual = actual.replace(/\r\n/g, '\n');
    const normalizedExpected = expected.replace(/\r\n/g, '\n');
    
    expect(normalizedActual).toBe(normalizedExpected);
  });

  it('should generate TypeScript props types when output is type', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quick-gen-type-'));
    const file = path.join(tempDir, 'TypeOutputButton.tsx');

    fs.writeFileSync(file, `const TypeOutputButton = ({ label, disabled, ...rest }) => {
  return (
    <button disabled={disabled} {...rest}>
      {label}
    </button>
  );
};
`, 'utf-8');

    await generateDocs(tempDir, {
      extensions: ['tsx'],
      output: 'type'
    });

    const actual = fs.readFileSync(file, 'utf-8');

    expect(actual).toContain(`type TypeOutputButtonProps = {
  label?: any;
  disabled?: any;
  [key: string]: any;
};

const TypeOutputButton`);
  });

  it('should convert quick-gen JSDoc into TypeScript props types', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quick-gen-convert-'));
    const file = path.join(tempDir, 'ExistingDocButton.tsx');

    fs.writeFileSync(file, `/**
 * @generated 1700000000000
 * @component ExistingDocButton
 *
 * @param {Object} props Component props
 * @param {string} props.label - Label
 * @param {boolean} props.disabled - Disabled
 * @param {Object} props.rest - [auto generate]
 * @returns {JSX.Element} React component
 */
const ExistingDocButton = ({ label, disabled, ...rest }) => {
  return (
    <button disabled={disabled} {...rest}>
      {label}
    </button>
  );
};
`, 'utf-8');

    await generateDocs(tempDir, {
      extensions: ['tsx'],
      convertJsDocToType: true
    });

    const actual = fs.readFileSync(file, 'utf-8');

    expect(actual).not.toContain('@component ExistingDocButton');
    expect(actual).toContain(`type ExistingDocButtonProps = {
  label?: string;
  disabled?: boolean;
  [key: string]: any;
};

const ExistingDocButton`);
  });
}); 
