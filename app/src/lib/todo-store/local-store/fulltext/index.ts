import { stemTokens } from './stemmer';
import { removeStopwords } from './stopwords';
import { createTokens } from './tokens';

function convertTextToFulltextSearchTokens(text: string): string[] {
  let tokens = createTokens(text.toLowerCase());
  tokens = removeStopwords(tokens);
  tokens = stemTokens(tokens);

  return Array.from(
    new Set(tokens),
  );
}

export { convertTextToFulltextSearchTokens };
