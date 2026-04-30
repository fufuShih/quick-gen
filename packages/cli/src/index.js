const { generateDocs } = require('@quick-gen/react');
const { generateKnowledge } = require('@quick-gen/knowledge');

exports.generateDocs = (dir, options) => {
  return generateDocs(dir, options);
};

exports.generateKnowledge = (dir) => {
  return generateKnowledge(dir);
}; 
