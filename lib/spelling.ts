// Bangla and English Spelling Checker & Correction Engine
// Designed for Ahona Islam Literary Platform CMS
// Follows Bangla Academy Standard Guidelines & Common Linguistic Rules

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

interface SpellRule {
  wrong: string;
  correct: string[];
  explanation: string;
}

// 1. Comprehensive Bengali Rules & Misspellings Dictionary
// Covers Bangla Academy standard guidelines: ই-কার, ঈ-কার, ণ-ত্ব/ষ-ত্ব, রেফ-দ্বিত্ব, সন্ধি ও প্রত্যয়
const BANGLA_SPELL_RULES: SpellRule[] = [
  // সর্বাধিক সচরাচর ভুল (High Frequency Misspellings)
  { wrong: "পরিক্ষা", correct: ["পরীক্ষা"], explanation: "সংস্কৃত সন্ধিজাত শব্দে দীর্ঘ ঈ-কার (পরীক্ষা) প্রমিত।" },
  { wrong: "ব্যাবহার", correct: ["ব্যবহার"], explanation: "শুদ্ধ রূপ 'ব্যবহার' (য-ফলা আকার হবে না)।" },
  { wrong: "ব্যাবহারিক", correct: ["ব্যবহারিক"], explanation: "শুদ্ধ রূপ 'ব্যবহারিক'।" },
  { wrong: "মনযোগ", correct: ["মনোযোগ"], explanation: "ও-কার যুক্ত 'মনোযোগ' প্রমিত রূপ।" },
  { wrong: "মনযোগী", correct: ["মনোযোগী"], explanation: "শুদ্ধ রূপ 'মনোযোগী'।" },
  { wrong: "অদ্ভূত", correct: ["অদ্ভুত"], explanation: "হ্রস্ব উ-কার দিয়ে 'অদ্ভুত' লেখা প্রমিত।" },
  { wrong: "ভূল", correct: ["ভুল"], explanation: "বাংলা একাডেমি প্রমিত নিয়মে 'ভুল' হ্রস্ব উ-কার দিয়ে শুদ্ধ।" },
  { wrong: "শ্রদ্ধা", correct: ["শ্রদ্ধা"], explanation: "তালব্য-শ ও র-ফলা দিয়ে 'শ্রদ্ধা' শুদ্ধ।" },
  { wrong: "স্রদ্ধা", correct: ["শ্রদ্ধা"], explanation: "তালব্য-শ দিয়ে 'শ্রদ্ধা' শুদ্ধ রূপ।" },
  { wrong: "ধরণ", correct: ["ধরন"], explanation: "প্রকার বা রূপ বোঝাতে দন্ত্য-ন দিয়ে 'ধরন' প্রমিত।" },
  { wrong: "বিদ্যান", correct: ["বিদ্বান"], explanation: "জ্ঞানী অর্থে ব-ফলা দিয়ে 'বিদ্বান' শুদ্ধ রূপ।" },
  { wrong: "আকাংখা", correct: ["আকাঙ্ক্ষা"], explanation: "শুদ্ধ বানান 'আকাঙ্ক্ষা' (ঙ্ক্ষ যুক্ত)।" },
  { wrong: "আকাঙ্খা", correct: ["আকাঙ্ক্ষা"], explanation: "যুক্তবর্ণ ঙ্ক্ষ দিয়ে 'আকাঙ্ক্ষা' প্রমিত রূপ।" },
  { wrong: "উজ্জল", correct: ["উজ্জ্বল"], explanation: "ব-ফলা যুক্ত 'উজ্জ্বল' শুদ্ধ রূপ।" },
  { wrong: "উজ্জ্বল্য", correct: ["উজ্জ্বলতা"], explanation: "শুদ্ধ রূপ 'উজ্জ্বলতা'।" },
  { wrong: "দুরবস্থা", correct: ["দুরবস্থা"], explanation: "দুর্ + অবস্থা = দুরবস্থা (হ্রস্ব উ-কার)।" },
  { wrong: "দূরবস্থা", correct: ["দুরবস্থা"], explanation: "দুর্ + অবস্থা = দুরবস্থা (হ্রস্ব উ-কার হবে)।" },
  { wrong: "দুর্ঘটনা", correct: ["দুর্ঘটনা"], explanation: "দুর্ + ঘটনা = দুর্ঘটনা (হ্রস্ব উ-কার)।" },
  { wrong: "দূরঘটনা", correct: ["দুর্ঘটনা"], explanation: "হ্রস্ব উ-কার দিয়ে 'দুর্ঘটনা' প্রমিত রূপ।" },
  { wrong: "দূরারোগ্য", correct: ["দুরারোগ্য"], explanation: "হ্রস্ব উ-কার দিয়ে 'দুরারোগ্য' প্রমিত।" },
  { wrong: "দূরাকাঙ্ক্ষা", correct: ["দুরাকাঙ্ক্ষা"], explanation: "হ্রস্ব উ-কার দিয়ে 'দুরাকাঙ্ক্ষা' প্রমিত।" },
  { wrong: "দুরত্ব", correct: ["দূরত্ব"], explanation: "দূরত্ব শব্দে দীর্ঘ ঊ-কার (দূরত্ব) প্রমিত।" },
  { wrong: "দুর", correct: ["দূর"], explanation: "ব্যবধান বোঝাতে দীর্ঘ ঊ-কার 'দূর' শুদ্ধ রূপ।" },
  { wrong: "নূন্যতম", correct: ["ন্যূনতম"], explanation: "য-ফলা হ্রস্ব উ ও দীর্ঘ ঊ মিলে 'ন্যূনতম' শুদ্ধ।" },
  { wrong: "মুহুর্ত", correct: ["মুহূর্ত"], explanation: "হ-এ দীর্ঘ ঊ-কার দিয়ে 'মুহূর্ত' শুদ্ধ।" },
  { wrong: "কৌতহুল", correct: ["কৌতূহল"], explanation: "ত-এ দীর্ঘ ঊ-কার দিয়ে 'কৌতূহল' শুদ্ধ।" },
  { wrong: "পুজা", correct: ["পূজা"], explanation: "দীর্ঘ ঊ-কার দিয়ে 'পূজা' শুদ্ধ রূপ।" },
  { wrong: "অনুকুল", correct: ["অনুকূল"], explanation: "ক-এ দীর্ঘ ঊ-কার দিয়ে 'অনুকূল' প্রমিত।" },
  { wrong: "প্রতিকুল", correct: ["প্রতিকূল"], explanation: "ক-এ দীর্ঘ ঊ-কার দিয়ে 'প্রতিকূল' প্রমিত।" },
  { wrong: "মুমূর্ষ", correct: ["মুমূর্ষু"], explanation: "সঠিক রূপ 'মুমূর্ষু' (হ্রস্ব উ, দীর্ঘ ঊ, হ্রস্ব উ)।" },
  { wrong: "মুমুর্ষু", correct: ["মুমূর্ষু"], explanation: "মাঝের বর্ণে দীর্ঘ ঊ-কার হবে: 'মুমূর্ষু'।" },
  { wrong: "মরীচীকা", correct: ["মরীচিকা"], explanation: "প্রথমটি দীর্ঘ ঈ এবং দ্বিতীয়টি হ্রস্ব ই: 'মরীচিকা'।" },
  { wrong: "মরিচিকা", correct: ["মরীচিকা"], explanation: "সঠিক রূপ 'মরীচিকা' (র-এ দীর্ঘ ঈ-কার)।" },
  { wrong: "পিপিলিকা", correct: ["পিপীলিকা"], explanation: "সঠিক রূপ 'পিপীলিকা' (প-এ দীর্ঘ ঈ-কার)।" },
  { wrong: "বিভীষীকা", correct: ["বিভীষিকা"], explanation: "সঠিক রূপ 'বিভীষিকা' (শেষ বর্ণে হ্রস্ব ই-কার)।" },
  { wrong: "বিভীসিকা", correct: ["বিভীষিকা"], explanation: "সঠিক রূপ 'বিভীষিকা'।" },
  { wrong: "বিভিষিকা", correct: ["বিভীষিকা"], explanation: "সঠিক রূপ 'বিভীষিকা'।" },
  { wrong: "শারিরীক", correct: ["শারীরিক"], explanation: "সঠিক রূপ 'শারীরিক' (দীর্ঘ ঈ ও হ্রস্ব ই)।" },
  { wrong: "শারিরিক", correct: ["শারীরিক"], explanation: "সঠিক রূপ 'শারীরিক' (র-এ দীর্ঘ ঈ-কার)।" },
  { wrong: "সমীচিন", correct: ["সমীচীন"], explanation: "সমীচীন শব্দে উভয় বর্ণেই দীর্ঘ ঈ-কার হবে।" },
  { wrong: "সমিচীন", correct: ["সমীচীন"], explanation: "উভয় বর্ণেই দীর্ঘ ঈ-কার দিয়ে 'সমীচীন' প্রমিত।" },
  { wrong: "সমিচিন", correct: ["সমীচীন"], explanation: "উভয় বর্ণেই দীর্ঘ ঈ-কার দিয়ে 'সমীচীন' প্রমিত।" },
  { wrong: "নিরব", correct: ["নীরব"], explanation: "দীর্ঘ ঈ-কার দিয়ে 'নীরব' শুদ্ধ রূপ।" },
  { wrong: "নিরবতা", correct: ["নীরবতা"], explanation: "দীর্ঘ ঈ-কার দিয়ে 'নীরবতা' শুদ্ধ রূপ।" },
  { wrong: "নিলিমা", correct: ["নীলিমা"], explanation: "দীর্ঘ ঈ-কার দিয়ে 'নীলিমা' প্রমিত রূপ।" },
  { wrong: "নীরোগ", correct: ["নিরোগ"], explanation: "হ্রস্ব ই-কার দিয়ে 'নিরোগ' প্রমিত।" },

  // অঞ্জলি ঘটিত শব্দাবলী (হ্রস্ব ই-কার)
  { wrong: "শ্রদ্ধাঞ্জলী", correct: ["শ্রদ্ধাঞ্জলি"], explanation: "অঞ্জলি প্রত্যয়ান্ত সকল শব্দে হ্রস্ব ই-কার (ি) হবে।" },
  { wrong: "গীতাঞ্জলী", correct: ["গীতাঞ্জলি"], explanation: "অঞ্জলি প্রত্যয়ান্ত শব্দে হ্রস্ব ই-কার (ি) প্রমিত।" },
  { wrong: "পুষ্পাঞ্জলী", correct: ["পুষ্পাঞ্জলি"], explanation: "অঞ্জলি প্রত্যয়ান্ত শব্দে হ্রস্ব ই-কার প্রযোজ্য।" },
  { wrong: "জলাঞ্জলী", correct: ["জলাঞ্জলি"], explanation: "অঞ্জলি প্রত্যয়ান্ত শব্দে হ্রস্ব ই-কার প্রযোজ্য।" },
  { wrong: "অঞ্জলী", correct: ["অঞ্জলি"], explanation: "হ্রস্ব ই-কার দিয়ে 'অঞ্জলি' প্রমিত রূপ।" },

  // ষত্ব ও স-ত্ব বিধান
  { wrong: "পুরষ্কার", correct: ["পুরস্কার"], explanation: "অ-কারান্ত উপসর্গের পর স্কার (দন্ত্য-স) হয়।" },
  { wrong: "পরিস্কার", correct: ["পরিষ্কার"], explanation: "ই-কারান্ত উপসর্গের পর মূর্ধন্য-ষ (ষ্কার) হয়।" },
  { wrong: "আবিস্কার", correct: ["আবিষ্কার"], explanation: "ই-কারান্ত উপসর্গের পর মূর্ধন্য-ষ (ষ্কার) হয়।" },
  { wrong: "তিরষ্কার", correct: ["তিরস্কার"], explanation: "তিরঃ শব্দের পর দন্ত্য-স (স্কার) প্রযোজ্য।" },
  { wrong: "দুস্প্রাপ্য", correct: ["দুষ্প্রাপ্য"], explanation: "দুঃ উপসর্গের পর প্র থাকলে মূর্ধন্য-ষ হয়।" },
  { wrong: "নিষ্পাপ", correct: ["নিষ্পাপ"], explanation: "মূর্ধন্য-ষ প্রমিত।" },

  // বাংলা একাডেমি বিদেশী শব্দ ও স্ট বিধি (বিদেশী শব্দে কখনো ষ বা ষ্ট হবে না)
  { wrong: "পোষ্ট", correct: ["পোস্ট"], explanation: "বিদেশী শব্দে মূর্ধন্য-ষ/ষ্ট বর্জন করে দন্ত্য-স (স্ট) প্রমিত।" },
  { wrong: "ষ্টেশন", correct: ["স্টেশন"], explanation: "ইংরেজি ও বিদেশী শব্দে দন্ত্য-স দিয়ে 'স্টেশন' প্রমিত।" },
  { wrong: "মাষ্টার", correct: ["মাস্টার"], explanation: "বিদেশী শব্দে মূর্ধন্য-ষ হবে না, 'মাস্টার' প্রমিত।" },
  { wrong: "রেজিষ্ট্রি", correct: ["রেজিস্ট্রি"], explanation: "ইংরেজি শব্দে 'স্ট' দিয়ে 'রেজিস্ট্রি' প্রমিত।" },
  { wrong: "রেষ্টুরেন্ট", correct: ["রেস্টুরেন্ট"], explanation: "বিদেশী শব্দে 'রেস্টুরেন্ট' প্রমিত রূপ।" },
  { wrong: "ডাষ্টবিন", correct: ["ডাস্টবিন"], explanation: "ইংরেজি শব্দে 'ডাস্টবিন' প্রমিত রূপ।" },
  { wrong: "টেষ্ট", correct: ["টেস্ট"], explanation: "ইংরেজি শব্দে 'টেস্ট' প্রমিত রূপ।" },
  { wrong: "লিষ্ট", correct: ["লিস্ট"], explanation: "ইংরেজি শব্দে 'লিস্ট' প্রমিত রূপ।" },
  { wrong: "প্লাষ্টিক", correct: ["প্লাস্টিক"], explanation: "ইংরেজি শব্দে 'প্লাস্টিক' প্রমিত রূপ।" },
  { wrong: "আগাষ্ট", correct: ["আগস্ট"], explanation: "ইংরেজি শব্দে 'আগস্ট' প্রমিত রূপ।" },
  { wrong: "একাডেমী", correct: ["একাডেমি"], explanation: "অতৎসম ও বিদেশী শব্দে হ্রস্ব ই-কার (একাডেমি) প্রমিত।" },
  { wrong: "শ্রেণী", correct: ["শ্রেণি"], explanation: "বাংলা একাডেমি আধুনিক নিয়মে হ্রস্ব ই-কার (শ্রেণি) প্রমিত।" },

  // ষ্ঠ vs ষ্ট সংস্কৃত প্রত্যয় শুদ্ধিকরণ
  { wrong: "শ্রেষ্ট", correct: ["শ্রেষ্ঠ"], explanation: "ইষ্ঠ প্রত্যয়ে 'শ্রেষ্ঠ' (ষ্ঠ) প্রমিত রূপ।" },
  { wrong: "জ্যেষ্ট", correct: ["জ্যেষ্ঠ"], explanation: "শুদ্ধ রূপ 'জ্যেষ্ঠ' (ষ-এ ঠ)।" },
  { wrong: "কনিষ্ট", correct: ["কনিষ্ঠ"], explanation: "শুদ্ধ রূপ 'কনিষ্ঠ' (ষ-এ ঠ)।" },
  { wrong: "গরিষ্ট", correct: ["গরিষ্ঠ"], explanation: "শুদ্ধ রূপ 'গরিষ্ঠ' (ষ-এ ঠ)।" },
  { wrong: "লঘিষ্ট", correct: ["লঘিষ্ঠ"], explanation: "শুদ্ধ রূপ 'লঘিষ্ঠ' (ষ-এ ঠ)।" },
  { wrong: "নিষ্টা", correct: ["নিষ্ঠা"], explanation: "শুদ্ধ রূপ 'নিষ্ঠা' (ষ-এ ঠ)।" },
  { wrong: "পৃষ্টা", correct: ["পৃষ্ঠা"], explanation: "বইয়ের পাতা অর্থে 'পৃষ্ঠা' (ষ-এ ঠ)।" },
  { wrong: "অনুষ্টান", correct: ["অনুষ্ঠান"], explanation: "শুদ্ধ রূপ 'অনুষ্ঠান' (ষ-এ ঠ)।" },
  { wrong: "প্রতিষ্টান", correct: ["প্রতিষ্ঠান"], explanation: "শুদ্ধ রূপ 'প্রতিষ্ঠান' (ষ-এ ঠ)।" },
  { wrong: "প্রতিষ্টা", correct: ["প্রতিষ্ঠা"], explanation: "শুদ্ধ রূপ 'প্রতিষ্ঠা' (ষ-এ ঠ)।" },
  { wrong: "সুষ্টু", correct: ["সুষ্ঠু"], explanation: "শুদ্ধ রূপ 'সুষ্ঠু' (ষ-এ ঠ)।" },
  { wrong: "ঘনিষ্ট", correct: ["ঘনিষ্ঠ"], explanation: "শুদ্ধ রূপ 'ঘনিষ্ঠ' (ষ-এ ঠ)।" },
  { wrong: "গোষ্টি", correct: ["গোষ্ঠী"], explanation: "শুদ্ধ রূপ 'গোষ্ঠী' (ষ-এ ঠ ও দীর্ঘ ঈ)।" },
  { wrong: "গোষ্ঠি", correct: ["গোষ্ঠী"], explanation: "শুদ্ধ রূপ 'গোষ্ঠী' (দীর্ঘ ঈ-কার)।" },

  // ষ্ট ঘটিত শব্দে ভুল ষ্ঠ সংশোধন
  { wrong: "কষ্ঠ", correct: ["কষ্ট"], explanation: "কষ্ট শব্দে ষ-এ ট (কষ্ট) প্রমিত রূপ।" },
  { wrong: "নষ্ঠ", correct: ["নষ্ট"], explanation: "নষ্ট শব্দে ষ-এ ট (নষ্ট) প্রমিত রূপ।" },
  { wrong: "স্পষ্ঠ", correct: ["স্পষ্ট"], explanation: "স্পষ্ট শব্দে ষ-এ ট (স্পষ্ট) প্রমিত রূপ।" },
  { wrong: "সৃষ্ঠি", correct: ["সৃষ্টি"], explanation: "সৃষ্টি শব্দে ষ-এ ট (সৃষ্টি) প্রমিত রূপ।" },
  { wrong: "দৃষ্ঠি", correct: ["দৃষ্টি"], explanation: "দৃষ্টি শব্দে ষ-এ ট (দৃষ্টি) প্রমিত রূপ।" },
  { wrong: "বৃষ্ঠি", correct: ["বৃষ্টি"], explanation: "বৃষ্টি শব্দে ষ-এ ট (বৃষ্টি) প্রমিত রূপ।" },
  { wrong: "উৎকৃষ্ঠ", correct: ["উৎकृष्ट"], explanation: "উৎকৃষ্ট শব্দে ষ-এ ট (উৎकृष्ट) প্রমিত।" },
  { wrong: "নিকৃষ্ঠ", correct: ["নিকৃষ্ট"], explanation: "নিকৃষ্ট শব্দে ষ-এ ট (নিকৃষ্ট) প্রমিত।" },
  { wrong: "বিশিষ্ঠ", correct: ["বিশিষ্ট"], explanation: "বিশিষ্ট শব্দে ষ-এ ট (বিশিষ্ট) প্রমিত।" },

  // জীবী ঘটিত বানান (উভয় বর্ণে দীর্ঘ ঈ-কার)
  { wrong: "বুদ্ধিজীবি", correct: ["বুদ্ধিজীবী"], explanation: "জীবী প্রত্যয়ে উভয় বর্ণে দীর্ঘ ঈ-কার (বুদ্ধিজীবী) হবে।" },
  { wrong: "আইনজীবি", correct: ["আইনজীবী"], explanation: "জীবী প্রত্যয়ে উভয় বর্ণে দীর্ঘ ঈ-কার (আইনজীবী) হবে।" },
  { wrong: "চাকুরিজীবি", correct: ["চাকরিজীবী"], explanation: "প্রমিত রূপ 'চাকরিজীবী'।" },
  { wrong: "চাকরিজীবি", correct: ["চাকরিজীবী"], explanation: "জীবী প্রত্যয়ে দীর্ঘ ঈ-কার দিয়ে 'চাকরিজীবী' প্রমিত।" },
  { wrong: "পেশাজীবি", correct: ["পেশাজীবী"], explanation: "জীবী প্রত্যয়ে উভয় বর্ণে দীর্ঘ ঈ-কার হবে।" },
  { wrong: "শ্রমজীবি", correct: ["শ্রমজীবী"], explanation: "জীবী প্রত্যয়ে উভয় বর্ণে দীর্ঘ ঈ-কার হবে।" },
  { wrong: "মৎস্যজীবি", correct: ["মৎস্যজীবী"], explanation: "জীবী প্রত্যয়ে উভয় বর্ণে দীর্ঘ ঈ-কার হবে।" },
  { wrong: "কর্মজীবি", correct: ["কর্মজীবী"], explanation: "জীবী প্রত্যয়ে উভয় বর্ণে দীর্ঘ ঈ-কার হবে।" },

  // প্রত্যয় যুক্তিতে হ্রস্ব ই-কার রূপান্তর (তা/সভা)
  { wrong: "প্রতিযোগীতা", correct: ["প্রতিযোগিতা"], explanation: "তা প্রত্যয় যুক্ত হলে ঈ-কার হ্রস্ব ই-কার (প্রতিযোগিতা) হয়।" },
  { wrong: "সহযোগীতা", correct: ["সহযোগিতা"], explanation: "তা প্রত্যয় যুক্ত হলে হ্রস্ব ই-কার (সহযোগিতা) প্রমিত।" },
  { wrong: "উপযোগীতা", correct: ["উপযোগিতা"], explanation: "তা প্রত্যয়ে হ্রস্ব ই-কার (উপযোগিতা) প্রমিত।" },
  { wrong: "মন্ত্রীসভা", correct: ["মন্ত্রিসভা"], explanation: "সভা যুক্ত হলে হ্রস্ব ই-কার (মন্ত্রিসভা) হয়।" },
  { wrong: "প্রাণীবিদ্যা", correct: ["প্রাণিবিদ্যা"], explanation: "যুক্তশব্দে হ্রস্ব ই-কার (প্রাণিবিদ্যা) প্রমিত।" },
  { wrong: "প্রাণীজগৎ", correct: ["প্রাণিজগৎ"], explanation: "যুক্তশব্দে হ্রস্ব ই-কার (প্রাণিজগৎ) প্রমিত।" },

  // বাহুল্য ও প্রত্যয় দোষ
  { wrong: "সৌহার্দ্যতা", correct: ["সৌহার্দ্য", "সুহৃদতা"], explanation: "য-ফলা ও তা প্রত্যয় একসাথে বাহুল্য দোষ।" },
  { wrong: "উৎকর্ষতা", correct: ["উৎকর্ষ"], explanation: "উৎকর্ষ নিজেই বিশেষ্য, 'তা' যুক্ত করা বাহুল্য দোষ।" },
  { wrong: "দৈন্যতা", correct: ["দীনতা", "দৈন্য"], explanation: "দীনতা অথবা দৈন্য শুদ্ধ, 'দৈন্যতা' বাহুল্য দোষ।" },
  { wrong: "দারিদ্রতা", correct: ["দারিদ্র্য", "দরিদ্রতা"], explanation: "দারিদ্র্য অথবা দরিদ্রতা শুদ্ধ রূপ।" },
  { wrong: "ঐক্যতান", correct: ["ঐকতান"], explanation: "শুদ্ধ রূপ 'ঐকতান' (য-ফলা ছাড়া)।" },
  { wrong: "লজ্জাস্কর", correct: ["লজ্জাজনক"], explanation: "শুদ্ধ রূপ 'লজ্জাজনক'।" },
  { wrong: "সুস্বাগতম", correct: ["স্বাগতম"], explanation: "স্বাগতম শব্দের ভেতরেই 'সু' রয়েছে।" },
  { wrong: "নির্দোষী", correct: ["নির্দোষ"], explanation: "শুদ্ধ রূপ 'নির্দোষ' (যেমন: তিনি নির্দোষ ব্যক্তি)।" },
  { wrong: "নিপরাধী", correct: ["নিরপরাধ"], explanation: "শুদ্ধ রূপ 'নিরপরাধ'।" },
  { wrong: "নিরপরাধী", correct: ["নিরপরাধ"], explanation: "শুদ্ধ রূপ 'নিরপরাধ'।" },
  { wrong: "অহোরাত্রি", correct: ["অহোরাত্র"], explanation: "শুদ্ধ রূপ 'অহোরাত্র'।" },

  // সন্ধি ও উপসর্গ
  { wrong: "ইতিপূর্বে", correct: ["ইতোপূর্বে", "এর আগে"], explanation: "সন্ধিজাত শুদ্ধ রূপ 'ইতোপূর্বে'।" },
  { wrong: "ইতিমধ্যে", correct: ["ইতোমধ্যে"], explanation: "সন্ধিজাত শুদ্ধ রূপ 'ইতোমধ্যে'।" },
  { wrong: "উপরোক্ত", correct: ["উপরিউক্ত", "উপরের"], explanation: "সংস্কৃত সন্ধি অনুযায়ী 'উপরিউক্ত' বা বাংলা 'উপরের' শুদ্ধ।" },
  { wrong: "মনোপুত", correct: ["মনঃপূত"], explanation: "শুদ্ধ রূপ বিসর্গসহ 'মনঃপূত'।" },
  { wrong: "মনকষ্ট", correct: ["মনঃকষ্ট"], explanation: "শুদ্ধ রূপ বিসর্গসহ 'মনঃকষ্ট'।" },
  { wrong: "শিরচ্ছেদ", correct: ["শিরশ্ছেদ"], explanation: "শিরঃ + ছেদ = শিরশ্ছেদ।" },
  { wrong: "নিশব্দ", correct: ["নিঃশব্দ"], explanation: "বিসর্গযুক্ত 'নিঃশব্দ' প্রমিত।" },
  { wrong: "দুঃস্থ", correct: ["দুস্থ"], explanation: "আধুনিক বানানে বিসর্গ বর্জন করে 'দুস্থ' প্রমিত।" },
  { wrong: "নিস্পৃহ", correct: ["নিঃস্পৃহ"], explanation: "শুদ্ধ রূপ 'নিঃস্পৃহ'।" },

  // ণ-ত্ব ও স/শ বিভ্রান্তি
  { wrong: "শান্তনা", correct: ["সান্ত্বনা"], explanation: "শুদ্ধ রূপ দন্ত্য-স ও ন্ত্ব যুক্ত 'সান্ত্বনা'।" },
  { wrong: "স্বান্তনা", correct: ["সান্ত্বনা"], explanation: "শুদ্ধ রূপ 'সান্ত্বনা'।" },
  { wrong: "সান্তনা", correct: ["সান্ত্বনা"], explanation: "শুদ্ধ রূপ 'সান্ত্বনা' (ব-ফলা যুক্ত)।" },
  { wrong: "শশুর", correct: ["শ্বশুর"], explanation: "তালব্য-শ এর সাথে ব-ফলা (শ্বশুর) হবে।" },
  { wrong: "সশ্মান", correct: ["শ্মশান"], explanation: "শুদ্ধ রূপ 'শ্মশান' (তালব্য শ)।" },
  { wrong: "শশ্মান", correct: ["শ্মশান"], explanation: "শুদ্ধ রূপ 'শ্মশান'।" },
  { wrong: "স্বরণীয়", correct: ["স্মরণীয়"], explanation: "স্মৃতি অর্থে ম-ফলা দিয়ে 'স্মরণীয়' শুদ্ধ।" },
  { wrong: "স্বারক", correct: ["স্মারক"], explanation: "স্মৃতি অর্থে ম-ফলা দিয়ে 'স্মারক' শুদ্ধ।" },
  { wrong: "স্বত্বাধিকারী", correct: ["স্বত্বাধিকারী"], explanation: "মালিকানা অর্থে 'স্বত্বাধিকারী'।" },
  { wrong: "স্বত্ত্ব", correct: ["স্বত্ব"], explanation: "মালিকানা অর্থে 'স্বত্ব'।" },
  { wrong: "সত্বাধিকারী", correct: ["স্বত্বাধিকারী"], explanation: "শুদ্ধ রূপ 'স্বত্বাধিকারী'।" },
  { wrong: "সচেনতন", correct: ["সচেতন"], explanation: "শুদ্ধ বানান 'সচেতন'।" },
  { wrong: "শাপথ", correct: ["শপথ"], explanation: "শুদ্ধ বানান 'শপথ'।" },
  { wrong: "সবাইর", correct: ["সবার"], explanation: "প্রমিত বাংলায় 'সবার' শুদ্ধ রূপ।" },
  { wrong: "সাক্ষাতকার", correct: ["সাক্ষাৎকার"], explanation: "খণ্ড-ত দিয়ে 'সাক্ষাৎকার' প্রমিত।" },
  { wrong: "স্বাক্ষাৎ", correct: ["সাক্ষাৎ"], explanation: "দেখা করা অর্থে ব-ফলা ছাড়া 'সাক্ষাৎ' প্রমিত।" },
  { wrong: "সাহাজ্য", correct: ["সাহায্য"], explanation: "য-ফলা দিয়ে 'সাহায্য' প্রমিত রূপ।" },
  { wrong: "সত্বেও", correct: ["সত্ত্বেও"], explanation: "ত-এ ত-ব-ফলা দিয়ে 'সত্ত্বেও' প্রমিত রূপ।" },
  { wrong: "স্বায়ত্বশাসন", correct: ["স্বায়ত্তশাসন"], explanation: "শুদ্ধ বানান 'স্বায়ত্তশাসন' (ত্ত)।" },
  { wrong: "ইত্যাদী", correct: ["ইত্যাদি"], explanation: "হ্রস্ব ই-কার দিয়ে 'ইত্যাদি' প্রমিত রূপ।" },
  { wrong: "ঘন্টা", correct: ["ঘণ্টা"], explanation: "ট-বর্গীয় বর্ণের পূর্বে মূর্ধন্য-ণ (ঘণ্টা) প্রমিত রূপ।" },
  { wrong: "লন্ঠন", correct: ["লণ্ঠন"], explanation: "ট-বর্গীয় বর্ণের পূর্বে মূর্ধন্য-ণ (লণ্ঠন) প্রমিত।" },
  { wrong: "কান্ড", correct: ["কাণ্ড"], explanation: "ট-বর্গীয় বর্ণের পূর্বে মূর্ধন্য-ণ (কাণ্ড) প্রমিত।" },
  { wrong: "গ্রহন", correct: ["গ্রহণ"], explanation: "ণ-ত্ব বিধান অনুযায়ী মূর্ধন্য-ণ (গ্রহণ) প্রমিত।" },
  { wrong: "কারন", correct: ["কারণ"], explanation: "র এর পর মূর্ধন্য-ণ (কারণ) প্রমিত রূপ।" },
  { wrong: "ধারন", correct: ["ধারণ"], explanation: "ণ-ত্ব বিধান অনুযায়ী মূর্ধন্য-ণ (ধারণ) প্রমিত।" },
  { wrong: "বরন", correct: ["বরণ"], explanation: "ণ-ত্ব বিধান অনুযায়ী মূর্ধন্য-ণ (বরণ) প্রমিত।" },
  { wrong: "চরন", correct: ["চরণ"], explanation: "র এর পর মূর্ধন্য-ণ (চরণ) প্রমিত রূপ।" },
  { wrong: "কিরন", correct: ["কিরণ"], explanation: "র এর পর মূর্ধন্য-ণ (কিরণ) প্রমিত।" },
  { wrong: "হরিন", correct: ["হরিণ"], explanation: "র এর পর মূর্ধন্য-ণ (হরিণ) প্রমিত রূপ।" },
  { wrong: "লবন", correct: ["লবণ"], explanation: "শুদ্ধ রূপ মূর্ধন্য-ণ দিয়ে 'লবণ'।" },
  { wrong: "গননা", correct: ["গণনা"], explanation: "শুদ্ধ রূপ মূর্ধন্য-ণ দিয়ে 'গণনা'।" },
  { wrong: "গুন", correct: ["গুণ"], explanation: "শুদ্ধ রূপ মূর্ধন্য-ণ দিয়ে 'গুণ'।" },
  { wrong: "বানিজ্য", correct: ["বাণিজ্য"], explanation: "শুদ্ধ রূপ মূর্ধন্য-ণ দিয়ে 'বাণিজ্য'।" },

  // বিসর্গ লোপ
  { wrong: "মূলতঃ", correct: ["মূলত"], explanation: "বাংলা বানানে শব্দের শেষে বিসর্গ হয় না, 'মূলত' প্রমিত।" },
  { wrong: "প্রথমতঃ", correct: ["প্রথমত"], explanation: "শব্দের শেষে বিসর্গ বর্জন করে 'প্রথমত' প্রমিত।" },
  { wrong: "প্রধানতঃ", correct: ["প্রধানত"], explanation: "শব্দের শেষে বিসর্গ বর্জন করে 'প্রধানত' প্রমিত।" },
  { wrong: "ফলতঃ", correct: ["ফলত"], explanation: "শব্দের শেষে বিসর্গ বর্জন করে 'ফলত' প্রমিত।" },
  { wrong: "অন্ততঃ", correct: ["অন্তত"], explanation: "শব্দের শেষে বিসর্গ বর্জন করে 'অন্তত' প্রমিত।" },
  { wrong: "সাধারণতঃ", correct: ["সাধারণত"], explanation: "শব্দের শেষে বিসর্গ বর্জন করে 'সাধারণত' প্রমিত।" },
  { wrong: "বস্তুতঃ", correct: ["বস্তুত"], explanation: "শব্দের শেষে বিসর্গ বর্জন করে 'বস্তুত' প্রমিত।" },

  // নিত্যব্যবহৃত আধুনিক ভুল ও প্রমিত বানান
  { wrong: "বানন", correct: ["বানান"], explanation: "শুদ্ধ রূপ 'বানান'।" },
  { wrong: "হচ্চে", correct: ["হচ্ছে"], explanation: "চ-ছ যুক্তবর্ণ দিয়ে 'হচ্ছে' শুদ্ধ।" },
  { wrong: "হচ্চিল", correct: ["হচ্ছিল"], explanation: "চ-ছ যুক্তবর্ণ দিয়ে 'হচ্ছিল' শুদ্ধ।" },
  { wrong: "করসিল", correct: ["করেছিল"], explanation: "সাধু/চলিত মিশ্রণ বর্জন করে 'করেছিল' শুদ্ধ।" },
  { wrong: "করসি", correct: ["করেছি"], explanation: "প্রমিত বাংলায় 'করেছি' শুদ্ধ।" },
  { wrong: "করবো", correct: ["করব"], explanation: "আধুনিক নিয়মে উত্তম পুরুষে ও-কার বর্জন করে 'করব' প্রমিত।" },
  { wrong: "খাবো", correct: ["খাব"], explanation: "আধুনিক নিয়মে ও-কার ছাড়া 'খাব' প্রমিত।" },
  { wrong: "যাবো", correct: ["যাব"], explanation: "আধুনিক নিয়মে 'যাব' প্রমিত।" },
  { wrong: "বলবো", correct: ["বলব"], explanation: "আধুনিক নিয়মে 'বলব' প্রমিত।" },
  { wrong: "লিখবো", correct: ["লিখব"], explanation: "আধুনিক নিয়মে 'লিখব' প্রমিত।" },
  { wrong: "দেখবো", correct: ["দেখব"], explanation: "আধুনিক নিয়মে 'দেখব' প্রমিত।" },
  { wrong: "শুনবো", correct: ["শুনব"], explanation: "আধুনিক নিয়মে 'শুনব' প্রমিত।" },
  { wrong: "দাবী", correct: ["দাবি"], explanation: "বাংলা একাডেমি নিয়মে হ্রস্ব ই-কার দিয়ে 'দাবি' প্রমিত।" },
  { wrong: "বাড়ী", correct: ["বাড়ি"], explanation: "অতৎসম শব্দে হ্রস্ব ই-কার দিয়ে 'বাড়ি' প্রমিত।" },
  { wrong: "শাড়ী", correct: ["শাড়ি"], explanation: "অতৎসম শব্দে হ্রস্ব ই-কার দিয়ে 'শাড়ি' প্রমিত।" },
  { wrong: "পাখী", correct: ["পাখি"], explanation: "অতৎসম শব্দে হ্রস্ব ই-কার দিয়ে 'পাখি' প্রমিত।" },
  { wrong: "হাতী", correct: ["হাতি"], explanation: "অতৎসম শব্দে হ্রস্ব ই-কার দিয়ে 'হাতি' প্রমিত।" },
  { wrong: "বেশী", correct: ["বেশি"], explanation: "অতৎসম শব্দে হ্রস্ব ই-কার দিয়ে 'বেশি' প্রমিত।" },
  { wrong: "সরকারী", correct: ["সরকারি"], explanation: "বিদেশী/অতৎসম শব্দে হ্রস্ব ই-কার দিয়ে 'সরকারি' প্রমিত।" },
  { wrong: "তরকারী", correct: ["তরকারি"], explanation: "অতৎসম শব্দে হ্রস্ব ই-কার দিয়ে 'তরকারি' প্রমিত।" },
  { wrong: "লাইব্রেরী", correct: ["লাইব্রেরি"], explanation: "বিদেশী শব্দে হ্রস্ব ই-কার দিয়ে 'লাইব্রেরি' প্রমিত।" },
  { wrong: "ফার্মেসী", correct: ["ফার্মেসি"], explanation: "বিদেশী শব্দে হ্রস্ব ই-কার দিয়ে 'ফার্মেসি' প্রমিত।" },
  { wrong: "জানুয়ারী", correct: ["জানুয়ারি"], explanation: "ইংরেজি মাসের নামে হ্রস্ব ই-কার দিয়ে 'জানুয়ারি' প্রমিত।" },
  { wrong: "ফেব্রুয়ারী", correct: ["ফেব্রুয়ারি"], explanation: "ইংরেজি মাসের নামে হ্রস্ব ই-কার দিয়ে 'ফেব্রুয়ারি' প্রমিত।" },
  { wrong: "জরুরী", correct: ["জরুরি"], explanation: "অতৎসম ও আরবী শব্দে হ্রস্ব ই-কার দিয়ে 'জরুরি' প্রমিত।" },
  { wrong: "দরকারী", correct: ["দরকারি"], explanation: "অতৎসম শব্দে হ্রস্ব ই-কার দিয়ে 'দরকারি' প্রমিত।" },
  { wrong: "সরাসরী", correct: ["সরাসরি"], explanation: "অতৎসম শব্দে হ্রস্ব ই-কার দিয়ে 'সরাসরি' প্রমিত।" },
  { wrong: "সূচনা", correct: ["সূচনা"], explanation: "দীর্ঘ ঊ-কার দিয়ে 'সূচনা' শুদ্ধ।" },
  { wrong: "সুচনা", correct: ["সূচনা"], explanation: "দীর্ঘ ঊ-কার দিয়ে 'সূচনা' প্রমিত।" },
  { wrong: "পুর্ণ", correct: ["পূর্ণ"], explanation: "দীর্ঘ ঊ-কার দিয়ে 'পূর্ণ' প্রমিত।" },
  { wrong: "সম্পুর্ণ", correct: ["সম্পূর্ণ"], explanation: "দীর্ঘ ঊ-কার দিয়ে 'সম্পূর্ণ' প্রমিত।" },
  { wrong: "অপুর্ণ", correct: ["অপূর্ণ"], explanation: "দীর্ঘ ঊ-কার দিয়ে 'অপূর্ণ' প্রমিত।" },
  { wrong: "পুর্ণাঙ্গ", correct: ["পূর্ণাঙ্গ"], explanation: "দীর্ঘ ঊ-কার দিয়ে 'পূর্ণাঙ্গ' প্রমিত।" },
  { wrong: "পুর্নিমা", correct: ["পূর্ণিমা"], explanation: "দীর্ঘ ঊ-কার দিয়ে 'পূর্ণিমা' প্রমিত।" },
  { wrong: "সঠীক", correct: ["সঠিক"], explanation: "হ্রস্ব ই-কার দিয়ে 'সঠিক' শুদ্ধ রূপ।" },
  { wrong: "কঠীন", correct: ["কঠিন"], explanation: "হ্রস্ব ই-কার দিয়ে 'কঠিন' শুদ্ধ রূপ।" },
  { wrong: "আহবান", correct: ["আহ্বান"], explanation: "হ-এ ব-ফলা দিয়ে 'আহ্বান' প্রমিত রূপ।" },
  { wrong: "জিহবা", correct: ["জিহ্বা"], explanation: "হ-এ ব-ফলা দিয়ে 'জিহ্বা' প্রমিত রূপ।" },
  { wrong: "চিহ্ণ", correct: ["চিহ্ন"], explanation: "হ-এ দন্ত্য-ন দিয়ে 'চিহ্ন' প্রমিত রূপ।" },
  { wrong: "দ্বন্দ", correct: ["দ্বন্দ্ব"], explanation: "উভয় দ-এ ব-ফলা দিয়ে 'দ্বন্দ্ব' শুদ্ধ রূপ।" },
  { wrong: "দন্দ্ব", correct: ["দ্বন্দ্ব"], explanation: "উভয় দ-এ ব-ফলা দিয়ে 'দ্বন্দ্ব' শুদ্ধ রূপ।" },
  { wrong: "দিত্ব", correct: ["দ্বিত্ব"], explanation: "দ-এ ব-ফলা দিয়ে 'দ্বিত্ব' শুদ্ধ রূপ।" },
  { wrong: "আকষ্মিক", correct: ["আকস্মিক"], explanation: "দন্ত্য-স ও ম-ফলা দিয়ে 'আকস্মিক' প্রমিত।" },
  { wrong: "উচ্ছাস", correct: ["উচ্ছ্বাস"], explanation: "ছ-এ ব-ফলা দিয়ে 'উচ্ছ্বাস' প্রমিত রূপ।" },
  { wrong: "উচ্ছসিত", correct: ["উচ্ছ্বসিত"], explanation: "ছ-এ ব-ফলা দিয়ে 'উচ্ছ্বসিত' প্রমিত রূপ।" },
  { wrong: "বিশ্বাস", correct: ["বিশ্বাস"], explanation: "তালব্য-শ ও ব-ফলা দিয়ে 'বিশ্বাস' শুদ্ধ।" },
  { wrong: "বিস্সাস", correct: ["বিশ্বাস"], explanation: "তালব্য-শ ও ব-ফলা দিয়ে 'বিশ্বাস' প্রমিত।" },
  { wrong: "উৎসর্গীকৃত", correct: ["উৎসর্গিত", "উৎসর্গ করা"], explanation: "শুদ্ধ রূপ 'উৎসর্গিত' বা 'উৎসর্গকৃত'।" },
  { wrong: "সুশিল", correct: ["সুশীল"], explanation: "দীর্ঘ ঈ-কার দিয়ে 'সুশীল' শুদ্ধ রূপ।" },
  { wrong: "শিতল", correct: ["শীতল"], explanation: "দীর্ঘ ঈ-কার দিয়ে 'শীতল' শুদ্ধ রূপ।" },
  { wrong: "পড়াশুনা", correct: ["পড়াশোনা"], explanation: "ও-কার দিয়ে 'পড়াশোনা' প্রমিত।" },
  { wrong: "লেখাপড়া", correct: ["লেখাপড়া"], explanation: "শুদ্ধ রূপ 'লেখাপড়া'।" },
  { wrong: "ধুলোবালি", correct: ["ধুলোবালি"], explanation: "হ্রস্ব উ-কার দিয়ে 'ধুলোবালি' শুদ্ধ রূপ।" },
  { wrong: "ধূলোবালি", correct: ["ধুলোবালি"], explanation: "হ্রস্ব উ-কার দিয়ে 'ধুলোবালি' প্রমিত।" },
  { wrong: "ধূলি", correct: ["ধূলি"], explanation: "দীর্ঘ ঊ-কার দিয়ে 'ধূলি' প্রমিত।" },
  { wrong: "ধুলি", correct: ["ধূলি"], explanation: "তৎসম শব্দে দীর্ঘ ঊ-কার দিয়ে 'ধূলি' প্রমিত।" },
  { wrong: "নারী", correct: ["নারী"], explanation: "দীর্ঘ ঈ-কার দিয়ে 'নারী' শুদ্ধ রূপ।" },
  { wrong: "নারি", correct: ["নারী"], explanation: "তৎসম শব্দে দীর্ঘ ঈ-কার দিয়ে 'নারী' প্রমিত।" },
  { wrong: "তরুন", correct: ["তরুণ"], explanation: "মূর্ধন্য-ণ দিয়ে 'তরুণ' প্রমিত।" },
  { wrong: "তরুনী", correct: ["তরুণী"], explanation: "মূর্ধন্য-ণ ও দীর্ঘ ঈ-কার দিয়ে 'তরুণী' প্রমিত।" },
  { wrong: "প্রানী", correct: ["প্রাণী"], explanation: "মূর্ধন্য-ণ ও দীর্ঘ ঈ-কার দিয়ে 'প্রাণী' প্রমিত।" },
  { wrong: "স্বাক্ষী", correct: ["সাক্ষী"], explanation: "ব-ফলা ছাড়া 'সাক্ষী' প্রমিত।" },
  { wrong: "সাক্ষি", correct: ["সাক্ষী"], explanation: "দীর্ঘ ঈ-কার দিয়ে 'সাক্ষী' প্রমিত রূপ।" },
];

// Map for ultra-fast Bengali lookup
const BANGLA_MAP = new Map<string, SpellRule>();
BANGLA_SPELL_RULES.forEach((r) => {
  BANGLA_MAP.set(r.wrong, r);
});

// Common Bengali Inflectional Suffixes (longest to shortest)
const BENGALI_SUFFIXES = [
  "গুলোর", "গুলো", "গুলির", "গুলি",
  "দেরকে", "দের", "খানির", "খানি", "খানার", "খানা",
  "ভাবে", "মূলক", "টির", "টার", "টি", "টা",
  "য়ের", "ের", "র", "কে", "তে", "ে", "য়", "হীন"
];

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

/**
 * Main Spell Check Function
 * Scans text and accurately returns all detected Bengali and English spelling mistakes.
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
  // Matches Bengali words and symbols including halant and nukta
  const wordRegex = /[\p{L}\p{N}\u0980-\u09FF\-_']+/gu;
  let match: RegExpExecArray | null;

  while ((match = wordRegex.exec(text)) !== null) {
    const rawWord = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + rawWord.length;

    // Check Bengali
    if (isBengaliWord(rawWord)) {
      // 1. Direct dictionary match
      const directMatch = BANGLA_MAP.get(rawWord);
      if (directMatch) {
        mistakes.push({
          id: `bn-${startIndex}-${endIndex}`,
          word: rawWord,
          cleanWord: rawWord,
          startIndex,
          endIndex,
          suggestions: directMatch.correct,
          explanation: directMatch.explanation,
          language: "bn",
          category: "spelling",
        });
        bnCount++;
        continue;
      }

      // 2. Inflectional suffix check (e.g. পরিক্ষার, পুরষ্কারটি, শ্রদ্ধাঞ্জলীর, বুদ্ধিজীবিদের)
      let suffixMatched = false;
      for (const suffix of BENGALI_SUFFIXES) {
        if (rawWord.endsWith(suffix) && rawWord.length > suffix.length + 1) {
          const stem = rawWord.slice(0, -suffix.length);
          const stemMatch = BANGLA_MAP.get(stem);
          if (stemMatch) {
            mistakes.push({
              id: `bn-suffix-${startIndex}-${endIndex}`,
              word: rawWord,
              cleanWord: rawWord,
              startIndex,
              endIndex,
              suggestions: stemMatch.correct.map((c) => c + suffix),
              explanation: `${stemMatch.explanation} (শব্দমূল: ${stem})`,
              language: "bn",
              category: "spelling",
            });
            bnCount++;
            suffixMatched = true;
            break;
          }
        }
      }
      if (suffixMatched) continue;

      // 3. Foreign/loan word rule: English/Foreign words must not use ষ/ষ্ট, always স্ট
      // (পোষ্ট -> পোস্ট, মাষ্টার -> মাস্টার, ষ্টেশন -> স্টেশন, ইত্যাদি)
      if (rawWord.includes("ষ্ট") && /(পোষ্ট|ষ্টেশন|মাষ্টার|ডাষ্টবিন|রেজিষ্ট্রি|রেষ্টুরেন্ট|টেষ্ট|লিষ্ট|প্লাষ্টিক|আগাষ্ট|ইষ্টিমার|ওয়েষ্ট|ওয়েবসাষ্ট)/.test(rawWord)) {
        const fixed = rawWord.replace(/ষ্ট/g, "স্ট");
        mistakes.push({
          id: `bn-loan-${startIndex}-${endIndex}`,
          word: rawWord,
          cleanWord: rawWord,
          startIndex,
          endIndex,
          suggestions: [fixed],
          explanation: "বাংলা একাডেমি প্রমিত নিয়মানুযায়ী বিদেশী বা ইংরেজি শব্দে মূর্ধন্য-ষ/ষ্ট বর্জন করে দন্ত্য-স (স্ট) ব্যবহার করতে হবে।",
          language: "bn",
          category: "orthography",
        });
        bnCount++;
        continue;
      }

      // 4. Sanskrit 'ষ্ঠ' vs 'ষ্ট' confusion
      // Words that must have 'ষ্ঠ'
      if (rawWord.includes("ষ্ট") && /(শ্রেষ্ট|জ্যেষ্ট|কনিষ্ট|গরিষ্ট|লঘিষ্ট|নিষ্টা|পৃষ্টা|অনুষ্টান|প্রতিষ্টান|প্রতিষ্টা|সুষ্টু|ঘনিষ্ট|গোষ্টি)/.test(rawWord)) {
        const fixed = rawWord.replace(/ষ্ট/g, "ষ্ঠ").replace(/গোষ্টি/g, "গোষ্ঠী");
        mistakes.push({
          id: `bn-stho-${startIndex}-${endIndex}`,
          word: rawWord,
          cleanWord: rawWord,
          startIndex,
          endIndex,
          suggestions: [fixed],
          explanation: "সংস্কৃত প্রত্যয় বা শব্দমূলে এই শব্দটিতে 'ষ্ঠ' (মূর্ধন্য-ষ ও ঠ) যুক্ত হবে।",
          language: "bn",
          category: "orthography",
        });
        bnCount++;
        continue;
      }

      // Words that must have 'ষ্ট' (e.g. কষ্ঠ -> কষ্ট, নষ্ঠ -> নষ্ট, স্পষ্ঠ -> স্পষ্ট)
      if (rawWord.includes("ষ্ঠ") && /(কষ্ঠ|নষ্ঠ|স্পষ্ঠ|সৃষ্ঠি|দৃষ্ঠি|বৃষ্ঠি|উৎকৃষ্ঠ|নিকৃষ্ঠ|বিশিষ্ঠ|তুষ্ঠ|রুষ্ঠ)/.test(rawWord)) {
        const fixed = rawWord.replace(/ষ্ঠ/g, "ষ্ট");
        mistakes.push({
          id: `bn-sto-${startIndex}-${endIndex}`,
          word: rawWord,
          cleanWord: rawWord,
          startIndex,
          endIndex,
          suggestions: [fixed],
          explanation: "এই শব্দটিতে 'ষ্ট' (মূর্ধন্য-ষ ও ট) প্রমিত রূপ।",
          language: "bn",
          category: "orthography",
        });
        bnCount++;
        continue;
      }

      // 5. Reph-duplication pattern (বাংলা একাডেমি নিয়ম: রেফের পর ব্যঞ্জনবর্ণ দ্বিত্ব বর্জনীয়)
      // যেমন: ধর্ম্ম -> ধর্ম, কর্ম্ম -> কর্ম, সূর্য্য -> সূর্য, কার্য্য -> কার্য, ধৈর্য্য -> ধৈর্য, পূর্ব্ব -> পূর্ব
      if (/র্[ক-হ]্[ক-হ]/.test(rawWord)) {
        const fixed = rawWord.replace(/র্([ক-হ])্\1/, "র্$1").replace(/র্([ক-হ])্য/, "র্$1");
        if (fixed !== rawWord) {
          mistakes.push({
            id: `bn-reph-${startIndex}-${endIndex}`,
            word: rawWord,
            cleanWord: rawWord,
            startIndex,
            endIndex,
            suggestions: [fixed],
            explanation: "বাংলা একাডেমি প্রমিত বানানরীতি অনুযায়ী রেফের পর ব্যঞ্জনবর্ণের দ্বিত্ব বর্জনীয়।",
            language: "bn",
            category: "orthography",
          });
          bnCount++;
          continue;
        }
      }

      // 6. অঞ্জলি প্রত্যয়ান্ত শব্দে দীর্ঘ ঈ-কার বর্জন (যেমন: শ্রদ্ধাঞ্জলী -> শ্রদ্ধাঞ্জলি)
      if (/াঞ্জলী/.test(rawWord)) {
        const fixed = rawWord.replace(/াঞ্জলী/g, "াঞ্জলি");
        mistakes.push({
          id: `bn-anjali-${startIndex}-${endIndex}`,
          word: rawWord,
          cleanWord: rawWord,
          startIndex,
          endIndex,
          suggestions: [fixed],
          explanation: "'অঞ্জলি' যুক্ত সকল শব্দে হ্রস্ব ই-কার (ি) হবে।",
          language: "bn",
          category: "spelling",
        });
        bnCount++;
        continue;
      }

      // 7. জীবী প্রত্যয়ান্ত শব্দে দীর্ঘ ঈ-কার (যেমন: বুদ্ধিজীবি -> বুদ্ধিজীবী)
      if (/জীবি(?=[র-ে]|গুলো|$)/.test(rawWord)) {
        const fixed = rawWord.replace(/জীবি/g, "জীবী");
        mistakes.push({
          id: `bn-jibi-${startIndex}-${endIndex}`,
          word: rawWord,
          cleanWord: rawWord,
          startIndex,
          endIndex,
          suggestions: [fixed],
          explanation: "'জীবী' প্রত্যয়ে উভয় বর্ণেই দীর্ঘ ঈ-কার (জীবী) প্রযোজ্য।",
          language: "bn",
          category: "spelling",
        });
        bnCount++;
        continue;
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
