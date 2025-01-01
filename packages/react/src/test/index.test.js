const fs = require('fs');
const path = require('path');
const { generateDocs } = require('../index');

describe('generateDocs', () => {
  const fixturesDir = path.join(__dirname, 'fixtures', 'components');
  const expectedDir = path.join(__dirname, 'fixtures', 'expected');
  const backupDir = path.join(__dirname, 'fixtures', 'backup');

  // Before all tests, ensure directories exist
  beforeAll(() => {
    // Create directories if they don't exist
    [fixturesDir, expectedDir, backupDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Test files mapping
    const testFiles = {
      'Button2.jsx': {
        content: `const Button2 = (props) => {
  const { onClick, children, disabled } = props;

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button2;`
      },
      'Button3.jsx': {
        content: `const Button3 = ({ onClick, children, disabled, ...props }) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button3;`
      },
      'Button4.jsx': {
        content: `const Button4 = (props) => {
  const { onClick, children, disabled, ...rest } = props;

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button4;`
      }
    };

    // Create test files
    Object.entries(testFiles).forEach(([file, { content }]) => {
      const componentPath = path.join(fixturesDir, file);
      if (!fs.existsSync(componentPath)) {
        fs.writeFileSync(componentPath, content);
      }
    });

    // Create backup
    const files = fs.readdirSync(fixturesDir);
    files.forEach(file => {
      const content = fs.readFileSync(path.join(fixturesDir, file), 'utf-8');
      fs.writeFileSync(path.join(backupDir, file), content);
    });
  });

  // After each test, restore from backup
  afterEach(() => {
    const files = fs.readdirSync(backupDir);
    files.forEach(file => {
      const content = fs.readFileSync(path.join(backupDir, file), 'utf-8');
      fs.writeFileSync(path.join(fixturesDir, file), content);
    });
  });

  // After all tests, cleanup
  afterAll(() => {
    fs.rmSync(backupDir, { recursive: true });
  });

  const testCases = [
    {
      name: 'basic arrow function component',
      file: 'Button.jsx',
      description: 'Basic arrow function component with destructured props'
    },
    {
      name: 'arrow function with props object',
      file: 'Button2.jsx',
      description: 'Arrow function using props object with destructuring'
    },
    {
      name: 'arrow function with spread props',
      file: 'Button3.jsx',
      description: 'Arrow function with spread operator in props'
    },
    {
      name: 'arrow function with rest props',
      file: 'Button4.jsx',
      description: 'Arrow function with rest parameter in props'
    },
    {
      name: 'memo component',
      file: 'MemoButton.jsx',
      description: 'React memo component'
    },
    {
      name: 'function declaration component',
      file: 'FunctionButton.jsx',
      description: 'Function declaration component'
    },
    {
      name: 'component with existing JSDoc',
      file: 'ButtonWithJSDoc.jsx',
      description: 'Component that already has JSDoc with @component'
    },
    {
      name: 'multiple components file',
      file: 'MultipleComponents.jsx',
      description: 'File with multiple components, some with existing JSDoc'
    },
    {
      name: 'component with const functions',
      file: 'ButtonWithConstFunction.jsx',
      description: 'Component with internal const functions'
    }
  ];

  testCases.forEach(({ name, file, description }) => {
    test(`should generate JSDoc for ${name} (${description})`, async () => {
      const initialContent = fs.readFileSync(path.join(fixturesDir, file), 'utf-8');
      
      await generateDocs(fixturesDir);
      
      const actual = fs.readFileSync(path.join(fixturesDir, file), 'utf-8');
      const expected = fs.readFileSync(path.join(expectedDir, file), 'utf-8');
      
      // For components with existing JSDoc, content should remain unchanged
      if (name === 'component with existing JSDoc') {
        expect(actual).toBe(initialContent);
      } else {
        // Normalize line endings
        const normalizedActual = actual.replace(/\r\n/g, '\n');
        const normalizedExpected = expected.replace(/\r\n/g, '\n');
        
        expect(normalizedActual).toBe(normalizedExpected);
      }
    });
  });
}); 
