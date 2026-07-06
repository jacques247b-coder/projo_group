# Run: python fix_entertainment2.py

file = r"frontend\src\pages\entertainment\EntertainmentHub.jsx"

with open(file, 'r', encoding='utf-8') as f:
    content = f.read()

print("CASINO_PARTNERS count:", content.count("const CASINO_PARTNERS"))
print("GAMES count:", content.count("const GAMES"))
print("TABS count:", content.count("const TABS"))

# Find positions of each duplicate
import re
for name in ["CASINO_PARTNERS", "GAMES", "TABS", "RADIO_STATIONS", "FREE_MUSIC"]:
    positions = [m.start() for m in re.finditer(f"^const {name}", content, re.MULTILINE)]
    print(f"const {name} at lines:", [content[:p].count('\n')+1 for p in positions])

# Remove the FIRST occurrence of each constant block that was inserted by the script
# The script inserted before "// ── RADIO STATIONS" 
# So we need to find and remove the INSERTED block (which comes first)
# Keep the ORIGINAL blocks that were already there

# Find the insertion marker
marker = "// ── RADIO STATIONS"
marker_pos = content.find(marker)

# Find what's just before the marker - that's our inserted block
# Go back to find "// ── CASINO AFFILIATE PARTNERS"
insert_start = content.rfind("// ── CASINO AFFILIATE PARTNERS", 0, marker_pos)

if insert_start > -1:
    # Remove from insert_start to marker_pos
    removed = content[insert_start:marker_pos]
    content = content[:insert_start] + content[marker_pos:]
    print(f"\nRemoved {len(removed)} chars of duplicate block")
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("CASINO_PARTNERS count after:", content.count("const CASINO_PARTNERS"))
    print("GAMES count after:", content.count("const GAMES"))
    print("TABS count after:", content.count("const TABS"))
    print("SUCCESS!")
else:
    print("Insertion marker not found")
