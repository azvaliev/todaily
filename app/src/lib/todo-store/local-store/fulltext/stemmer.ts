/* eslint-disable */
// SOURCE: https://tartarus.org/martin/PorterStemmer/index.html
// Slightly revised for modern TypeScript syntax

// Porter stemmer in Javascript. Few comments, but it's easy to follow against the rules in the original
// paper, in
//
//  Porter, 1980, An algorithm for suffix stripping, Program, Vol. 14,
//  no. 3, pp 130-137,
//
// see also http://www.tartarus.org/~martin/PorterStemmer

// Release 1 be 'andargor', Jul 2004
// Release 2 (substantially revised) by Christopher McKenzie, Aug 2009

const step2list = {
    "ational" : "ate",
    "tional" : "tion",
    "enci" : "ence",
    "anci" : "ance",
    "izer" : "ize",
    "bli" : "ble",
    "alli" : "al",
    "entli" : "ent",
    "eli" : "e",
    "ousli" : "ous",
    "ization" : "ize",
    "ation" : "ate",
    "ator" : "ate",
    "alism" : "al",
    "iveness" : "ive",
    "fulness" : "ful",
    "ousness" : "ous",
    "aliti" : "al",
    "iviti" : "ive",
    "biliti" : "ble",
    "logi" : "log"
  },

  step3list = {
    "icate" : "ic",
    "ative" : "",
    "alize" : "al",
    "iciti" : "ic",
    "ical" : "ic",
    "ful" : "",
    "ness" : ""
  },

  c = "[^aeiou]",          // consonant
  v = "[aeiouy]",          // vowel
  C = c + "[^aeiouy]*",    // consonant sequence
  V = v + "[aeiou]*",      // vowel sequence

  mgr0 = "^(" + C + ")?" + V + C,               // [C]VC... is m>0
  meq1 = "^(" + C + ")?" + V + C + "(" + V + ")?$",  // [C]VC[V] is m=1
  mgr1 = "^(" + C + ")?" + V + C + V + C,       // [C]VCVC... is m>1
  s_v = "^(" + C + ")?" + v;                   // vowel in stem

function stemmer(token: string) {
  let stem: string;
  let suffix: keyof typeof step2list | keyof typeof step3list;
  let firstch: string;
  let re: RegExp;
  let re2: RegExp;
  let re3: RegExp;
  let re4: RegExp;

  if (token.length < 3) { return token; }

  firstch = token.slice(0,1);
  if (firstch == "y") {
    token = firstch.toUpperCase() + token.slice(1);
  }

  // Step 1a
  re = /^(.+?)(ss|i)es$/;
  re2 = /^(.+?)([^s])s$/;

  if (re.test(token)) { token = token.replace(re,"$1$2"); }
  else if (re2.test(token)) {	token = token.replace(re2,"$1$2"); }

  // Step 1b
  re = /^(.+?)eed$/;
  re2 = /^(.+?)(ed|ing)$/;
  if (re.test(token)) {
    var fp = re.exec(token)!;
    re = new RegExp(mgr0);
    if (re.test(fp[1]!)) {
      re = /.$/;
      token = token.replace(re,"");
    }
  } else if (re2.test(token)) {
    var fp = re2.exec(token)!;
    stem = fp[1]!;
    re2 = new RegExp(s_v);
    if (re2.test(stem)) {
      token = stem;
      re2 = /(at|bl|iz)$/;
      re3 = new RegExp("([^aeiouylsz])\\1$");
      re4 = new RegExp("^" + C + v + "[^aeiouwxy]$");
      if (re2.test(token)) {	token = token + "e"; }
      else if (re3.test(token)) { re = /.$/; token = token.replace(re,""); }
      else if (re4.test(token)) { token = token + "e"; }
    }
  }

  // Step 1c
  re = /^(.+?)y$/;
  if (re.test(token)) {
    var fp = re.exec(token)!;
    stem = fp[1]!;
    re = new RegExp(s_v);
    if (re.test(stem)) { token = stem + "i"; }
  }

  // Step 2
  re = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
  if (re.test(token)) {
    var fp = re.exec(token)!;
    stem = fp[1]!;
    suffix = fp[2]! as keyof typeof step2list;
    re = new RegExp(mgr0);
    if (re.test(stem)) {
      token = stem + step2list[suffix];
    }
  }

  // Step 3
  re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
  if (re.test(token)) {
    var fp = re.exec(token)!;
    stem = fp[1]!;
    suffix = fp[2]! as keyof typeof step3list;
    re = new RegExp(mgr0);
    if (re.test(stem)) {
      token = stem + step3list[suffix];
    }
  }

  // Step 4
  re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
  re2 = /^(.+?)(s|t)(ion)$/;
  if (re.test(token)) {
    var fp = re.exec(token)!;
    stem = fp[1]!;
    re = new RegExp(mgr1);
    if (re.test(stem)) {
      token = stem;
    }
  } else if (re2.test(token)) {
    var fp = re2.exec(token)!;
    stem = fp[1]! + fp[2]!;
    re2 = new RegExp(mgr1);
    if (re2.test(stem)) {
      token = stem;
    }
  }

  // Step 5
  re = /^(.+?)e$/;
  if (re.test(token)) {
    var fp = re.exec(token)!;
    stem = fp[1]!;
    re = new RegExp(mgr1);
    re2 = new RegExp(meq1);
    re3 = new RegExp("^" + C + v + "[^aeiouwxy]$");
    if (re.test(stem) || (re2.test(stem) && !(re3.test(stem)))) {
      token = stem;
    }
  }

  re = /ll$/;
  re2 = new RegExp(mgr1);
  if (re.test(token) && re2.test(token)) {
    re = /.$/;
    token = token.replace(re,"");
  }

  // and turn initial Y back to y

  if (firstch == "y") {
    token = firstch.toLowerCase() + token.slice(1);
  }

  return token;
}

function stemTokens(tokens: string[]) {
  return tokens.map((t) => stemmer(t));
}

export { stemTokens };
