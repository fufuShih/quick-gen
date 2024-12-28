const { glob } = require('glob');
const path = require('path');
const fs = require('fs');
const { mkdirp } = require('mkdirp');
const createParser = require('./parser');

async function generateKnowledge(dir) {
  const knowledgeDir = path.join(dir, '.knowledge');
  
  // Create .knowledge directory if it doesn't exist
  await mkdirp(knowledgeDir);

  const parser = createParser();
  
  // Find all JS/TS files
  const files = await glob('**/*.{js,jsx,ts,tsx}', {
    ignore: ['node_modules/**', 'dist/**', '.knowledge/**'],
    cwd: dir
  });

  // Parse each file
  for (const file of files) {
    const filePath = path.join(dir, file);
    try {
      parser.parseFile(filePath);
    } catch (error) {
      console.error(`Error parsing ${file}:`, error);
    }
  }

  // Generate and save knowledge
  const knowledge = parser.generateKnowledge();
  
  // Save separate JSON files
  fs.writeFileSync(
    path.join(knowledgeDir, 'fileSymbols.json'),
    JSON.stringify(knowledge.fileSymbols, null, 2)
  );
  
  fs.writeFileSync(
    path.join(knowledgeDir, 'fileImports.json'),
    JSON.stringify(knowledge.fileImports, null, 2)
  );
  
  fs.writeFileSync(
    path.join(knowledgeDir, 'symbolReferences.json'),
    JSON.stringify(knowledge.symbolReferences, null, 2)
  );

  console.log('Knowledge files generated in .knowledge directory');
}

module.exports = {
  generateKnowledge
}; 
