# Run this from your project folder:
# python fix_entertainment.py

import os

file = r"frontend\src\pages\entertainment\EntertainmentHub.jsx"

with open(file, 'r', encoding='utf-8') as f:
    content = f.read()

# The missing constants to insert before // ── RADIO STATIONS
INSERT = '''
// ── CASINO AFFILIATE PARTNERS ──────────────────────────────────
const CASINO_PARTNERS = [
  { id:"betway", name:"Betway", logo:"🎰", color:"#00a651", bonus:"R25 Free Bet on Signup", description:"PSL title sponsor. Sports betting, live casino, slots.", rating:5, categories:["Sports Betting","Live Casino","Slots"], url:"https://www.betway.co.za", terms:"T&Cs apply. 18+ only.", featured:true, isNew:false },
  { id:"hollywoodbets", name:"Hollywood Bets", logo:"🎬", color:"#e31837", bonus:"R50 Free Bet Welcome Bonus", description:"SA most trusted betting platform.", rating:5, categories:["Sports Betting","Casino","Horse Racing"], url:"https://www.hollywoodbets.net", terms:"T&Cs apply. 18+ only.", featured:true, isNew:false },
  { id:"supabets", name:"Supabets", logo:"🃏", color:"#ff6600", bonus:"R50 Signup Bonus", description:"2 million+ SA players.", rating:4, categories:["Sports Betting","Casino","Slots"], url:"https://www.supabets.co.za", terms:"T&Cs apply. 18+ only.", featured:false, isNew:false },
  { id:"sunbet", name:"Sunbet", logo:"☀️", color:"#f59e0b", bonus:"100% Match Bonus up to R1000", description:"Sun International casino brand.", rating:4, categories:["Live Casino","Slots","Table Games"], url:"https://www.sunbet.co.za", terms:"T&Cs apply. 18+ only.", featured:false, isNew:true },
  { id:"zarbet", name:"ZARbet", logo:"💎", color:"#a78bfa", bonus:"200% Welcome Bonus up to R2000", description:"SA Rand casino. Slots, live dealer, jackpots.", rating:4, categories:["Casino","Slots","Jackpots"], url:"https://www.zarbet.co.za", terms:"T&Cs apply. 18+ only.", featured:false, isNew:true },
];

const GAMES = [
  { id:"2048",      title:"2048",          icon:"🎯", color:"#f59e0b", desc:"Merge tiles to reach 2048" },
  { id:"snake",     title:"Snake",         icon:"🐍", color:"#4ade80", desc:"Classic snake game" },
  { id:"memory",    title:"Memory",        icon:"🧠", color:"#a78bfa", desc:"Match the pairs" },
  { id:"tictactoe", title:"Tic Tac Toe",   icon:"❌", color:"#60a5fa", desc:"3 in a row wins" },
  { id:"trivia",    title:"SA Trivia",     icon:"🇿🇦", color:"#f87171", desc:"Test your SA knowledge" },
  { id:"reaction",  title:"Reaction Time", icon:"⚡", color:"#e8b84b", desc:"How fast are you?" },
  { id:"sudoku",    title:"Sudoku",        icon:"🔢", color:"#34d399", desc:"Classic number puzzle" },
  { id:"solitaire", title:"Solitaire",     icon:"🃏", color:"#f87171", desc:"Classic card game" },
];

const TABS = [
  { key:"home",    label:"🏠", full:"Home" },
  { key:"music",   label:"🎵", full:"Music" },
  { key:"kids",    label:"👶", full:"Kids" },
  { key:"comedy",  label:"😂", full:"Comedy" },
  { key:"fitness", label:"💪", full:"Fitness" },
  { key:"cooking", label:"🍳", full:"Cooking" },
  { key:"wellness",label:"🧘", full:"Wellness" },
  { key:"learning",label:"📚", full:"Learn" },
  { key:"news",    label:"📰", full:"News" },
  { key:"games",   label:"🎮", full:"Games" },
  { key:"stream",  label:"📺", full:"Stream" },
  { key:"reading", label:"📖", full:"Reading" },
  { key:"casino",  label:"🎰", full:"18+ Casino" },
  { key:"ads",     label:"🏪", full:"Deals" },
];

'''

TARGET = "// ── RADIO STATIONS"
if TARGET in content:
    content = content.replace(TARGET, INSERT + TARGET, 1)
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS! Constants inserted.")
    print("GAMES count:", content.count("const GAMES"))
    print("TABS count:", content.count("const TABS"))
    print("CASINO_PARTNERS count:", content.count("const CASINO_PARTNERS"))
else:
    print("ERROR: Could not find insertion point '// ── RADIO STATIONS'")
    print("Searching for alternatives...")
    for line in content.split('\n')[80:120]:
        print(repr(line[:60]))
