const { generateDocs } = require('@quick-gen/react');
const { generateKnowledge } = require('@quick-gen/knowledge');

exports.generateDocs = (dir) => {
  return generateDocs(dir);
};

exports.generateKnowledge = (dir) => {
  return generateKnowledge(dir);
}; 
