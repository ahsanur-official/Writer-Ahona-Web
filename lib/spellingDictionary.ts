// Comprehensive Bengali & English Dictionary and Validation Engine
// Designed for Ahona Islam Literary Platform

import { BENGALI_ROOTS } from "./bengaliWordsList";
import { ENGLISH_WORDS } from "./englishWordsList";

// Build fast lookup Sets
const BENGALI_SET = new Set<string>(BENGALI_ROOTS);
const ENGLISH_SET = new Set<string>(ENGLISH_WORDS.map((w) => w.toLowerCase()));

// Bengali inflectional suffixes (case endings, plurals, determiners, verbal inflections, clitics)
const BENGALI_SUFFIXES = [
  // Multi-character case, relational & adverbial postpositions
  "দ্বারা", "দিয়ে", "হতে", "থেকে", "চেয়ে", "ছাড়া", "বিনা", "সহিত", "সহ", "পূর্বক", "মূলক",
  "ভাবে", "বিহীন", "যুক্ত", "পূর্ণ", "বিশিষ্ট", "ময়", "কালীন", "ভিত্তিক", "যোগ্য", "জনক", "শীল",
  "সমূহ", "বর্গ", "মণ্ডল", "গণ",
  // Plurals & determiners
  "গুলো", "গুলি", "দেরকে", "দের", "খান", "খানা", "খানি", "টুকু", "টুকুন", "টি", "টা", "রা",
  // Continuous & past verbal inflections
  "তেছিলাম", "তেছিলেন", "তেছিলে", "তেছিল", "তেছিস", "তেছেন", "তেছে", "তেছ", "তেছি",
  "ছিলেন", "ছিলাম", "ছিলে", "ছিল",
  "লেন", "লাম", "লে", "ল", "লো", "ছেন", "ছে", "ছিস", "ছি", "ছ",
  "বেন", "বে", "বি", "ব", "বো", "তেন", "তাম", "তিস",
  "বারই", "বার", "কার",
  // Single/double character case endings & clitics (including vowel sign kar-based inflections)
  "গুলোতে", "গুলিতে", "গুলোতেই", "টিতে", "টাতে", "টিতেও", "টাতেও",
  "য়ের", "এর", "কে", "তে", "রে", "য়ে", "র", "এ", "য়",
  "ের", "েও", "েই", "ে", "ায়", "ায়ের", "াতে", "িতে", "ীতে",
  "ও", "ই"
];

// Common Bengali verbal root variations:
const BENGALI_VERBAL_STEMS = new Set([
  "কর", "করে", "করা", "বল", "বলে", "বলা", "চল", "চলে", "চলা", "বস", "বসে", "বসা",
  "শুন", "শুনে", "শোনা", "লিখ", "লিখে", "লেখা", "পড়", "পড়ে", "পড়া", "দেখ", "দেখে", "দেখা",
  "যা", "যায়", "যেতে", "গিয়ে", "গেলে", "আয়", "আসে", "আসা", "আসতে", "এসে",
  "খা", "খায়", "খেয়ে", "খাওয়া", "পা", "পায়", "পেয়ে", "পাওয়া", "দে", "দেয়", "দিয়ে", "দেওয়া",
  "নে", "নেয়", "নিয়ে", "নেওয়া", "থাক", "থাকে", "থাকা", "ওঠ", "ওঠে", "ওঠা", "হাঁট", "হাঁটে",
  "দৌড়", "দৌড়ে", "ভাব", "ভেবে", "ভাবা", "হাস", "হেসে", "হাসা", "কাঁদ", "কেঁদে", "কাঁদা",
  "ডাক", "ডেকে", "রাখ", "রেখে", "রাখা", "কাট", "কেটে", "কাটা", "বাঁধ", "বেঁধে", "বাঁধা",
  "ভাঙ", "ভেঙে", "ভাঙা", "ভাস", "ভেসে", "ডোব", "ডুবে", "উড়", "উড়ে", "ফের", "ফিরে", "ফেরা",
  "পাঠা", "পাঠিয়ে", "শিখ", "শিখে", "শেখা", "বোঝ", "বুঝে", "বোঝা", "জান", "জেনে", "জানা",
  "চিন", "চিনে", "চেনা", "লুক", "লুকিয়ে", "খোঁজ", "খুঁজে", "খোঁজা", "হার", "হারিয়ে", "হারা",
  "জাগ", "জেগে", "জাগা", "ঘুম", "ঘুমে", "ঘুমিয়ে", "মরা", "মরে", "বাঁচ", "বেঁচে", "বাঁচা",
  "চাও", "চেয়ে", "চাওয়া", "লাগ", "লেগে", "লাগা", "ছুট", "ছুটে", "ছুটা", "পড়", "পড়ে"
]);

// 1. Bengali Phonotactic & Structural Validation
export function checkBengaliPhonotactics(word: string): { valid: boolean; reason?: string } {
  if (!word || word.length === 0) return { valid: true };

  // Rule 1: No vowel signs (matras), virama (hasanta), or diacritics at the beginning of a word
  if (/^[\u09BE-\u09CC\u09CD\u0981\u0982\u0983]/.test(word)) {
    return { valid: false, reason: "শব্দের শুরুতে কোনো কারচিহ্ন, হসন্ত বা অনুস্বর-বিসর্গ বসতে পারে না৤" };
  }

  // Rule 2: No consecutive vowel signs (e.g. াি, ুে, োৌ)
  if (/[\u09BE-\u09CC]{2,}/.test(word)) {
    return { valid: false, reason: "পরপর একাধিক কারচিহ্ন ব্যবহার করা অশুদ্ধ৤" };
  }

  // Rule 3: No consecutive hasantas (্)
  if (/\u09CD{2,}/.test(word)) {
    return { valid: false, reason: "পরপর দুটি হসন্ত যুক্ত করা যায় না৤" };
  }

  // Rule 4: Hasanta cannot be immediately followed by a vowel sign (e.g. ক্ + া)
  if (/\u09CD[\u09BE-\u09CC]/.test(word)) {
    return { valid: false, reason: "হসন্তর সাথে পুনরায় কারচিহ্ন যুক্ত করা যায় না৤" };
  }

  // Rule 5: Non-clusterable characters cannot take hasanta as first consonant (ড়, ঢ়, য়, ৎ)
  if (/[\u09DC\u09DD\u09DF\u09CE]\u09CD/.test(word)) {
    return { valid: false, reason: "এই বর্ণের সাথে হসন্ত দিয়ে যুক্তবর্ণ গঠন করা যায় না৤" };
  }

  // Rule 6: Anusvara (ং), Visarga (ঃ), Chandrabindu (ঁ) cannot take vowel signs or hasanta
  if (/[\u0981\u0982\u0983][\u09BE-\u09CC\u09CD]/.test(word)) {
    return { valid: false, reason: "অনুস্বর, বিসর্গ বা চন্দ্রবিন্দুর সাথে কারচিহ্ন বা হসন্ত যুক্ত হয় না৤" };
  }

  // Rule 7: Impossible consonant clusters / phonotactic violations in Bengali
  // Consecutive stops of incompatible manners / gibberish combinations like স্ফচ, স্ফভ, চঢ, ভস, ভচ, দস্ফ, ঢুসয, etc.
  if (/(স্ফচ|স্ফভ|চঢ|ভস|ভচ|দস্ফ|দস্ফভ|দস্ফভচ|চঢুসয|কখগ|পফব|টঠডঢ|চছজঝ)/.test(word)) {
    return { valid: false, reason: "শব্দটিতে বাংলায় অপ্রচলিত বা অসম্ভব যুক্তবর্ণের সমাহার রয়েছে৤" };
  }

  // Rule 8: Clustered 4+ consonants in Bengali
  if (/[\u0995-\u09B9]\u09CD[\u0995-\u09B9]\u09CD[\u0995-\u09B9]\u09CD[\u0995-\u09B9]/.test(word)) {
    return { valid: false, reason: "বাংলায় চার বা ততোধিক ব্যঞ্জনবর্ণের জটিল যুক্তবর্ণ প্রমিত নয়৤" };
  }

  return { valid: true };
}

// Helper: Check phonetic confusion against dictionary words
export function getPhoneticCorrection(word: string): string[] {
  const candidates: string[] = [];
  const isKnown = (w: string) => {
    if (BENGALI_SET.has(w) || BENGALI_VERBAL_STEMS.has(w)) return true;
    for (const suf of BENGALI_SUFFIXES) {
      if (w.endsWith(suf) && w.length > suf.length) {
        const stem = w.slice(0, w.length - suf.length);
        if (BENGALI_SET.has(stem) || BENGALI_VERBAL_STEMS.has(stem)) return true;
      }
    }
    return false;
  };

  const tryAdd = (w: string) => {
    if (w !== word && isKnown(w) && !candidates.includes(w)) {
      candidates.push(w);
    }
  };

  if (word.includes("ী")) tryAdd(word.replace(/ী/g, "ি"));
  if (word.includes("ি")) tryAdd(word.replace(/ি/g, "ী"));
  if (word.includes("ূ")) tryAdd(word.replace(/ূ/g, "ু"));
  if (word.includes("ু")) tryAdd(word.replace(/ু/g, "ূ"));
  if (word.includes("ণ")) tryAdd(word.replace(/ণ/g, "ন"));
  if (word.includes("ন")) tryAdd(word.replace(/ন/g, "ণ"));
  if (word.includes("ড়")) tryAdd(word.replace(/ড়/g, "র"));
  if (word.includes("র")) tryAdd(word.replace(/র/g, "ড়"));
  if (word.includes("ঢ়")) tryAdd(word.replace(/ঢ়/g, "ড়"));
  if (word.includes("স")) tryAdd(word.replace(/স/g, "শ"));
  if (word.includes("শ")) tryAdd(word.replace(/শ/g, "স"));
  if (word.includes("ষ")) {
    tryAdd(word.replace(/ষ/g, "শ"));
    tryAdd(word.replace(/ষ/g, "স"));
  }
  if (word.includes("ৎ")) tryAdd(word.replace(/ৎ/g, "ত"));
  if (word.includes("ত")) tryAdd(word.replace(/ত/g, "ৎ"));
  if (word.includes("ং")) tryAdd(word.replace(/ং/g, "ঙ"));

  return candidates;
}

// 2. Check if a Bengali word is recognized
export function isBengaliWordRecognized(
  cleanWord: string,
  userAccepted?: Set<string>
): { recognized: boolean; reason?: string; suggestions?: string[] } {
  if (!cleanWord) return { recognized: true };

  // Check user accepted words
  if (userAccepted?.has(cleanWord)) {
    return { recognized: true };
  }

  // Check phonotactics first
  const phonotacticCheck = checkBengaliPhonotactics(cleanWord);
  if (!phonotacticCheck.valid) {
    return { recognized: false, reason: phonotacticCheck.reason };
  }

  // Check if Bengali numerals / numbers (e.g. ১২৩৪, ৫টি, ১ম, ইত্যাদি)
  if (/^[০-৯]+(\.[০-৯]+)?(টি|টা|তম|র্থ|ষ্ঠ|শ|গুণ|জন|বার|বারই)?$/.test(cleanWord)) {
    return { recognized: true };
  }

  // Bengali number words (এক, দুই, দু, তিনটি, চারটি, দশটা, ইত্যাদি)
  if (/^(এক|দুই|দু|তিন|তে|চার|পাঁচ|ছয়|সাত|আট|নয়|দশ|এগার|বার|তের|চৌদ্দ|পনের|ষোল|সতের|আঠার|উনিশ|বিশ|একুশ|বাইশ|তেইশ|চব্বিশ|পঁচিশ|তিরিশ|চল্লিশ|পঞ্চাশ|ষাট|সত্তর|আশি|নব্বই|শত|হাজার|লক্ষ|কোটি)(টি|টা|টো|টেই|টোই|টিতে|টোর|টের|টির|খানা|খানি|জন|বার|বারই|গুণ|তম)?$/.test(cleanWord)) {
    return { recognized: true };
  }

  // Direct set lookup
  if (BENGALI_SET.has(cleanWord)) {
    return { recognized: true };
  }

  // Check verbal stems directly
  if (BENGALI_VERBAL_STEMS.has(cleanWord)) {
    return { recognized: true };
  }

  // Check hyphenated compound or reduplicated words (e.g. ধীরে-ধীরে, বসে-বসে, ছোট-ছোট)
  if (cleanWord.includes("-")) {
    const parts = cleanWord.split("-").filter(Boolean);
    if (parts.length > 0 && parts.every((p) => isBengaliWordRecognized(p, userAccepted).recognized)) {
      return { recognized: true };
    }
  }

  // Check inflectional suffixes: Stem + Suffix
  for (const suf of BENGALI_SUFFIXES) {
    if (cleanWord.endsWith(suf) && cleanWord.length > suf.length) {
      const stem = cleanWord.slice(0, cleanWord.length - suf.length);
      if (BENGALI_SET.has(stem) || BENGALI_VERBAL_STEMS.has(stem)) {
        return { recognized: true };
      }
      // Also check stem with trailing vowel recovery (e.g. বলা + র -> বলার)
      if (BENGALI_SET.has(stem + "া") || BENGALI_SET.has(stem + "ি") || BENGALI_SET.has(stem + "ী")) {
        return { recognized: true };
      }
    }
  }

  // Check compound inflectional suffixes: Strip 2nd layer suffix (e.g. বইটির -> বই + টি + র, মানুষগুলোকে -> মানুষ + গুলো + কে, তাদেরও -> তাদের + ও)
  for (const suf of BENGALI_SUFFIXES) {
    if (cleanWord.endsWith(suf) && cleanWord.length > suf.length) {
      const stem1 = cleanWord.slice(0, cleanWord.length - suf.length);
      for (const suf2 of BENGALI_SUFFIXES) {
        if (stem1.endsWith(suf2) && stem1.length > suf2.length) {
          const stem2 = stem1.slice(0, stem1.length - suf2.length);
          if (BENGALI_SET.has(stem2) || BENGALI_VERBAL_STEMS.has(stem2)) {
            return { recognized: true };
          }
          if (BENGALI_SET.has(stem2 + "া") || BENGALI_SET.has(stem2 + "ি") || BENGALI_SET.has(stem2 + "ী")) {
            return { recognized: true };
          }
        }
      }
    }
  }

  // Check common Bengali productive prefixes: অ-, সু-, কু-, বে-, নি-, নির্-, প্রতি-, উপ-, অপ-
  const prefixes = ["প্রতি", "নির্", "নিঃ", "নি", "উপ", "অপ", "সু", "কু", "বে", "অন", "অ"];
  for (const pre of prefixes) {
    if (cleanWord.startsWith(pre) && cleanWord.length > pre.length) {
      const base = cleanWord.slice(pre.length);
      if (BENGALI_SET.has(base) || BENGALI_VERBAL_STEMS.has(base)) {
        return { recognized: true };
      }
      // check base with standard suffixes
      for (const suf of BENGALI_SUFFIXES) {
        if (base.endsWith(suf) && base.length > suf.length) {
          const stem = base.slice(0, base.length - suf.length);
          if (BENGALI_SET.has(stem) || BENGALI_VERBAL_STEMS.has(stem)) {
            return { recognized: true };
          }
          if (BENGALI_SET.has(stem + "া") || BENGALI_SET.has(stem + "ি") || BENGALI_SET.has(stem + "ী")) {
            return { recognized: true };
          }
        }
      }
    }
  }

  // Check compound words (সমাসবদ্ধ পদ, যেমন: গল্পগুচ্ছ, পথচলা, মেঘমেদুর)
  if (cleanWord.length >= 4) {
    for (let i = 2; i <= cleanWord.length - 2; i++) {
      const left = cleanWord.slice(0, i);
      const right = cleanWord.slice(i);
      if (BENGALI_SET.has(left) && (BENGALI_SET.has(right) || BENGALI_VERBAL_STEMS.has(right))) {
        return { recognized: true };
      }
    }
  }

  // Check if this word is an orthographic confusion of a real word (e.g. পাখী -> পাখি, ধরণ -> ধরন)
  const phoneticCand = getPhoneticCorrection(cleanWord);
  if (phoneticCand.length > 0) {
    return {
      recognized: false,
      reason: `সম্ভাব্য বানান বিভ্রান্তি৤ প্রমিত রূপ হতে পারে: ${phoneticCand.join(", ")}`,
      suggestions: phoneticCand,
    };
  }

  // Allow standard monosyllabic grammatical particles & clitics
  const COMMON_PARTICLES = new Set([
    "ও", "এ", "না", "তা", "যা", "বা", "হা", "মা", "গা", "চা", "পা", "ঘা", "খা",
    "কী", "কি", "সে", "যে", "কে", "হে", "গো", "রে", "তো", "লো",
    "যেই", "সেই", "এই", "ওই", "কই", "রই", "সই", "দই", "বই", "মই", "হই", "ছি"
  ]);
  if (COMMON_PARTICLES.has(cleanWord)) {
    return { recognized: true };
  }

  // Word not found in Bengali dictionary, valid verbal stems, suffix inflections, or compounds:
  // Return unrecognized spelling mistake with closest dictionary suggestions
  const suggestions = getSuggestions(cleanWord, "bn");
  return {
    recognized: false,
    reason: `বাংলা অভিধানে শব্দটি পাওয়া যায়নি বা ভুল বানান রয়েছে৤`,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
}

// 3. Check if an English word is recognized
export function isEnglishWordRecognized(
  cleanWord: string,
  userAccepted?: Set<string>
): { recognized: boolean; reason?: string } {
  if (!cleanWord) return { recognized: true };

  const lower = cleanWord.toLowerCase();

  // User accepted
  if (userAccepted?.has(lower) || userAccepted?.has(cleanWord)) {
    return { recognized: true };
  }

  // Numbers & ordinals (e.g. 1st, 2nd, 100)
  if (/^\d+(st|nd|rd|th)?$/.test(lower)) {
    return { recognized: true };
  }

  // Direct set lookup
  if (ENGLISH_SET.has(lower)) {
    return { recognized: true };
  }

  // Standard English inflections (-s, -es, -ed, -ing, -ly, -er, -est, -ment, -ness, -able)
  const enSuffixes = ["ing", "tion", "able", "ness", "ment", "ies", "ied", "est", "ly", "er", "ed", "es", "s"];
  for (const suf of enSuffixes) {
    if (lower.endsWith(suf) && lower.length > suf.length + 2) {
      const stem = lower.slice(0, lower.length - suf.length);
      if (ENGLISH_SET.has(stem) || ENGLISH_SET.has(stem + "e")) {
        return { recognized: true };
      }
    }
  }

  return {
    recognized: false,
    reason: "Unrecognized or misspelled English word.",
  };
}

// 4. Levenshtein Distance Helper
function calculateLevenshtein(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// 5. Intelligent Suggestions for unknown words
export function getSuggestions(word: string, lang: "bn" | "en"): string[] {
  if (!word || word.length < 2) return [];

  const suggestions: { word: string; dist: number }[] = [];
  const candidateList = lang === "bn" ? BENGALI_ROOTS : ENGLISH_WORDS;
  const target = lang === "en" ? word.toLowerCase() : word;
  const maxDist = target.length <= 3 ? 1 : 2;

  // Bengali phonetic confusion groups for starting character
  const bnConfusions = [
    ["শ", "স", "ষ"],
    ["ই", "ঈ"],
    ["উ", "ঊ"],
    ["র", "ড়", "ঢ়"],
    ["জ", "য"],
    ["ণ", "ন"],
  ];

  for (const cand of candidateList) {
    if (Math.abs(cand.length - target.length) > maxDist) continue;

    // For Bengali, prevent suggesting completely unrelated words starting with totally different letters
    if (lang === "bn" && target.length > 2 && target[0] !== cand[0]) {
      const isPhonetic = bnConfusions.some(
        (group) => group.includes(target[0]) && group.includes(cand[0])
      );
      if (!isPhonetic) continue;
    }

    const dist = calculateLevenshtein(target, cand);
    if (dist <= maxDist) {
      suggestions.push({ word: cand, dist });
      if (suggestions.length >= 8) break;
    }
  }

  suggestions.sort((a, b) => a.dist - b.dist);
  return suggestions.slice(0, 3).map((s) => s.word);
}
