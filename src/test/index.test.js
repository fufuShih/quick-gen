const fs = require('fs');
const path = require('path');
const { generateDocs } = require('../index');

describe('generateDocs', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');
  const backupDir = path.join(__dirname, 'fixtures-backup');

  // Before all tests, create backup of fixtures
  beforeAll(() => {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    const files = fs.readdirSync(fixturesDir);
    files.forEach(file => {
      if (file.endsWith('.jsx')) {
        const content = fs.readFileSync(path.join(fixturesDir, file), 'utf-8');
        fs.writeFileSync(path.join(backupDir, file), content);
      }
    });
  });

  // After each test, restore fixtures from backup
  afterEach(() => {
    const files = fs.readdirSync(backupDir);
    files.forEach(file => {
      const content = fs.readFileSync(path.join(backupDir, file), 'utf-8');
      fs.writeFileSync(path.join(fixturesDir, file), content);
    });
  });

  // After all tests, remove backup directory
  afterAll(() => {
    fs.rmSync(backupDir, { recursive: true });
  });

  test('should generate JSDoc for regular component', async () => {
    await generateDocs(fixturesDir);
    
    const content = fs.readFileSync(
      path.join(fixturesDir, 'Button.jsx'),
      'utf-8'
    );

    expect(content).toContain('@component Button');
    expect(content).toContain('@param {Object} props');
    expect(content).toContain('props.onClick');
    expect(content).toContain('props.children');
    expect(content).toContain('props.disabled');
  });

  test('should generate JSDoc for memo component', async () => {
    await generateDocs(fixturesDir);
    
    const content = fs.readFileSync(
      path.join(fixturesDir, 'MemoComponent.jsx'),
      'utf-8'
    );

    expect(content).toContain('@component MemoComponent');
    expect(content).toContain('props.text');
  });

  test('should generate JSDoc for export default component', async () => {
    await generateDocs(fixturesDir);
    
    const content = fs.readFileSync(
      path.join(fixturesDir, 'ExportDefaultComponent.jsx'),
      'utf-8'
    );

    expect(content).toContain('@component ExportDefaultComponent');
    expect(content).toContain('props.title');
    expect(content).toContain('props.children');
  });

  test('should not duplicate JSDoc if already exists', async () => {
    // First generation
    await generateDocs(fixturesDir);
    
    // Second generation
    await generateDocs(fixturesDir);
    
    const content = fs.readFileSync(
      path.join(fixturesDir, 'Button.jsx'),
      'utf-8'
    );

    // Count occurrences of @component
    const matches = content.match(/@component/g) || [];
    expect(matches.length).toBe(1);
  });

  test('should maintain proper indentation', async () => {
    await generateDocs(fixturesDir);
    
    const content = fs.readFileSync(
      path.join(fixturesDir, 'Button.jsx'),
      'utf-8'
    );

    const lines = content.split('\n');
    const componentLine = lines.find(line => line.includes('const Button'));
    const jsDocLines = lines.slice(0, lines.indexOf(componentLine));

    // Check if JSDoc has same indentation as component
    const componentIndent = componentLine.match(/^\s*/)[0];
    jsDocLines.forEach(line => {
      if (line.trim()) {
        expect(line).toMatch(new RegExp(`^${componentIndent}\\s*\\*`));
      }
    });
  });
}); 