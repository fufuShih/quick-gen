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

    // Create test files if they don't exist
    if (!fs.existsSync(path.join(fixturesDir, 'Button.jsx'))) {
      fs.writeFileSync(
        path.join(fixturesDir, 'Button.jsx'),
        `const Button = ({ onClick, children, disabled }) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;`
      );
    }

    // Create expected output
    if (!fs.existsSync(path.join(expectedDir, 'Button.jsx'))) {
      fs.writeFileSync(
        path.join(expectedDir, 'Button.jsx'),
        `/**
 * @component Button
 * @description React component
 * @param {Object} props Component props
 * @param {*} props.onClick - onClick prop
 * @param {*} props.children - children prop
 * @param {*} props.disabled - disabled prop
 * @returns {JSX.Element} React component
 */
const Button = ({ onClick, children, disabled }) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;`
      );
    }

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

  test('should generate JSDoc for components', async () => {
    console.log('Test directory:', fixturesDir);
    console.log('Files before:', fs.readdirSync(fixturesDir));
    
    await generateDocs(fixturesDir);
    
    console.log('Files after:', fs.readdirSync(fixturesDir));
    
    const files = fs.readdirSync(fixturesDir);
    files.forEach(file => {
      const actual = fs.readFileSync(path.join(fixturesDir, file), 'utf-8');
      const expected = fs.readFileSync(path.join(expectedDir, file), 'utf-8');
      // Normalize line endings
      const normalizedActual = actual.replace(/\r\n/g, '\n');
      const normalizedExpected = expected.replace(/\r\n/g, '\n');
      expect(normalizedActual).toBe(normalizedExpected);
    });
  });
}); 