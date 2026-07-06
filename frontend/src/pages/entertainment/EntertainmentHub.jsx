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
    { id:"tr7", title:"TikTok Food Trends 2026 — Every Viral Recipe Q1", videoId:"oSe5_TteZlQ", category:"Cooking", thumb:"https://img.youtube.com/vi/oSe5_TteZlQ/maxresdefault.jpg" },
    { id:"tr8", title:"Afrobeats vs Amapiano Mix 2026 — DJ Shinski", videoId:"KBdAZsFqVUk", category:"Music", thumb:"https://img.youtube.com/vi/KBdAZsFqVUk/maxresdefault.jpg" },
    { id:"tr9", title:"AI for Beginners 2025", videoId:"ad79nYk2keg", category:"Learning", thumb:"https://img.youtube.com/vi/ad79nYk2keg/maxresdefault.jpg" },
    { id:"tr10",title:"20 Min Pilates — Best Daily Routine 2026", videoId:"GRmaNb3cOE0", category:"Fitness", thumb:"https://img.youtube.com/vi/GRmaNb3cOE0/maxresdefault.jpg" },
  ],
  kids: [
    { id:"k1",  title:"🐷 Peppa Pig 2026 NEW — Summer Adventures Season 10 & 11", videoId:"0gyr8ZXdwVo", category:"Kids", thumb:"https://img.youtube.com/vi/0gyr8ZXdwVo/maxresdefault.jpg" },
    { id:"k2",  title:"🐷 Peppa Pig LIVE 2026 — Big Adventures 24/7", videoId:"bXj_RK2Tb38", category:"Kids", thumb:"https://img.youtube.com/vi/bXj_RK2Tb38/maxresdefault.jpg" },
    { id:"k3",  title:"🐷 Peppa Pig NEW Episodes 2026 — Family Learning Stories", videoId:"PY79_u1ZFVo", category:"Kids", thumb:"https://img.youtube.com/vi/PY79_u1ZFVo/maxresdefault.jpg" },
    { id:"k4",  title:"🐷 Peppa Pig Tales 2025 ❄️ Snowed In!", videoId:"y4--k3YDOPI", category:"Kids", thumb:"https://img.youtube.com/vi/y4--k3YDOPI/maxresdefault.jpg" },
    { id:"k5",  title:"🐷 Peppa Pig 2026 LIVE 24/7 — Best Pig Adventures", videoId:"1l_7rRpwPTk", category:"Kids", thumb:"https://img.youtube.com/vi/1l_7rRpwPTk/maxresdefault.jpg" },
    { id:"k6",  title:"🍉 CoComelon New Year Song 2026 — 3 Hours Nursery Rhymes", videoId:"KLf4VBLLxKA", category:"Kids", thumb:"https://img.youtube.com/vi/KLf4VBLLxKA/maxresdefault.jpg" },
    { id:"k7",  title:"🍉 CoComelon Wheels on the Bus 2026 Version", videoId:"SRX6Y0s75C0", category:"Kids", thumb:"https://img.youtube.com/vi/SRX6Y0s75C0/maxresdefault.jpg" },
    { id:"k8",  title:"🍉 Best of CoComelon 2025 — Nursery Rhymes Kids Songs", videoId:"xfBgELKf0_U", category:"Kids", thumb:"https://img.youtube.com/vi/xfBgELKf0_U/maxresdefault.jpg" },
    { id:"k9",  title:"🍉 CoComelon Animals LIVE 2025 — Sing Along Songs", videoId:"oX0YnAnlUio", category:"Kids", thumb:"https://img.youtube.com/vi/oX0YnAnlUio/maxresdefault.jpg" },
    { id:"k10", title:"🍉 CoComelon Animal Sounds Song", videoId:"75ENi5QC-vM", category:"Kids", thumb:"https://img.youtube.com/vi/75ENi5QC-vM/maxresdefault.jpg" },
    { id:"k11", title:"🍉 CoComelon ABC Alphabet Song", videoId:"6oihoZjsV7I", category:"Kids", thumb:"https://img.youtube.com/vi/6oihoZjsV7I/maxresdefault.jpg" },
    { id:"k12", title:"🍉 CoComelon Happy New Year 2026 — Toddler Songs", videoId:"oevvpKM8QQY", category:"Kids", thumb:"https://img.youtube.com/vi/oevvpKM8QQY/maxresdefault.jpg" },
    { id:"k13", title:"🔢 Count 1-20 — Kids Learning Songs", videoId:"DR-cfDsHCGA", category:"Kids", thumb:"https://img.youtube.com/vi/DR-cfDsHCGA/maxresdefault.jpg" },
    { id:"k14", title:"🌍 African Safari — 20 Wild Animals for Kids", videoId:"14LDUtA7G84", category:"Kids", thumb:"https://img.youtube.com/vi/14LDUtA7G84/maxresdefault.jpg" },
    { id:"k15", title:"🪐 Solar System for Kids — Planets Explained", videoId:"libKVRa01L8", category:"Kids", thumb:"https://img.youtube.com/vi/libKVRa01L8/maxresdefault.jpg" },
    { id:"k16", title:"🔤 ABC Song — Learn the Alphabet", videoId:"75p-N9YKqNo", category:"Kids", thumb:"https://img.youtube.com/vi/75p-N9YKqNo/maxresdefault.jpg" },
    { id:"k17", title:"🎈 CoComelon — ABC with Balloons Song", videoId:"om_1599v70c", category:"Kids", thumb:"https://img.youtube.com/vi/om_1599v70c/maxresdefault.jpg" },
    { id:"k18", title:"🐷 Peppa Pig In The Future — Official Full Episodes", videoId:"XfDyf5T4sxs", category:"Kids", thumb:"https://img.youtube.com/vi/XfDyf5T4sxs/maxresdefault.jpg" },
    { id:"k19", title:"🐷 Peppa Pig Tales 2025 — Brand New Every Week", videoId:"oWayeixv8f0", category:"Kids", thumb:"https://img.youtube.com/vi/oWayeixv8f0/maxresdefault.jpg" },
    { id:"k20", title:"🐷 Peppa Pig Official — Live George Livestream 2026", videoId:"XfLCC1xaYf0", category:"Kids", thumb:"https://img.youtube.com/vi/XfLCC1xaYf0/maxresdefault.jpg" },
  ],
  music: [
    { id:"m1",  title:"Amapiano Mix May 2026 — Romeo Makota Soulful Sunset", videoId:"5ZteaJFFTFY", category:"Music", thumb:"https://img.youtube.com/vi/5ZteaJFFTFY/maxresdefault.jpg" },
    { id:"m2",  title:"Amapiano 2026 — Nonstop SA Hits", videoId:"GC0cl8aHjAY", category:"Music", thumb:"https://img.youtube.com/vi/GC0cl8aHjAY/maxresdefault.jpg" },
    { id:"m3",  title:"Amapiano Mix 2026 — New & Hottest Sounds", videoId:"e12dB9qTFVg", category:"Music", thumb:"https://img.youtube.com/vi/e12dB9qTFVg/maxresdefault.jpg" },
    { id:"m4",  title:"Amapiano Mix South Africa 2026 — Music Vibe ZA", videoId:"WyM58E60NMY", category:"Music", thumb:"https://img.youtube.com/vi/WyM58E60NMY/maxresdefault.jpg" },
    { id:"m5",  title:"Amapiano 2026 — New & Trending Afro Vibes", videoId:"Gqe6BfE1RvI", category:"Music", thumb:"https://img.youtube.com/vi/Gqe6BfE1RvI/maxresdefault.jpg" },
    { id:"m6",  title:"Afrobeats x Amapiano Mix 2026 — Love & Soft Life", videoId:"zHuTFuaRquw", category:"Music", thumb:"https://img.youtube.com/vi/zHuTFuaRquw/maxresdefault.jpg" },
    { id:"m7",  title:"Afrobeat + Amapiano Mix 2026 Masterclass", videoId:"k99HmSVCocM", category:"Music", thumb:"https://img.youtube.com/vi/k99HmSVCocM/maxresdefault.jpg" },
    { id:"m8",  title:"Afrobeats vs Amapiano Vol.4 2026 — DJ Shinski", videoId:"KBdAZsFqVUk", category:"Music", thumb:"https://img.youtube.com/vi/KBdAZsFqVUk/maxresdefault.jpg" },
    { id:"m9",  title:"Amapiano 2026 Vol.III — Soulful (Shela)", videoId:"1MjTlrkEDZs", category:"Music", thumb:"https://img.youtube.com/vi/1MjTlrkEDZs/maxresdefault.jpg" },
    { id:"m10", title:"Amapiano April 2026 — Trending (Musicbwoy)", videoId:"IRWLhgPkG7U", category:"Music", thumb:"https://img.youtube.com/vi/IRWLhgPkG7U/maxresdefault.jpg" },
    { id:"m11", title:"Amapiano 2026 — WE GLOBAL Vol.I", videoId:"ZvjoyNOE39s", category:"Music", thumb:"https://img.youtube.com/vi/ZvjoyNOE39s/maxresdefault.jpg" },
    { id:"m12", title:"Best Amapiano Video Mix 2026 — DJ Pere", videoId:"o0WaIJDA4ug", category:"Music", thumb:"https://img.youtube.com/vi/o0WaIJDA4ug/maxresdefault.jpg" },
    { id:"m13", title:"Amapiano New Year Mix 2026", videoId:"4ngVPKwOJok", category:"Music", thumb:"https://img.youtube.com/vi/4ngVPKwOJok/maxresdefault.jpg" },
    { id:"m14", title:"Best Amapiano 2025 — OSOCITY", videoId:"XZhu91HwUR0", category:"Music", thumb:"https://img.youtube.com/vi/XZhu91HwUR0/maxresdefault.jpg" },
    { id:"m15", title:"Amapiano December 2025 — Romeo Makota", videoId:"Lgtz-8T3DIc", category:"Music", thumb:"https://img.youtube.com/vi/Lgtz-8T3DIc/maxresdefault.jpg" },
    { id:"m16", title:"MIX Amapiano 2026 SA — Music Vibe ZA Vol.2", videoId:"IRaKDfC72R4", category:"Music", thumb:"https://img.youtube.com/vi/IRaKDfC72R4/maxresdefault.jpg" },
    { id:"m17", title:"Top Hits 2026 — Afro House Summer Mix", videoId:"8KkIw5CjwqA", category:"Music", thumb:"https://img.youtube.com/vi/8KkIw5CjwqA/maxresdefault.jpg" },
    { id:"m18", title:"Top Music 2026 — Best Pop & TikTok Hits", videoId:"p5Q2bfe-iZI", category:"Music", thumb:"https://img.youtube.com/vi/p5Q2bfe-iZI/maxresdefault.jpg" },
    { id:"m19", title:"Top 40 Global Songs 2025", videoId:"9vSdEHTVWGY", category:"Music", thumb:"https://img.youtube.com/vi/9vSdEHTVWGY/maxresdefault.jpg" },
    { id:"m20", title:"Mega Hit List 2025 — Top Songs Right Now", videoId:"1AzkGpeUQZI", category:"Music", thumb:"https://img.youtube.com/vi/1AzkGpeUQZI/maxresdefault.jpg" },
    { id:"m21", title:"Top Hits 2025 — Summer Playlist", videoId:"vp2ZoXIFJfw", category:"Music", thumb:"https://img.youtube.com/vi/vp2ZoXIFJfw/maxresdefault.jpg" },
    { id:"m22", title:"Top Hits 2025 — TikTok Viral Songs Mix", videoId:"UN5t2BxBUos", category:"Music", thumb:"https://img.youtube.com/vi/UN5t2BxBUos/maxresdefault.jpg" },
    { id:"m23", title:"SA Gospel Songs Mix 2026 — Powerful African Praise", videoId:"19fyz5lAIJs", category:"Music", thumb:"https://img.youtube.com/vi/19fyz5lAIJs/maxresdefault.jpg" },
    { id:"m24", title:"Zulu Gospel 2025 — 1 Hour Powerful Praise", videoId:"sVS1JEV1-i4", category:"Music", thumb:"https://img.youtube.com/vi/sVS1JEV1-i4/maxresdefault.jpg" },
    { id:"m25", title:"Afro Gospel Playlist 2026", videoId:"MXzPCqviiVI", category:"Music", thumb:"https://img.youtube.com/vi/MXzPCqviiVI/maxresdefault.jpg" },
    { id:"m26", title:"SA Hymns — Lebo Sekgobela & Ayanda Ntanzi", videoId:"RORRqTZtPkY", category:"Music", thumb:"https://img.youtube.com/vi/RORRqTZtPkY/maxresdefault.jpg" },
    { id:"m27", title:"African Relaxation Music — Calm & Peace", videoId:"1ZYbU82GVz4", category:"Music", thumb:"https://img.youtube.com/vi/1ZYbU82GVz4/maxresdefault.jpg" },
    { id:"m28", title:"KHAYA — African Meditation Music", videoId:"9WhTzc5_cUQ", category:"Music", thumb:"https://img.youtube.com/vi/9WhTzc5_cUQ/maxresdefault.jpg" },
  ],
  comedy: [
    { id:"c1",  title:"Best Stand-Up Specials 2025 — Full Compilation", videoId:"Aj3hD2KwiBc", category:"Comedy", thumb:"https://img.youtube.com/vi/Aj3hD2KwiBc/maxresdefault.jpg" },
    { id:"c2",  title:"Best Comedy Specials 2025 Part 1", videoId:"bzoNW7Ugfms", category:"Comedy", thumb:"https://img.youtube.com/vi/bzoNW7Ugfms/maxresdefault.jpg" },
    { id:"c3",  title:"Best Comedy Specials 2025 Part 2", videoId:"zJ1JlP3bStk", category:"Comedy", thumb:"https://img.youtube.com/vi/zJ1JlP3bStk/maxresdefault.jpg" },
    { id:"c4",  title:"Start 2026 Right — 12 Must-Watch Comedians", videoId:"sfk9rHiDUjA", category:"Comedy", thumb:"https://img.youtube.com/vi/sfk9rHiDUjA/maxresdefault.jpg" },
    { id:"c5",  title:"Most Viral Comedy Sets 2025 Vol.1", videoId:"Ew4C0kh67kg", category:"Comedy", thumb:"https://img.youtube.com/vi/Ew4C0kh67kg/maxresdefault.jpg" },
    { id:"c6",  title:"Popular Jokes 2025 — Viral Comedians Compilation", videoId:"OfzqNh6H2jg", category:"Comedy", thumb:"https://img.youtube.com/vi/OfzqNh6H2jg/maxresdefault.jpg" },
    { id:"c7",  title:"Best Stand-Up Sets 2025 — Cracked Comedy Club", videoId:"vNlXk7vXYYQ", category:"Comedy", thumb:"https://img.youtube.com/vi/vNlXk7vXYYQ/maxresdefault.jpg" },
    { id:"c8",  title:"Best Stand-Up 2025 Vol.2 — Comedy Dynamics", videoId:"bJrwXhOVdQQ", category:"Comedy", thumb:"https://img.youtube.com/vi/bJrwXhOVdQQ/maxresdefault.jpg" },
    { id:"c9",  title:"Top 7 Jokes September 2025 — Stand-Up Compilation", videoId:"qiPHEGbvxB8", category:"Comedy", thumb:"https://img.youtube.com/vi/qiPHEGbvxB8/maxresdefault.jpg" },
    { id:"c10", title:"Fresh 2025 Jokes — Stand Up Comedy", videoId:"ucxKfRE3cwM", category:"Comedy", thumb:"https://img.youtube.com/vi/ucxKfRE3cwM/maxresdefault.jpg" },
    { id:"c11", title:"SA Stand-Up — Savanna Comics Choice Awards 2024", videoId:"JavCA0w5omc", category:"Comedy", thumb:"https://img.youtube.com/vi/JavCA0w5omc/maxresdefault.jpg" },
    { id:"c12", title:"Loyiso Madinga — Comedians of the World", videoId:"sytJFA8ES6o", category:"Comedy", thumb:"https://img.youtube.com/vi/sytJFA8ES6o/maxresdefault.jpg" },
    { id:"c13", title:"Savanna Newcomer Comedy Showcase 2025", videoId:"Fu8GK_BulR8", category:"Comedy", thumb:"https://img.youtube.com/vi/Fu8GK_BulR8/maxresdefault.jpg" },
    { id:"c14", title:"Prins Live — SA Comedy Special", videoId:"n5OWI-5Y-Y0", category:"Comedy", thumb:"https://img.youtube.com/vi/n5OWI-5Y-Y0/maxresdefault.jpg" },
    { id:"c15", title:"Trevor Noah — South Africa Stand-Up Special", videoId:"sytJFA8ES6o", category:"Comedy", thumb:"https://img.youtube.com/vi/sytJFA8ES6o/maxresdefault.jpg" },
  ],
  fitness: [
    { id:"fi1",  title:"2026 Rap HIIT — 20 Min Full Body Fat Burn", videoId:"iIGDoUMv5h4", category:"Fitness", thumb:"https://img.youtube.com/vi/iIGDoUMv5h4/maxresdefault.jpg" },
    { id:"fi2",  title:"30 Min Cardio HIIT — 5000 Steps at Home", videoId:"DVD_gIdPr-o", category:"Fitness", thumb:"https://img.youtube.com/vi/DVD_gIdPr-o/maxresdefault.jpg" },
    { id:"fi3",  title:"30 Min Full Body Cardio HIIT 2025 (With Modifications)", videoId:"Okpb-ZX8a_k", category:"Fitness", thumb:"https://img.youtube.com/vi/Okpb-ZX8a_k/maxresdefault.jpg" },
    { id:"fi4",  title:"20 Min Full Body Beginner HIIT — No Equipment", videoId:"ZeJLIdQenTo", category:"Fitness", thumb:"https://img.youtube.com/vi/ZeJLIdQenTo/maxresdefault.jpg" },
    { id:"fi5",  title:"25 Min HIIT Full Body — No Equipment Needed", videoId:"cbKkB3POqaY", category:"Fitness", thumb:"https://img.youtube.com/vi/cbKkB3POqaY/maxresdefault.jpg" },
    { id:"fi6",  title:"30 Min Full Body — All Standing Low Impact HIIT", videoId:"3rdsdh5fVeY", category:"Fitness", thumb:"https://img.youtube.com/vi/3rdsdh5fVeY/maxresdefault.jpg" },
    { id:"fi7",  title:"25 Min Beginner HIIT — No Jumping", videoId:"lH0p5oQvTDY", category:"Fitness", thumb:"https://img.youtube.com/vi/lH0p5oQvTDY/maxresdefault.jpg" },
    { id:"fi8",  title:"Full Body Beginner Workout — No Equipment at Home", videoId:"WBaLczkURjQ", category:"Fitness", thumb:"https://img.youtube.com/vi/WBaLczkURjQ/maxresdefault.jpg" },
    { id:"fi9",  title:"20 Min Pilates Sculpt 2026 — Daily Routine", videoId:"GRmaNb3cOE0", category:"Fitness", thumb:"https://img.youtube.com/vi/GRmaNb3cOE0/maxresdefault.jpg" },
    { id:"fi10", title:"20 Min Full Body Pilates Day 1 Challenge 2026", videoId:"GD1lI0f8yg8", category:"Fitness", thumb:"https://img.youtube.com/vi/GD1lI0f8yg8/maxresdefault.jpg" },
    { id:"fi11", title:"20 Min Pilates for Beginners — Full Body No Equipment", videoId:"SPEBWOFleOI", category:"Fitness", thumb:"https://img.youtube.com/vi/SPEBWOFleOI/maxresdefault.jpg" },
    { id:"fi12", title:"30 Min Pilates Yoga — Full Body Tone & Flexibility", videoId:"Bar742jA-Zg", category:"Fitness", thumb:"https://img.youtube.com/vi/Bar742jA-Zg/maxresdefault.jpg" },
    { id:"fi13", title:"30 Min Beginner Pilates — Classical No Equipment", videoId:"QW_0H-5udr0", category:"Fitness", thumb:"https://img.youtube.com/vi/QW_0H-5udr0/maxresdefault.jpg" },
    { id:"fi14", title:"Yoga for Beginners — 20 Min Full Body", videoId:"v7AYKMP6rOE", category:"Fitness", thumb:"https://img.youtube.com/vi/v7AYKMP6rOE/maxresdefault.jpg" },
    { id:"fi15", title:"30 Min Walk at Home — Low Impact Cardio", videoId:"enUB3x5Rz3Y", category:"Fitness", thumb:"https://img.youtube.com/vi/enUB3x5Rz3Y/maxresdefault.jpg" },
    { id:"fi16", title:"10 Min Abs Workout — No Equipment Needed", videoId:"DHD1-2P4nB8", category:"Fitness", thumb:"https://img.youtube.com/vi/DHD1-2P4nB8/maxresdefault.jpg" },
    { id:"fi17", title:"Joe Wicks — 15 Min HIIT Workout", videoId:"oFkzvg4_HLk", category:"Fitness", thumb:"https://img.youtube.com/vi/oFkzvg4_HLk/maxresdefault.jpg" },
  ],
  cooking: [
    { id:"co1",  title:"SA Heritage Day Braai 2025 — Ultimate Platter", videoId:"kGtZ6nfYUNI", category:"Cooking", thumb:"https://img.youtube.com/vi/kGtZ6nfYUNI/maxresdefault.jpg" },
    { id:"co2",  title:"50k Special — Half Lamb on the Braai 2025", videoId:"wpvttX4G-OM", category:"Cooking", thumb:"https://img.youtube.com/vi/wpvttX4G-OM/maxresdefault.jpg" },
    { id:"co3",  title:"Boerekos on the Braai — Biltong-Spiced Beef 2026", videoId:"dKYffJYf52Q", category:"Cooking", thumb:"https://img.youtube.com/vi/dKYffJYf52Q/maxresdefault.jpg" },
    { id:"co4",  title:"Shisanyama Fire Cooking — SA Braai Feast 2026", videoId:"oCssyYnsAzE", category:"Cooking", thumb:"https://img.youtube.com/vi/oCssyYnsAzE/maxresdefault.jpg" },
    { id:"co5",  title:"Oxtail & Mac Cheese Potjie on the Braai", videoId:"603SFpYUdp0", category:"Cooking", thumb:"https://img.youtube.com/vi/603SFpYUdp0/maxresdefault.jpg" },
    { id:"co6",  title:"Bush Braai — Braaivleis, Pap and Relish", videoId:"19N6KRZ-NVg", category:"Cooking", thumb:"https://img.youtube.com/vi/19N6KRZ-NVg/maxresdefault.jpg" },
    { id:"co7",  title:"Homemade SA Chakalaka Recipe", videoId:"U4driexsnt4", category:"Cooking", thumb:"https://img.youtube.com/vi/U4driexsnt4/maxresdefault.jpg" },
    { id:"co8",  title:"10 Easy Braai Recipes 2026 — Popular in SA", videoId:"0A_7h1gJ0bs", category:"Cooking", thumb:"https://img.youtube.com/vi/0A_7h1gJ0bs/maxresdefault.jpg" },
    { id:"co9",  title:"SA Braai — Ultimate BBQ Experience", videoId:"MRf2tPsvi_4", category:"Cooking", thumb:"https://img.youtube.com/vi/MRf2tPsvi_4/maxresdefault.jpg" },
    { id:"co10", title:"Most Loved Recipes 2026 — Jan to March", videoId:"2Gbl4kW9Rjg", category:"Cooking", thumb:"https://img.youtube.com/vi/2Gbl4kW9Rjg/maxresdefault.jpg" },
    { id:"co11", title:"TikTok Food Trends 2026 — Every Viral Recipe Q1", videoId:"oSe5_TteZlQ", category:"Cooking", thumb:"https://img.youtube.com/vi/oSe5_TteZlQ/maxresdefault.jpg" },
    { id:"co12", title:"We Try 2026 Most Viral Foods", videoId:"8JYvr04gkbk", category:"Cooking", thumb:"https://img.youtube.com/vi/8JYvr04gkbk/maxresdefault.jpg" },
    { id:"co13", title:"Testing TikTok Biggest Food Trends 2026", videoId:"LV0UGG7xkWc", category:"Cooking", thumb:"https://img.youtube.com/vi/LV0UGG7xkWc/maxresdefault.jpg" },
    { id:"co14", title:"Viral TikTok Recipes for Days You Don't Want to Cook", videoId:"JR-0B2OmJYM", category:"Cooking", thumb:"https://img.youtube.com/vi/JR-0B2OmJYM/maxresdefault.jpg" },
    { id:"co15", title:"4 Viral Recipes Actually Worth Making 2026", videoId:"Tt6KUa8b9gY", category:"Cooking", thumb:"https://img.youtube.com/vi/Tt6KUa8b9gY/maxresdefault.jpg" },
    { id:"co16", title:"5 Easy 5-Ingredient Dinners — Anyone Can Make", videoId:"bvGmhsshhqM", category:"Cooking", thumb:"https://img.youtube.com/vi/bvGmhsshhqM/maxresdefault.jpg" },
    { id:"co17", title:"Budget Family Meals Feb 2026 — Quick & Easy", videoId:"ANbQnMYNjDg", category:"Cooking", thumb:"https://img.youtube.com/vi/ANbQnMYNjDg/maxresdefault.jpg" },
    { id:"co18", title:"Gordon Ramsay Ultimate Cooking Skills", videoId:"RFiGEbCRbCM", category:"Cooking", thumb:"https://img.youtube.com/vi/RFiGEbCRbCM/maxresdefault.jpg" },
  ],
  wellness: [
    { id:"w1",  title:"Become Unstoppable 2026 — Confidence Building Meditation", videoId:"wC-k9B-lHok", category:"Wellness", thumb:"https://img.youtube.com/vi/wC-k9B-lHok/maxresdefault.jpg" },
    { id:"w2",  title:"2026 Wellness Trends — What Works", videoId:"q7mulqQ3WZg", category:"Wellness", thumb:"https://img.youtube.com/vi/q7mulqQ3WZg/maxresdefault.jpg" },
    { id:"w3",  title:"Meditation for Stress & Anxiety — May 2026", videoId:"kjno6r8CAlU", category:"Wellness", thumb:"https://img.youtube.com/vi/kjno6r8CAlU/maxresdefault.jpg" },
    { id:"w4",  title:"Release, Relax, Reinvigorate — Meditation May 2026", videoId:"2yWRFK7s3_c", category:"Wellness", thumb:"https://img.youtube.com/vi/2yWRFK7s3_c/maxresdefault.jpg" },
    { id:"w5",  title:"10 Min Guided Meditation — Clear Your Mind", videoId:"uTN29kj7e-w", category:"Wellness", thumb:"https://img.youtube.com/vi/uTN29kj7e-w/maxresdefault.jpg" },
    { id:"w6",  title:"Daily Calm — 10 Min Mindfulness: Be Present", videoId:"ZToicYcHIOU", category:"Wellness", thumb:"https://img.youtube.com/vi/ZToicYcHIOU/maxresdefault.jpg" },
    { id:"w7",  title:"10 Min Meditation — Release Stress & Anxiety", videoId:"z6X5oEIg6Ak", category:"Wellness", thumb:"https://img.youtube.com/vi/z6X5oEIg6Ak/maxresdefault.jpg" },
    { id:"w8",  title:"20 Min Guided Meditation — Reduce Anxiety", videoId:"MIr3RsUWrdo", category:"Wellness", thumb:"https://img.youtube.com/vi/MIr3RsUWrdo/maxresdefault.jpg" },
    { id:"w9",  title:"10 Min Meditation — Positive Energy & Peace", videoId:"cyMxWXlX9sU", category:"Wellness", thumb:"https://img.youtube.com/vi/cyMxWXlX9sU/maxresdefault.jpg" },
    { id:"w10", title:"Meaningful Meditation August 2025", videoId:"h4MHpaDR7iw", category:"Wellness", thumb:"https://img.youtube.com/vi/h4MHpaDR7iw/maxresdefault.jpg" },
    { id:"w11", title:"Mindfulness with Sharon Salzberg Oct 2025", videoId:"C4Ma_mOWpcQ", category:"Wellness", thumb:"https://img.youtube.com/vi/C4Ma_mOWpcQ/maxresdefault.jpg" },
    { id:"w12", title:"KHAYA — African Deep Meditation Music", videoId:"9WhTzc5_cUQ", category:"Wellness", thumb:"https://img.youtube.com/vi/9WhTzc5_cUQ/maxresdefault.jpg" },
    { id:"w13", title:"AMANI — African Meditation Campfire", videoId:"ClqulIR6ml8", category:"Wellness", thumb:"https://img.youtube.com/vi/ClqulIR6ml8/maxresdefault.jpg" },
    { id:"w14", title:"African Nature Sounds — Relaxing Background Music", videoId:"d-asjw9grxM", category:"Wellness", thumb:"https://img.youtube.com/vi/d-asjw9grxM/maxresdefault.jpg" },
    { id:"w15", title:"Africa 4K — Nature Relaxation Film & Tribal Music", videoId:"u91U8oPJzL8", category:"Wellness", thumb:"https://img.youtube.com/vi/u91U8oPJzL8/maxresdefault.jpg" },
    { id:"w16", title:"Whispers of Africa 2026 — Calm Zulu Voices", videoId:"UJhyXRUzBEc", category:"Wellness", thumb:"https://img.youtube.com/vi/UJhyXRUzBEc/maxresdefault.jpg" },
    { id:"w17", title:"Soothing Zulu Vocals 2026 — Deep Peace & Sleep", videoId:"ypZjgkjyy9s", category:"Wellness", thumb:"https://img.youtube.com/vi/ypZjgkjyy9s/maxresdefault.jpg" },
    { id:"w18", title:"Healing African Music — Nature Melodies 2025", videoId:"x7wMps7Od2Q", category:"Wellness", thumb:"https://img.youtube.com/vi/x7wMps7Od2Q/maxresdefault.jpg" },
    { id:"w19", title:"8 Hours Relaxing Music — African Sleep & Study", videoId:"l3RQZ4mcr1Y", category:"Wellness", thumb:"https://img.youtube.com/vi/l3RQZ4mcr1Y/maxresdefault.jpg" },
    { id:"w20", title:"African Relaxation Music — Calm & Peace", videoId:"1ZYbU82GVz4", category:"Wellness", thumb:"https://img.youtube.com/vi/1ZYbU82GVz4/maxresdefault.jpg" },
  ],
  learning: [
    { id:"l1", title:"Learn Python — Full Course for Beginners", videoId:"rfscVS0vtbw", category:"Learning", thumb:"https://img.youtube.com/vi/rfscVS0vtbw/maxresdefault.jpg" },
    { id:"l2", title:"Personal Finance Basics", videoId:"HQzoZfc3GwQ", category:"Learning", thumb:"https://img.youtube.com/vi/HQzoZfc3GwQ/maxresdefault.jpg" },
    { id:"l3", title:"AI for Beginners 2025", videoId:"ad79nYk2keg", category:"Learning", thumb:"https://img.youtube.com/vi/ad79nYk2keg/maxresdefault.jpg" },
    { id:"l4", title:"Photography Masterclass for Beginners", videoId:"LxO-6rlihSg", category:"Learning", thumb:"https://img.youtube.com/vi/LxO-6rlihSg/maxresdefault.jpg" },
    { id:"l5", title:"How to Start a Business — Complete SA Guide", videoId:"Fl7WLnpVgD0", category:"Learning", thumb:"https://img.youtube.com/vi/Fl7WLnpVgD0/maxresdefault.jpg" },
  ],
  podcasts: [
    { id:"p1", title:"Motivation — How to Build a Better Life", videoId:"mgmVOuLgFB0", category:"Podcast", thumb:"https://img.youtube.com/vi/mgmVOuLgFB0/maxresdefault.jpg" },
    { id:"p2", title:"AI for Beginners — Tech Talk Africa", videoId:"ad79nYk2keg", category:"Podcast", thumb:"https://img.youtube.com/vi/ad79nYk2keg/maxresdefault.jpg" },
    { id:"p3", title:"Personal Finance Masterclass", videoId:"HQzoZfc3GwQ", category:"Podcast", thumb:"https://img.youtube.com/vi/HQzoZfc3GwQ/maxresdefault.jpg" },
  ],
};



// ── RADIO STATIONS ───────────────────────────────────────────
// North West + SA national stations
// Links open in browser (audio streams can't embed directly)
const RADIO_STATIONS = [
  // North West Province
  { id: "nwfm",      name: "North West FM", freq: "89.8-103.9 FM", desc: "Home of the best music — Rustenburg & NW Province", region: "North West", color: "#e8b84b", icon: "📻", url: "https://onlineradiobox.com/za/northwestfm/", stream: "https://stream.zeno.fm/northwestfm" },
  { id: "groot",     name: "Groot FM", freq: "90.4 FM", desc: "Afrikaans music & entertainment — NW Province", region: "North West", color: "#60a5fa", icon: "📻", url: "https://www.grootfm.co.za", stream: "https://playerservices.streamtheworld.com/api/livestream-redirect/GROOT_FM.mp3" },
  { id: "mmabatho",  name: "Mmabatho Community Radio", freq: "Community FM", desc: "Serving Mmabatho & surrounds", region: "North West", color: "#4ade80", icon: "📻", url: "https://onlineradiobox.com/za/", stream: null },
  // National SA
  { id: "5fm",       name: "5FM", freq: "SA National", desc: "SA's youth music station — hits, Amapiano & more", region: "National", color: "#f59e0b", icon: "🎵", url: "https://www.5fm.co.za", stream: "https://playerservices.streamtheworld.com/api/livestream-redirect/SABC_5FM.mp3" },
  { id: "metro",     name: "Metro FM", freq: "SA National", desc: "Urban music, Amapiano & R&B", region: "National", color: "#a78bfa", icon: "🎵", url: "https://www.metrofm.co.za", stream: "https://playerservices.streamtheworld.com/api/livestream-redirect/SABC_METRO.mp3" },
  { id: "jacaranda", name: "Jacaranda FM", freq: "94.2 FM", desc: "Good music, great vibes — Pretoria/Rustenburg area", region: "National", color: "#f87171", icon: "🌸", url: "https://www.jacarandafm.com", stream: "https://playerservices.streamtheworld.com/api/livestream-redirect/JACARANDA_FM.mp3" },
  { id: "safm",      name: "SAfm", freq: "104-107 FM", desc: "News, talk & current affairs", region: "National", color: "#34d399", icon: "📰", url: "https://www.sabc.co.za/sabc/safm/", stream: "https://playerservices.streamtheworld.com/api/livestream-redirect/SABC_SAFM.mp3" },
];

// ── FREE MUSIC TRACKS ─────────────────────────────────────────
// YouTube Music — free, embeddable tracks
const FREE_MUSIC = [
  // ── AMAPIANO 2026 ────────────────────────────────────────────
  { id: "am1", title: "Amapiano Mix 22 May 2026 — Romeo Makota Soulful Sunset", videoId: "5ZteaJFFTFY", artist: "Romeo Makota", genre: "Amapiano", thumb: "https://img.youtube.com/vi/5ZteaJFFTFY/maxresdefault.jpg" },
  { id: "am2", title: "Amapiano 2026 Video Mix Vol.III — Shela", videoId: "1MjTlrkEDZs", artist: "Shela", genre: "Amapiano", thumb: "https://img.youtube.com/vi/1MjTlrkEDZs/maxresdefault.jpg" },
  { id: "am3", title: "Amapiano Mix April 2026 — Trending Songs", videoId: "IRWLhgPkG7U", artist: "Musicbwoy", genre: "Amapiano", thumb: "https://img.youtube.com/vi/IRWLhgPkG7U/maxresdefault.jpg" },
  { id: "am4", title: "Amapiano 2026 — New & Trending Afro Vibes", videoId: "Gqe6BfE1RvI", artist: "Various Artists", genre: "Amapiano", thumb: "https://img.youtube.com/vi/Gqe6BfE1RvI/maxresdefault.jpg" },
  { id: "am5", title: "Amapiano 2026 — WE GLOBAL Vol.I (Fast Fast, AL Xapo)", videoId: "ZvjoyNOE39s", artist: "Various Artists", genre: "Amapiano", thumb: "https://img.youtube.com/vi/ZvjoyNOE39s/maxresdefault.jpg" },
  { id: "am6", title: "Best of Amapiano Video Mix 2026 — DJ Pere", videoId: "o0WaIJDA4ug", artist: "DJ Pere", genre: "Amapiano", thumb: "https://img.youtube.com/vi/o0WaIJDA4ug/maxresdefault.jpg" },
  { id: "am7", title: "Amapiano 2026 — Shela, Zep, Snokonoko Video Mix", videoId: "RztpgqHO3c4", artist: "Various Artists", genre: "Amapiano", thumb: "https://img.youtube.com/vi/RztpgqHO3c4/maxresdefault.jpg" },
  { id: "am8", title: "Amapiano New Year Mix 2026", videoId: "4ngVPKwOJok", artist: "AmapianoGroove", genre: "Amapiano", thumb: "https://img.youtube.com/vi/4ngVPKwOJok/maxresdefault.jpg" },
  { id: "am9", title: "Amapiano Mix 2025 — Best of Year", videoId: "XZhu91HwUR0", artist: "OSOCITY", genre: "Amapiano", thumb: "https://img.youtube.com/vi/XZhu91HwUR0/maxresdefault.jpg" },
  { id: "am10", title: "Amapiano Mix December 2025 — Romeo Makota", videoId: "Lgtz-8T3DIc", artist: "Romeo Makota", genre: "Amapiano", thumb: "https://img.youtube.com/vi/Lgtz-8T3DIc/maxresdefault.jpg" },
  // ── AFRIKAANS ────────────────────────────────────────────────
  { id: "af1", title: "🇿🇦 Afrikaans Treffers Mix 2025 — Dis Doring Tyd", videoId: "rv60h6q6ers", artist: "DJ Dal S.A", genre: "Afrikaans", thumb: "https://img.youtube.com/vi/rv60h6q6ers/maxresdefault.jpg" },
  { id: "af2", title: "🇿🇦 Sondag Mix Vol.10 — Sing Along Afrikaans 2025", videoId: "HVpO8-rBg4o", artist: "DJ KMA CPT", genre: "Afrikaans", thumb: "https://img.youtube.com/vi/HVpO8-rBg4o/maxresdefault.jpg" },
  { id: "af3", title: "🇿🇦 Afrikaans Is Asemrowend Mix 2025 — Naweek Treffers", videoId: "yvLVjAPhvwg", artist: "DJ KMA CPT", genre: "Afrikaans", thumb: "https://img.youtube.com/vi/yvLVjAPhvwg/maxresdefault.jpg" },
  { id: "af4", title: "🇿🇦 Afrikaans Is Tip Top Mix Vol.3 — Plaas Treffers", videoId: "x4Sxa9zFzLA", artist: "DJ KMA CPT", genre: "Afrikaans", thumb: "https://img.youtube.com/vi/x4Sxa9zFzLA/maxresdefault.jpg" },
  // ── INTERNATIONAL 2026 ───────────────────────────────────────
  { id: "in1", title: "☀️ Top Hits 2026 — Afro House Summer Mix", videoId: "8KkIw5CjwqA", artist: "Various Artists", genre: "2026 Hits", thumb: "https://img.youtube.com/vi/8KkIw5CjwqA/maxresdefault.jpg" },
  { id: "in2", title: "🎧 Top Music 2026 — Best Pop & TikTok Hits", videoId: "p5Q2bfe-iZI", artist: "Various Artists", genre: "2026 Hits", thumb: "https://img.youtube.com/vi/p5Q2bfe-iZI/maxresdefault.jpg" },
  { id: "in3", title: "🔥 Top 40 Global Songs 2025", videoId: "9vSdEHTVWGY", artist: "Global Hits", genre: "International", thumb: "https://img.youtube.com/vi/9vSdEHTVWGY/maxresdefault.jpg" },
  { id: "in4", title: "🎵 Mega Hit List 2025 — Top Songs Right Now", videoId: "1AzkGpeUQZI", artist: "Chart Toppers", genre: "International", thumb: "https://img.youtube.com/vi/1AzkGpeUQZI/maxresdefault.jpg" },
  { id: "in5", title: "🌍 Top Hits 2025 — Summer Playlist", videoId: "vp2ZoXIFJfw", artist: "Various Artists", genre: "International", thumb: "https://img.youtube.com/vi/vp2ZoXIFJfw/maxresdefault.jpg" },
  { id: "in6", title: "🎵 Top Hits 2025 — TikTok Viral Songs Mix", videoId: "UN5t2BxBUos", artist: "Various Artists", genre: "International", thumb: "https://img.youtube.com/vi/UN5t2BxBUos/maxresdefault.jpg" },
  // ── GOSPEL ───────────────────────────────────────────────────
  { id: "go1", title: "✝️ SA Gospel Songs Mix 2026 — Powerful African Praise", videoId: "19fyz5lAIJs", artist: "Various Artists", genre: "Gospel", thumb: "https://img.youtube.com/vi/19fyz5lAIJs/maxresdefault.jpg" },
  { id: "go2", title: "✝️ Best Zulu Gospel 2025 — 1 Hour Powerful Praise", videoId: "sVS1JEV1-i4", artist: "Various Artists", genre: "Gospel", thumb: "https://img.youtube.com/vi/sVS1JEV1-i4/maxresdefault.jpg" },
  { id: "go3", title: "✝️ Zulu Worship Songs 2025 — Spirit Filled Praise", videoId: "ic-nHpZS0Co", artist: "Various Artists", genre: "Gospel", thumb: "https://img.youtube.com/vi/ic-nHpZS0Co/maxresdefault.jpg" },
  { id: "go4", title: "✝️ The Best Afro Gospel Playlist 2026", videoId: "MXzPCqviiVI", artist: "Scripture Music", genre: "Gospel", thumb: "https://img.youtube.com/vi/MXzPCqviiVI/maxresdefault.jpg" },
  { id: "go5", title: "✝️ SA Hymns Medley — Lebo Sekgobela & Ayanda Ntanzi", videoId: "RORRqTZtPkY", artist: "Lebo Sekgobela", genre: "Gospel", thumb: "https://img.youtube.com/vi/RORRqTZtPkY/maxresdefault.jpg" },
  { id: "go6", title: "✝️ Worship Songs 2025 SA — Spirit-Filled Praise", videoId: "pFbQyZtTCMA", artist: "Various Artists", genre: "Gospel", thumb: "https://img.youtube.com/vi/pFbQyZtTCMA/maxresdefault.jpg" },
  { id: "go7", title: "✝️ Old SA Gospel Songs Vol.1 2025 Mix", videoId: "xPeYcdTYEP4", artist: "Sibusiso Ketile", genre: "Gospel", thumb: "https://img.youtube.com/vi/xPeYcdTYEP4/maxresdefault.jpg" },
  // ── RELAXATION ───────────────────────────────────────────────
  { id: "re1", title: "🧘 African Relaxation Music — Calm & Peace", videoId: "1ZYbU82GVz4", artist: "Relaxing Africa", genre: "Relaxation", thumb: "https://img.youtube.com/vi/1ZYbU82GVz4/maxresdefault.jpg" },
  { id: "re2", title: "🧘 8 Hours Relaxing Music — Sleep & Study", videoId: "l3RQZ4mcr1Y", artist: "Relaxing Africa", genre: "Relaxation", thumb: "https://img.youtube.com/vi/l3RQZ4mcr1Y/maxresdefault.jpg" },
];
// ── NEWS SOURCES (RSS via proxy) ─────────────────────────────
const NEWS_FEEDS = [
  { label: "🇿🇦 SA News", url: "https://www.news24.com/rss" },
  { label: "🌍 World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { label: "💼 Business", url: "https://feeds.bbci.co.uk/news/business/rss.xml" },
  { label: "⚽ Sports", url: "https://feeds.bbci.co.uk/sport/rss.xml" },
];

// ── HTML5 GAMES ──────────────────────────────────────────────
// ── CASINO AFFILIATE PARTNERS ────────────────────────────────
// Managed via admin dashboard — add/edit/remove without code changes
// All partners are licensed SA gambling operators
const CASINO_PARTNERS = [
  {
    id: "betway",
    name: "Betway",
    logo: "🎰",
    color: "#00a651",
    bonus: "R25 Free Bet on Signup",
    description: "PSL title sponsor. Sports betting, live casino, slots & more.",
    rating: 5,
    categories: ["Sports Betting", "Live Casino", "Slots"],
    url: `https://www.betway.co.za${process.env.REACT_APP_BETWAY_BTAG ? "?btag=" + process.env.REACT_APP_BETWAY_BTAG : ""}`,
    terms: "T&Cs apply. 18+ only. New customers only.",
    featured: true,
    isNew: false,
  },
  {
    id: "hollywoodbets",
    name: "Hollywood Bets",
    logo: "🎬",
    color: "#e31837",
    bonus: "R50 Free Bet Welcome Bonus",
    description: "SA's most trusted betting platform. Horse racing, soccer, casino.",
    rating: 5,
    categories: ["Sports Betting", "Casino", "Horse Racing"],
    url: `https://www.hollywoodbets.net${process.env.REACT_APP_HB_REF ? "?ref=" + process.env.REACT_APP_HB_REF : ""}`,
    terms: "T&Cs apply. 18+ only. New customers only.",
    featured: true,
    isNew: false,
  },
  {
    id: "supabets",
    name: "Supabets",
    logo: "🃏",
    color: "#ff6600",
    bonus: "R50 Signup Bonus",
    description: "2 million+ SA players. Soccer, rugby, cricket & casino games.",
    rating: 4,
    categories: ["Sports Betting", "Casino", "Slots"],
    url: `https://www.supabets.co.za${process.env.REACT_APP_SUPABETS_REF ? "?ref=" + process.env.REACT_APP_SUPABETS_REF : ""}`,
    terms: "T&Cs apply. 18+ only.",
    featured: false,
    isNew: false,
  },
  {
    id: "sunbet",
    name: "Sunbet",
    logo: "☀️",
    color: "#f59e0b",
    bonus: "100% Match Bonus up to R1000",
    description: "Sun International casino brand. Roulette, blackjack, live casino.",
    rating: 4,
    categories: ["Live Casino", "Slots", "Table Games"],
    url: "https://www.sunbet.co.za",
    terms: "T&Cs apply. 18+ only. New customers only.",
    featured: false,
    isNew: true,
  },
  {
    id: "zarbet",
    name: "ZARbet",
    logo: "💎",
    color: "#a78bfa",
    bonus: "200% Welcome Bonus up to R2000",
    description: "SA Rand casino. Slots, live dealer, jackpots in ZAR.",
    rating: 4,
    categories: ["Casino", "Slots", "Jackpots"],
    url: "https://www.zarbet.co.za",
    terms: "T&Cs apply. 18+ only. Wagering requirements apply.",
    featured: false,
    isNew: true,
  },
];

const GAMES = [
  { id: "2048", title: "2048", icon: "🎯", color: "#f59e0b", desc: "Merge tiles to reach 2048" },
  { id: "snake", title: "Snake", icon: "🐍", color: "#4ade80", desc: "Classic snake game" },
  { id: "memory", title: "Memory", icon: "🧠", color: "#a78bfa", desc: "Match the pairs" },
  { id: "tictactoe", title: "Tic Tac Toe", icon: "❌", color: "#60a5fa", desc: "3 in a row wins" },
  { id: "trivia", title: "SA Trivia", icon: "🇿🇦", color: "#f87171", desc: "Test your SA knowledge" },
  { id: "reaction", title: "Reaction Time", icon: "⚡", color: G, desc: "How fast are you?" },
  { id: "sudoku",   title: "Sudoku",        icon: "🔢", color: "#34d399", desc: "Classic number puzzle" },
  { id: "solitaire",title: "Solitaire",     icon: "🃏", color: "#f87171", desc: "Classic card game" },
];

const TABS = [
  { key: "home",     label: "🏠",  full: "Home" },
  { key: "kids",     label: "👶",  full: "Kids" },
  { key: "music",    label: "🎵",  full: "Music" },
  { key: "comedy",   label: "😂",  full: "Comedy" },
  { key: "fitness",  label: "💪",  full: "Fitness" },
  { key: "cooking",  label: "🍳",  full: "Cooking" },
  { key: "wellness", label: "🧘",  full: "Wellness" },
  { key: "learning", label: "📚",  full: "Learn" },
  { key: "news",     label: "📰",  full: "News" },
  { key: "games",    label: "🎮",  full: "Games" },
  { key: "stream",   label: "📺",  full: "Stream" },
  { key: "reading",  label: "📚",  full: "Reading" },
  { key: "casino",      label: "🎰",  full: "18+ Casino" },
  { key: "classifieds", label: "📋",  full: "Classifieds" },
  { key: "ads",         label: "🏪",  full: "Biz Ads" },
];

// ── MINI GAMES ────────────────────────────────────────────────
function Game2048() {
  const [grid, setGrid] = useState(() => initGrid());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem("projo_2048_best") || "0"));
  const [gameOver, setGameOver] = useState(false);

  function initGrid() {
    const g = Array(4).fill(null).map(() => Array(4).fill(0));
    addRandom(g); addRandom(g);
    return g;
  }
  function addRandom(g) {
    const empty = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!g[r][c]) empty.push([r,c]);
    if (!empty.length) return;
    const [r,c] = empty[Math.floor(Math.random() * empty.length)];
    g[r][c] = Math.random() < 0.9 ? 2 : 4;
  }
  function move(dir) {
    if (gameOver) return;
    const g = grid.map(r => [...r]);
    let moved = false, gained = 0;
    const rotate = (arr) => arr[0].map((_, i) => arr.map(r => r[i]).reverse());
    let m = dir === "left" ? g : dir === "right" ? g.map(r => [...r].reverse()) : dir === "up" ? rotate(g) : rotate(g).map(r => [...r].reverse());
    m = m.map(row => {
      const filtered = row.filter(x => x);
      const merged = [];
      let i = 0;
      while (i < filtered.length) {
        if (i + 1 < filtered.length && filtered[i] === filtered[i+1]) {
          merged.push(filtered[i] * 2); gained += filtered[i] * 2; i += 2;
        } else { merged.push(filtered[i]); i++; }
      }
      const padded = [...merged, ...Array(4 - merged.length).fill(0)];
      if (padded.join() !== row.join()) moved = true;
      return padded;
    });
    let result = dir === "left" ? m : dir === "right" ? m.map(r => [...r].reverse()) : dir === "up" ? rotate(m.map(r => [...r].reverse())) : rotate(m).map(r => [...r].reverse());
    if (moved) { addRandom(result); setScore(s => { const ns = s + gained; if (ns > best) { setBest(ns); localStorage.setItem("projo_2048_best", ns); } return ns; }); setGrid(result); }
  }

  const COLORS = { 0:"#1a1a1a",2:"#eee4da",4:"#ede0c8",8:"#f2b179",16:"#f59563",32:"#f67c5f",64:"#f65e3b",128:"#edcf72",256:"#edcc61",512:"#edc850",1024:"#edc53f",2048:"#edc22e" };
  return (
    <div style={{ background: BG2, borderRadius: "16px", padding: "1rem", maxWidth: "360px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "24px", fontWeight: "800", color: G }}>2048</div>
        <div style={{ display: "flex", gap: "8px" }}>
          {[["Score", score],["Best", best]].map(([l,v]) => (
            <div key={l} style={{ background: "#8f7a66", borderRadius: "8px", padding: "6px 12px", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "#eee4da" }}>{l}</div>
              <div style={{ fontWeight: "700", color: "#fff" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", background: "#bbada0", padding: "8px", borderRadius: "10px", marginBottom: "12px" }}>
        {grid.flat().map((v,i) => (
          <div key={i} style={{ height: "70px", background: COLORS[v] || "#3c3a32", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: v > 999 ? "14px" : v > 99 ? "18px" : "22px", color: v <= 4 ? "#776e65" : "#f9f6f2" }}>
            {v || ""}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "6px" }}>
        {[["←","left"],["↑","up"],["↓","down"],["→","right"]].map(([label, dir]) => (
          <button key={dir} onClick={() => move(dir)} style={{ background: "#8f7a66", color: "#fff", border: "none", borderRadius: "8px", padding: "10px", fontSize: "18px", cursor: "pointer", fontWeight: "700" }}>{label}</button>
        ))}
      </div>
      <button onClick={() => { setGrid(initGrid()); setScore(0); setGameOver(false); }} style={{ width: "100%", marginTop: "10px", background: G, color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "10px", fontWeight: "700", cursor: "pointer" }}>New Game</button>
    </div>
  );
}

function ReactionGame() {
  const [state, setState] = useState("idle"); // idle, waiting, ready, done
  const [time, setTime] = useState(null);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem("projo_reaction_best") || "9999"));
  const timerRef = useRef(null);
  const startRef = useRef(null);

  function start() {
    setState("waiting");
    timerRef.current = setTimeout(() => { setState("ready"); startRef.current = Date.now(); }, 1000 + Math.random() * 3000);
  }
  function tap() {
    if (state === "waiting") { clearTimeout(timerRef.current); setState("idle"); toast.error("Too early! Wait for green."); return; }
    if (state === "ready") {
      const t = Date.now() - startRef.current;
      setTime(t);
      if (t < best) { setBest(t); localStorage.setItem("projo_reaction_best", t); }
      setState("done");
    }
    if (state === "idle" || state === "done") start();
  }
  const colors = { idle:"#1a1a1a", waiting:"#ef4444", ready:"#4ade80", done:"#e8b84b" };
  const messages = { idle:"Tap to Start", waiting:"Wait...", ready:"TAP NOW!", done:`${time}ms${time < best ? " 🏆 New Best!" : ""}` };
  return (
    <div style={{ textAlign: "center", padding: "1rem" }}>
      <div style={{ fontSize: "13px", color: "#6b6760", marginBottom: "8px" }}>Best: {best === 9999 ? "—" : `${best}ms`}</div>
      <div onClick={tap} style={{ height: "200px", background: colors[state], borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.1s" }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "24px", fontWeight: "800", color: state === "ready" ? "#0a0a0a" : "#fff" }}>{messages[state]}</div>
      </div>
      <div style={{ fontSize: "11px", color: "#6b6760", marginTop: "8px" }}>Under 200ms = Elite · Under 300ms = Good · Under 500ms = Average</div>
    </div>
  );
}

function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xTurn, setXTurn] = useState(true);
  const [winner, setWinner] = useState(null);
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  function checkWinner(b) { for (const [a,c,d] of wins) { if (b[a] && b[a]===b[c] && b[a]===b[d]) return b[a]; } return b.includes(null) ? null : "Draw"; }
  function play(i) {
    if (board[i] || winner) return;
    const nb = [...board]; nb[i] = xTurn ? "X" : "O";
    setBoard(nb); setXTurn(!xTurn);
    const w = checkWinner(nb); if (w) setWinner(w);
  }
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "14px", color: G, fontWeight: "700", marginBottom: "12px" }}>
        {winner ? (winner === "Draw" ? "Draw!" : `${winner} Wins! 🎉`) : `${xTurn ? "X" : "O"}'s turn`}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", maxWidth: "220px", margin: "0 auto 12px" }}>
        {board.map((v,i) => (
          <button key={i} onClick={() => play(i)} style={{ height: "70px", background: BG3, border: `1px solid ${BORDER}`, borderRadius: "10px", fontSize: "28px", fontWeight: "800", color: v === "X" ? "#60a5fa" : "#f87171", cursor: "pointer" }}>{v}</button>
        ))}
      </div>
      <button onClick={() => { setBoard(Array(9).fill(null)); setXTurn(true); setWinner(null); }} style={{ background: G, color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "8px 20px", fontWeight: "700", cursor: "pointer" }}>Reset</button>
    </div>
  );
}

function MemoryGame() {
  const emojis = ["🦁","🐘","🦒","🐊","🦓","🐆","🦏","🦛"];
  const [cards, setCards] = useState(() => {
    const deck = [...emojis,...emojis].sort(() => Math.random()-0.5).map((e,i) => ({ id:i, emoji:e, flipped:false, matched:false }));
    return deck;
  });
  const [flipped, setFlipped] = useState([]);
  const [moves, setMoves] = useState(0);
  function flip(id) {
    if (flipped.length === 2) return;
    const card = cards.find(c => c.id === id);
    if (card.flipped || card.matched) return;
    const nf = [...flipped, id];
    setCards(prev => prev.map(c => c.id === id ? {...c, flipped:true} : c));
    setFlipped(nf);
    if (nf.length === 2) {
      setMoves(m => m+1);
      const [a,b] = nf.map(i => cards.find(c => c.id === i));
      if (a.emoji === b.emoji) {
        setCards(prev => prev.map(c => nf.includes(c.id) ? {...c, matched:true} : c));
        setFlipped([]);
      } else {
        setTimeout(() => { setCards(prev => prev.map(c => nf.includes(c.id) ? {...c, flipped:false} : c)); setFlipped([]); }, 800);
      }
    }
  }
  const won = cards.every(c => c.matched);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "13px", color: "#6b6760", marginBottom: "12px" }}>Moves: {moves} {won && "🎉 You won!"}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", maxWidth: "280px", margin: "0 auto 12px" }}>
        {cards.map(c => (
          <button key={c.id} onClick={() => flip(c.id)} style={{ height: "60px", background: c.flipped||c.matched ? BG3 : "#3a2020", border: `1px solid ${c.matched ? G : BORDER}`, borderRadius: "10px", fontSize: "24px", cursor: "pointer", transition: "all 0.3s" }}>
            {c.flipped||c.matched ? c.emoji : "❓"}
          </button>
        ))}
      </div>
      <button onClick={() => { setCards([...emojis,...emojis].sort(() => Math.random()-0.5).map((e,i) => ({id:i,emoji:e,flipped:false,matched:false}))); setFlipped([]); setMoves(0); }} style={{ background: G, color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "8px 20px", fontWeight: "700", cursor: "pointer" }}>New Game</button>
    </div>
  );
}

// ── SNAKE GAME ───────────────────────────────────────────────
function SnakeGame() {
  const canvasRef = React.useRef(null);
  const gameRef = React.useRef({ running: false, dir: "RIGHT", nextDir: "RIGHT", snake: [{x:10,y:10}], food: {x:15,y:15}, score: 0, speed: 150 });
  const [score, setScore] = React.useState(0);
  const [best, setBest] = React.useState(() => parseInt(localStorage.getItem("projo_snake_best")||"0"));
  const [status, setStatus] = React.useState("idle"); // idle, playing, over
  const loopRef = React.useRef(null);

  const COLS = 20, ROWS = 20, CELL = 16;

  function randomFood(snake) {
    let pos;
    do { pos = { x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS) }; }
    while (snake.some(s => s.x===pos.x && s.y===pos.y));
    return pos;
  }

  function draw() {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const g = gameRef.current;
    ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0,0,COLS*CELL,ROWS*CELL);
    // Grid
    ctx.strokeStyle = "rgba(232,184,75,0.05)";
    for (let i=0;i<=COLS;i++) { ctx.beginPath(); ctx.moveTo(i*CELL,0); ctx.lineTo(i*CELL,ROWS*CELL); ctx.stroke(); }
    for (let i=0;i<=ROWS;i++) { ctx.beginPath(); ctx.moveTo(0,i*CELL); ctx.lineTo(COLS*CELL,i*CELL); ctx.stroke(); }
    // Snake
    g.snake.forEach((s,i) => {
      ctx.fillStyle = i===0 ? "#e8b84b" : "#4ade80";
      ctx.beginPath(); ctx.roundRect(s.x*CELL+1, s.y*CELL+1, CELL-2, CELL-2, 3); ctx.fill();
    });
    // Food
    ctx.fillStyle = "#ef4444";
    ctx.beginPath(); ctx.arc(g.food.x*CELL+CELL/2, g.food.y*CELL+CELL/2, CELL/2-2, 0, Math.PI*2); ctx.fill();
  }

  function gameLoop() {
    const g = gameRef.current;
    g.dir = g.nextDir;
    const head = { ...g.snake[0] };
    if (g.dir==="UP") head.y--; if (g.dir==="DOWN") head.y++;
    if (g.dir==="LEFT") head.x--; if (g.dir==="RIGHT") head.x++;
    // Wall or self collision
    if (head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS||g.snake.some(s=>s.x===head.x&&s.y===head.y)) {
      clearInterval(loopRef.current);
      g.running = false;
      if (g.score > best) { setBest(g.score); localStorage.setItem("projo_snake_best", g.score); }
      setStatus("over");
      return;
    }
    g.snake.unshift(head);
    if (head.x===g.food.x && head.y===g.food.y) {
      g.score++; setScore(g.score);
      g.food = randomFood(g.snake);
      // Speed up
      if (g.score % 5 === 0 && g.speed > 80) {
        clearInterval(loopRef.current);
        g.speed -= 10;
        loopRef.current = setInterval(gameLoop, g.speed);
      }
    } else { g.snake.pop(); }
    draw();
  }

  function startGame() {
    const g = gameRef.current;
    g.snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
    g.dir = "RIGHT"; g.nextDir = "RIGHT";
    g.food = randomFood(g.snake);
    g.score = 0; g.speed = 150; g.running = true;
    setScore(0); setStatus("playing");
    clearInterval(loopRef.current);
    loopRef.current = setInterval(gameLoop, g.speed);
    draw();
  }

  React.useEffect(() => {
    draw();
    return () => clearInterval(loopRef.current);
  }, []);

  React.useEffect(() => {
    function handleKey(e) {
      const g = gameRef.current; if (!g.running) return;
      const map = { ArrowUp:"UP", ArrowDown:"DOWN", ArrowLeft:"LEFT", ArrowRight:"RIGHT", w:"UP", s:"DOWN", a:"LEFT", d:"RIGHT" };
      const newDir = map[e.key];
      if (!newDir) return;
      const opp = {UP:"DOWN",DOWN:"UP",LEFT:"RIGHT",RIGHT:"LEFT"};
      if (newDir !== opp[g.dir]) g.nextDir = newDir;
      e.preventDefault();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  function handleSwipe(dir) {
    const g = gameRef.current; if (!g.running) return;
    const opp = {UP:"DOWN",DOWN:"UP",LEFT:"RIGHT",RIGHT:"LEFT"};
    if (dir !== opp[g.dir]) g.nextDir = dir;
  }

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "12px" }}>
        <div style={{ fontSize: "13px", color: G, fontWeight: "700" }}>Score: {score}</div>
        <div style={{ fontSize: "13px", color: "#6b6760" }}>Best: {best}</div>
      </div>
      <canvas ref={canvasRef} width={COLS*CELL} height={ROWS*CELL} style={{ border: "1px solid rgba(232,184,75,0.2)", borderRadius: "8px", display: "block", margin: "0 auto" }} />
      {status !== "playing" && (
        <button onClick={startGame} style={{ marginTop: "12px", background: "#4ade80", color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "10px 24px", fontWeight: "800", cursor: "pointer", fontSize: "14px" }}>
          {status === "over" ? "🐍 Play Again" : "🐍 Start Game"}
        </button>
      )}
      {status === "over" && <div style={{ color: "#f87171", marginTop: "8px", fontWeight: "700" }}>Game Over! Score: {score}</div>}
      {/* Mobile controls */}
      {status === "playing" && (
        <div style={{ marginTop: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", maxWidth: "150px", margin: "0 auto" }}>
            <div />
            <button onClick={() => handleSwipe("UP")} style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "10px", color: G, fontSize: "16px", cursor: "pointer" }}>↑</button>
            <div />
            <button onClick={() => handleSwipe("LEFT")} style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "10px", color: G, fontSize: "16px", cursor: "pointer" }}>←</button>
            <button onClick={() => handleSwipe("DOWN")} style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "10px", color: G, fontSize: "16px", cursor: "pointer" }}>↓</button>
            <button onClick={() => handleSwipe("RIGHT")} style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "10px", color: G, fontSize: "16px", cursor: "pointer" }}>→</button>
          </div>
          <div style={{ fontSize: "10px", color: "#4a3030", marginTop: "6px" }}>Keyboard: WASD or Arrow Keys · Mobile: tap arrows above</div>
        </div>
      )}
    </div>
  );
}

// ── SUDOKU GAME ──────────────────────────────────────────────
function SudokuGame() {
  const G = "#e8b84b";
  const BG = "#0a0a0a";
  const BG3 = "#1a1a1a";
  const BORDER = "rgba(232,184,75,0.15)";

  // Generate a valid sudoku puzzle
  function generatePuzzle() {
    const base = [
      [5,3,0,0,7,0,0,0,0],
      [6,0,0,1,9,5,0,0,0],
      [0,9,8,0,0,0,0,6,0],
      [8,0,0,0,6,0,0,0,3],
      [4,0,0,8,0,3,0,0,1],
      [7,0,0,0,2,0,0,0,6],
      [0,6,0,0,0,0,2,8,0],
      [0,0,0,4,1,9,0,0,5],
      [0,0,0,0,8,0,0,7,9],
    ];
    const solution = [
      [5,3,4,6,7,8,9,1,2],
      [6,7,2,1,9,5,3,4,8],
      [1,9,8,3,4,2,5,6,7],
      [8,5,9,7,6,1,4,2,3],
      [4,2,6,8,5,3,7,9,1],
      [7,1,3,9,2,4,8,5,6],
      [9,6,1,5,3,7,2,8,4],
      [2,8,7,4,1,9,6,3,5],
      [3,4,5,2,8,6,1,7,9],
    ];
    // Shuffle by rotating/reflecting randomly
    return { puzzle: base, solution };
  }

  const { puzzle, solution } = React.useMemo(() => generatePuzzle(), []);
  const [grid, setGrid] = React.useState(() => puzzle.map(r => [...r]));
  const [selected, setSelected] = React.useState(null);
  const [errors, setErrors] = React.useState({});
  const [won, setWon] = React.useState(false);
  const [notes, setNotes] = React.useState(false);

  const isFixed = (r, c) => puzzle[r][c] !== 0;

  function selectCell(r, c) {
    if (isFixed(r, c)) return;
    setSelected([r, c]);
  }

  function inputNum(n) {
    if (!selected || won) return;
    const [r, c] = selected;
    if (isFixed(r, c)) return;
    const ng = grid.map(row => [...row]);
    ng[r][c] = n;
    setGrid(ng);
    // Check error
    const ne = { ...errors };
    const key = `${r}-${c}`;
    if (n !== 0 && n !== solution[r][c]) { ne[key] = true; }
    else { delete ne[key]; }
    setErrors(ne);
    // Check win
    if (ng.every((row, ri) => row.every((v, ci) => v === solution[ri][ci]))) setWon(true);
  }

  function getCellBg(r, c) {
    if (selected && selected[0] === r && selected[1] === c) return "rgba(232,184,75,0.3)";
    if (selected) {
      const [sr, sc] = selected;
      const sBox = Math.floor(sr/3)*3 + Math.floor(sc/3);
      const cBox = Math.floor(r/3)*3 + Math.floor(c/3);
      if (sr === r || sc === c || sBox === cBox) return "rgba(232,184,75,0.06)";
    }
    return Math.floor(r/3)*3 + Math.floor(c/3) % 2 === 0 ? "#111" : "#151515";
  }

  const cellSize = "30px";

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "10px" }}>
        <div style={{ fontSize: "12px", color: "#6b6760" }}>Tap a cell, then tap a number</div>
        {won && <div style={{ fontSize: "13px", color: "#4ade80", fontWeight: "700" }}>🎉 Solved!</div>}
      </div>

      {/* Grid */}
      <div style={{ display: "inline-block", border: "2px solid rgba(232,184,75,0.5)", borderRadius: "4px" }}>
        {grid.map((row, r) => (
          <div key={r} style={{ display: "flex", borderBottom: r === 2 || r === 5 ? "2px solid rgba(232,184,75,0.4)" : "1px solid rgba(232,184,75,0.1)" }}>
            {row.map((val, c) => (
              <div key={c} onClick={() => selectCell(r, c)} style={{
                width: cellSize, height: cellSize, display: "flex", alignItems: "center", justifyContent: "center",
                background: getCellBg(r, c),
                borderRight: c === 2 || c === 5 ? "2px solid rgba(232,184,75,0.4)" : "1px solid rgba(232,184,75,0.1)",
                cursor: isFixed(r,c) ? "default" : "pointer",
                fontSize: "14px",
                fontWeight: isFixed(r,c) ? "800" : "500",
                color: errors[`${r}-${c}`] ? "#ef4444" : isFixed(r,c) ? "#f0ede8" : "#e8b84b",
                transition: "background 0.1s",
              }}>
                {val !== 0 ? val : ""}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Number pad */}
      <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginTop: "12px", flexWrap: "wrap" }}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => inputNum(n)} style={{
            width: "36px", height: "36px", background: BG3,
            border: `1px solid ${BORDER}`, borderRadius: "8px",
            color: "#f0ede8", fontSize: "16px", fontWeight: "700", cursor: "pointer",
          }}>{n}</button>
        ))}
        <button onClick={() => inputNum(0)} style={{
          width: "36px", height: "36px", background: "#7f1d1d",
          border: "1px solid #ef4444", borderRadius: "8px",
          color: "#f87171", fontSize: "12px", fontWeight: "700", cursor: "pointer",
        }}>✕</button>
      </div>

      <button onClick={() => { setGrid(puzzle.map(r=>[...r])); setErrors({}); setWon(false); setSelected(null); }}
        style={{ marginTop: "12px", background: BG3, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 20px", color: "#6b6760", cursor: "pointer", fontSize: "12px" }}>
        Reset Puzzle
      </button>
    </div>
  );
}

// ── SOLITAIRE (Klondike) ──────────────────────────────────────
function SolitaireGame() {
  const G = "#e8b84b";
  const BG2 = "#111111";
  const BG3 = "#1a1a1a";
  const BORDER = "rgba(232,184,75,0.15)";

  const SUITS = ["♠","♥","♦","♣"];
  const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  const RED = ["♥","♦"];

  function newDeck() {
    const deck = [];
    for (const s of SUITS) for (const r of RANKS) deck.push({ suit: s, rank: r, faceUp: false });
    for (let i = deck.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [deck[i],deck[j]]=[deck[j],deck[i]]; }
    return deck;
  }

  function initGame() {
    const deck = newDeck();
    const tableau = Array(7).fill(null).map(() => []);
    let idx = 0;
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = deck[idx++];
        card.faceUp = row === col;
        tableau[col].push(card);
      }
    }
    return {
      tableau,
      stock: deck.slice(idx).map(c => ({ ...c, faceUp: false })),
      waste: [],
      foundations: [[], [], [], []],
    };
  }

  const [game, setGame] = React.useState(() => initGame());
  const [selected, setSelected] = React.useState(null); // { source, colIdx, cardIdx }
  const [moves, setMoves] = React.useState(0);
  const [won, setWon] = React.useState(false);

  function rankVal(r) { return RANKS.indexOf(r); }
  function isRed(s) { return RED.includes(s); }

  function canPlace(card, onto) {
    if (!onto) return card.rank === "K";
    const top = onto[onto.length-1];
    if (!top) return card.rank === "K";
    return rankVal(card.rank) === rankVal(top.rank)-1 && isRed(card.suit) !== isRed(top.suit);
  }

  function canFoundation(card, found) {
    if (found.length === 0) return card.rank === "A";
    const top = found[found.length-1];
    return card.suit === top.suit && rankVal(card.rank) === rankVal(top.rank)+1;
  }

  function drawCard() {
    setGame(prev => {
      const g = JSON.parse(JSON.stringify(prev));
      if (g.stock.length === 0) {
        g.stock = g.waste.reverse().map(c => ({ ...c, faceUp: false }));
        g.waste = [];
      } else {
        const card = g.stock.pop();
        card.faceUp = true;
        g.waste.push(card);
      }
      return g;
    });
    setMoves(m => m+1);
  }

  function selectCard(source, colIdx, cardIdx) {
    if (selected) {
      // Try to move
      moveCard(source, colIdx, cardIdx);
      return;
    }
    setSelected({ source, colIdx, cardIdx });
  }

  function moveCard(destSource, destColIdx, destCardIdx) {
    setGame(prev => {
      const g = JSON.parse(JSON.stringify(prev));
      let cards = [];
      // Get cards to move
      if (selected.source === "waste") {
        cards = [g.waste[g.waste.length-1]];
      } else if (selected.source === "tableau") {
        cards = g.tableau[selected.colIdx].slice(selected.cardIdx);
      }
      if (!cards.length) { setSelected(null); return prev; }

      // Try foundation
      if (destSource === "foundation") {
        const found = g.foundations[destColIdx];
        if (cards.length === 1 && canFoundation(cards[0], found)) {
          found.push(cards[0]);
          if (selected.source === "waste") g.waste.pop();
          else g.tableau[selected.colIdx].splice(selected.cardIdx);
          // Flip top of source column
          if (selected.source === "tableau" && g.tableau[selected.colIdx].length > 0) {
            g.tableau[selected.colIdx][g.tableau[selected.colIdx].length-1].faceUp = true;
          }
          setSelected(null);
          setMoves(m => m+1);
          // Check win
          if (g.foundations.every(f => f.length === 13)) setWon(true);
          return g;
        }
        setSelected(null); return prev;
      }

      // Try tableau
      if (destSource === "tableau") {
        const col = g.tableau[destColIdx];
        const topCard = col.length > 0 ? col[col.length-1] : null;
        if (canPlace(cards[0], col)) {
          col.push(...cards);
          if (selected.source === "waste") g.waste.pop();
          else g.tableau[selected.colIdx].splice(selected.cardIdx);
          if (selected.source === "tableau" && g.tableau[selected.colIdx].length > 0) {
            g.tableau[selected.colIdx][g.tableau[selected.colIdx].length-1].faceUp = true;
          }
          setSelected(null);
          setMoves(m => m+1);
          return g;
        }
        setSelected(null); return prev;
      }

      setSelected(null); return prev;
    });
  }

  function CardView({ card, isSelected, onClick, style = {} }) {
    if (!card) return <div style={{ width: "48px", height: "68px", border: "1px dashed rgba(232,184,75,0.2)", borderRadius: "6px", ...style }} onClick={onClick} />;
    if (!card.faceUp) return (
      <div onClick={onClick} style={{ width: "48px", height: "68px", background: "#1a2a4a", border: "1px solid #2a3a5a", borderRadius: "6px", cursor: "pointer",
        backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 8px)", ...style }} />
    );
    return (
      <div onClick={onClick} style={{
        width: "48px", height: "68px", background: isSelected ? "rgba(232,184,75,0.2)" : "#f8f8f8",
        border: `2px solid ${isSelected ? G : "transparent"}`, borderRadius: "6px", cursor: "pointer",
        display: "flex", flexDirection: "column", padding: "3px 4px", boxSizing: "border-box",
        boxShadow: isSelected ? `0 0 8px ${G}` : "none", ...style,
      }}>
        <div style={{ fontSize: "11px", fontWeight: "800", color: isRed(card.suit) ? "#dc2626" : "#111", lineHeight: 1 }}>{card.rank}</div>
        <div style={{ fontSize: "14px", color: isRed(card.suit) ? "#dc2626" : "#111", textAlign: "center", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>{card.suit}</div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: "360px" }}>
        {won && <div style={{ textAlign: "center", color: "#4ade80", fontWeight: "800", fontSize: "18px", marginBottom: "12px" }}>🎉 You Won in {moves} moves!</div>}

        {/* Top row: stock, waste, foundations */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "12px", alignItems: "flex-start" }}>
          {/* Stock */}
          <div onClick={drawCard} style={{ cursor: "pointer" }}>
            {game.stock.length > 0
              ? <div style={{ width: "48px", height: "68px", background: "#1a2a4a", border: "1px solid #2a3a5a", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🂠</div>
              : <div style={{ width: "48px", height: "68px", border: "1px dashed rgba(232,184,75,0.3)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", color: "#6b6760" }}>↺</div>
            }
          </div>
          {/* Waste */}
          <CardView card={game.waste[game.waste.length-1] || null}
            isSelected={selected?.source === "waste"}
            onClick={() => game.waste.length > 0 && selectCard("waste", 0, game.waste.length-1)} />
          <div style={{ flex: 1 }} />
          {/* Foundations */}
          {game.foundations.map((f, i) => (
            <div key={i} onClick={() => moveCard("foundation", i, f.length)} style={{ cursor: "pointer" }}>
              {f.length > 0
                ? <CardView card={f[f.length-1]} isSelected={false} onClick={() => moveCard("foundation", i, f.length)} />
                : <div style={{ width: "48px", height: "68px", border: "1px dashed rgba(232,184,75,0.3)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "rgba(232,184,75,0.3)" }}>{SUITS[i]}</div>
              }
            </div>
          ))}
        </div>

        {/* Tableau */}
        <div style={{ display: "flex", gap: "6px", alignItems: "flex-start" }}>
          {game.tableau.map((col, colIdx) => (
            <div key={colIdx} style={{ position: "relative", minHeight: "80px", flex: 1 }}
              onClick={() => col.length === 0 && moveCard("tableau", colIdx, 0)}>
              {col.length === 0 && (
                <div style={{ width: "48px", height: "68px", border: "1px dashed rgba(232,184,75,0.2)", borderRadius: "6px" }} />
              )}
              {col.map((card, cardIdx) => (
                <div key={cardIdx} style={{ position: cardIdx === 0 ? "relative" : "absolute", top: cardIdx === 0 ? 0 : cardIdx * (card.faceUp ? 20 : 12), left: 0 }}>
                  <CardView card={card}
                    isSelected={selected?.source==="tableau" && selected?.colIdx===colIdx && selected?.cardIdx===cardIdx}
                    onClick={() => card.faceUp && selectCard("tableau", colIdx, cardIdx)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: `${Math.max(...game.tableau.map(c=>c.length)) * 20 + 80}px` }}>
          <div style={{ fontSize: "12px", color: "#6b6760" }}>Moves: {moves}</div>
          <button onClick={() => { setGame(initGame()); setSelected(null); setMoves(0); setWon(false); }}
            style={{ background: BG3, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "6px 14px", color: G, fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
            New Game
          </button>
        </div>
        <div style={{ fontSize: "10px", color: "#4a3030", marginTop: "6px" }}>Tap a card to select, tap destination to move · Tap deck to draw</div>
      </div>
    </div>
  );
}

// SA Trivia
const TRIVIA = [
  { q: "What is the capital city of South Africa?", a: ["Cape Town", "Pretoria", "Johannesburg", "Durban"], correct: 1 },
  { q: "What year did SA host the FIFA World Cup?", a: ["2006","2010","2014","2018"], correct: 1 },
  { q: "What is South Africa's national animal?", a: ["Lion","Elephant","Springbok","Rhino"], correct: 2 },
  { q: "How many official languages does SA have?", a: ["9","11","7","13"], correct: 1 },
  { q: "Which SA city is called 'eGoli'?", a: ["Durban","Cape Town","Johannesburg","Pretoria"], correct: 2 },
  { q: "What currency does South Africa use?", a: ["Dollar","Pound","Rand","Euro"], correct: 2 },
  { q: "Who was SA's first democratic president?", a: ["F.W. de Klerk","Thabo Mbeki","Nelson Mandela","Cyril Ramaphosa"], correct: 2 },
  { q: "Which ocean borders the Cape of Good Hope?", a: ["Indian","Atlantic","Both","Pacific"], correct: 2 },
];

function TriviaGame() {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [done, setDone] = useState(false);
  const q = TRIVIA[idx];
  function answer(i) {
    if (answered !== null) return;
    setAnswered(i);
    if (i === q.correct) setScore(s => s+1);
    setTimeout(() => {
      if (idx < TRIVIA.length - 1) { setIdx(i => i+1); setAnswered(null); }
      else setDone(true);
    }, 1000);
  }
  if (done) return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <div style={{ fontSize: "48px", marginBottom: "12px" }}>🇿🇦</div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "24px", fontWeight: "800", color: G, marginBottom: "8px" }}>{score}/{TRIVIA.length}</div>
      <div style={{ color: "#6b6760", marginBottom: "16px" }}>{score >= 6 ? "Excellent! You really know SA! 🏆" : score >= 4 ? "Good job! Keep learning!" : "Keep exploring SA!"}</div>
      <button onClick={() => { setIdx(0); setScore(0); setAnswered(null); setDone(false); }} style={{ background: G, color: "#0a0a0a", border: "none", borderRadius: "8px", padding: "10px 24px", fontWeight: "700", cursor: "pointer" }}>Play Again</button>
    </div>
  );
  return (
    <div style={{ padding: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{ fontSize: "12px", color: "#6b6760" }}>Question {idx+1}/{TRIVIA.length}</div>
        <div style={{ fontSize: "12px", color: G, fontWeight: "700" }}>Score: {score}</div>
      </div>
      <div style={{ background: BG3, borderRadius: "12px", padding: "1rem", marginBottom: "14px", fontSize: "14px", fontWeight: "600", color: "#f0ede8", lineHeight: 1.5 }}>{q.q}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {q.a.map((ans, i) => (
          <button key={i} onClick={() => answer(i)} style={{
            background: answered === null ? BG3 : i === q.correct ? "rgba(74,222,128,0.2)" : answered === i ? "rgba(248,113,113,0.2)" : BG3,
            border: `1px solid ${answered === null ? BORDER : i === q.correct ? "#4ade80" : answered === i ? "#f87171" : BORDER}`,
            borderRadius: "10px", padding: "12px 14px", textAlign: "left", fontSize: "13px",
            color: "#f0ede8", cursor: "pointer", fontWeight: "500",
          }}>{ans}</button>
        ))}
      </div>
    </div>
  );
}

// ── VIDEO CARD ────────────────────────────────────────────────
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

// ── CLASSIFIEDS ──────────────────────────────────────────────
function ClassifiedsTab({ user }) {
  const G = "#e8b84b";
  const BG2 = "#111111";
  const BG3 = "#1a1a1a";
  const BORDER = "rgba(232,184,75,0.15)";

  const CATS = ["All","Vehicles","Property","Electronics","Furniture","Clothing","Jobs","Services","Animals","Food","Other"];
  const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  const [ads, setAds] = React.useState([]);
  const [myAds, setMyAds] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [subTab, setSubTab] = React.useState("browse");
  const [category, setCategory] = React.useState("All");
  const [search, setSearch] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);
  const [selectedAd, setSelectedAd] = React.useState(null);
  const [form, setForm] = React.useState({ title:"", description:"", category:"", price:"", location:"", phone:"", mediaData:null, mediaType:"", mediaName:"" });
  const [tcAccepted, setTcAccepted] = React.useState(false);
  const [showTC, setShowTC] = React.useState(false);
  const [posting, setPosting] = React.useState(false);

  const token = localStorage.getItem("projo_token");
  const headers = { Authorization: `Bearer ${token}` };

  async function loadAds() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "All") params.set("category", category);
      if (search) params.set("search", search);
      const res = await fetch(`${API}/entertainment/classifieds?${params}`, { headers });
      const data = await res.json();
      setAds(data.classifieds || []);
    } catch {}
    setLoading(false);
  }

  async function loadMyAds() {
    try {
      const res = await fetch(`${API}/entertainment/classifieds/mine`, { headers });
      const data = await res.json();
      setMyAds(data.classifieds || []);
    } catch {}
  }

  React.useEffect(() => { loadAds(); }, [category, search]);
  React.useEffect(() => { if (subTab === "mine") loadMyAds(); }, [subTab]);

  async function postAd() {
    if (!form.title || !form.description) return toast.error("Title and description required");
    if (!form.category) return toast.error("Please select a category");
    if (!form.phone) return toast.error("Phone number required for buyers to contact you");
    if (!tcAccepted) return toast.error("Please accept the Terms & Conditions to post");
    setPosting(true);
    try {
      const res = await fetch(`${API}/entertainment/classifieds`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("✅ Ad posted successfully!");
        setShowForm(false);
        setForm({ title:"", description:"", category:"General", price:"", location:"", phone:"", mediaData:null, mediaType:"", mediaName:"" });
        loadAds();
      }
    } catch { toast.error("Could not post ad"); }
    setPosting(false);
  }

  async function markSold(id) {
    try {
      await fetch(`${API}/entertainment/classifieds/${id}/mark-sold`, { method:"PUT", headers });
      toast.success("Marked as sold");
      loadMyAds();
    } catch {}
  }

  async function deleteAd(id) {
    if (!window.confirm("Delete this ad?")) return;
    try {
      await fetch(`${API}/entertainment/classifieds/${id}`, { method:"DELETE", headers });
      toast.success("Ad deleted");
      loadMyAds(); loadAds();
    } catch {}
  }

  const inp = { width:"100%", background:BG3, border:`1px solid ${BORDER}`, borderRadius:"8px", color:"#f0ede8", padding:"10px 12px", fontSize:"13px", outline:"none", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box", marginBottom:"10px" };

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
        <div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"16px", fontWeight:"800", color:"#f0ede8" }}>📋 Free Classifieds</div>
          <div style={{ fontSize:"11px", color:"#6b6760" }}>Buy · Sell · Swap — 100% Free · Rustenburg & surrounds</div>
        </div>
        <button onClick={() => setShowForm(true)} style={{ background:G, color:"#0a0a0a", border:"none", borderRadius:"8px", padding:"8px 14px", fontSize:"12px", fontWeight:"700", cursor:"pointer" }}>+ Post Ad</button>
      </div>

      {/* Sub tabs */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"1rem" }}>
        {[["browse","🔍 Browse"],["mine","📝 My Ads"]].map(([k,l]) => (
          <button key={k} onClick={() => setSubTab(k)} style={{ flex:1, background:subTab===k?"rgba(232,184,75,0.15)":BG2, border:`1px solid ${subTab===k?G:BORDER}`, borderRadius:"10px", padding:"10px", color:subTab===k?G:"#6b6760", fontSize:"13px", fontWeight:"700", cursor:"pointer" }}>{l}</button>
        ))}
      </div>

      {subTab === "browse" && (
        <>
          {/* Search */}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search classifieds..."
            style={{ ...inp, marginBottom:"10px" }} />

          {/* Category pills */}
          <div style={{ display:"flex", gap:"6px", overflowX:"auto", marginBottom:"1rem", paddingBottom:"4px" }}>
            {CATS.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)} style={{
                background:category===cat?"rgba(232,184,75,0.15)":BG2,
                border:`1px solid ${category===cat?G:BORDER}`,
                borderRadius:"20px", padding:"5px 12px", color:category===cat?G:"#6b6760",
                fontSize:"11px", fontWeight:"700", cursor:"pointer", whiteSpace:"nowrap", flexShrink:0,
              }}>{cat}</button>
            ))}
          </div>

          {loading ? <div style={{ textAlign:"center", padding:"2rem", color:"#6b6760" }}>Loading ads...</div> : (
            ads.length === 0 ? (
              <div style={{ textAlign:"center", padding:"3rem", color:"#6b6760" }}>
                <div style={{ fontSize:"48px", marginBottom:"12px" }}>📋</div>
                <div style={{ fontWeight:"700", marginBottom:"8px" }}>No ads yet</div>
                <div style={{ fontSize:"12px", marginBottom:"16px" }}>Be the first to post a classified in Rustenburg!</div>
                <button onClick={() => setShowForm(true)} style={{ background:G, color:"#0a0a0a", border:"none", borderRadius:"10px", padding:"12px 24px", fontWeight:"700", cursor:"pointer" }}>Post Free Ad</button>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                {ads.map(ad => (
                  <div key={ad.id} onClick={() => setSelectedAd(ad)} style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"14px", overflow:"hidden", cursor:"pointer" }}>
                    {ad.mediaData && ad.mediaType?.startsWith("image") && (
                      <img src={ad.mediaData} alt={ad.title} style={{ width:"100%", height:"130px", objectFit:"cover" }} />
                    )}
                    <div style={{ padding:"10px" }}>
                      <div style={{ fontSize:"10px", color:G, fontWeight:"700", marginBottom:"3px" }}>{ad.category}</div>
                      <div style={{ fontSize:"13px", fontWeight:"700", color:"#f0ede8", lineHeight:1.3, marginBottom:"4px" }}>{ad.title}</div>
                      {ad.price && <div style={{ fontSize:"14px", fontWeight:"800", color:G }}>{ad.price.startsWith("R") ? ad.price : `R${ad.price}`}</div>}
                      <div style={{ fontSize:"10px", color:"#6b6760", marginTop:"4px" }}>📍 {ad.location || "Rustenburg"}</div>
                      <div style={{ fontSize:"10px", color:"#4a3030", marginTop:"2px" }}>{new Date(ad.createdAt).toLocaleDateString("en-ZA")}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}

      {subTab === "mine" && (
        <div>
          {myAds.length === 0 ? (
            <div style={{ textAlign:"center", padding:"2rem", color:"#6b6760" }}>
              <div style={{ fontSize:"32px", marginBottom:"8px" }}>📋</div>
              <div>You haven't posted any ads yet</div>
              <button onClick={() => { setSubTab("browse"); setShowForm(true); }} style={{ background:G, color:"#0a0a0a", border:"none", borderRadius:"8px", padding:"10px 20px", fontWeight:"700", cursor:"pointer", marginTop:"12px" }}>Post Your First Ad</button>
            </div>
          ) : myAds.map(ad => (
            <div key={ad.id} style={{ background:BG2, border:`1px solid ${BORDER}`, borderRadius:"14px", padding:"1rem", marginBottom:"10px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"6px" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"13px", fontWeight:"700", color:"#f0ede8" }}>{ad.title}</div>
                  <div style={{ fontSize:"11px", color:"#6b6760" }}>{ad.category} {ad.price ? `· ${ad.price.startsWith("R")?ad.price:"R"+ad.price}` : ""}</div>
                </div>
                <span style={{ fontSize:"10px", fontWeight:"700", color:ad.status==="ACTIVE"?"#4ade80":ad.status==="SOLD"?"#f59e0b":"#ef4444", background:`rgba(${ad.status==="ACTIVE"?"74,222,128":ad.status==="SOLD"?"245,158,11":"239,68,68"},0.1)`, borderRadius:"4px", padding:"2px 6px" }}>{ad.status}</span>
              </div>
              {ad.expiresAt && (
                <div style={{ fontSize:"10px", color: new Date(ad.expiresAt) < new Date(Date.now() + 7*24*60*60*1000) ? "#f59e0b" : "#4a3030", marginTop:"4px" }}>
                  {ad.status === "EXPIRED" ? "⚠️ Expired" : `⏳ Expires ${new Date(ad.expiresAt).toLocaleDateString("en-ZA", {day:"2-digit",month:"short",year:"numeric"})}`}
                </div>
              )}
              <div style={{ display:"flex", gap:"6px", marginTop:"8px", flexWrap:"wrap" }}>
                {ad.status === "ACTIVE" && <button onClick={() => markSold(ad.id)} style={{ background:"rgba(245,158,11,0.15)", border:"1px solid #f59e0b", borderRadius:"6px", padding:"5px 10px", color:"#f59e0b", fontSize:"11px", fontWeight:"700", cursor:"pointer" }}>Mark Sold</button>}
                {(ad.status === "EXPIRED" || ad.status === "ACTIVE") && (
                  <button onClick={async () => {
                    const res = await fetch(`${API}/entertainment/classifieds/${ad.id}/renew`, { method:"POST", headers });
                    if (res.ok) { toast.success("✅ Ad renewed for 2 months!"); loadMyAds(); }
                  }} style={{ background:"rgba(74,222,128,0.15)", border:"1px solid #4ade80", borderRadius:"6px", padding:"5px 10px", color:"#4ade80", fontSize:"11px", fontWeight:"700", cursor:"pointer" }}>🔄 Renew</button>
                )}
                <button onClick={() => deleteAd(ad.id)} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid #ef4444", borderRadius:"6px", padding:"5px 10px", color:"#f87171", fontSize:"11px", fontWeight:"700", cursor:"pointer" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ad Detail Modal */}
      {selectedAd && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div style={{ background:BG2, borderRadius:"20px 20px 0 0", padding:"1.5rem", width:"100%", maxWidth:"500px", maxHeight:"85vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"1rem" }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"16px", fontWeight:"800", color:"#f0ede8" }}>{selectedAd.title}</div>
              <button onClick={() => setSelectedAd(null)} style={{ background:"none", border:"none", color:"#6b6760", fontSize:"20px", cursor:"pointer" }}>✕</button>
            </div>
            {selectedAd.mediaData && selectedAd.mediaType?.startsWith("image") && (
              <img src={selectedAd.mediaData} alt={selectedAd.title} style={{ width:"100%", borderRadius:"12px", marginBottom:"12px", maxHeight:"250px", objectFit:"cover" }} />
            )}
            {selectedAd.price && <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"22px", fontWeight:"800", color:G, marginBottom:"8px" }}>{selectedAd.price.startsWith("R")?selectedAd.price:"R"+selectedAd.price}</div>}
            <div style={{ display:"flex", gap:"8px", marginBottom:"12px", flexWrap:"wrap" }}>
              <span style={{ background:"rgba(232,184,75,0.1)", color:G, borderRadius:"6px", padding:"3px 8px", fontSize:"11px", fontWeight:"700" }}>{selectedAd.category}</span>
              <span style={{ background:BG3, color:"#6b6760", borderRadius:"6px", padding:"3px 8px", fontSize:"11px" }}>📍 {selectedAd.location || "Rustenburg"}</span>
              <span style={{ background:BG3, color:"#6b6760", borderRadius:"6px", padding:"3px 8px", fontSize:"11px" }}>👤 {selectedAd.user?.name}</span>
            </div>
            <div style={{ fontSize:"13px", color:"#b8a09a", lineHeight:1.6, marginBottom:"1.25rem" }}>{selectedAd.description}</div>
            {selectedAd.phone && (
              <a href={`tel:${selectedAd.phone}`} style={{ display:"block", textAlign:"center", background:"#166534", border:"1px solid #4ade80", borderRadius:"12px", padding:"14px", color:"#4ade80", textDecoration:"none", fontWeight:"800", fontSize:"15px", marginBottom:"8px" }}>
                📞 Call Seller — {selectedAd.phone}
              </a>
            )}
            <a href={`https://wa.me/${selectedAd.phone?.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" style={{ display:"block", textAlign:"center", background:"#166534", border:"1px solid #25d366", borderRadius:"12px", padding:"12px", color:"#25d366", textDecoration:"none", fontWeight:"800", fontSize:"14px" }}>
              💬 WhatsApp Seller
            </a>
          </div>
        </div>
      )}

      {/* Post Ad Form */}
      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div style={{ background:BG2, borderRadius:"20px 20px 0 0", padding:"1.5rem", width:"100%", maxWidth:"500px", maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:"18px", fontWeight:"800", color:G, marginBottom:"4px" }}>📋 Post Free Ad</div>
            <div style={{ fontSize:"12px", color:"#6b6760", marginBottom:"1.25rem" }}>100% free · Reaches all PROJO app users in Rustenburg</div>

            <input style={inp} placeholder="Ad Title *" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} />
            <textarea style={{...inp, minHeight:"80px", resize:"vertical"}} placeholder="Description *" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} />
            <select style={{...inp, color: form.category ? "#f0ede8" : "#6b6760"}} value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))}>
              <option value="" disabled>Select a Category *</option>
              {["Vehicles","Property","Electronics","Furniture","Clothing","Jobs","Services","Animals","Food","General","Other"].map(c => <option key={c} style={{color:"#f0ede8"}}>{c}</option>)}
            </select>
            <input style={inp} placeholder="Price (e.g. R500 or Free or Swap)" value={form.price} onChange={e => setForm(f=>({...f,price:e.target.value}))} />
            <input style={inp} placeholder="Location (e.g. Rustenburg, Phokeng)" value={form.location} onChange={e => setForm(f=>({...f,location:e.target.value}))} />
            <input style={inp} placeholder="Phone Number *" value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} />

            {/* Photo upload */}
            <div style={{ marginBottom:"10px" }}>
              <div style={{ fontSize:"11px", color:"#6b6760", marginBottom:"6px" }}>Photo / Video (optional)</div>
              <input type="file" accept="image/png,image/jpeg,video/mp4" onChange={e => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 10*1024*1024) return toast.error("Max 10MB");
                const reader = new FileReader();
                reader.onload = ev => setForm(f=>({...f,mediaData:ev.target.result,mediaType:file.type,mediaName:file.name}));
                reader.readAsDataURL(file);
              }} style={{...inp, padding:"8px"}} />
              {form.mediaData && form.mediaType?.startsWith("image") && (
                <img src={form.mediaData} alt="preview" style={{ width:"100%", borderRadius:"8px", marginTop:"8px", maxHeight:"150px", objectFit:"cover" }} />
              )}
            </div>

            {/* T&Cs */}
            <div style={{ background:"rgba(232,184,75,0.03)", border:`1px solid ${BORDER}`, borderRadius:"10px", padding:"12px", marginBottom:"12px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
                <div style={{ fontSize:"12px", fontWeight:"700", color:G }}>📋 Posting Rules & Terms</div>
                <button onClick={() => setShowTC(t => !t)} style={{ background:"none", border:"none", color:G, fontSize:"11px", cursor:"pointer", fontWeight:"700" }}>{showTC ? "Hide ▲" : "Read ▼"}</button>
              </div>
              {showTC && (
                <div style={{ fontSize:"11px", color:"#a8a49e", lineHeight:1.7, marginBottom:"8px" }}>
                  <strong style={{color:"#f0ede8"}}>PROJO GROUP Free Classifieds — Posting Rules & Terms</strong><br/><br/>

                  <strong style={{color:G}}>1. Eligibility</strong><br/>
                  You must be 18 years or older to post a classified ad. By posting you confirm you are a resident of South Africa and that the item or service advertised is legally available for sale or trade in South Africa.<br/><br/>

                  <strong style={{color:G}}>2. Honest & Accurate Listings</strong><br/>
                  All information must be truthful and accurate. Misleading, fraudulent or exaggerated descriptions are prohibited. Photos must be of the actual item being sold — stock images or photos of similar items are not permitted. Price must reflect the actual asking price.<br/><br/>

                  <strong style={{color:G}}>3. Prohibited Content</strong><br/>
                  The following are strictly not allowed: illegal goods or services; counterfeit, stolen or unlicensed items; weapons, ammunition or explosives; controlled substances or drugs; adult or explicit content; financial services without FSCA registration; any item that violates South African law. PROJO GROUP reserves the right to remove any ad without notice.<br/><br/>

                  <strong style={{color:G}}>4. One Ad Per Item</strong><br/>
                  Duplicate ads for the same item are not allowed. Listing multiple different items in a single ad is prohibited. Each ad must be placed in the most relevant category — ads in the wrong category may be removed.<br/><br/>

                  <strong style={{color:G}}>5. Ad Expiry & Renewal</strong><br/>
                  All ads expire automatically after 2 months. You will receive a reminder 7 days before expiry. Expired ads can be renewed for free at any time. It is your responsibility to mark items as sold and remove ads for items no longer available.<br/><br/>

                  <strong style={{color:G}}>6. Contact & Privacy</strong><br/>
                  Your phone number will be visible to other app users. Do not share banking details, passwords or any sensitive personal information in your ad. PROJO GROUP is not responsible for transactions between buyers and sellers — always meet in a safe public place and use secure payment methods.<br/><br/>

                  <strong style={{color:G}}>7. Safety</strong><br/>
                  Beware of scams. Never accept overpayments. Never pay upfront for items you haven't seen. PROJO GROUP is a platform only — we are not a party to any transaction and accept no liability for losses arising from classified ad transactions.<br/><br/>

                  <strong style={{color:G}}>8. Reporting</strong><br/>
                  Users may report suspicious or inappropriate ads. PROJO GROUP reserves the right to remove, edit or suspend any ad or user account that violates these rules. Repeated violations may result in permanent account suspension.<br/><br/>

                  <strong style={{color:G}}>9. Governing Law</strong><br/>
                  These rules are governed by the laws of South Africa, including the Consumer Protection Act 68 of 2008 and the Electronic Communications and Transactions Act 25 of 2002.
                </div>
              )}
              <div onClick={() => setTcAccepted(t => !t)} style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", marginTop:"4px" }}>
                <div style={{ width:"20px", height:"20px", borderRadius:"4px", border:`2px solid ${tcAccepted?G:BORDER}`, background:tcAccepted?"rgba(232,184,75,0.2)":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {tcAccepted && <span style={{color:G,fontSize:"12px",fontWeight:"800"}}>✓</span>}
                </div>
                <span style={{fontSize:"12px", color:"#a8a49e"}}>I have read and agree to the <span style={{color:G,fontWeight:"700"}}>Posting Rules & Terms</span></span>
              </div>
            </div>
            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={postAd} disabled={posting} style={{ flex:1, background:G, color:"#0a0a0a", border:"none", borderRadius:"10px", padding:"14px", fontWeight:"800", fontSize:"14px", cursor:"pointer" }}>
                {posting ? "Posting..." : "Post Ad Free 📋"}
              </button>
              <button onClick={() => setShowForm(false)} style={{ background:BG3, border:`1px solid ${BORDER}`, borderRadius:"10px", padding:"14px 20px", color:"#6b6760", cursor:"pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── LOCAL ADS ─────────────────────────────────────────────────
function LocalAdsTab({ user }) {
  const [ads, setAds] = useState([]);
  const [showSubmit, setShowSubmit] = useState(false);
  const [form, setForm] = useState({ businessName: "", category: "Restaurant", offer: "", price: "", description: "", phone: "", website: "", mediaData: null, mediaType: null, mediaName: null, isPaid: false });
  const [submitting, setSubmitting] = useState(false);
  const [bizTC, setBizTC] = useState(false);
  const [showBizTC, setShowBizTC] = useState(false);

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
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "16px", fontWeight: "800", color: "#f0ede8" }}>🏪 Business Ads & Deals</div>
          <div style={{ fontSize: "11px", color: "#6b6760" }}>Promote your business · Reach all PROJO users in Rustenburg</div>
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

            {/* Business Ads T&Cs */}
            <div style={{ background:"rgba(232,184,75,0.03)", border:"1px solid rgba(232,184,75,0.15)", borderRadius:"10px", padding:"12px", marginBottom:"12px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
                <div style={{ fontSize:"12px", fontWeight:"700", color:G }}>📋 Business Advertising Terms</div>
                <button onClick={() => setShowBizTC(t=>!t)} style={{ background:"none", border:"none", color:G, fontSize:"11px", cursor:"pointer", fontWeight:"700" }}>{showBizTC?"Hide ▲":"Read ▼"}</button>
              </div>
              {showBizTC && (
                <div style={{ fontSize:"11px", color:"#a8a49e", lineHeight:1.7, marginBottom:"8px" }}>
                  <strong style={{color:"#f0ede8"}}>PROJO GROUP — Business Advertising Terms</strong><br/><br/>
                  <strong style={{color:G}}>1. Eligibility</strong><br/>Only legally operating SA businesses or sole traders may advertise. You confirm your business complies with all applicable South African laws.<br/><br/>
                  <strong style={{color:G}}>2. Accuracy</strong><br/>All information, offers and prices must be truthful and accurate. PROJO GROUP may remove misleading ads without notice.<br/><br/>
                  <strong style={{color:G}}>3. Prohibited Content</strong><br/>No false claims, unlicensed financial advice, adult content, illegal products or inappropriate use of competitor brands. Ads must comply with the Consumer Protection Act 68 of 2008 and the Advertising Regulatory Board standards.<br/><br/>
                  <strong style={{color:G}}>4. Free vs Paid</strong><br/>Basic listings are free and reviewed within 24 hours. Paid promotions (R170/month) include featured placement and weekly social media posts. Paid promotions are non-refundable once activated.<br/><br/>
                  <strong style={{color:G}}>5. Approval</strong><br/>All ads are reviewed before going live. We may approve, reject or request amendments at our discretion.<br/><br/>
                  <strong style={{color:G}}>6. Media Rights</strong><br/>You may only submit media you own or have rights to use. By uploading you grant PROJO GROUP a licence to display and share it on the app and social media for the duration of your listing.<br/><br/>
                  <strong style={{color:G}}>7. Social Media</strong><br/>Paid promotions include one weekly post to PROJO platforms. You grant PROJO GROUP permission to post on your behalf using your provided content.<br/><br/>
                  <strong style={{color:G}}>8. Liability</strong><br/>PROJO GROUP is an advertising platform only and accepts no liability for transactions between businesses and customers.<br/><br/>
                  <strong style={{color:G}}>9. Governing Law</strong><br/>Governed by South African law including the CPA 68 of 2008 and the ECT Act 25 of 2002.
                </div>
              )}
              <div onClick={() => setBizTC(t=>!t)} style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", marginTop:"4px" }}>
                <div style={{ width:"20px", height:"20px", borderRadius:"4px", border:`2px solid ${bizTC?G:BORDER}`, background:bizTC?"rgba(232,184,75,0.2)":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {bizTC && <span style={{color:G, fontSize:"12px", fontWeight:"800"}}>✓</span>}
                </div>
                <span style={{fontSize:"12px", color:"#a8a49e"}}>I agree to the <span style={{color:G, fontWeight:"700"}}>Business Advertising Terms</span></span>
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

        {/* ── CLASSIFIEDS TAB ── */}
        {tab === "classifieds" && <ClassifiedsTab user={user} />}

        {/* ── LOCAL ADS TAB ── */}
        {tab === "ads" && <LocalAdsTab user={user} />}

      </div>
    </div>
  );
}
