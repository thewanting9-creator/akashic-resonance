# 🔮 Personal Astrology Toolkit

A local, private astrology calculator you run entirely on your own machine.  
All data stays with you — nothing is uploaded anywhere.

Built on **[kerykeion](https://github.com/g-battaglia/kerykeion)** (MIT licence), so there are zero licensing restrictions for personal use.

---

## One-time setup

```bash
# 1. Make sure Python 3.9+ is installed
python --version

# 2. (Optional but recommended) create a virtual environment
python -m venv .venv
source .venv/bin/activate        # Mac/Linux
# .venv\Scripts\activate         # Windows

# 3. Install dependencies
pip install -r requirements.txt
```

---

## Run it

```bash
cd personal_tools
python astrology.py
```

You'll see an interactive menu:

```
╔══════════════════════════════════════╗
║   🔮 Personal Astrology Toolkit 🔮   ║
╚══════════════════════════════════════╝

Main Menu:
  1. Natal chart (planets + elements)
  2. Aspect table (natal aspects)
  3. Synastry comparison (two people)
  4. Export SVG natal wheel
  5. Full report (natal + aspects) → save to file
  6. Recall a previously entered chart
  0. Exit
```

### Example natal chart output

```
┌──────────────────────────────┐
│  Natal Chart — Alice         │
└──────────────────────────────┘
  Born: 15/06/1990  14:30  New York, US

  PLANETS
  ────────────────────────────────────────────────────────────
  Planet            Sign              Degree        House    ℞
  ☉ Sun             ♊ Gemini          24°12'05"     H12
  ☽ Moon            ♑ Capricorn       07°44'18"     H7     ℞
  ☿ Mercury         ♋ Cancer          03°09'22"     H12
  ...

  ELEMENTS
  Fire     ████ (4)
  Earth    ██ (2)
  Air      ██ (2)
  Water    ██ (2)
```

### SVG natal wheel

Choosing option **4** saves a visual chart wheel as an SVG file inside `personal_tools/output/`. Open it in any browser.

---

## Batch mode

Process many charts at once from a CSV file:

```bash
python astrology.py --batch sample_batch.csv
```

Each person gets their own `output/<Name>_natal.txt` file.

**CSV format** (`sample_batch.csv`):

```csv
name,year,month,day,hour,minute,city,nation
Alice,1990,6,15,14,30,New York,US
Bob,1985,11,3,8,0,London,GB
```

---

## Output files

All saved reports land in `personal_tools/output/` (git-ignored).

---

## What it calculates

| Feature | Details |
|---------|---------|
| Planets | Sun · Moon · Mercury · Venus · Mars · Jupiter · Saturn · Uranus · Neptune · Pluto · True Node · Chiron |
| Angles | Ascendant (AC) · Midheaven (MC) |
| Houses | Placidus system |
| Aspects | Conjunction · Opposition · Trine · Square · Sextile · Quincunx · Semisextile · Semisquare · Sesquiquadrate |
| Synastry | Cross-aspects between two charts |
| Elements | Fire / Earth / Air / Water planet counts |
| Modalities | Cardinal / Fixed / Mutable counts |
| Retrograde | Marked with ℞ |

---

## Tips

- Cities must be recognisable place names (kerykeion looks them up via GeoNames). If a small town isn't found, use the nearest large city.
- Charts entered during a session are kept in memory so you can reuse them (e.g. generate synastry right after entering natal).
- The `output/` folder is git-ignored so your personal data is never committed.
