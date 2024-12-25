module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  testMatch: ['**/src/test/**/*.test.js'],
  moduleFileExtensions: ['js', 'jsx']
}; 