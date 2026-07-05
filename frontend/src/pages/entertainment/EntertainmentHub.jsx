// PROJO GROUP — Entertainment Hub
// Netflix-style entertainment page with YouTube embeds, games, news, local ads
// Free, legal, no ongoing costs

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/ui/Navbar";
import ReadingHub from "./ReadingHub";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const G = "#e8b84b";
const BG = "#0a0a0a";
const BG2 = "#111111";
const BG3 = "#1a1a1a";
const BORDER = "rgba(232,184,75,0.08)";

// ── CONTENT LIBRARY ──────────────────────────────────────────
// All verified YouTube video IDs — tested July 2026
const CONTENT = {
  featured: [
    { id:"f1", title:"Springboks vs England — Nations Championship 2026", videoId:"qUAMswHmCjs", category:"Sports", thumb:"https://img.youtube.com/vi/qUAMswHmCjs/maxresdefault.jpg" },
    { id:"f2", title:"Cape Town Travel Guide 2026", videoId:"13u-JcPWbkQ", category:"Travel", thumb:"https://img.youtube.com/vi/13u-JcPWbkQ/maxresdefault.jpg" },
    { id:"f3", title:"Best Stand-Up Comedy Specials 2025", videoId:"Aj3hD2KwiBc", category:"Comedy", thumb:"https://img.youtube.com/vi/Aj3hD2KwiBc/maxresdefault.jpg" },
    { id:"f4", title:"2026 Rap HIIT — 20 Min Full Body", videoId:"iIGDoUMv5h4", category:"Fitness", thumb:"https://img.youtube.com/vi/iIGDoUMv5h4/maxresdefault.jpg" },
    { id:"f5", title:"Become Unstoppable 2026 — Confidence Meditation", videoId:"wC-k9B-lHok", category:"Wellness", thumb:"https://img.youtube.com/vi/wC-k9B-lHok/maxresdefault.jpg" },
  ],
  trending: [
    { id:"tr1", title:"SA Heritage Day Braai 2025 — Ultimate Platter", videoId:"kGtZ6nfYUNI", category:"Cooking", thumb:"https://img.youtube.com/vi/kGtZ6nfYUNI/maxresdefault.jpg" },
    { id:"tr2", title:"Amapiano Mix May 2026 — Romeo Makota", videoId:"5ZteaJFFTFY", category:"Music", thumb:"https://img.youtube.com/vi/5ZteaJFFTFY/maxresdefault.jpg" },
    { id:"tr3", title:"Most Viral Comedy Sets 2025 Vol.1", videoId:"Ew4C0kh67kg", category:"Comedy", thumb:"https://img.youtube.com/vi/Ew4C0kh67kg/maxresdefault.jpg" },
    { id:"tr4", title:"30 Min Cardio HIIT — 5000 Steps at Home", videoId:"DVD_gIdPr-o", category:"Fitness", thumb:"https://img.youtube.com/vi/DVD_gIdPr-o/maxresdefault.jpg" },
    { id:"tr5", title:"2026 Wellness Trends — What Works", videoId:"q7mulqQ3WZg", category:"Wellness", thumb:"https://img.youtube.com/vi/q7mulqQ3WZg/maxresdefault.jpg" },
    { id:"tr6", title:"Most Popular Recipes 2026 — Jan to March", videoId:"2Gbl4kW9Rjg", category:"Cooking", thumb:"https://img.youtube.com/vi/2Gbl4kW9Rjg/maxresdefault.jpg" },
    { id:"tr7", title:"TikTok Food Trends 2026 — Every Viral Recipe", videoId:"oSe5_TteZlQ", category:"Cooking", thumb:"https://img.youtube.com/vi/oSe5_TteZlQ/maxresdefault.jpg" },
    { id:"tr8", title:"Afrobeats vs Amapiano Mix 2026 — DJ Shinski", videoId:"KBdAZsFqVUk", category:"Music", thumb:"https://img.youtube.com/vi/KBdAZsFqVUk/maxresdefault.jpg" },
    { id:"tr9", title:"AI for Beginners 2025", videoId:"ad79nYk2keg", category:"Learning", thumb:"https://img.youtube.com/vi/ad79nYk2keg/maxresdefault.jpg" },
    { id:"tr10",title:"20 Min Pilates — Best Daily Routine 2026", videoId:"GRmaNb3cOE0", category:"Fitness", thumb:"https://img.youtube.com/vi/GRmaNb3cOE0/maxresdefault.jpg" },
  ],
  kids: [
    // Peppa Pig 2026
    { id:"k1",  title:"🐷 Peppa Pig 2026 NEW — Summer Adventures Season 10 & 11", videoId:"0gyr8ZXdwVo", category:"Kids", thumb:"https://img.youtube.com/vi/0gyr8ZXdwVo/maxresdefault.jpg" },
    { id:"k2",  title:"🐷 Peppa Pig LIVE 2026 — Big Adventures 24/7", videoId:"bXj_RK2Tb38", category:"Kids", thumb:"https://img.youtube.com/vi/bXj_RK2Tb38/maxresdefault.jpg" },
    { id:"k3",  title:"🐷 Peppa Pig NEW Episodes 2026 — Family Learning Stories", videoId:"PY79_u1ZFVo", category:"Kids", thumb:"https://img.youtube.com/vi/PY79_u1ZFVo/maxresdefault.jpg" },
    { id:"k4",  title:"🐷 Peppa Pig Tales 2025 ❄️ Snowed In!", videoId:"y4--k3YDOPI", category:"Kids", thumb:"https://img.youtube.com/vi/y4--k3YDOPI/maxresdefault.jpg" },
    { id:"k5",  title:"🐷 Peppa Pig 2026 LIVE 24/7 — Best Pig Adventures", videoId:"1l_7rRpwPTk", category:"Kids", thumb:"https://img.youtube.com/vi/1l_7rRpwPTk/maxresdefault.jpg" },
    // CoComelon 2025/2026
    { id:"k6",  title:"🍉 CoComelon New Year Song 2026 — 3 Hours Nursery Rhymes", videoId:"KLf4VBLLxKA", category:"Kids", thumb:"https://img.youtube.com/vi/KLf4VBLLxKA/maxresdefault.jpg" },
    { id:"k7",  title:"🍉 CoComelon Wheels on the Bus 2026 Version", videoId:"SRX6Y0s75C0", category:"Kids", thumb:"https://img.youtube.com/vi/SRX6Y0s75C0/maxresdefault.jpg" },
    { id:"k8",  title:"🍉 Best of CoComelon 2025 — Nursery Rhymes Kids Songs", videoId:"xfBgELKf0_U", category:"Kids", thumb:"https://img.youtube.com/vi/xfBgELKf0_U/maxresdefault.jpg" },
    { id:"k9",  title:"🍉 CoComelon Animals LIVE 2025 — Sing Along Songs", videoId:"oX0YnAnlUio", category:"Kids", thumb:"https://img.youtube.com/vi/oX0YnAnlUio/maxresdefault.jpg" },
    { id:"k10", title:"🍉 CoComelon Animal Sounds Song", videoId:"75ENi5QC-vM", category:"Kids", thumb:"https://img.youtube.com/vi/75ENi5QC-vM/maxresdefault.jpg" },
    { id:"k11", title:"🍉 CoComelon ABC Alphabet Song", videoId:"6oihoZjsV7I", category:"Kids", thumb:"https://img.youtube.com/vi/6oihoZjsV7I/maxresdefault.jpg" },
    { id:"k12", title:"🍉 CoComelon Happy New Year 2026 — Toddler Songs", videoId:"oevvpKM8QQY", category:"Kids", thumb:"https://img.youtube.com/vi/oevvpKM8QQY/maxresdefault.jpg" },
    // Learning for kids
    { id:"k13", title:"🔢 Count 1-20 — Kids Learning Songs", videoId:"DR-cfDsHCGA", category:"Kids", thumb:"https://img.youtube.com/vi/DR-cfDsHCGA/maxresdefault.jpg" },
    { id:"k14", title:"🌍 African Safari — 20 Wild Animals for Kids", videoId:"14LDUtA7G84", category:"Kids", thumb:"https://img.youtube.com/vi/14LDUtA7G84/maxresdefault.jpg" },
    { id:"k15", title:"🪐 Solar System for Kids — Planets Explained", videoId:"libKVRa01L8", category:"Kids", thumb:"https://img.youtube.com/vi/libKVRa01L8/maxresdefault.jpg" },
    { id:"k16", title:"🔤 ABC Song — Learn the Alphabet", videoId:"75p-N9YKqNo", category:"Kids", thumb:"https://img.youtube.com/vi/75p-N9YKqNo/maxresdefault.jpg" },
    { id:"k17", title:"🎨 Kids Drawing — How to Draw Animals Step by Step", videoId:"75p-N9YKqNo", category:"Kids", thumb:"https://img.youtube.com/vi/75p-N9YKqNo/maxresdefault.jpg" },
    { id:"k18", title:"🎈 CoComelon — ABC with Balloons Song", videoId:"om_1599v70c", category:"Kids", thumb:"https://img.youtube.com/vi/om_1599v70c/maxresdefault.jpg" },
    { id:"k19", title:"🐷 Peppa Pig In The Future — Official Full Episodes", videoId:"XfDyf5T4sxs", category:"Kids", thumb:"https://img.youtube.com/vi/XfDyf5T4sxs/maxresdefault.jpg" },
    { id:"k20", title:"🐷 Peppa Pig Tales 2025 — Brand New Every Week", videoId:"oWayeixv8f0", category:"Kids", thumb:"https://img.youtube.com/vi/oWayeixv8f0/maxresdefault.jpg" },
  ],
  music: [
    // Amapiano 2026
    { id:"m1",  title:"Amapiano Mix May 2026 — Romeo Makota Soulful Sunset", videoId:"5ZteaJFFTFY", category:"Music", thumb:"https://img.youtube.com/vi/5ZteaJFFTFY/maxresdefault.jpg" },
    { id:"m2",  title:"Amapiano 2026 — Nonstop SA Hits (Music Vibe ZA)", videoId:"GC0cl8aHjAY", category:"Music", thumb:"https://img.youtube.com/vi/GC0cl8aHjAY/maxresdefault.jpg" },
    { id:"m3",  title:"Amapiano Mix 2026 — New & Hottest Sounds", videoId:"e12dB9qTFVg", category:"Music", thumb:"https://img.youtube.com/vi/e12dB9qTFVg/maxresdefault.jpg" },
    { id:"m4",  title:"Amapiano Mix South Africa 2026 — Music Vibe ZA", videoId:"WyM58E60NMY", category:"Music", thumb:"https://img.youtube.com/vi/WyM58E60NMY/maxresdefault.jpg" },
    { id:"m5",  title:"Amapiano 2026 Mix — New & Trending Afro Vibes", videoId:"Gqe6BfE1RvI", category:"Music", thumb:"https://img.youtube.com/vi/Gqe6BfE1RvI/maxresdefault.jpg" },
    { id:"m6",  title:"Afrobeats x Amapiano Mix 2026 — Love & Soft Life Vibes", videoId:"zHuTFuaRquw", category:"Music", thumb:"https://img.youtube.com/vi/zHuTFuaRquw/maxresdefault.jpg" },
    { id:"m7",  title:"Afrobeat + Amapiano Mix 2026 Masterclass", videoId:"k99HmSVCocM", category:"Music", thumb:"https://img.youtube.com/vi/k99HmSVCocM/maxresdefault.jpg" },
    { id:"m8",  title:"Afrobeats vs Amapiano Vol.4 2026 — DJ Shinski", videoId:"KBdAZsFqVUk", category:"Music", thumb:"https://img.youtube.com/vi/KBdAZsFqVUk/maxresdefault.jpg" },
    { id:"m9",  title:"Amapiano 2026 Vol.III — Soulful (Shela)", videoId:"1MjTlrkEDZs", category:"Music", thumb:"https://img.youtube.com/vi/1MjTlrkEDZs/maxresdefault.jpg" },
    { id:"m10", title:"Amapiano April 2026 — Trending Songs (Musicbwoy)", videoId:"IRWLhgPkG7U", category:"Music", thumb:"https://img.youtube.com/vi/IRWLhgPkG7U/maxresdefault.jpg" },
    { id:"m11", title:"Amapiano 2026 — WE GLOBAL Vol.I (Fast Fast, AL Xapo)", videoId:"ZvjoyNOE39s", category:"Music", thumb:"https://img.youtube.com/vi/ZvjoyNOE39s/maxresdefault.jpg" },
    { id:"m12", title:"Best Amapiano Video Mix 2026 — DJ Pere", videoId:"o0WaIJDA4ug", category:"Music", thumb:"https://img.youtube.com/vi/o0WaIJDA4ug/maxresdefault.jpg" },
    { id:"m13", title:"Amapiano New Year Mix 2026", videoId:"4ngVPKwOJok", category:"Music", thumb:"https://img.youtube.com/vi/4ngVPKwOJok/maxresdefault.jpg" },
    { id:"m14", title:"Best Amapiano 2025 — OSOCITY Year Mix", videoId:"XZhu91HwUR0", category:"Music", thumb:"https://img.youtube.com/vi/XZhu91HwUR0/maxresdefault.jpg" },
    { id:"m15", title:"Amapiano December 2025 — Romeo Makota", videoId:"Lgtz-8T3DIc", category:"Music", thumb:"https://img.youtube.com/vi/Lgtz-8T3DIc/maxresdefault.jpg" },
    { id:"m16", title:"MIX Amapiano 2026 SA — Music Vibe ZA Vol.2", videoId:"IRaKDfC72R4", category:"Music", thumb:"https://img.youtube.com/vi/IRaKDfC72R4/maxresdefault.jpg" },
    // International
    { id:"m17", title:"Top Hits 2026 — Afro House Summer Mix", videoId:"8KkIw5CjwqA", category:"Music", thumb:"https://img.youtube.com/vi/8KkIw5CjwqA/maxresdefault.jpg" },
    { id:"m18", title:"Top Music 2026 — Best Pop & TikTok Hits", videoId:"p5Q2bfe-iZI", category:"Music", thumb:"https://img.youtube.com/vi/p5Q2bfe-iZI/maxresdefault.jpg" },
    { id:"m19", title:"Top 40 Global Songs 2025", videoId:"9vSdEHTVWGY", category:"Music", thumb:"https://img.youtube.com/vi/9vSdEHTVWGY/maxresdefault.jpg" },
    { id:"m20", title:"Mega Hit List 2025 — Top Songs Right Now", videoId:"1AzkGpeUQZI", category:"Music", thumb:"https://img.youtube.com/vi/1AzkGpeUQZI/maxresdefault.jpg" },
    { id:"m21", title:"Top Hits 2025 — Summer Playlist", videoId:"vp2ZoXIFJfw", category:"Music", thumb:"https://img.youtube.com/vi/vp2ZoXIFJfw/maxresdefault.jpg" },
    { id:"m22", title:"Top Hits 2025 — TikTok Viral Songs Mix", videoId:"UN5t2BxBUos", category:"Music", thumb:"https://img.youtube.com/vi/UN5t2BxBUos/maxresdefault.jpg" },
    // Gospel
    { id:"m23", title:"✝️ SA Gospel Songs Mix 2026 — Powerful African Praise", videoId:"19fyz5lAIJs", category:"Music", thumb:"https://img.youtube.com/vi/19fyz5lAIJs/maxresdefault.jpg" },
    { id:"m24", title:"✝️ Zulu Gospel 2025 — 1 Hour Powerful Praise", videoId:"sVS1JEV1-i4", category:"Music", thumb:"https://img.youtube.com/vi/sVS1JEV1-i4/maxresdefault.jpg" },
    { id:"m25", title:"✝️ Afro Gospel Playlist 2026", videoId:"MXzPCqviiVI", category:"Music", thumb:"https://img.youtube.com/vi/MXzPCqviiVI/maxresdefault.jpg" },
    { id:"m26", title:"✝️ SA Hymns — Lebo Sekgobela & Ayanda Ntanzi", videoId:"RORRqTZtPkY", category:"Music", thumb:"https://img.youtube.com/vi/RORRqTZtPkY/maxresdefault.jpg" },
    // Relaxation
    { id:"m27", title:"🧘 African Relaxation Music — Calm & Peace", videoId:"1ZYbU82GVz4", category:"Music", thumb:"https://img.youtube.com/vi/1ZYbU82GVz4/maxresdefault.jpg" },
    { id:"m28", title:"🧘 KHAYA — African Meditation Music", videoId:"9WhTzc5_cUQ", category:"Music", thumb:"https://img.youtube.com/vi/9WhTzc5_cUQ/maxresdefault.jpg" },
  ],
  comedy: [
    { id:"c1",  title:"Best Stand-Up Specials 2025 — Full Compilation", videoId:"Aj3hD2KwiBc", category:"Comedy", thumb:"https://img.youtube.com/vi/Aj3hD2KwiBc/maxresdefault.jpg" },
    { id:"c2",  title:"Best Comedy Specials 2025 Part 1 — Kelsey Cook, Trae Crowder", videoId:"bzoNW7Ugfms", category:"Comedy", thumb:"https://img.youtube.com/vi/bzoNW7Ugfms/maxresdefault.jpg" },
    { id:"c3",  title:"Best Comedy Specials 2025 Part 2 — Chad Daniels, Greg Warren", videoId:"zJ1JlP3bStk", category:"Comedy", thumb:"https://img.youtube.com/vi/zJ1JlP3bStk/maxresdefault.jpg" },
    { id:"c4",  title:"Start 2026 Right — 12 Must-Watch Comedians", videoId:"sfk9rHiDUjA", category:"Comedy", thumb:"https://img.youtube.com/vi/sfk9rHiDUjA/maxresdefault.jpg" },
    { id:"c5",  title:"Most Viral Comedy Sets 2025 Vol.1", videoId:"Ew4C0kh67kg", category:"Comedy", thumb:"https://img.youtube.com/vi/Ew4C0kh67kg/maxresdefault.jpg" },
    { id:"c6",  title:"Popular Jokes 2025 — Viral Comedians Compilation", videoId:"OfzqNh6H2jg", category:"Comedy", thumb:"https://img.youtube.com/vi/OfzqNh6H2jg/maxresdefault.jpg" },
    { id:"c7",  title:"Best Stand-Up Sets 2025 — Cracked Comedy Club", videoId:"vNlXk7vXYYQ", category:"Comedy", thumb:"https://img.youtube.com/vi/vNlXk7vXYYQ/maxresdefault.jpg" },
    { id:"c8",  title:"Best Stand-Up 2025 Vol.2 — Comedy Dynamics", videoId:"bJrwXhOVdQQ", category:"Comedy", thumb:"https://img.youtube.com/vi/bJrwXhOVdQQ/maxresdefault.jpg" },
    { id:"c9",  title:"Top 7 Jokes September 2025 — Stand-Up Compilation", videoId:"qiPHEGbvxB8", category:"Comedy", thumb:"https://img.youtube.com/vi/qiPHEGbvxB8/maxresdefault.jpg" },
    { id:"c10", title:"Fresh 2025 Jokes — Self-Driving Cybertruck Comedy", videoId:"ucxKfRE3cwM", category:"Comedy", thumb:"https://img.youtube.com/vi/ucxKfRE3cwM/maxresdefault.jpg" },
    { id:"c11", title:"SA Stand-Up — Savanna Comics Choice Awards 2024", videoId:"JavCA0w5omc", category:"Comedy", thumb:"https://img.youtube.com/vi/JavCA0w5omc/maxresdefault.jpg" },
    { id:"c12", title:"Loyiso Madinga — Comedians of the World (Netflix)", videoId:"sytJFA8ES6o", category:"Comedy", thumb:"https://img.youtube.com/vi/sytJFA8ES6o/maxresdefault.jpg" },
    { id:"c13", title:"Savanna Newcomer Comedy Showcase 2025", videoId:"Fu8GK_BulR8", category:"Comedy", thumb:"https://img.youtube.com/vi/Fu8GK_BulR8/maxresdefault.jpg" },
    { id:"c14", title:"Prins Live — SA Comedy Special", videoId:"n5OWI-5Y-Y0", category:"Comedy", thumb:"https://img.youtube.com/vi/n5OWI-5Y-Y0/maxresdefault.jpg" },
    { id:"c15", title:"Trevor Noah — South Africa Stand-Up Special", videoId:"sytJFA8ES6o", category:"Comedy", thumb:"https://img.youtube.com/vi/sytJFA8ES6o/maxresdefault.jpg" },
  ],
  fitness: [
    // HIIT 2026
    { id:"fi1",  title:"2026 Rap HIIT — 20 Min Full Body Fat Burn", videoId:"iIGDoUMv5h4", category:"Fitness", thumb:"https://img.youtube.com/vi/iIGDoUMv5h4/maxresdefault.jpg" },
    { id:"fi2",  title:"30 Min Cardio HIIT — 5000 Steps at Home", videoId:"DVD_gIdPr-o", category:"Fitness", thumb:"https://img.youtube.com/vi/DVD_gIdPr-o/maxresdefault.jpg" },
    { id:"fi3",  title:"30 Min Full Body Cardio HIIT 2025 (With Modifications)", videoId:"Okpb-ZX8a_k", category:"Fitness", thumb:"https://img.youtube.com/vi/Okpb-ZX8a_k/maxresdefault.jpg" },
    { id:"fi4",  title:"20 Min Full Body Beginner HIIT — No Equipment", videoId:"ZeJLIdQenTo", category:"Fitness", thumb:"https://img.youtube.com/vi/ZeJLIdQenTo/maxresdefault.jpg" },
    { id:"fi5",  title:"25 Min HIIT Full Body — No Equipment Needed", videoId:"cbKkB3POqaY", category:"Fitness", thumb:"https://img.youtube.com/vi/cbKkB3POqaY/maxresdefault.jpg" },
    { id:"fi6",  title:"30 Min Full Body — All Standing Low Impact HIIT", videoId:"3rdsdh5fVeY", category:"Fitness", thumb:"https://img.youtube.com/vi/3rdsdh5fVeY/maxresdefault.jpg" },
    { id:"fi7",  title:"25 Min Beginner HIIT — No Jumping", videoId:"lH0p5oQvTDY", category:"Fitness", thumb:"https://img.youtube.com/vi/lH0p5oQvTDY/maxresdefault.jpg" },
    { id:"fi8",  title:"Full Body Beginner Workout — No Equipment at Home", videoId:"WBaLczkURjQ", category:"Fitness", thumb:"https://img.youtube.com/vi/WBaLczkURjQ/maxresdefault.jpg" },
    // Pilates 2026
    { id:"fi9",  title:"20 Min Pilates Sculpt 2026 — Daily Routine", videoId:"GRmaNb3cOE0", category:"Fitness", thumb:"https://img.youtube.com/vi/GRmaNb3cOE0/maxresdefault.jpg" },
    { id:"fi10", title:"20 Min Full Body Pilates Day 1 Challenge 2026", videoId:"GD1lI0f8yg8", category:"Fitness", thumb:"https://img.youtube.com/vi/GD1lI0f8yg8/maxresdefault.jpg" },
    { id:"fi11", title:"20 Min Pilates for Beginners — Full Body No Equipment", videoId:"SPEBWOFleOI", category:"Fitness", thumb:"https://img.youtube.com/vi/SPEBWOFleOI/maxresdefault.jpg" },
    { id:"fi12", title:"30 Min Pilates Yoga — Full Body Tone & Flexibility", videoId:"Bar742jA-Zg", category:"Fitness", thumb:"https://img.youtube.com/vi/Bar742jA-Zg/maxresdefault.jpg" },
    { id:"fi13", title:"30 Min Beginner Pilates — Classical No Equipment", videoId:"QW_0H-5udr0", category:"Fitness", thumb:"https://img.youtube.com/vi/QW_0H-5udr0/maxresdefault.jpg" },
    // Yoga
    { id:"fi14", title:"Yoga for Beginners — 20 Min Full Body", videoId:"v7AYKMP6rOE", category:"Fitness", thumb:"https://img.youtube.com/vi/v7AYKMP6rOE/maxresdefault.jpg" },
    { id:"fi15", title:"30 Min Walk at Home — Low Impact Cardio", videoId:"enUB3x5Rz3Y", category:"Fitness", thumb:"https://img.youtube.com/vi/enUB3x5Rz3Y/maxresdefault.jpg" },
    { id:"fi16", title:"10 Min Abs Workout — No Equipment Needed", videoId:"DHD1-2P4nB8", category:"Fitness", thumb:"https://img.youtube.com/vi/DHD1-2P4nB8/maxresdefault.jpg" },
    { id:"fi17", title:"Joe Wicks — 15 Min HIIT Workout", videoId:"oFkzvg4_HLk", category:"Fitness", thumb:"https://img.youtube.com/vi/oFkzvg4_HLk/maxresdefault.jpg" },
  ],
  cooking: [
    // SA Braai 2025/2026
    { id:"co1",  title:"🔥 SA Heritage Day Braai 2025 — Ultimate Platter", videoId:"kGtZ6nfYUNI", category:"Cooking", thumb:"https://img.youtube.com/vi/kGtZ6nfYUNI/maxresdefault.jpg" },
    { id:"co2",  title:"🔥 50k Special — Half Lamb on the Braai 2025", videoId:"wpvttX4G-OM", category:"Cooking", thumb:"https://img.youtube.com/vi/wpvttX4G-OM/maxresdefault.jpg" },
    { id:"co3",  title:"🔥 Boerekos on the Braai — Biltong-Spiced Beef 2026", videoId:"dKYffJYf52Q", category:"Cooking", thumb:"https://img.youtube.com/vi/dKYffJYf52Q/maxresdefault.jpg" },
    { id:"co4",  title:"🔥 Shisanyama Fire Cooking — SA Braai Feast 2026", videoId:"oCssyYnsAzE", category:"Cooking", thumb:"https://img.youtube.com/vi/oCssyYnsAzE/maxresdefault.jpg" },
    { id:"co5",  title:"🥩 Oxtail & Mac Cheese Potjie on the Braai", videoId:"603SFpYUdp0", category:"Cooking", thumb:"https://img.youtube.com/vi/603SFpYUdp0/maxresdefault.jpg" },
    { id:"co6",  title:"🥩 Bush Braai — Braaivleis, Pap and Relish", videoId:"19N6KRZ-NVg", category:"Cooking", thumb:"https://img.youtube.com/vi/19N6KRZ-NVg/maxresdefault.jpg" },
    { id:"co7",  title:"🌶️ Homemade SA Chakalaka Recipe", videoId:"U4driexsnt4", category:"Cooking", thumb:"https://img.youtube.com/vi/U4driexsnt4/maxresdefault.jpg" },
    { id:"co8",  title:"🍖 10 Easy Braai Recipes 2026 — Popular in SA", videoId:"0A_7h1gJ0bs", category:"Cooking", thumb:"https://img.youtube.com/vi/0A_7h1gJ0bs/maxresdefault.jpg" },
    { id:"co9",  title:"🥩 SA Braai — Ultimate BBQ Experience", videoId:"MRf2tPsvi_4", category:"Cooking", thumb:"https://img.youtube.com/vi/MRf2tPsvi_4/maxresdefault.jpg" },
    // Trending 2026 recipes
    { id:"co10", title:"🍳 Most Loved Recipes 2026 — Jan to March", videoId:"2Gbl4kW9Rjg", category:"Cooking", thumb:"https://img.youtube.com/vi/2Gbl4kW9Rjg/maxresdefault.jpg" },
    { id:"co11", title:"🍳 TikTok Food Trends 2026 — Every Viral Recipe Q1", videoId:"oSe5_TteZlQ", category:"Cooking", thumb:"https://img.youtube.com/vi/oSe5_TteZlQ/maxresdefault.jpg" },
    { id:"co12", title:"🍳 We Try 2026's Most Viral Foods", videoId:"8JYvr04gkbk", category:"Cooking", thumb:"https://img.youtube.com/vi/8JYvr04gkbk/maxresdefault.jpg" },
    { id:"co13", title:"🍳 Testing TikTok's Biggest Food Trends 2026", videoId:"LV0UGG7xkWc", category:"Cooking", thumb:"https://img.youtube.com/vi/LV0UGG7xkWc/maxresdefault.jpg" },
    { id:"co14", title:"🍳 Viral TikTok Recipes for Days You Don't Feel Like Cooking", videoId:"JR-0B2OmJYM", category:"Cooking", thumb:"https://img.youtube.com/vi/JR-0B2OmJYM/maxresdefault.jpg" },
    { id:"co15", title:"🍳 4 Viral Recipes Actually Worth Making 2026", videoId:"Tt6KUa8b9gY", category:"Cooking", thumb:"https://img.youtube.com/vi/Tt6KUa8b9gY/maxresdefault.jpg" },
    { id:"co16", title:"🍳 5 Easy 5-Ingredient Dinners — Anyone Can Make", videoId:"bvGmhsshhqM", category:"Cooking", thumb:"https://img.youtube.com/vi/bvGmhsshhqM/maxresdefault.jpg" },
    { id:"co17", title:"🍳 Budget Family Meals Feb 2026 — Quick & Easy", videoId:"ANbQnMYNjDg", category:"Cooking", thumb:"https://img.youtube.com/vi/ANbQnMYNjDg/maxresdefault.jpg" },
    { id:"co18", title:"🍳 Gordon Ramsay's Ultimate Cooking Skills", videoId:"RFiGEbCRbCM", category:"Cooking", thumb:"https://img.youtube.com/vi/RFiGEbCRbCM/maxresdefault.jpg" },
  ],
  wellness: [
    { id:"w1",  title:"Become Unstoppable 2026 — Confidence Building Meditation", videoId:"wC-k9B-lHok", category:"Wellness", thumb:"https://img.youtube.com/vi/wC-k9B-lHok/maxresdefault.jpg" },
    { id:"w2",  title:"2026 Wellness Trends — What's Worth Your Money", videoId:"q7mulqQ3WZg", category:"Wellness", thumb:"https://img.youtube.com/vi/q7mulqQ3WZg/maxresdefault.jpg" },
    { id:"w3",  title:"Meditation for Stress & Anxiety — May 2026", videoId:"kjno6r8CAlU", category:"Wellness", thumb:"https://img.youtube.com/vi/kjno6r8CAlU/maxresdefault.jpg" },
    { id:"w4",  title:"Release, Relax, Reinvigorate — Meditation May 2026", videoId:"2yWRFK7s3_c", category:"Wellness", thumb:"https://img.youtube.com/vi/2yWRFK7s3_c/maxresdefault.jpg" },
    { id:"w5",  title:"10 Min Guided Meditation — Clear Your Mind", videoId:"uTN29kj7e-w", category:"Wellness", thumb:"https://img.youtube.com/vi/uTN29kj7e-w/maxresdefault.jpg" },
    { id:"w6",  title:"Daily Calm — 10 Min Mindfulness: Be Present", videoId:"ZToicYcHIOU", category:"Wellness", thumb:"https://img.youtube.com/vi/ZToicYcHIOU/maxresdefault.jpg" },
    { id:"w7",  title:"10 Min Meditation — Release Stress & Anxiety", videoId:"z6X5oEIg6Ak", category:"Wellness", thumb:"https://img.youtube.com/vi/z6X5oEIg6Ak/maxresdefault.jpg" },
    { id:"w8",  title:"20 Min Guided Meditation — Reduce Anxiety", videoId:"MIr3RsUWrdo", category:"Wellness", thumb:"https://img.youtube.com/vi/MIr3RsUWrdo/maxresdefault.jpg" },
    { id:"w9",  title:"10 Min Meditation — Positive Energy & Peace", videoId:"cyMxWXlX9sU", category:"Wellness", thumb:"https://img.youtube.com/vi/cyMxWXlX9sU/maxresdefault.jpg" },
    { id:"w10", title:"Meaningful Meditation August 2025", videoId:"h4MHpaDR7iw", category:"Wellness", thumb:"https://img.youtube.com/vi/h4MHpaDR7iw/maxresdefault.jpg" },
    { id:"w11", title:"Mindfulness with Sharon Salzberg — Oct 2025", videoId:"C4Ma_mOWpcQ", category:"Wellness", thumb:"https://img.youtube.com/vi/C4Ma_mOWpcQ/maxresdefault.jpg" },
    { id:"w12", title:"KHAYA — African Deep Meditation Music", videoId:"9WhTzc5_cUQ", category:"Wellness", thumb:"https://img.youtube.com/vi/9WhTzc5_cUQ/maxresdefault.jpg" },
    { id:"w13", title:"AMANI — African Meditation (Campfire)", videoId:"ClqulIR6ml8", category:"Wellness", thumb:"https://img.youtube.com/vi/ClqulIR6ml8/maxresdefault.jpg" },
    { id:"w14", title:"African Nature Sounds — Relaxing Background Music", videoId:"d-asjw9grxM", category:"Wellness", thumb:"https://img.youtube.com/vi/d-asjw9grxM/maxresdefault.jpg" },
    { id:"w15", title:"Africa 4K — Nature Relaxation Film & Tribal Music", videoId:"u91U8oPJzL8", category:"Wellness", thumb:"https://img.youtube.com/vi/u91U8oPJzL8/maxresdefault.jpg" },
    { id:"w16", title:"Whispers of Africa 2026 — Calm Zulu Voices", videoId:"UJhyXRUzBEc", category:"Wellness", thumb:"https://img.youtube.com/vi/UJhyXRUzBEc/maxresdefault.jpg" },
    { id:"w17", title:"Soothing Zulu Vocals 2026 — Deep Peace & Sleep", videoId:"ypZjgkjyy9s", category:"Wellness", thumb:"https://img.youtube.com/vi/ypZjgkjyy9s/maxresdefault.jpg" },
    { id:"w18", title:"Healing African Music — Nature Melodies 2025", videoId:"x7wMps7Od2Q", category:"Wellness", thumb:"https://img.youtube.com/vi/x7wMps7Od2Q/maxresdefault.jpg" },
    { id:"w19", title:"8 Hours Relaxing Music — African Sleep & Study", videoId:"l3RQZ4mcr1Y", category:"Wellness", thumb:"https://img.youtube.com/vi/l3RQZ4mcr1Y/maxresdefault.jpg" },
    { id:"w20", title:"African Relaxation Music — Calm & Peace", videoId:"1ZYbU82GVz4", category:"Wellness", thumb:"https://img.youtube.com/vi/1ZYbU82GVz4/maxresdefault.jpg" },
  ],
  learning: [
    { id:"l1",  title:"Learn Python — Full Course for Beginners (4 Hours)", videoId:"rfscVS0vtbw", category:"Learning", thumb:"https://img.youtube.com/vi/rfscVS0vtbw/maxresdefault.jpg" },
    { id:"l2",  title:"Personal Finance Basics — Managing Your Money SA", videoId:"HQzoZfc3GwQ", category:"Learning", thumb:"https://img.youtube.com/vi/HQzoZfc3GwQ/maxresdefault.jpg" },
    { id:"l3",  title:"AI for Beginners 2025 — Full Guide", videoId:"ad79nYk2keg", category:"Learning", thumb:"https://img.youtube.com/vi/ad79nYk2keg/maxresdefault.jpg" },
    { id:"l4",  title:"Photography Masterclass for Beginners", videoId:"LxO-6rlihSg", category:"Learning", thumb:"https://img.youtube.com/vi/LxO-6rlihSg/maxresdefault.jpg" },
    { id:"l5",  title:"How to Start a Business — Complete SA Guide", videoId:"Fl7WLnpVgD0", category:"Learning", thumb:"https://img.youtube.com/vi/Fl7WLnpVgD0/maxresdefault.jpg" },
  ],
  podcasts: [
    { id:"p1",  title:"Motivation — How to Build a Better Life", videoId:"mgmVOuLgFB0", category:"Podcast", thumb:"https://img.youtube.com/vi/mgmVOuLgFB0/maxresdefault.jpg" },
    { id:"p2",  title:"AI for Beginners — Tech Talk Africa", videoId:"ad79nYk2keg", category:"Podcast", thumb:"https://img.youtube.com/vi/ad79nYk2keg/maxresdefault.jpg" },
    { id:"p3",  title:"Personal Finance Masterclass", videoId:"HQzoZfc3GwQ", category:"Podcast", thumb:"https://img.youtube.com/vi/HQzoZfc3GwQ/maxresdefault.jpg" },
  ],
};
 PROJO GROUP — Entertainment Hub
// Netflix-style entertainment page with YouTube embeds, games, news, local ads
// Free, legal, no ongoing costs

function VideoCard({ item, onClick, size = "normal" }) {
  return (
    <div onClick={() => onClick(item)} style={{ cursor: "pointer" }}>
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: "10px", overflow: "hidden", background: BG3, marginBottom: "6px" }}>
        <img src={item.thumb} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display="none"} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>▶</div>
        </div>
        <div style={{ position: "absolute", bottom: "4px", left: "4px", background: "rgba(0,0,0,0.7)", borderRadius: "4px", padding: "1px 5px", fontSize: "9px", color: "#fff" }}>{item.category}</div>
      </div>
      <div style={{ fontSize: "11px", color: "#f0ede8", fontWeight: "600", lineHeight: 1.3 }}>{item.title}</div>
    </div>
  );
}

function VideoRow({ title, items, onPlay, rowKey, ratings, rateContent, showMore, toggleShowMore }) {
  const sorted = [...items].sort((a, b) => (ratings?.[b.id] || 3) - (ratings?.[a.id] || 3));
  const displayed = showMore?.[rowKey] ? sorted : sorted.slice(0, 10);
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px", fontWeight: "800", color: "#f0ede8" }}>{title}</div>
        {items.length > 10 && (
          <button onClick={() => toggleShowMore?.(rowKey)} style={{ background: "none", border: "none", color: "#e8b84b", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>
            {showMore?.[rowKey] ? "Show Less ↑" : `Show All (${items.length}) →`}
          </button>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px" }}>
        {displayed.map(item => (
          <div key={item.id} style={{ cursor: "pointer" }} onClick={() => onPlay(item)}>
            <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: "8px", overflow: "hidden", background: "#1a1a1a", marginBottom: "5px" }}>
              <img src={item.thumb} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display="none"} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.2)" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>▶</div>
              </div>
              {ratings?.[item.id] && (
                <div style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.7)", borderRadius: "4px", padding: "1px 5px", fontSize: "9px", color: "#e8b84b" }}>
                  {"★".repeat(ratings[item.id])}
                </div>
              )}
              <div style={{ position: "absolute", bottom: "4px", left: "4px", background: "rgba(0,0,0,0.7)", borderRadius: "4px", padding: "1px 5px", fontSize: "9px", color: "#6b6760" }}>
                {item.category}
              </div>
            </div>
            <div style={{ fontSize: "11px", color: "#f0ede8", fontWeight: "600", lineHeight: 1.3 }}>{item.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CASINO OFFERS TAB ───────────────────────────────────────
function CasinoOffersTab({ user }) {
  const G = "#e8b84b";
  const BG2 = "#111111";
  const BG3 = "#1a1a1a";
  const BORDER = "rgba(232,184,75,0.15)";
  const [ageConfirmed, setAgeConfirmed] = React.useState(() =>
    localStorage.getItem("projo_casino_18plus") === "true"
  );
  const [filter, setFilter] = React.useState("All");
  const [clickLog, setClickLog] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("projo_casino_clicks") || "{}"); }
    catch { return {}; }
  });

  function trackClick(partner) {
    const log = { ...clickLog, [partner.id]: (clickLog[partner.id] || 0) + 1 };
    setClickLog(log);
    localStorage.setItem("projo_casino_clicks", JSON.stringify(log));
  }

  const categories = ["All", "Sports Betting", "Live Casino", "Slots", "Casino", "Horse Racing"];
  const filtered = filter === "All"
    ? CASINO_PARTNERS
    : CASINO_PARTNERS.filter(p => p.categories.includes(filter));

  const featured = CASINO_PARTNERS.filter(p => p.featured);
  const newOffers = CASINO_PARTNERS.filter(p => p.isNew);

  // Age gate
  if (!ageConfirmed) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <div style={{ background: BG2, border: "1px solid rgba(239,68,68,0.3)", borderRadius: "20px", padding: "2rem", maxWidth: "380px", width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎰</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "20px", fontWeight: "800", color: G, marginBottom: "8px" }}>18+ Casino Offers</div>
          <div style={{ fontSize: "13px", color: "#b8a09a", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            This section contains gambling content and is strictly for users aged <strong style={{ color: "#f0ede8" }}>18 years and older</strong>.
          </div>
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", padding: "1rem", marginBottom: "1.5rem", textAlign: "left" }}>
            <div style={{ fontSize: "12px", color: "#f87171", fontWeight: "700", marginBottom: "8px" }}>⚠️ Please read before continuing:</div>
            {[
              "Gambling can be addictive. Please play responsibly.",
              "Only licensed SA gambling operators are promoted.",
              "You must be 18 years or older to continue.",
              "If you need help: 0800 006 008 (NRGP — free, 24/7)",
            ].map((item, i) => (
              <div key={i} style={{ fontSize: "11px", color: "#a8a49e", marginBottom: "4px", display: "flex", gap: "6px" }}>
                <span>•</span><span>{item}</span>
              </div>
            ))}
          </div>
          <button onClick={() => { localStorage.setItem("projo_casino_18plus", "true"); setAgeConfirmed(true); }}
            style={{ width: "100%", background: G, color: "#0a0a0a", border: "none", borderRadius: "12px", padding: "14px", fontWeight: "800", fontSize: "15px", cursor: "pointer", marginBottom: "10px" }}>
            I confirm I am 18+ — Enter
          </button>
          <div style={{ fontSize: "10px", color: "#4a3030" }}>By entering you confirm you are at least 18 years old and agree to gamble responsibly.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, rgba(232,184,75,0.1), rgba(167,139,250,0.05))", border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "1.25rem", marginBottom: "1.25rem" }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "18px", fontWeight: "800", color: G, marginBottom: "4px" }}>🎰 Casino & Betting Offers</div>
        <div style={{ fontSize: "12px", color: "#6b6760" }}>Licensed SA operators · Compare bonuses · Play responsibly</div>
      </div>

      {/* Responsible gambling reminder */}
      <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "10px", padding: "8px 12px", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "11px", color: "#f87171" }}>⚠️ 18+ only · Gamble responsibly · Help: 0800 006 008</div>
        <button onClick={() => { localStorage.removeItem("projo_casino_18plus"); setAgeConfirmed(false); }}
          style={{ background: "none", border: "none", color: "#4a3030", fontSize: "10px", cursor: "pointer" }}>Exit</button>
      </div>

      {/* Featured Offers */}
      {featured.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "14px", fontWeight: "800", color: "#f0ede8", marginBottom: "10px" }}>⭐ Featured Offers</div>
          {featured.map(partner => (
            <div key={partner.id} style={{ background: BG2, border: `2px solid ${partner.color}40`, borderRadius: "16px", padding: "1.25rem", marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${partner.color}20`, border: `1px solid ${partner.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>{partner.logo}</div>
                  <div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: "800", color: "#f0ede8" }}>{partner.name}</div>
                    <div style={{ display: "flex", gap: "2px" }}>{"★".repeat(partner.rating).split("").map((s,i) => <span key={i} style={{ color: G, fontSize: "10px" }}>★</span>)}</div>
                  </div>
                </div>
                <div style={{ background: `${partner.color}20`, border: `1px solid ${partner.color}40`, borderRadius: "8px", padding: "4px 10px", fontSize: "11px", color: partner.color, fontWeight: "700", flexShrink: 0, marginLeft: "8px" }}>
                  FEATURED
                </div>
              </div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px", fontWeight: "800", color: G, marginBottom: "4px" }}>{partner.bonus}</div>
              <div style={{ fontSize: "12px", color: "#6b6760", marginBottom: "12px" }}>{partner.description}</div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                {partner.categories.map(cat => (
                  <span key={cat} style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "3px 8px", fontSize: "10px", color: "#a8a49e" }}>{cat}</span>
                ))}
              </div>
              <a href={partner.url} target="_blank" rel="noreferrer" onClick={() => trackClick(partner)} style={{
                display: "block", textAlign: "center", background: partner.color,
                color: "#fff", textDecoration: "none", borderRadius: "10px",
                padding: "12px", fontWeight: "800", fontSize: "14px",
              }}>Play Now at {partner.name} ↗</a>
              <div style={{ fontSize: "9px", color: "#4a3030", marginTop: "6px", textAlign: "center" }}>{partner.terms}</div>
            </div>
          ))}
        </div>
      )}

      {/* New Offers */}
      {newOffers.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "14px", fontWeight: "800", color: "#f0ede8", marginBottom: "10px" }}>🆕 New Offers</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {newOffers.map(partner => (
              <div key={partner.id} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "1rem" }}>
                <div style={{ fontSize: "24px", marginBottom: "6px" }}>{partner.logo}</div>
                <div style={{ fontWeight: "700", color: "#f0ede8", fontSize: "13px", marginBottom: "4px" }}>{partner.name}</div>
                <div style={{ fontSize: "11px", color: G, fontWeight: "700", marginBottom: "8px" }}>{partner.bonus}</div>
                <a href={partner.url} target="_blank" rel="noreferrer" onClick={() => trackClick(partner)} style={{
                  display: "block", textAlign: "center", background: partner.color,
                  color: "#fff", textDecoration: "none", borderRadius: "8px",
                  padding: "8px", fontWeight: "700", fontSize: "12px",
                }}>Play Now ↗</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category filter */}
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "14px", fontWeight: "800", color: "#f0ede8", marginBottom: "10px" }}>🔍 All Offers</div>
      <div style={{ display: "flex", gap: "6px", overflowX: "auto", marginBottom: "12px", paddingBottom: "4px" }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{
            background: filter === cat ? "rgba(232,184,75,0.15)" : BG2,
            border: `1px solid ${filter === cat ? G : BORDER}`,
            borderRadius: "20px", padding: "5px 12px", color: filter === cat ? G : "#6b6760",
            fontSize: "11px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
          }}>{cat}</button>
        ))}
      </div>

      {/* All partners grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filtered.map(partner => (
          <div key={partner.id} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${partner.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>{partner.logo}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "700", color: "#f0ede8", fontSize: "13px" }}>{partner.name}</div>
                <div style={{ display: "flex", gap: "1px" }}>{"★".repeat(partner.rating).split("").map((s,i) => <span key={i} style={{ color: G, fontSize: "9px" }}>★</span>)}</div>
              </div>
              {partner.isNew && <span style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "4px", padding: "2px 6px", fontSize: "9px", fontWeight: "700" }}>NEW</span>}
            </div>
            <div style={{ fontSize: "13px", color: G, fontWeight: "700", marginBottom: "4px" }}>{partner.bonus}</div>
            <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "10px" }}>{partner.description}</div>
            <a href={partner.url} target="_blank" rel="noreferrer" onClick={() => trackClick(partner)} style={{
              display: "block", textAlign: "center", background: partner.color,
              color: "#fff", textDecoration: "none", borderRadius: "8px",
              padding: "10px", fontWeight: "800", fontSize: "13px",
            }}>Play Now at {partner.name} ↗</a>
            <div style={{ fontSize: "9px", color: "#4a3030", marginTop: "4px", textAlign: "center" }}>{partner.terms}</div>
          </div>
        ))}
      </div>

      {/* Responsible gambling footer */}
      <div style={{ marginTop: "1.5rem", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "12px", padding: "1rem", textAlign: "center" }}>
        <div style={{ fontSize: "12px", color: "#f87171", fontWeight: "700", marginBottom: "6px" }}>🛡️ Gamble Responsibly</div>
        <div style={{ fontSize: "11px", color: "#6b6760", lineHeight: 1.6 }}>
          All operators are licensed by South African Provincial Gambling Boards.<br />
          PROJO GROUP earns a commission when you register via these links.<br />
          <strong style={{ color: "#f87171" }}>National Responsible Gambling Programme: 0800 006 008 (Free · 24/7)</strong>
        </div>
      </div>
    </div>
  );
}

// ── LOCAL ADS ─────────────────────────────────────────────────
function LocalAdsTab({ user }) {
  const [ads, setAds] = useState([]);
  const [showSubmit, setShowSubmit] = useState(false);
  const [form, setForm] = useState({ businessName: "", category: "Restaurant", offer: "", price: "", description: "", phone: "", website: "", mediaData: null, mediaType: null, mediaName: null, isPaid: false });
  const [submitting, setSubmitting] = useState(false);

  const CATEGORIES = ["Restaurant","Retail","Service","Health","Beauty","Auto","Property","Events","Other"];

  async function loadAds() {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/entertainment/ads`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("projo_token")}` }
      });
      const data = await res.json();
      setAds(data.ads || []);
    } catch {}
  }

  useEffect(() => { loadAds(); }, []);

  async function submitAd() {
    if (!form.businessName) return toast.error("Business name required");
    setSubmitting(true);
    try {
      await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/entertainment/ads`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("projo_token")}` },
        body: JSON.stringify(form),
      });
      toast.success("Ad submitted! PROJO will review and approve within 24 hours.");
      setShowSubmit(false);
      setForm({ businessName: "", category: "Restaurant", offer: "", description: "", phone: "", website: "" });
    } catch { toast.error("Could not submit ad"); }
    finally { setSubmitting(false); }
  }

  const inp = { width: "100%", background: BG3, border: `1px solid ${BORDER}`, borderRadius: "8px", color: "#f0ede8", padding: "10px 12px", fontSize: "13px", outline: "none", fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box", marginBottom: "10px" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: "800", color: "#f0ede8" }}>🏪 Local Business Deals</div>
          <div style={{ fontSize: "11px", color: "#6b6760" }}>Exclusive deals from Rustenburg businesses</div>
        </div>
        <button onClick={() => setShowSubmit(true)} style={{ background: G, color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
          + Advertise
        </button>
      </div>

      {/* Paid Ads Banner */}
      {ads.filter(a => a.isPaid).length > 0 && (
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ background: "linear-gradient(135deg, rgba(232,184,75,0.15), rgba(232,184,75,0.05))", border: `1px solid ${G}`, borderRadius: "14px", padding: "10px 14px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px" }}>⭐</span>
            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "13px", fontWeight: "800", color: G }}>Featured Businesses</span>
            <span style={{ fontSize: "10px", color: "#6b6760", marginLeft: "auto" }}>Promoted</span>
          </div>
          {ads.filter(a => a.isPaid).map(ad => (
            <div key={ad.id} style={{ background: BG2, border: `2px solid ${G}40`, borderRadius: "14px", padding: "1rem", marginBottom: "10px" }}>
              {ad.mediaData && ad.mediaType?.startsWith("image") && (
                <img src={ad.mediaData} alt={ad.businessName} style={{ width: "100%", borderRadius: "10px", marginBottom: "10px", maxHeight: "200px", objectFit: "cover" }} />
              )}
              {ad.mediaData && ad.mediaType?.startsWith("video") && (
                <video src={ad.mediaData} controls style={{ width: "100%", borderRadius: "10px", marginBottom: "10px", maxHeight: "200px" }} />
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: "700", color: "#f0ede8", fontSize: "15px" }}>{ad.businessName}</div>
                  <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "2px" }}>{ad.category}</div>
                </div>
                <div style={{ background: "rgba(232,184,75,0.15)", border: `1px solid ${G}`, borderRadius: "8px", padding: "4px 10px", fontSize: "11px", color: G, fontWeight: "700" }}>⭐ Featured</div>
              </div>
              <div style={{ fontSize: "14px", color: G, fontWeight: "700", margin: "8px 0" }}>{ad.offer}</div>
              {ad.description && <div style={{ fontSize: "12px", color: "#6b6760", marginBottom: "8px" }}>{ad.description}</div>}
              <div style={{ display: "flex", gap: "8px" }}>
                {ad.phone && <a href={`tel:${ad.phone}`} style={{ background: "#166534", border: "1px solid #4ade80", borderRadius: "8px", padding: "6px 12px", color: "#4ade80", fontSize: "12px", fontWeight: "700", textDecoration: "none" }}>📞 Call</a>}
                {ad.website && <a href={ad.website} target="_blank" rel="noreferrer" style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "6px 12px", color: G, fontSize: "12px", fontWeight: "700", textDecoration: "none" }}>🌐 Website ↗</a>}
              </div>
            </div>
          ))}
        </div>
      )}

      {ads.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#6b6760" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏪</div>
          <div style={{ fontWeight: "700", marginBottom: "8px" }}>No active deals yet</div>
          <div style={{ fontSize: "12px", marginBottom: "16px" }}>Be the first Rustenburg business to advertise here!</div>
          <button onClick={() => setShowSubmit(true)} style={{ background: G, color: "#0a0a0a", border: "none", borderRadius: "10px", padding: "12px 24px", fontWeight: "700", cursor: "pointer" }}>
            Submit Your Deal
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {ads.map(ad => (
          <div key={ad.id} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: "700", color: "#f0ede8", fontSize: "15px" }}>{ad.businessName}</div>
                <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "2px" }}>{ad.category}</div>
              </div>
              <div style={{ background: "rgba(232,184,75,0.15)", border: `1px solid ${G}`, borderRadius: "8px", padding: "4px 10px", fontSize: "11px", color: G, fontWeight: "700" }}>Special Offer</div>
            </div>
            <div style={{ fontSize: "14px", color: G, fontWeight: "700", margin: "8px 0" }}>{ad.offer}</div>
            {ad.description && <div style={{ fontSize: "12px", color: "#6b6760", marginBottom: "8px" }}>{ad.description}</div>}
            <div style={{ display: "flex", gap: "8px" }}>
              {ad.phone && <a href={`tel:${ad.phone}`} style={{ background: "#166534", border: "1px solid #4ade80", borderRadius: "8px", padding: "6px 12px", color: "#4ade80", fontSize: "12px", fontWeight: "700", textDecoration: "none" }}>📞 Call</a>}
              {ad.website && <a href={ad.website} target="_blank" rel="noreferrer" style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "6px 12px", color: G, fontSize: "12px", fontWeight: "700", textDecoration: "none" }}>🌐 Website ↗</a>}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Ad Modal */}
      {showSubmit && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: BG2, borderRadius: "20px 20px 0 0", padding: "1.5rem", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "18px", fontWeight: "800", color: G, marginBottom: "4px" }}>Advertise Your Business</div>
            <div style={{ fontSize: "12px", color: "#6b6760", marginBottom: "1.25rem" }}>Submit your deal for review. PROJO will approve within 24 hours. Reach thousands of app users in Rustenburg!</div>
            <input style={inp} placeholder="Business Name *" value={form.businessName} onChange={e => setForm(f => ({...f, businessName: e.target.value}))} />
            <select style={inp} value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input style={inp} placeholder="Special Offer (e.g. 20% off all meals) — optional" value={form.offer} onChange={e => setForm(f => ({...f, offer: e.target.value}))} />
            <input style={inp} placeholder="Price / Pricing info — optional (e.g. From R99)" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} />
            <textarea style={{...inp, minHeight: "80px", resize: "vertical"}} placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
            <input style={inp} placeholder="Phone Number" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
            <input style={inp} placeholder="Website (optional)" value={form.website} onChange={e => setForm(f => ({...f, website: e.target.value}))} />

            {/* Media upload */}
            <div style={{ marginBottom: "10px" }}>
              <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "6px", textTransform: "uppercase" }}>Ad Media (Optional)</div>
              <input type="file" accept="image/png,image/jpeg,video/mp4,video/mpeg" onChange={e => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 10 * 1024 * 1024) return toast.error("File too large. Max 10MB");
                const reader = new FileReader();
                reader.onload = ev => setForm(f => ({ ...f, mediaData: ev.target.result, mediaType: file.type, mediaName: file.name }));
                reader.readAsDataURL(file);
              }} style={{ ...inp, padding: "8px" }} />
              {form.mediaData && (
                <div style={{ marginTop: "8px" }}>
                  {form.mediaType?.startsWith("image") ? (
                    <img src={form.mediaData} alt="Ad preview" style={{ width: "100%", borderRadius: "8px", maxHeight: "150px", objectFit: "cover" }} />
                  ) : (
                    <video src={form.mediaData} controls style={{ width: "100%", borderRadius: "8px", maxHeight: "150px" }} />
                  )}
                </div>
              )}
              <div style={{ fontSize: "10px", color: "#4a3030", marginTop: "4px" }}>Supported: PNG, JPEG, MP4, MPEG · Max 10MB · Instagram size (1080×1080) recommended for best display</div>
            </div>

            {/* Paid promotion option */}
            <div style={{ background: "rgba(232,184,75,0.05)", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "12px", marginBottom: "10px" }}>
              <div style={{ fontSize: "12px", color: G, fontWeight: "700", marginBottom: "6px" }}>⭐ Paid Promotion — R170/month</div>
              <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "8px", lineHeight: 1.5 }}>
                Get featured at the top of the app AND posted to PROJO social media platforms & groups once per week. Upscalable for more posts.
              </div>
              <div onClick={() => setForm(f => ({ ...f, isPaid: !f.isPaid }))} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <div style={{ width: "44px", height: "24px", borderRadius: "12px", background: form.isPaid ? G : BG3, border: `1px solid ${form.isPaid ? G : BORDER}`, position: "relative", transition: "all .2s" }}>
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: form.isPaid ? "#0a0a0a" : "#6b6760", position: "absolute", top: "3px", left: form.isPaid ? "22px" : "3px", transition: "left .2s" }} />
                </div>
                <span style={{ fontSize: "12px", color: "#f0ede8", fontWeight: "700" }}>Include Paid Promotion (R170/month)</span>
              </div>
            </div>

            <div style={{ fontSize: "11px", color: "#6b6760", marginBottom: "12px" }}>
              ✓ Free to submit · ✓ PROJO reviews within 24hrs · ✓ Reaches all app users · ✓ Basic listings are free
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={submitAd} disabled={submitting} style={{ flex: 1, background: G, color: "#0a0a0a", border: "none", borderRadius: "10px", padding: "14px", fontWeight: "800", fontSize: "14px", cursor: "pointer" }}>
                {submitting ? "Submitting..." : "Submit for Approval"}
              </button>
              <button onClick={() => setShowSubmit(false)} style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "14px 20px", color: "#6b6760", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────
export default function EntertainmentHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("home");
  const [playing, setPlaying] = useState(null);
  const [activeGame, setActiveGame] = useState(null);
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [ratings, setRatings] = useState(() => {
    try { return JSON.parse(localStorage.getItem("projo_content_ratings") || "{}"); } catch { return {}; }
  });
  const [showMore, setShowMore] = useState({});
  const [musicFilter, setMusicFilter] = useState('All');
  const [activeNews, setActiveNews] = useState(null);
  const [newsHeadlines, setNewsHeadlines] = useState({});
  const [newsLoading, setNewsLoading] = useState(false);

  // Fetch headlines when news source selected
  useEffect(() => {
    if (!activeNews || !activeNews.feedKey) return;
    const key = activeNews.feedKey;
    const name = activeNews.name;
    setNewsLoading(true);
    setNewsHeadlines(prev => ({ ...prev })); // force re-render
    const controller = new AbortController();
    fetch(`https://projo-group-backend.onrender.com/api/news/${key}`, { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          setNewsHeadlines(prev => ({ ...prev, [name]: data.items }));
        } else {
          setNewsHeadlines(prev => ({ ...prev, [name]: [] }));
        }
        setNewsLoading(false);
      })
      .catch(e => {
        if (e.name !== 'AbortError') {
          setNewsHeadlines(prev => ({ ...prev, [name]: [] }));
          setNewsLoading(false);
        }
      });
    return () => controller.abort();
  }, [activeNews]);

  function rateContent(id, stars) {
    const nr = { ...ratings, [id]: stars };
    setRatings(nr);
    localStorage.setItem("projo_content_ratings", JSON.stringify(nr));
  }

  function getTop10(items) {
    return [...items].sort((a, b) => (ratings[b.id] || 3) - (ratings[a.id] || 3)).slice(0, 10);
  }

  function toggleShowMore(key) {
    setShowMore(prev => ({ ...prev, [key]: !prev[key] }));
  }
  const [radioPlaying, setRadioPlaying] = useState(null);
  const [radioFilter, setRadioFilter] = useState("All");
  const audioRef = React.useRef(null);

  function playRadio(station) {
    if (!station.stream) {
      window.open(station.url, "_blank");
      return;
    }
    if (radioPlaying?.id === station.id) {
      audioRef.current?.pause();
      setRadioPlaying(null);
      return;
    }
    setRadioPlaying(station);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.src = station.stream;
        audioRef.current.play().catch(() => {
          // Fallback to browser
          window.open(station.url, "_blank");
          setRadioPlaying(null);
        });
      }
    }, 100);
  }
  const [search, setSearch] = useState("");
  const [newsCategory, setNewsCategory] = useState(0);

  // Auto-rotate featured banner
  useEffect(() => {
    const timer = setInterval(() => setFeaturedIdx(i => (i + 1) % CONTENT.featured.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const allContent = Object.values(CONTENT).flat();
  const searchResults = search.length > 1 ? allContent.filter(v => v.title.toLowerCase().includes(search.toLowerCase())) : [];

  function playVideo(item) { setPlaying(item); window.scrollTo(0, 0); }

  const featured = CONTENT.featured[featuredIdx];

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'DM Sans',sans-serif", paddingBottom: "5rem" }}>
      <Navbar />

      {/* Video Player */}
      {playing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ width: "100%", maxWidth: "800px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: "800", color: "#f0ede8" }}>{playing.title}</div>
              <button onClick={() => setPlaying(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer", fontSize: "16px" }}>✕</button>
            </div>
            <iframe src={`https://www.youtube.com/embed/${playing.videoId}?autoplay=1`} title={playing.title} style={{ width: "100%", aspectRatio: "16/9", border: "none", borderRadius: "12px" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
            <span style={{ fontSize: "12px", color: "#6b6760" }}>Rate:</span>
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => rateContent(playing.id, s)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", filter: (ratings[playing.id] || 0) >= s ? "none" : "grayscale(100%)" }}>⭐</button>
            ))}
          </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ background: BG2, borderBottom: `1px solid ${BORDER}`, paddingTop: "72px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "12px 1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: "6px" }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setActiveGame(null); }} style={{
                background: tab === t.key ? "rgba(232,184,75,0.15)" : BG3,
                border: `1px solid ${tab === t.key ? G : BORDER}`,
                borderRadius: "12px", padding: "10px 6px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
              }}>
                <span style={{ fontSize: "22px", lineHeight: 1 }}>{t.label}</span>
                <span style={{ fontSize: "10px", fontWeight: "700", color: tab === t.key ? G : "#a8a49e", whiteSpace: "nowrap" }}>{t.full}</span>
              </button>
            ))}
          </div>

        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.25rem 1rem" }}>

        {/* Search bar */}
        <div style={{ marginBottom: "1.25rem" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search videos, music, learning..."
            style={{ width: "100%", background: BG2, border: `1px solid ${BORDER}`, borderRadius: "10px", color: "#f0ede8", padding: "12px 16px", fontSize: "13px", outline: "none", fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box" }} />
          {searchResults.length > 0 && (
            <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingTop: "12px" }}>
              {searchResults.map(item => <VideoCard key={item.id} item={item} onClick={playVideo} size="small" />)}
            </div>
          )}
        </div>

        {/* ── HOME TAB ── */}
        {tab === "home" && (
          <div>
            {/* Featured Banner */}
            <div onClick={() => playVideo(featured)} style={{ position: "relative", borderRadius: "20px", overflow: "hidden", marginBottom: "1.5rem", cursor: "pointer", aspectRatio: "16/7" }}>
              <img src={featured.thumb} alt={featured.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }} />
              <div style={{ position: "absolute", bottom: "1.25rem", left: "1.25rem", right: "1.25rem" }}>
                <div style={{ fontSize: "10px", color: G, fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px" }}>{featured.category}</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.4rem", fontWeight: "800", color: "#fff", marginBottom: "10px" }}>{featured.title}</div>
                <button style={{ background: "#fff", color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "10px 20px", fontWeight: "800", fontSize: "13px", cursor: "pointer" }}>▶ Play Now</button>
              </div>
              {/* Dots */}
              <div style={{ position: "absolute", bottom: "12px", right: "12px", display: "flex", gap: "4px" }}>
                {CONTENT.featured.map((_, i) => <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: i === featuredIdx ? G : "rgba(255,255,255,0.4)" }} />)}
              </div>
            </div>

            <VideoRow title="🔥 Trending Now" items={CONTENT.trending} onPlay={playVideo} />
            <VideoRow title="🎵 Music" items={CONTENT.music} onPlay={playVideo} />
            <VideoRow title="📚 Learning" items={CONTENT.learning} onPlay={playVideo} />
            <VideoRow title="👶 Kids" items={CONTENT.kids.slice(0,5)} onPlay={playVideo} />
            <VideoRow title="😂 SA Comedy" items={CONTENT.comedy.slice(0,4)} onPlay={playVideo} />
            <VideoRow title="💪 Fitness" items={CONTENT.fitness.slice(0,3)} onPlay={playVideo} />
            <VideoRow title="🍳 SA Cooking & Braai" items={CONTENT.cooking.slice(0,4)} onPlay={playVideo} />
            <VideoRow title="🧘 Wellness & Meditation" items={CONTENT.wellness.slice(0,3)} onPlay={playVideo} />

            {/* Games promo */}
            <div onClick={() => setTab("games")} style={{ background: "linear-gradient(135deg, #1a0a2e, #0a1a2e)", border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "1.25rem", marginBottom: "1.5rem", cursor: "pointer" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: "800", color: G, marginBottom: "6px" }}>🎮 Play Games</div>
              <div style={{ fontSize: "12px", color: "#6b6760", marginBottom: "12px" }}>2048, Memory, Trivia & more — free to play</div>
              <div style={{ display: "flex", gap: "10px" }}>
                {GAMES.slice(0,4).map(g => <div key={g.id} style={{ fontSize: "24px" }}>{g.icon}</div>)}
              </div>
            </div>

            <VideoRow title="🎙️ Podcasts" items={CONTENT.podcasts} onPlay={playVideo} />
          </div>
        )}

        {/* ── KIDS TAB ── */}
        {tab === "kids" && (
          <div>
            <div style={{ background: "linear-gradient(135deg, #1a2e0a, #0a1a2e)", borderRadius: "16px", padding: "1.25rem", marginBottom: "1.5rem", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>👶 🌈 🦁</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "20px", fontWeight: "800", color: G }}>Kids Zone</div>
              <div style={{ fontSize: "12px", color: "#6b6760" }}>Safe, fun, educational content</div>
            </div>
            {[
              { emoji: "🔤", label: "Alphabet & Numbers", items: CONTENT.kids.slice(0,2) },
              { emoji: "🦁", label: "Animals & Nature", items: CONTENT.kids.slice(2,4) },
              { emoji: "🚀", label: "Science & Space", items: CONTENT.kids.slice(4) },
            ].map(section => (
              <div key={section.label} style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px", fontWeight: "800", color: "#f0ede8", marginBottom: "12px" }}>{section.emoji} {section.label}</div>
                <div style={{ display: "flex", gap: "12px", overflowX: "auto" }}>
                  {section.items.map(item => <VideoCard key={item.id} item={item} onClick={playVideo} size="large" />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── MUSIC TAB ── */}
        {tab === "music" && (
          <div>
            {/* Hidden audio element for radio */}
            <audio ref={audioRef} style={{ display: "none" }} />

            {/* Radio section */}
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: "800", color: "#f0ede8", marginBottom: "12px" }}>📻 Live Radio</div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", overflowX: "auto" }}>
              {["All", "North West", "National"].map(f => (
                <button key={f} onClick={() => setRadioFilter(f)} style={{
                  background: radioFilter === f ? "rgba(232,184,75,0.15)" : BG2,
                  border: `1px solid ${radioFilter === f ? G : BORDER}`,
                  borderRadius: "8px", padding: "6px 14px", color: radioFilter === f ? G : "#6b6760",
                  fontSize: "12px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap",
                }}>{f}</button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "1.5rem" }}>
              {RADIO_STATIONS.filter(s => radioFilter === "All" || s.region === radioFilter).map(station => (
                <div key={station.id} onClick={() => playRadio(station)} style={{
                  background: radioPlaying?.id === station.id ? "rgba(232,184,75,0.08)" : BG2,
                  border: `1px solid ${radioPlaying?.id === station.id ? G : BORDER}`,
                  borderRadius: "14px", padding: "12px 14px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "12px",
                }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: `${station.color}20`, border: `2px solid ${station.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
                    {radioPlaying?.id === station.id ? "⏸" : station.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "700", color: "#f0ede8", fontSize: "13px" }}>{station.name}</div>
                    <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "2px" }}>{station.freq} · {station.desc}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                    {radioPlaying?.id === station.id && (
                      <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                        {[1,2,3].map(i => <div key={i} style={{ width: "3px", background: G, borderRadius: "2px", animation: `eq${i} 0.8s ease-in-out infinite alternate`, height: `${8+i*4}px` }} />)}
                      </div>
                    )}
                    <div style={{ fontSize: "10px", color: station.region === "North West" ? G : "#6b6760", fontWeight: "700" }}>{station.region}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Now Playing bar */}
            {radioPlaying && (
              <div style={{ position: "fixed", bottom: "70px", left: 0, right: 0, zIndex: 100, padding: "0 1rem", maxWidth: "900px", margin: "0 auto" }}>
                <div style={{ background: BG3, border: `1px solid ${G}`, borderRadius: "14px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "12px", boxShadow: `0 0 20px rgba(232,184,75,0.2)` }}>
                  <div style={{ fontSize: "20px" }}>{radioPlaying.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: G }}>{radioPlaying.name}</div>
                    <div style={{ fontSize: "11px", color: "#6b6760" }}>🔴 LIVE</div>
                  </div>
                  <button onClick={() => { audioRef.current?.pause(); setRadioPlaying(null); }} style={{ background: "none", border: "none", color: "#f87171", fontSize: "18px", cursor: "pointer" }}>⏹</button>
                </div>
              </div>
            )}

            {/* Free Music */}
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: "800", color: "#f0ede8", marginBottom: "8px" }}>🎵 Free Music</div>
            {(() => {
              const genres = ["All", "Amapiano", "Afrikaans", "2026 Hits", "International", "Gospel", "Relaxation"];
              const filtered = musicFilter === "All" ? FREE_MUSIC : FREE_MUSIC.filter(t => t.genre.includes(musicFilter));
              return (
                <>
                  <div style={{ display: "flex", gap: "6px", overflowX: "auto", marginBottom: "12px", paddingBottom: "4px" }}>
                    {genres.map(g => (
                      <button key={g} onClick={() => setMusicFilter(g)} style={{
                        background: musicFilter === g ? "rgba(232,184,75,0.15)" : BG2,
                        border: `1px solid ${musicFilter === g ? G : BORDER}`,
                        borderRadius: "20px", padding: "4px 12px", color: musicFilter === g ? G : "#6b6760",
                        fontSize: "11px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                      }}>{g}</button>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px", marginBottom: "1.5rem" }}>
                    {filtered.map(track => (
                      <div key={track.id} onClick={() => playVideo({ ...track, title: track.title })} style={{ cursor: "pointer" }}>
                        <div style={{ position: "relative", width: "100%", aspectRatio: "1", borderRadius: "10px", overflow: "hidden", background: BG3, marginBottom: "6px" }}>
                          <img src={track.thumb} alt={track.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display="none"} />
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>▶</div>
                          </div>
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent,rgba(0,0,0,0.8))", padding: "4px 6px" }}>
                            <div style={{ fontSize: "9px", color: G, fontWeight: "700" }}>{track.genre}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: "10px", color: "#f0ede8", fontWeight: "600", lineHeight: 1.3 }}>{track.title}</div>
                        <div style={{ fontSize: "9px", color: "#6b6760", marginTop: "1px" }}>{track.artist}</div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}


            <VideoRow title="🎙️ Podcasts" items={CONTENT.podcasts} onPlay={playVideo} />
          </div>
        )}

        {/* ── LEARNING TAB ── */}
        {tab === "learning" && (
          <div>
            <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px", fontWeight: "800", color: G, marginBottom: "6px" }}>📚 Learn Something New Today</div>
              <div style={{ fontSize: "12px", color: "#6b6760" }}>Business, Tech, Finance, Coding & more</div>
            </div>
            <VideoRow title="🚀 Business & Entrepreneurship" items={CONTENT.learning.slice(0,2)} onPlay={playVideo} />
            <VideoRow title="💻 Technology & Coding" items={CONTENT.learning.slice(2,4)} onPlay={playVideo} />
            <VideoRow title="📷 Creative Skills" items={CONTENT.learning.slice(4)} onPlay={playVideo} />
          </div>
        )}

        {/* ── PODCASTS TAB ── */}
        {tab === "podcasts" && <VideoRow title="🎙️ Featured Podcasts" items={CONTENT.podcasts} onPlay={playVideo} />}

        {/* ── NEWS TAB ── */}
        {tab === "news" && (
          <div>
            {/* Category filter pills */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "1rem", overflowX: "auto" }}>
              {[{ label: "📰 All", idx: 0 }, { label: "🇿🇦 SA", idx: 1 }, { label: "🌍 World", idx: 2 }, { label: "💼 Business", idx: 3 }, { label: "⚽ Sports", idx: 4 }].map(f => (
                <button key={f.idx} onClick={() => setNewsCategory(f.idx)} style={{
                  background: newsCategory === f.idx ? "rgba(232,184,75,0.15)" : BG2,
                  border: `1px solid ${newsCategory === f.idx ? G : BORDER}`,
                  borderRadius: "20px", padding: "6px 14px", color: newsCategory === f.idx ? G : "#6b6760",
                  fontSize: "12px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                }}>{f.label}</button>
              ))}
            </div>

            {/* Source list or headlines */}
            {activeNews ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                  <button onClick={() => setActiveNews(null)} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 12px", color: "#a8a49e", cursor: "pointer", fontSize: "12px", flexShrink: 0 }}>← Back</button>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: "800", color: "#f0ede8", fontSize: "15px" }}>{activeNews.name}</div>
                  <a href={activeNews.url} target="_blank" rel="noreferrer" style={{ marginLeft: "auto", background: G, color: "#0a0a0a", textDecoration: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "11px", fontWeight: "800", flexShrink: 0 }}>Full Site ↗</a>
                </div>
                {newsLoading && (
                  <div style={{ textAlign: "center", padding: "2rem", color: "#6b6760" }}>⏳ Loading headlines...</div>
                )}
                {!newsLoading && newsHeadlines[activeNews.name]?.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {newsHeadlines[activeNews.name].map((item, i) => (
                      <a key={i} href={item.link} target="_blank" rel="noreferrer" style={{ textDecoration: "none", display: "block", background: BG2, border: `1px solid ${BORDER}`, borderRadius: "14px", overflow: "hidden" }}>
                        {item.thumbnail ? <img src={item.thumbnail} alt={item.title} style={{ width: "100%", height: "160px", objectFit: "cover", display: "block" }} onError={e => e.target.style.display="none"} /> : null}
                        <div style={{ padding: "12px" }}>
                          <div style={{ fontSize: "13px", fontWeight: "700", color: "#f0ede8", lineHeight: 1.4, marginBottom: "6px" }}>{item.title}</div>
                          {item.description ? <div style={{ fontSize: "11px", color: "#6b6760", lineHeight: 1.5, marginBottom: "8px" }}>{item.description.slice(0, 120)}...</div> : null}
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div style={{ fontSize: "10px", color: "#4a3030" }}>{item.pubDate ? new Date(item.pubDate).toLocaleDateString("en-ZA", { day: "2-digit", month: "short" }) : ""}</div>
                            <span style={{ fontSize: "11px", color: G, fontWeight: "700" }}>Read more ↗</span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
                {!newsLoading && !newsHeadlines[activeNews.name]?.length && (
                  <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "2rem", textAlign: "center" }}>
                    <div style={{ fontSize: "32px", marginBottom: "10px" }}>📰</div>
                    <div style={{ fontSize: "13px", color: "#6b6760", marginBottom: "16px" }}>Could not load headlines.</div>
                    <a href={activeNews.url} target="_blank" rel="noreferrer" style={{ display: "block", background: G, color: "#0a0a0a", textDecoration: "none", borderRadius: "10px", padding: "12px", fontWeight: "800" }}>Read {activeNews.name} ↗</a>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {[
                  { name: "SA News",        feedKey: "safrica",    url: "https://allafrica.com/southafrica/", desc: "South Africa headlines — AllAfrica",  cat: [0,1] },
                  { name: "BBC Business",   feedKey: "safricabiz", url: "https://www.bbc.com/news/business",  desc: "Business & economy news",             cat: [0,2,3] },
                  { name: "Football News",  feedKey: "sport24",    url: "https://www.bbc.com/sport/football", desc: "Football headlines from BBC Sport",   cat: [0,4] },
                  { name: "BBC World",      feedKey: "bbcworld",   url: "https://www.bbc.com/news/world",     desc: "International headlines",             cat: [0,2] },
                  { name: "BBC Sport",      feedKey: "bbcsport",   url: "https://www.bbc.com/sport",          desc: "World sport news",                    cat: [0,3] },
                  { name: "BBC Business",   feedKey: "bbcbusiness",url: "https://www.bbc.com/news/business",  desc: "Business & economy news",             cat: [0,2] },
                  { name: "BBC Technology", feedKey: "bbctech",    url: "https://www.bbc.com/news/technology","desc": "Tech news from BBC",                cat: [0,2] },
                  { name: "Sky News",       feedKey: "reuters",    url: "https://news.sky.com",               desc: "UK & world breaking news",            cat: [0,2] },
                  { name: "Al Jazeera",     feedKey: "aljazeera",  url: "https://www.aljazeera.com",          desc: "Middle East & world news",            cat: [0,2] },
                  { name: "Sky News",       feedKey: "skynews",    url: "https://news.sky.com",               desc: "UK & world news",                     cat: [0,2] },
                ].filter(s => s.cat.includes(newsCategory)).map(source => (
                  <div key={source.name} onClick={() => setActiveNews(source)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", background: BG2, borderRadius: "12px", marginBottom: "8px", cursor: "pointer", border: `1px solid ${BORDER}` }}>
                    <div>
                      <div style={{ fontSize: "14px", color: "#f0ede8", fontWeight: "700" }}>{source.name}</div>
                      <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "2px" }}>{source.desc}</div>
                    </div>
                    <span style={{ color: G, fontSize: "20px" }}>→</span>
                  </div>
                ))}
                <div style={{ fontSize: "10px", color: "#4a3030", textAlign: "center", marginTop: "8px" }}>Tap to load headlines in-app</div>
              </div>
            )}
          </div>
        )}

                {/* ── GAMES TAB ── */}
        {tab === "games" && (
          <div>
            {!activeGame ? (
              <>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "18px", fontWeight: "800", color: "#f0ede8", marginBottom: "1rem" }}>🎮 Games</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {GAMES.map(g => (
                    <div key={g.id} onClick={() => setActiveGame(g.id)} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "1.25rem", cursor: "pointer", textAlign: "center" }}>
                      <div style={{ fontSize: "36px", marginBottom: "8px" }}>{g.icon}</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "14px", fontWeight: "800", color: "#f0ede8", marginBottom: "4px" }}>{g.title}</div>
                      <div style={{ fontSize: "11px", color: "#6b6760" }}>{g.desc}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
                  <button onClick={() => setActiveGame(null)} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 14px", color: "#a8a49e", cursor: "pointer", fontSize: "13px" }}>← Back</button>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: "800", color: G }}>
                    {GAMES.find(g => g.id === activeGame)?.title}
                  </div>
                </div>
                <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "1.25rem" }}>
                  {activeGame === "2048"     && <Game2048 />}
                  {activeGame === "reaction" && <ReactionGame />}
                  {activeGame === "tictactoe"&& <TicTacToe />}
                  {activeGame === "memory"   && <MemoryGame />}
                  {activeGame === "trivia"   && <TriviaGame />}
                  {activeGame === "snake"    && <SnakeGame />}
                  {activeGame === "sudoku"   && <SudokuGame />}
                  {activeGame === "solitaire"&& <SolitaireGame />}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── COMEDY ── */}
        {tab === "comedy" && (
          <div>
            <VideoRow title="😂 SA Stand-Up Comedy" items={CONTENT.comedy.slice(0,3)} onPlay={playVideo} />
            <VideoRow title="🎭 Comedy Shows & Specials" items={CONTENT.comedy.slice(3)} onPlay={playVideo} />
          </div>
        )}

        {/* ── FITNESS ── */}
        {tab === "fitness" && (
          <div>
            <div style={{ background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "14px", padding: "1rem", marginBottom: "1.25rem" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px", fontWeight: "800", color: "#4ade80", marginBottom: "4px" }}>💪 Home Workouts</div>
              <div style={{ fontSize: "12px", color: "#6b6760" }}>No equipment needed · Do it anywhere · All fitness levels</div>
            </div>
            <VideoRow title="🔥 Full Body Workouts" items={CONTENT.fitness.slice(0,3)} onPlay={playVideo} />
            <VideoRow title="⚡ HIIT Training" items={CONTENT.fitness.slice(3)} onPlay={playVideo} />
          </div>
        )}

        {/* ── COOKING ── */}
        {tab === "cooking" && (
          <div>
            <div style={{ background: "rgba(232,184,75,0.05)", border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "1rem", marginBottom: "1.25rem" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px", fontWeight: "800", color: G, marginBottom: "4px" }}>🍳 SA Recipes & Cooking</div>
              <div style={{ fontSize: "12px", color: "#6b6760" }}>Braai, Potjie, Pap & traditional South African cuisine</div>
            </div>
            <VideoRow title="🔥 Braai & Fire Cooking" items={CONTENT.cooking.slice(0,3)} onPlay={playVideo} />
            <VideoRow title="🍖 SA Traditional Recipes" items={CONTENT.cooking.slice(3)} onPlay={playVideo} />
          </div>
        )}

        {/* ── WELLNESS ── */}
        {tab === "wellness" && (
          <div>
            <div style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: "14px", padding: "1rem", marginBottom: "1.25rem" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px", fontWeight: "800", color: "#a78bfa", marginBottom: "4px" }}>🧘 Mindfulness & Wellness</div>
              <div style={{ fontSize: "12px", color: "#6b6760" }}>Guided meditation · Stress relief · Mental wellbeing</div>
            </div>
            <VideoRow title="🧘 Guided Meditation" items={CONTENT.wellness.slice(0,3)} onPlay={playVideo} />
            <VideoRow title="☮️ Mindfulness & Calm" items={CONTENT.wellness.slice(3)} onPlay={playVideo} />
          </div>
        )}

        {/* ── STREAMING LINKS ── */}
        {tab === "stream" && (
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: "800", color: "#f0ede8", marginBottom: "12px" }}>📺 Stream Movies & Series</div>
            <div style={{ fontSize: "12px", color: "#6b6760", marginBottom: "1rem" }}>These services open in your browser. Subscription may be required.</div>
            {[
              { name: "Netflix", url: "https://www.netflix.com", desc: "Movies, series, documentaries", icon: "🔴", color: "#E50914", free: false },
              { name: "Disney+", url: "https://www.disneyplus.com", desc: "Disney, Marvel, Star Wars, Pixar", icon: "✨", color: "#113CCF", free: false },
              { name: "Amazon Prime Video", url: "https://www.primevideo.com", desc: "Movies, series & Amazon originals", icon: "🔵", color: "#00A8E0", free: false },
              { name: "SABC+", url: "https://sabc-plus.com", desc: "Free SA content — news, sport, local shows", icon: "📺", color: "#e31837", free: true },
              { name: "DStv Now", url: "https://now.dstv.com", desc: "SuperSport, M-Net, kykNET & more", icon: "📡", color: "#003087", free: false },
              { name: "Apple TV+", url: "https://tv.apple.com", desc: "Apple originals — Ted Lasso & more", icon: "🍎", color: "#555555", free: false },
              { name: "Tubi TV", url: "https://tubitv.com", desc: "100% free movies & TV shows — no subscription", icon: "🟠", color: "#FA5000", free: true },
              { name: "Plex", url: "https://www.plex.tv/watch-free", desc: "Free movies & live TV — available in SA", icon: "🟡", color: "#E5A00D", free: true },
            ].map(s => (
              <a key={s.name} href={s.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "14px", background: BG2, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "1rem", marginBottom: "10px", textDecoration: "none" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: `${s.color}20`, border: `1px solid ${s.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>{s.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "700", color: "#f0ede8", fontSize: "14px" }}>{s.name}</div>
                  <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "2px" }}>{s.desc}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                  {s.free && <span style={{ fontSize: "10px", background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "4px", padding: "2px 6px", fontWeight: "700" }}>FREE</span>}
                  <span style={{ color: G, fontSize: "14px" }}>↗</span>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* ── READING HUB TAB ── */}
        {tab === "reading" && <ReadingHub />}

        {/* ── CASINO OFFERS TAB ── */}
        {tab === "casino" && <CasinoOffersTab user={user} />}

        {/* ── LOCAL ADS TAB ── */}
        {tab === "ads" && <LocalAdsTab user={user} />}

      </div>
    </div>
  );
}
