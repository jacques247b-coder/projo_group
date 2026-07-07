// PROJO GROUP — Anonymous Community Identity Generator
// Every Community Chat user gets a randomly generated display name + a
// generic emoji avatar from this built-in library. No photos, no dating
// profile data — this identity is completely separate from DatingProfile.

const ADJECTIVES = [
  "Blue", "Sunny", "Wild", "Cosmic", "Silent", "Golden", "Crimson", "Electric",
  "Mystic", "Velvet", "Amber", "Frosty", "Bold", "Gentle", "Rustic", "Vivid",
  "Rapid", "Lucky", "Noble", "Hidden",
];

const NOUNS = [
  "Fox", "Lion", "Falcon", "Panther", "Otter", "Eagle", "Wolf", "Hawk",
  "Tiger", "Dolphin", "Raven", "Stallion", "Phoenix", "Cobra", "Lynx",
  "Comet", "Sparrow", "Badger", "Heron", "Puma",
];

// Built-in avatar library — emoji + accent color, no photos, no uploads
const AVATAR_LIBRARY = [
  { key: "fox",      emoji: "🦊", color: "#E8863A" },
  { key: "lion",     emoji: "🦁", color: "#D4AF37" },
  { key: "wolf",     emoji: "🐺", color: "#6B7280" },
  { key: "owl",      emoji: "🦉", color: "#8B5CF6" },
  { key: "panther",  emoji: "🐆", color: "#111827" },
  { key: "eagle",    emoji: "🦅", color: "#2563EB" },
  { key: "dolphin",  emoji: "🐬", color: "#06B6D4" },
  { key: "tiger",    emoji: "🐯", color: "#EA580C" },
  { key: "koala",    emoji: "🐨", color: "#94A3B8" },
  { key: "panda",    emoji: "🐼", color: "#334155" },
  { key: "butterfly",emoji: "🦋", color: "#EC4899" },
  { key: "turtle",   emoji: "🐢", color: "#16A34A" },
  { key: "penguin",  emoji: "🐧", color: "#0F172A" },
  { key: "hedgehog", emoji: "🦔", color: "#A16207" },
  { key: "dragon",   emoji: "🐉", color: "#DC2626" },
  { key: "unicorn",  emoji: "🦄", color: "#C026D3" },
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDisplayName() {
  const adj = randomFrom(ADJECTIVES);
  const noun = randomFrom(NOUNS);
  const num = Math.floor(Math.random() * 900) + 100; // 100-999
  return `${adj}${noun}${num}`;
}

function generateAvatarKey() {
  return randomFrom(AVATAR_LIBRARY).key;
}

function getAvatar(key) {
  return AVATAR_LIBRARY.find((a) => a.key === key) || AVATAR_LIBRARY[0];
}

module.exports = { AVATAR_LIBRARY, generateDisplayName, generateAvatarKey, getAvatar };
