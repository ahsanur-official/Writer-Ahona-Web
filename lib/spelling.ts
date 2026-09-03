// Bangla and English Spelling Checker & Correction Engine
// Designed for Ahona Islam Literary Platform

export interface SpellingMistake {
  id: string;
  word: string;
  cleanWord: string;
  startIndex: number;
  endIndex: number;
  suggestions: string[];
  explanation: string;
  language: "bn" | "en";
  category: "spelling" | "orthography" | "grammar";
}

export interface SpellCheckResult {
  totalMistakes: number;
  bnMistakesCount: number;
  enMistakesCount: number;
  mistakes: SpellingMistake[];
}

// 1. Comprehensive Bengali Rules & Misspellings Dictionary
// Covers Bangla Academy standard guidelines (ই-কার, ঈ-কার, ণ-ত্ব/ষ-ত্ব, রেফ-দ্বিত্ব, সন্ধি ও প্রত্যয়)
interface BnRule {
  wrong: string;
  correct: string[];
  explanation: string;
}

const BANGLA_SPELL_RULES: BnRule[] = [
  // অঞ্জলি ঘটিত শব্দাবলী (হ্রস্ব ই-কার)
  { wrong: "শ্রদ্ধাঞ্জলী", correct: ["শ্রদ্ধাঞ্জলি"], explanation: "অঞ্জলি যুক্ত সকল শব্দে হ্রস্ব ই-কার (ি) হবে।" },
  { wrong: "গীতাঞ্জলী", correct: ["গীতাঞ্জলি"], explanation: "অঞ্জলি প্রত্যয়ান্ত শব্দে হ্রস্ব ই-কার (ি) প্রমিত।" },
  { wrong: "পুষ্পাঞ্জলী", correct: ["পুষ্পাঞ্জলি"], explanation: "অঞ্জলি যুক্ত শব্দে হ্রস্ব ই-কার প্রযোজ্য।" },
  { wrong: "জলাঞ্জলী", correct: ["জলাঞ্জলি"], explanation: "অঞ্জলি যুক্ত শব্দে হ্রস্ব ই-কার প্রযোজ্য।" },

  // ষত্ব ও স-ত্ব বিধান
  { wrong: "পুরষ্কার", correct: ["পুরস্কার"], explanation: "অ-কারান্ত উপসর্গের পর স্কার (দন্ত্য-স) হয়।" },
  { wrong: "পরিস্কার", correct: ["পরিষ্কার"], explanation: "ই-কারান্ত উপসর্গের পর মূর্ধন্য-ষ (ষ্ফ/ষ্কার) হয়।" },
  { wrong: "আবিস্কার", correct: ["আবিষ্কার"], explanation: "ই-কারান্ত উপসর্গের পর মূর্ধন্য-ষ (ষ্কার) হয়।" },
  { wrong: "তিরষ্কার", correct: ["তিরস্কার"], explanation: "তিরঃ শব্দের পর দন্ত্য-স (স্কার) প্রযোজ্য।" },
  { wrong: "দুস্প্রাপ্য", correct: ["দুষ্প্রাপ্য"], explanation: "দুঃ উপসর্গের পর প্র থাকলে মূর্ধন্য-ষ হয়।" },
  { wrong: "নিষ্পাপ", correct: ["নিষ্পাপ"], explanation: "মূর্ধন্য-ষ প্রমিত।" },

  // রেফের পর দ্বিত্ব বর্জন (বাংলা একাডেমি নিয়ম)
  { wrong: "অনিবার্য্য", correct: ["অনিবার্য"], explanation: "বাংলা একাডেমি নিয়ম অনুযায়ী রেফের পর ব্যঞ্জনবর্ণের দ্বিত্ব হয় না।" },
  { wrong: "সূর্য্য", correct: ["সূর্য"], explanation: "রেফের পর ব্যঞ্জনবর্ণের দ্বিত্ব বর্জনীয়।" },
  { wrong: "ধর্ম্ম", correct: ["ধর্ম"], explanation: "রেফের পর দ্বিত্ব বর্জন করে 'ধর্ম' লেখা প্রমিত।" },
  { wrong: "কর্ম্ম", correct: ["কর্ম"], explanation: "রেফের পর দ্বিত্ব বর্জন করে 'কর্ম' লেখা প্রমিত।" },
  { wrong: "কার্য্য", correct: ["কার্য"], explanation: "রেফের পর ব্যঞ্জনবর্ণের দ্বিত্ব হবে না।" },
  { wrong: "ধৈর্য্য", correct: ["ধৈর্য"], explanation: "রেফের পর দ্বিত্ব বর্জনীয়।" },
  { wrong: "বার্ধক্য্য", correct: ["বার্ধক্য"], explanation: "রেফের পর দ্বিত্ব বর্জনীয়।" },
  { wrong: "মর্ম্ম", correct: ["মর্ম"], explanation: "রেফের পর দ্বিত্ব বর্জনীয়।" },
  { wrong: "পূর্ব্ব", correct: ["পূর্ব"], explanation: "রেফের পর দ্বিত্ব বর্জনীয়।" },
  { wrong: "সর্ব্ব", correct: ["সর্ব"], explanation: "রেফের পর দ্বিত্ব বর্জনীয়।" },

  // দীর্ঘ ঈ-কার ও হ্রস্ব ই-কার জটিলতা
  { wrong: "মুমূর্ষ", correct: ["মুমূর্ষু"], explanation: "সঠিক রূপ 'মুমূর্ষু' (হ্রস্ব উ, দীর্ঘ ঊ, হ্রস্ব উ)।" },
  { wrong: "মরিচিকা", correct: ["মরীচিকা"], explanation: "প্রথমটি দীর্ঘ ঈ-কার এবং দ্বিতীয়টি হ্রস্ব ই-কার (মরীচিকা)।" },
  { wrong: "মরিচীকা", correct: ["মরীচিকা"], explanation: "সঠিক রূপ 'মরীচিকা'।" },
  { wrong: "পিপিলিকা", correct: ["পিপীলিকা"], explanation: "সঠিক রূপ 'পিপীলিকা' (হ্রস্ব ই, দীর্ঘ ঈ, হ্রস্ব ই)।" },
  { wrong: "বিভিষিকা", correct: ["বিভীষিকা"], explanation: "সঠিক রূপ 'বিভীষিকা' (হ্রস্ব ই, দীর্ঘ ঈ, হ্রস্ব ই)।" },
  { wrong: "বিভীসিকা", correct: ["বিভীষিকা"], explanation: "সঠিক রূপ 'বিভীষিকা'।" },
  { wrong: "শারিরীক", correct: ["শারীরিক"], explanation: "সঠিক রূপ 'শারীরিক' (দীর্ঘ ঈ, হ্রস্ব ই)।" },
  { wrong: "সমিচীন", correct: ["সমীচীন"], explanation: "সমীচীন শব্দে উভয়টিই দীর্ঘ ঈ-কার হবে।" },
  { wrong: "সমীচিন", correct: ["সমীচীন"], explanation: "সমীচীন শব্দে উভয়টিই দীর্ঘ ঈ-কার প্রযোজ্য।" },
  { wrong: "নিরব", correct: ["নীরব"], explanation: "নীরব শব্দে দীর্ঘ ঈ-কার (নীরব) প্রমিত।" },
  { wrong: "নিরবতা", correct: ["নীরবতা"], explanation: "নীরবতা শব্দে দীর্ঘ ঈ-কার (নীরবতা) প্রমিত।" },
  { wrong: "নীলিমা", correct: ["নীলিমা"], explanation: "সঠিক রূপ নীলিমা।" },
  { wrong: "নিলিমা", correct: ["নীলিমা"], explanation: "নীলিমা শব্দে প্রথম বর্ণে দীর্ঘ ঈ-কার হবে।" },
  { wrong: "নীরোগ", correct: ["নিরোগ"], explanation: "সঠিক রূপ 'নিরোগ' (হ্রস্ব ই-কার)।" },

  // প্রত্যয় যুক্তিতে হ্রস্ব ই-কার রূপান্তর (তা/সভা/বিদ্যা)
  { wrong: "প্রতিযোগীতা", correct: ["প্রতিযোগিতা"], explanation: "তা প্রত্যয় যুক্ত হলে ঈ-কার হ্রস্ব ই-কার (প্রতিযোগিতা) হয়।" },
  { wrong: "সহযোগীতা", correct: ["সহযোগিতা"], explanation: "তা প্রত্যয় যোগে হ্রস্ব ই-কার (সহযোগিতা) প্রমিত।" },
  { wrong: "উপযোগীতা", correct: ["উপযোগিতা"], explanation: "তা প্রত্যয়ে হ্রস্ব ই-কার হবে।" },
  { wrong: "মন্ত্রীসভা", correct: ["মন্ত্রিসভা"], explanation: "সভা যুক্ত হলে হ্রস্ব ই-কার (মন্ত্রিসভা) হয়।" },
  { wrong: "প্রাণীবিদ্যা", correct: ["প্রাণিবিদ্যা"], explanation: "যুক্তশব্দে হ্রস্ব ই-কার (প্রাণিবিদ্যা) প্রমিত।" },
  { wrong: "প্রাণীজগৎ", correct: ["প্রাণিজগৎ"], explanation: "যুক্তশব্দে হ্রস্ব ই-কার (প্রাণিজগৎ) প্রমিত।" },

  // জীবী ঘটিত বানান (উভয় দীর্ঘ ঈ-কার)
  { wrong: "বুদ্ধিজীবি", correct: ["বুদ্ধিজীবী"], explanation: "জীবী প্রত্যয়ে উভয়টি দীর্ঘ ঈ-কার হবে।" },
  { wrong: "আইনজীবি", correct: ["আইনজীবী"], explanation: "জীবী প্রত্যয়ে উভয়টি দীর্ঘ ঈ-কার প্রযোজ্য।" },
  { wrong: "চাকুরিজীবি", correct: ["চাকরিজীবী"], explanation: "প্রমিত রূপ 'চাকরিজীবী'।" },
  { wrong: "চাকরিজীবি", correct: ["চাকরিজীবী"], explanation: "জীবী শব্দে দীর্ঘ ঈ-কার হবে।" },
  { wrong: "পেশাজীবি", correct: ["পেশাজীবী"], explanation: "জীবী শব্দে দীর্ঘ ঈ-কার হবে।" },
  { wrong: "শ্রমজীবি", correct: ["শ্রমজীবী"], explanation: "জীবী শব্দে দীর্ঘ ঈ-কার হবে।" },

  // উপসর্গ ও সন্ধি
  { wrong: "দূরবস্থা", correct: ["দুরবস্থা"], explanation: "দুর্ + অবস্থা = দুরবস্থা (হ্রস্ব উ-কার হবে)।" },
  { wrong: "দূরারোগ্য", correct: ["দুরারোগ্য"], explanation: "দুর্ + আরোগ্য = দুরারোগ্য (হ্রস্ব উ-কার)।" },
  { wrong: "দূরাকাঙ্ক্ষা", correct: ["দুরাকাঙ্ক্ষা"], explanation: "দুর্ + আকাঙ্ক্ষা = দুরাকাঙ্ক্ষা।" },
  { wrong: "দূরভিসন্ধি", correct: ["দুরভিসন্ধি"], explanation: "দুর্ + অভিসন্ধি = দুরভিসন্ধি।" },
  { wrong: "ইতিপূর্বে", correct: ["ইতোপূর্বে", "এর আগে"], explanation: "সন্ধিজাত শুদ্ধ রূপ 'ইতোপূর্বে'।" },
  { wrong: "ইতিমধ্যে", correct: ["ইতোমধ্যে"], explanation: "সন্ধিজাত শুদ্ধ রূপ 'ইতোমধ্যে'।" },
  { wrong: "উপরোক্ত", correct: ["উপরিউক্ত", "উপরের"], explanation: "সংস্কৃত সন্ধি অনুযায়ী 'উপরিউক্ত' বা বাংলা 'উপরের' শুদ্ধ।" },
  { wrong: "মনোপুত", correct: ["মনঃপূত"], explanation: "শুদ্ধ রূপ বিসর্গসহ 'মনঃপূত'।" },
  { wrong: "মনকষ্ট", correct: ["মনঃকষ্ট"], explanation: "শুদ্ধ রূপ বিসর্গসহ 'মনঃকষ্ট'।" },
  { wrong: "শিরচ্ছেদ", correct: ["শিরশ্ছেদ"], explanation: "শিরঃ + ছেদ = শিরশ্ছেদ।" },
  { wrong: "নিশব্দ", correct: ["নিঃশব্দ"], explanation: "বিসর্গযুক্ত 'নিঃশব্দ' প্রমিত।" },
  { wrong: "দুঃস্থ", correct: ["দুস্থ"], explanation: "আধুনিক বানানে বিসর্গ বর্জন করে 'দুস্থ' প্রমিত।" },
  { wrong: "নিস্পৃহ", correct: ["নিঃস্পৃহ"], explanation: "শুদ্ধ রূপ 'নিঃস্পৃহ'।" },

  // বাহুল্য ও প্রত্যয় দোষ
  { wrong: "সৌহার্দ্যতা", correct: ["সৌহার্দ্য", "সুহৃদতা"], explanation: "য-ফলা ও তা প্রত্যয় একসাথে বাহুল্য দোষ।" },
  { wrong: "উৎকর্ষতা", correct: ["উৎকর্ষ"], explanation: "উৎকর্ষ নিজেই বিশেষ্য, 'তা' যুক্ত করা বাহুল্য দোষ।" },
  { wrong: "দৈন্যতা", correct: ["দীনতা", "দৈন্য"], explanation: "দীনতা অথবা দৈন্য শুদ্ধ, 'দৈন্যতা' বাহুল্য দোষ।" },
  { wrong: "দারিদ্রতা", correct: ["দারিদ্র্য", "দরিদ্রতা"], explanation: "দারিদ্র্য অথবা দরিদ্রতা শুদ্ধ রূপ।" },
  { wrong: "ঐক্যতান", correct: ["ঐকতান"], explanation: "শুদ্ধ রূপ 'ঐকতান' (য-ফলা ছাড়া)।" },
  { wrong: "লজ্জাস্কর", correct: ["লজ্জাজনক"], explanation: "শুদ্ধ রূপ 'লজ্জাজনক'।" },
  { wrong: "সুস্বাগতম", correct: ["স্বাগতম"], explanation: "স্বাগতম (সু+আগতম) শব্দের ভেতরেই 'সু' রয়েছে।" },
  { wrong: "নির্দোষী", correct: ["নির্দোষ"], explanation: "শুদ্ধ রূপ 'নির্দোষ' (যেমন: তিনি নির্দোষ ব্যক্তি)।" },
  { wrong: "নিপরাধী", correct: ["নিরপরাধ"], explanation: "শুদ্ধ রূপ 'নিরপরাধ'।" },
  { wrong: "অহোরাত্রি", correct: ["অহোরাত্র"], explanation: "শুদ্ধ রূপ 'অহোরাত্র'।" },

  // স/শ/ষ এবং ণ/ন জটিলতা
  { wrong: "শান্তনা", correct: ["সান্ত্বনা"], explanation: "শুদ্ধ রূপ দন্ত্য-স ও ন্ত্ব যুক্ত 'সান্ত্বনা'।" },
  { wrong: "স্বান্তনা", correct: ["সান্ত্বনা"], explanation: "শুদ্ধ রূপ 'সান্ত্বনা'।" },
  { wrong: "সান্তনা", correct: ["সান্ত্বনা"], explanation: "শুদ্ধ রূপ 'সান্ত্বনা'।" },
  { wrong: "শশুর", correct: ["শ্বশুর"], explanation: "তালব্য-শ এর সাথে ব-ফলা (শ্বশুর) হবে।" },
  { wrong: "সশ্মান", correct: ["শ্মশান"], explanation: "শুদ্ধ রূপ 'শ্মশান' (তালব্য শ)।" },
  { wrong: "শশ্মান", correct: ["শ্মশান"], explanation: "শুদ্ধ রূপ 'শ্মশান'।" },
  { wrong: "আকাংখা", correct: ["আকাঙ্ক্ষা"], explanation: "শুদ্ধ রূপ 'আকাঙ্ক্ষা' (ঙ্ক্ষ যুক্ত)।" },
  { wrong: "আকাঙ্খা", correct: ["আকাঙ্ক্ষা"], explanation: "শুদ্ধ রূপ 'আকাঙ্ক্ষা' (ক্ষ-বিন্দু)।" },
  { wrong: "উজ্জল", correct: ["উজ্জ্বল"], explanation: "জ্ব যুক্ত 'উজ্জ্বল' শুদ্ধ রূপ।" },
  { wrong: "উজ্জ্বল্য", correct: ["উজ্জ্বলতা"], explanation: "শুদ্ধ রূপ 'উজ্জ্বলতা'।" },
  { wrong: "ধরণ", correct: ["ধরন"], explanation: "প্রকার বা রূপ অর্থে দন্ত্য-ন দিয়ে 'ধরন' প্রমিত।" },
  { wrong: "স্বরণীয়", correct: ["স্মরণীয়"], explanation: "স্মৃতি অর্থে ম-ফলা দিয়ে 'স্মরণীয়' শুদ্ধ।" },
  { wrong: "স্বারক", correct: ["স্মারক"], explanation: "স্মৃতি অর্থে 'স্মারক' শুদ্ধ।" },
  { wrong: "স্বত্বাধিকারী", correct: ["স্বত্বাধিকারী"], explanation: "অধিকার অর্থে স্বত্ব।" },
  { wrong: "স্বত্ত্ব", correct: ["স্বত্ব"], explanation: "মালিকানা অর্থে 'স্বত্ব'।" },
  { wrong: "সচেনতন", correct: ["সচেতন"], explanation: "শুদ্ধ বানান 'সচেতন'।" },
  { wrong: "শাপথ", correct: ["শপথ"], explanation: "শুদ্ধ বানান 'শপথ'।" },
  { wrong: "সবাইর", correct: ["সবার"], explanation: "প্রমিত বাংলায় 'সবার' শুদ্ধ রূপ।" },
  { wrong: "ভূল", correct: ["ভুল"], explanation: "হ্রস্ব উ-কার দিয়ে 'ভুল' প্রমিত।" },
  { wrong: "ধুল", correct: ["ধুলো", "ধূলি"], explanation: "শুদ্ধ রূপ 'ধুলো' বা 'ধূলি'।" },
  { wrong: "পুজা", correct: ["পূজা"], explanation: "পূজা শব্দে দীর্ঘ ঊ-কার প্রমিত।" },
  { wrong: "অনুকুল", correct: ["অনুকূল"], explanation: "অনুকূল শব্দে দীর্ঘ ঊ-কার প্রমিত।" },
  { wrong: "প্রতিকুল", correct: ["প্রতিকূল"], explanation: "প্রতিকূল শব্দে দীর্ঘ ঊ-কার প্রমিত।" },
  { wrong: "কৌতহুল", correct: ["কৌতূহল"], explanation: "শুদ্ধ বানান 'কৌতূহল' (ত-এ দীর্ঘ ঊ)।" },
  { wrong: "সাক্ষাতকার", correct: ["সাক্ষাৎকার"], explanation: "খণ্ড-ত দিয়ে 'সাক্ষাৎকার' প্রমিত।" },
  { wrong: "স্বাক্ষাৎ", correct: ["সাক্ষাৎ"], explanation: "দেখা করা অর্থে 'সাক্ষাৎ' (ব-ফলা নেই)।" },
  { wrong: "বিদ্যান", correct: ["বিদ্বান"], explanation: "শুদ্ধ রূপ 'বিদ্বান'।" },
];

// Map for ultra-fast Bengali lookup
const BANGLA_MAP = new Map<string, BnRule>();
BANGLA_SPELL_RULES.forEach((r) => {
  BANGLA_MAP.set(r.wrong, r);
});

// 2. Comprehensive English Rules & Misspellings Dictionary
interface EnRule {
  wrong: string;
  correct: string[];
  explanation: string;
}

const ENGLISH_SPELL_RULES: EnRule[] = [
  { wrong: "teh", correct: ["the"], explanation: "Common typo for 'the'." },
  { wrong: "recieved", correct: ["received"], explanation: "'i' before 'e' except after 'c' (received)." },
  { wrong: "seperate", correct: ["separate"], explanation: "Spelled with 'par', not 'per' (separate)." },
  { wrong: "definately", correct: ["definitely"], explanation: "Spelled with 'finite' (definitely)." },
  { wrong: "definitly", correct: ["definitely"], explanation: "Spelled as 'definitely'." },
  { wrong: "occured", correct: ["occurred"], explanation: "Requires double 'r' in past tense (occurred)." },
  { wrong: "occuring", correct: ["occurring"], explanation: "Requires double 'r' (occurring)." },
  { wrong: "untill", correct: ["until"], explanation: "Spelled with a single 'l' (until)." },
  { wrong: "tommorow", correct: ["tomorrow"], explanation: "Spelled with one 'm' and double 'r' (tomorrow)." },
  { wrong: "tomorow", correct: ["tomorrow"], explanation: "Spelled with double 'r' (tomorrow)." },
  { wrong: "writting", correct: ["writing"], explanation: "Spelled with a single 't' (writing)." },
  { wrong: "truely", correct: ["truly"], explanation: "Drops the 'e' in adverb form (truly)." },
  { wrong: "accomodate", correct: ["accommodate"], explanation: "Requires double 'c' and double 'm' (accommodate)." },
  { wrong: "acommodate", correct: ["accommodate"], explanation: "Requires double 'c' and double 'm' (accommodate)." },
  { wrong: "beleive", correct: ["believe"], explanation: "'i' before 'e' (believe)." },
  { wrong: "belive", correct: ["believe"], explanation: "Spelled as 'believe'." },
  { wrong: "calender", correct: ["calendar"], explanation: "Spelled with 'ar' at the end (calendar)." },
  { wrong: "collegue", correct: ["colleague"], explanation: "Spelled as 'colleague'." },
  { wrong: "concious", correct: ["conscious"], explanation: "Spelled with 'sc' (conscious)." },
  { wrong: "embarass", correct: ["embarrass"], explanation: "Requires double 'r' and double 's' (embarrass)." },
  { wrong: "enviroment", correct: ["environment"], explanation: "Includes 'n' after 'o' (environment)." },
  { wrong: "goverment", correct: ["government"], explanation: "Includes 'n' before 'ment' (government)." },
  { wrong: "grammer", correct: ["grammar"], explanation: "Spelled with 'ar' at the end (grammar)." },
  { wrong: "happend", correct: ["happened"], explanation: "Spelled with 'ened' (happened)." },
  { wrong: "interupt", correct: ["interrupt"], explanation: "Requires double 'r' (interrupt)." },
  { wrong: "neccessary", correct: ["necessary"], explanation: "Single 'c', double 's' (necessary)." },
  { wrong: "necesary", correct: ["necessary"], explanation: "Requires double 's' (necessary)." },
  { wrong: "peice", correct: ["piece"], explanation: "'i' before 'e' (piece)." },
  { wrong: "privelege", correct: ["privilege"], explanation: "No 'd', spelled as 'privilege'." },
  { wrong: "priviledge", correct: ["privilege"], explanation: "No 'd', spelled as 'privilege'." },
  { wrong: "succesful", correct: ["successful"], explanation: "Requires double 'c' and double 's' (successful)." },
  { wrong: "succesfull", correct: ["successful"], explanation: "Single 'l' at the end (successful)." },
  { wrong: "suprise", correct: ["surprise"], explanation: "Includes the first 'r' (surprise)." },
  { wrong: "wierd", correct: ["weird"], explanation: "Exception to the rule: spelled 'ei' (weird)." },
  { wrong: "alot", correct: ["a lot"], explanation: "'A lot' should be written as two words." },
  { wrong: "begining", correct: ["beginning"], explanation: "Requires double 'n' (beginning)." },
  { wrong: "experiance", correct: ["experience"], explanation: "Spelled with 'ence' (experience)." },
  { wrong: "existance", correct: ["existence"], explanation: "Spelled with 'ence' (existence)." },
  { wrong: "foriegn", correct: ["foreign"], explanation: "Spelled 'eign' (foreign)." },
  { wrong: "freind", correct: ["friend"], explanation: "'i' before 'e' (friend)." },
  { wrong: "independant", correct: ["independent"], explanation: "Spelled with 'ent' (independent)." },
  { wrong: "knowlege", correct: ["knowledge"], explanation: "Includes 'd' (knowledge)." },
  { wrong: "liesure", correct: ["leisure"], explanation: "Spelled as 'leisure'." },
  { wrong: "millenium", correct: ["millennium"], explanation: "Double 'l' and double 'n' (millennium)." },
  { wrong: "noticeable", correct: ["noticeable"], explanation: "Keeps the 'e' (noticeable)." },
  { wrong: "occurence", correct: ["occurrence"], explanation: "Double 'c', double 'r', and 'ence' (occurrence)." },
  { wrong: "recommand", correct: ["recommend"], explanation: "Spelled with 'e' (recommend)." },
  { wrong: "religous", correct: ["religious"], explanation: "Includes 'i' (religious)." },
  { wrong: "rythm", correct: ["rhythm"], explanation: "Spelled with 'h' (rhythm)." },
  { wrong: "rhytm", correct: ["rhythm"], explanation: "Spelled as 'rhythm'." },
  { wrong: "thier", correct: ["their"], explanation: "Spelled 'their'." },
  { wrong: "becuase", correct: ["because"], explanation: "Spelled 'because'." },
  { wrong: "beautifull", correct: ["beautiful"], explanation: "Single 'l' at the end (beautiful)." },
  { wrong: "langauge", correct: ["language"], explanation: "Spelled as 'language'." },
  { wrong: "literture", correct: ["literature"], explanation: "Spelled as 'literature'." },
  { wrong: "litrature", correct: ["literature"], explanation: "Spelled as 'literature'." },
  { wrong: "poetey", correct: ["poetry"], explanation: "Spelled as 'poetry'." },
  { wrong: "charecter", correct: ["character"], explanation: "Spelled as 'character'." },
  { wrong: "noval", correct: ["novel"], explanation: "Spelled as 'novel'." },
  { wrong: "authur", correct: ["author"], explanation: "Spelled with 'or' (author)." },
  { wrong: "sentance", correct: ["sentence"], explanation: "Spelled with 'ence' (sentence)." },
  { wrong: "paragragh", correct: ["paragraph"], explanation: "Spelled with 'ph' at the end (paragraph)." },
  { wrong: "libary", correct: ["library"], explanation: "Includes first 'r' (library)." },
  { wrong: "maintainance", correct: ["maintenance"], explanation: "Spelled as 'maintenance'." },
  { wrong: "mispell", correct: ["misspell"], explanation: "Double 's' (misspell)." },
  { wrong: "posession", correct: ["possession"], explanation: "Double 's' twice (possession)." },
  { wrong: "pronounciation", correct: ["pronunciation"], explanation: "No 'o' in the middle (pronunciation)." },
  { wrong: "questionaire", correct: ["questionnaire"], explanation: "Double 'n' (questionnaire)." },
  { wrong: "refered", correct: ["referred"], explanation: "Double 'r' (referred)." },
  { wrong: "restarant", correct: ["restaurant"], explanation: "Spelled with 'au' (restaurant)." },
  { wrong: "shedule", correct: ["schedule"], explanation: "Spelled as 'schedule'." },
  { wrong: "tendancy", correct: ["tendency"], explanation: "Spelled with 'ency' (tendency)." },
];

const ENGLISH_MAP = new Map<string, EnRule>();
ENGLISH_SPELL_RULES.forEach((r) => {
  ENGLISH_MAP.set(r.wrong.toLowerCase(), r);
});

// Helper: Check if token is Bengali
export function isBengaliWord(word: string): boolean {
  return /[\u0980-\u09FF]/.test(word);
}

// Helper: Check if token is English
export function isEnglishWord(word: string): boolean {
  return /^[a-zA-Z]+$/.test(word);
}

// Clean punctuation from word borders
export function stripWordPunctuation(word: string): { clean: string; leading: string; trailing: string } {
  const match = word.match(/^([^\p{L}\p{N}]*)([\p{L}\p{N}\u0980-\u09FF\-_]*?)([^\p{L}\p{N}]*)$/u);
  if (!match) return { clean: word, leading: "", trailing: "" };
  return {
    leading: match[1] || "",
    clean: match[2] || "",
    trailing: match[3] || "",
  };
}

/**
 * Main Spell Check Function
 * Scans text and returns all detected Bengali and English spelling mistakes.
 */
export function checkSpelling(text: string): SpellCheckResult {
  if (!text || !text.trim()) {
    return {
      totalMistakes: 0,
      bnMistakesCount: 0,
      enMistakesCount: 0,
      mistakes: [],
    };
  }

  const mistakes: SpellingMistake[] = [];
  let bnCount = 0;
  let enCount = 0;

  // Regex to match words and tokens while keeping track of indices
  const wordRegex = /[\p{L}\p{N}\u0980-\u09FF\-_']+/gu;
  let match: RegExpExecArray | null;

  while ((match = wordRegex.exec(text)) !== null) {
    const rawWord = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + rawWord.length;

    // Check Bengali
    if (isBengaliWord(rawWord)) {
      const bnMatch = BANGLA_MAP.get(rawWord);
      if (bnMatch) {
        mistakes.push({
          id: `bn-${startIndex}-${endIndex}`,
          word: rawWord,
          cleanWord: rawWord,
          startIndex,
          endIndex,
          suggestions: bnMatch.correct,
          explanation: bnMatch.explanation,
          language: "bn",
          category: "spelling",
        });
        bnCount++;
        continue;
      }

      // Check common reph-duplication pattern like ধর্ম্ম, কর্ম্ম, সূর্য্য
      const rephPattern = /([ক-হ])্\1(?=[া-ৌ]?)/;
      // If it contains reph + doubled consonant, detect suggestion
      if (/র্[ক-হ]্[ক-হ]/.test(rawWord)) {
        const fixed = rawWord.replace(/র্([ক-হ])্\1/, "র্$1");
        if (fixed !== rawWord) {
          mistakes.push({
            id: `bn-reph-${startIndex}-${endIndex}`,
            word: rawWord,
            cleanWord: rawWord,
            startIndex,
            endIndex,
            suggestions: [fixed],
            explanation: "আধুনিক বাংলা একাডেমির নিয়ম অনুযায়ী রেফের পর ব্যঞ্জনবর্ণের দ্বিত্ব বর্জনীয়।",
            language: "bn",
            category: "orthography",
          });
          bnCount++;
          continue;
        }
      }
    }

    // Check English
    const lowerEn = rawWord.toLowerCase();
    if (isEnglishWord(rawWord)) {
      const enMatch = ENGLISH_MAP.get(lowerEn);
      if (enMatch) {
        // preserve original case if capitalized
        const suggestions = enMatch.correct.map((s) => {
          if (rawWord[0] === rawWord[0].toUpperCase()) {
            return s.charAt(0).toUpperCase() + s.slice(1);
          }
          return s;
        });

        mistakes.push({
          id: `en-${startIndex}-${endIndex}`,
          word: rawWord,
          cleanWord: rawWord,
          startIndex,
          endIndex,
          suggestions,
          explanation: enMatch.explanation,
          language: "en",
          category: "spelling",
        });
        enCount++;
      }
    }
  }

  return {
    totalMistakes: mistakes.length,
    bnMistakesCount: bnCount,
    enMistakesCount: enCount,
    mistakes,
  };
}

/**
 * Replace a single mistake with the chosen suggestion.
 */
export function fixSingleMistake(
  text: string,
  mistake: SpellingMistake,
  chosenSuggestion: string
): string {
  const before = text.slice(0, mistake.startIndex);
  const after = text.slice(mistake.endIndex);
  return before + chosenSuggestion + after;
}

/**
 * Fix all detected mistakes in one click.
 */
export function fixAllMistakes(text: string, mistakes: SpellingMistake[]): string {
  if (!mistakes.length) return text;

  // Sort descending by startIndex to prevent offset shifting
  const sorted = [...mistakes].sort((a, b) => b.startIndex - a.startIndex);
  let result = text;

  for (const m of sorted) {
    if (m.suggestions.length > 0) {
      const replacement = m.suggestions[0];
      const before = result.slice(0, m.startIndex);
      const after = result.slice(m.endIndex);
      result = before + replacement + after;
    }
  }

  return result;
}
