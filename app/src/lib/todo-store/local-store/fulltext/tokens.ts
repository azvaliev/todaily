/* eslint-disable no-continue */
// Match all punctuation except '
const punctuationRegExp = /[!"#$%&()*+,-./:;<=>?@[\\]^_`{|}~]/g;

// Match a single quote followed by a non word character
const nonContractionSingleQuoteRegExp = /'\W/;

const expandContractionsLibPromise = import('@stdlib/nlp-expand-contractions').then((res) => res.default);

/**
  * Split text into tokens, like a word but a bit more granular.
* */
async function createTokens(text: string): Promise<string[]> {
  const expandContractions = await expandContractionsLibPromise;
  const tokens: string[] = [];

  let word = '';
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]!;
    const charIsWhitespace = /\s/.test(char);

    if (!charIsWhitespace) {
      word += char;

      // If we are on the last character, treat this like an end of a word
      if (i < text.length - 1) {
        continue;
      }
    }

    // This character is whitespace, which means we are at the end of the "word"
    // Now we need to determine how to break this into tokens
    const newTokens = [word];

    // Expand contractions
    const expanded = expandContractions(word);
    if (expanded.includes(' ')) {
      newTokens.push(...expanded.split(' '));
    }

    for (let j = 0; j < newTokens.length; j += 1) {
      let newToken = newTokens[j]!; // safe to assert because index comes from loop

      newToken = newToken.replace(punctuationRegExp, '');

      newToken = newToken.replace(nonContractionSingleQuoteRegExp, '');

      newToken = newToken.replace(/\s+/, '');

      newTokens[j] = newToken;
    }

    tokens.push(...newTokens);
    word = '';
  }

  return tokens;
}

export { createTokens };
