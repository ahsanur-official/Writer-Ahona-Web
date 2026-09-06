import words from "an-array-of-english-words";

const COMMON_CONTRACTIONS = [
  "don't", "can't", "won't", "isn't", "aren't", "wasn't", "weren't",
  "haven't", "hasn't", "hadn't", "doesn't", "didn't", "couldn't", "shouldn't", "wouldn't",
  "it's", "that's", "what's", "there's", "here's", "who's", "how's", "where's",
  "i'm", "you're", "he's", "she's", "we're", "they're",
  "i've", "you've", "we've", "they've",
  "i'll", "you'll", "he'll", "she'll", "we'll", "they'll",
  "i'd", "you'd", "he'd", "she'd", "we'd", "they'd",
  "let's", "ain't"
];

export const ENGLISH_WORDS: string[] = (words as string[]).concat(COMMON_CONTRACTIONS);
