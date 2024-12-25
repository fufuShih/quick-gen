describe('genkit CLI', () => {
  test('should be defined', () => {
    const { generateDocs } = require('../index');
    expect(generateDocs).toBeDefined();
  });
}); 