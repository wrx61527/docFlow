const fs = require('fs');
const path = require('path');
const Category = require('../models/Category');

/**
 * Funkcja normalizująca tekst do tokenów
 * - Konwertuje na małe litery
 * - Usuwa znaki specjalne
 * - Dzieli na słowa
 * - Filtruje słowa poniżej 4 znaków
 */
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // Usuwanie znaków specjalnych (Unicode-safe)
    .split(/\s+/)
    .filter(word => word.length >= 4); // Eliminacja krótkich słów (szum)
}

/**
 * Główna funkcja klasyfikacji dokumentów
 * 
 * Algorytm:
 * 1. Pobiera wszystkie kategorie z bazą danych
 * 2. Normalizuje nazwę pliku i (jeśli .txt) zawartość
 * 3. Porównuje tokeny z słowami kluczowymi każdej kategorii
 * 4. Przyznaje punkty: +2 dla dokładnego trafienia, +1 dla częściowego
 * 5. Przypisuje dokument do kategorii z najwyższym wynikiem
 * 
 * @param {string} filePath - Ścieżka do pliku na dysku
 * @param {string} filename - Nazwa pliku
 * @returns {Promise<string>} - Nazwa przydzielonej kategorii
 */
module.exports = async function classify(filePath, filename) {
  try {
    // Pobranie wszystkich kategorii z bazy danych
    const categories = await Category.find();

    // Normalizacja nazwy pliku do tokenów
    let tokens = normalize(filename);

    // Jeśli plik jest tekstowy, analiza również jego zawartości
    if (filePath && filePath.endsWith('.txt') && fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        tokens = tokens.concat(normalize(content));
      } catch (err) {
        console.warn(`Nie można odczytać zawartości pliku ${filePath}:`, err.message);
      }
    }

    // Inicjalizacja najlepszego dopasowania
    let bestMatch = { 
      name: 'Nieprzypisane', 
      score: 0 
    };

    // Iteracja przez każdą kategorię
    categories.forEach(category => {
      let categoryScore = 0;

      // Iteracja przez słowa kluczowe kategorii
      category.keywords.forEach(keyword => {
        const normalizedKeyword = keyword.toLowerCase();

        // Pominięcie krótkich słów kluczowych (szum)
        if (normalizedKeyword.length < 4) return;

        // Iteracja przez tokeny dokumentu
        tokens.forEach(token => {
          if (token === normalizedKeyword) {
            // Dokładne trafienie - wyższa waga
            categoryScore += 2;
          } else if (token.includes(normalizedKeyword)) {
            // Częściowe trafienie (zawieranie) - niższa waga
            categoryScore += 1;
          }
        });
      });

      // Aktualizacja najlepszego dopasowania
      if (categoryScore > bestMatch.score) {
        bestMatch = { 
          name: category.name, 
          score: categoryScore 
        };
      }
    });

    return bestMatch.name;
  } catch (error) {
    console.error('Błąd w funkcji klasyfikacji:', error);
    return 'Nieprzypisane';
  }
};