import { stemTokens } from './stemmer';
import { createTokens } from './tokens';

async function convertTextToFulltextSearchTokens(text: string): Promise<string[]> {
  let tokens = await createTokens(text.toLowerCase());
  tokens = await removeStopwords(tokens);
  tokens = stemTokens(tokens);

  return Array.from(
    new Set(tokens),
  );
}

const stopwordsPromise = import('./stopwords').then((mod) => mod.stopwords);

/**
  * Remove stopwords from token array
  * */
async function removeStopwords(tokens: string[]): Promise<string[]> {
  const stopwords = await stopwordsPromise;
  return tokens.filter((token) => {
    const tokenIsStopword = stopwords.includes(token);

    return !tokenIsStopword;
  });
}

export { convertTextToFulltextSearchTokens };
