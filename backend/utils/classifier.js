const fs = require('fs');
const Category = require('../models/Category');

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4); // eliminacja krótkich śmieci
}

module.exports = async function classify(filePath, filename) {
  const categories = await Category.find();

  let tokens = normalize(filename);

  if (filePath.endsWith('.txt')) {
    const content = fs.readFileSync(filePath, 'utf8');
    tokens = tokens.concat(normalize(content));
  }

  let best = { name: 'Nieprzypisane', score: 0 };

  categories.forEach(cat => {
    let score = 0;

    cat.keywords.forEach(keyword => {
      const kw = keyword.toLowerCase();
      if (kw.length < 4) return;

      tokens.forEach(token => {
        if (token === kw) score += 2;        // dokładne trafienie
        else if (token.includes(kw)) score += 1; // słabsze trafienie
      });
    });

    if (score > best.score) {
      best = { name: cat.name, score };
    }
  });

  return best.name;
};
