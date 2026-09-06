// Comprehensive Bengali & English Dictionary and Orthographic Engine
// Designed for Ahona Islam Literary Platform

// 1. Bengali Phonotactic & Structural Validation
export function checkBengaliPhonotactics(word: string): { valid: boolean; reason?: string } {
  if (!word || word.length === 0) return { valid: true };

  // Rule 1: No vowel signs (matras) or virama (hasanta) or diacritics at the beginning of a word
  if (/^[\u09BE-\u09CC\u09CD\u0981\u0982\u0983]/.test(word)) {
    return { valid: false, reason: "শব্দের শুরুতে কোনো কারচিহ্ন, হসন্ত বা অনুস্বর-বিসর্গ বসতে পারে না।" };
  }

  // Rule 2: No consecutive vowel signs (e.g. াি, ুে, োৌ)
  if (/[\u09BE-\u09CC]{2,}/.test(word)) {
    return { valid: false, reason: "পরপর একাধিক কারচিহ্ন ব্যবহার করা অশুদ্ধ।" };
  }

  // Rule 3: No consecutive hasantas (্)
  if (/\u09CD{2,}/.test(word)) {
    return { valid: false, reason: "পরপর দুটি হসন্ত যুক্ত করা যায় না।" };
  }

  // Rule 4: Hasanta cannot be immediately followed by a vowel sign (e.g. ক্ + া)
  if (/\u09CD[\u09BE-\u09CC]/.test(word)) {
    return { valid: false, reason: "হসন্তর সাথে পুনরায় কারচিহ্ন যুক্ত করা যায় না।" };
  }

  // Rule 5: Non-clusterable characters cannot take hasanta as first consonant (ড়, ঢ়, য়, ৎ)
  if (/[\u09DC\u09DD\u09DF\u09CE]\u09CD/.test(word)) {
    return { valid: false, reason: "এই বর্ণের সাথে হসন্ত দিয়ে যুক্তবর্ণ গঠন করা যায় না।" };
  }

  // Rule 6: Anusvara (ং), Visarga (ঃ), Chandrabindu (ঁ) cannot take vowel signs or hasanta
  if (/[\u0981\u0982\u0983][\u09BE-\u09CC\u09CD]/.test(word)) {
    return { valid: false, reason: "অনুস্বর, বিসর্গ বা চন্দ্রবিন্দুর সাথে কারচিহ্ন বা হসন্ত যুক্ত হয় না।" };
  }

  // Rule 7: Impossible consonant clusters in Bengali phonotactics
  // Consecutive stops of incompatible manners / gibberish combinations like স্ফচ, স্ফভ, চঢ, ভস, ভচ, দস্ফ, ঢুসয, etc.
  if (/(স্ফচ|স্ফভ|চঢ|ভস|ভচ|দস্ফ|দস্ফভ|চঢুসয|কখগ|পফব|টঠডঢ|চছজঝ)/.test(word)) {
    return { valid: false, reason: "শব্দটিতে বাংলায় অপ্রচলিত বা অসম্ভব যুক্তবর্ণের সমাহার রয়েছে।" };
  }

  // Rule 8: Clustered 4+ consonants in Bengali (extremely unnatural/impossible in modern Bengali orthography)
  if (/[\u0995-\u09B9]\u09CD[\u0995-\u09B9]\u09CD[\u0995-\u09B9]\u09CD[\u0995-\u09B9]/.test(word)) {
    return { valid: false, reason: "বাংলায় চার বা ততোধিক ব্যঞ্জনবর্ণের জটিল যুক্তবর্ণ প্রমিত নয়।" };
  }

  return { valid: true };
}
