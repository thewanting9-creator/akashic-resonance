#!/usr/bin/env python3
"""
Personal Astrology Toolkit
===========================
A local-only, interactive astrology calculator for personal research.
Uses kerykeion (MIT license) — safe for private use, no network service.

Features:
  • Natal chart (planets, signs, degrees, houses, retrograde)
  • Aspect table (conjunction, trine, sextile, square, opposition, etc.)
  • Synastry comparison between two charts
  • Dominant element & modality summary
  • Save any report to a text file
  • Batch mode: load multiple people from a CSV

Usage:
  python astrology.py                  # interactive menu
  python astrology.py --batch file.csv # batch mode

CSV format for batch:
  name,year,month,day,hour,minute,city,nation
  Alice,1990,6,15,14,30,New York,US
"""

import argparse
import csv
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

try:
    from kerykeion import AstrologicalSubject, KerykeionChartSVG
    from kerykeion.aspects import NatalAspects, SynastryAspects
except ImportError:
    print("\n[ERROR] kerykeion is not installed.")
    print("Run:  pip install -r requirements.txt\n")
    sys.exit(1)

try:
    from tabulate import tabulate
    HAS_TABULATE = True
except ImportError:
    HAS_TABULATE = False

try:
    from colorama import Fore, Style, init as colorama_init
    colorama_init(autoreset=True)
    HAS_COLOR = True
except ImportError:
    HAS_COLOR = False

# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

PLANETS = [
    "sun", "moon", "mercury", "venus", "mars",
    "jupiter", "saturn", "uranus", "neptune", "pluto",
    "true_node", "chiron",
]

PLANET_SYMBOLS = {
    "sun": "☉", "moon": "☽", "mercury": "☿", "venus": "♀", "mars": "♂",
    "jupiter": "♃", "saturn": "♄", "uranus": "♅", "neptune": "♆",
    "pluto": "♇", "true_node": "☊", "chiron": "⚷",
}

SIGN_SYMBOLS = {
    "Aries": "♈", "Taurus": "♉", "Gemini": "♊", "Cancer": "♋",
    "Leo": "♌", "Virgo": "♍", "Libra": "♎", "Scorpio": "♏",
    "Sagittarius": "♐", "Capricorn": "♑", "Aquarius": "♒", "Pisces": "♓",
}

ELEMENTS = {
    "Aries": "Fire", "Leo": "Fire", "Sagittarius": "Fire",
    "Taurus": "Earth", "Virgo": "Earth", "Capricorn": "Earth",
    "Gemini": "Air", "Libra": "Air", "Aquarius": "Air",
    "Cancer": "Water", "Scorpio": "Water", "Pisces": "Water",
}

MODALITIES = {
    "Aries": "Cardinal", "Cancer": "Cardinal", "Libra": "Cardinal", "Capricorn": "Cardinal",
    "Taurus": "Fixed", "Leo": "Fixed", "Scorpio": "Fixed", "Aquarius": "Fixed",
    "Gemini": "Mutable", "Virgo": "Mutable", "Sagittarius": "Mutable", "Pisces": "Mutable",
}


def color(text: str, fore_color: str) -> str:
    if HAS_COLOR:
        return fore_color + text + Style.RESET_ALL
    return text


def header(title: str) -> str:
    line = "─" * (len(title) + 4)
    return f"\n┌{line}┐\n│  {title}  │\n└{line}┘"


def sign_sym(sign: str) -> str:
    return SIGN_SYMBOLS.get(sign, "") + " " + sign


def planet_sym(name: str) -> str:
    return PLANET_SYMBOLS.get(name.lower(), "") + " " + name.capitalize().replace("_", " ")


def deg_str(degrees: float) -> str:
    d = int(degrees)
    m = int((degrees - d) * 60)
    s = int(((degrees - d) * 60 - m) * 60)
    return f"{d:2d}°{m:02d}'{s:02d}\""


# ──────────────────────────────────────────────────────────────────────────────
# Input helpers
# ──────────────────────────────────────────────────────────────────────────────

def prompt(text: str, default: str = "") -> str:
    display = f"{text} [{default}]: " if default else f"{text}: "
    value = input(display).strip()
    return value if value else default


def prompt_int(text: str, default: Optional[int] = None) -> int:
    while True:
        raw = prompt(text, str(default) if default is not None else "")
        try:
            return int(raw)
        except ValueError:
            print("  Please enter a whole number.")


def get_birth_data(label: str = "") -> AstrologicalSubject:
    """Interactively collect birth data and return an AstrologicalSubject."""
    prefix = f"[{label}] " if label else ""
    print(f"\n{prefix}Enter birth details:")
    name  = prompt(f"  {prefix}Name")
    year  = prompt_int(f"  {prefix}Year (e.g. 1990)")
    month = prompt_int(f"  {prefix}Month (1-12)")
    day   = prompt_int(f"  {prefix}Day (1-31)")
    hour  = prompt_int(f"  {prefix}Hour 24h (0-23)", 12)
    minute = prompt_int(f"  {prefix}Minute (0-59)", 0)
    city  = prompt(f"  {prefix}City (e.g. New York)")
    nation = prompt(f"  {prefix}Country code (e.g. US)", "US")

    try:
        subject = AstrologicalSubject(
            name=name,
            year=year,
            month=month,
            day=day,
            hour=hour,
            minute=minute,
            city=city,
            nation=nation,
        )
        return subject
    except Exception as e:
        print(f"\n[ERROR] Could not calculate chart: {e}")
        print("  Check that the city name is recognisable (try a nearby major city).")
        raise


def subject_from_row(row: dict) -> AstrologicalSubject:
    """Create a subject from a CSV row dict."""
    return AstrologicalSubject(
        name=row["name"],
        year=int(row["year"]),
        month=int(row["month"]),
        day=int(row["day"]),
        hour=int(row["hour"]),
        minute=int(row["minute"]),
        city=row["city"],
        nation=row.get("nation", "US"),
    )


# ──────────────────────────────────────────────────────────────────────────────
# Report builders
# ──────────────────────────────────────────────────────────────────────────────

def natal_report(subject: AstrologicalSubject) -> str:
    lines = []
    lines.append(header(f"Natal Chart — {subject.name}"))
    lines.append(
        f"  Born: {subject.day:02d}/{subject.month:02d}/{subject.year}  "
        f"{subject.hour:02d}:{subject.minute:02d}  "
        f"{subject.city}, {subject.nation}"
    )

    # ── Planets ──────────────────────────────────────────────────────────────
    lines.append("\n  PLANETS\n" + "  " + "─" * 60)
    rows = []
    for p in PLANETS:
        obj = getattr(subject, p, None)
        if obj is None:
            continue
        retro = "℞" if getattr(obj, "retrograde", False) else " "
        sign = obj.sign
        house = getattr(obj, "house_name", f"H{getattr(obj, 'house', '?')}")
        rows.append([
            planet_sym(p),
            sign_sym(sign),
            deg_str(obj.position),
            house,
            retro,
        ])

    if HAS_TABULATE:
        lines.append(tabulate(
            rows,
            headers=["Planet", "Sign", "Degree", "House", "℞"],
            tablefmt="simple",
            colalign=("left", "left", "right", "left", "center"),
        ))
    else:
        lines.append("  {:<20} {:<18} {:<12} {:<8} {}".format(
            "Planet", "Sign", "Degree", "House", "℞"))
        for r in rows:
            lines.append("  {:<20} {:<18} {:<12} {:<8} {}".format(*r))

    # ── Ascendant & MC ───────────────────────────────────────────────────────
    lines.append("\n  ANGLES")
    try:
        asc = subject.first_house
        mc  = subject.tenth_house
        lines.append(f"  Ascendant (AC):  {sign_sym(asc.sign)}  {deg_str(asc.position)}")
        lines.append(f"  Midheaven (MC):  {sign_sym(mc.sign)}  {deg_str(mc.position)}")
    except Exception:
        pass

    # ── Elements & Modalities ────────────────────────────────────────────────
    elem_count: dict[str, int] = {"Fire": 0, "Earth": 0, "Air": 0, "Water": 0}
    mod_count: dict[str, int]  = {"Cardinal": 0, "Fixed": 0, "Mutable": 0}
    for p in ["sun", "moon", "mercury", "venus", "mars",
              "jupiter", "saturn", "uranus", "neptune", "pluto"]:
        obj = getattr(subject, p, None)
        if obj:
            e = ELEMENTS.get(obj.sign)
            m = MODALITIES.get(obj.sign)
            if e:
                elem_count[e] += 1
            if m:
                mod_count[m] += 1

    lines.append("\n  ELEMENTS")
    for elem, count in sorted(elem_count.items(), key=lambda x: -x[1]):
        bar = "█" * count
        lines.append(f"  {elem:<8} {bar} ({count})")

    lines.append("\n  MODALITIES")
    for mod, count in sorted(mod_count.items(), key=lambda x: -x[1]):
        bar = "█" * count
        lines.append(f"  {mod:<10} {bar} ({count})")

    return "\n".join(lines)


def aspect_report(subject: AstrologicalSubject) -> str:
    lines = []
    lines.append(header(f"Aspects — {subject.name}"))

    try:
        na = NatalAspects(subject)
        aspects = na.relevant_aspects
    except Exception as e:
        return f"  Could not calculate aspects: {e}"

    if not aspects:
        return "  No aspects found."

    rows = []
    for asp in aspects:
        p1 = planet_sym(asp.p1_name)
        p2 = planet_sym(asp.p2_name)
        name = asp.aspect
        orb  = f"{abs(asp.orbit):.2f}°"
        rows.append([p1, name, p2, orb])

    if HAS_TABULATE:
        lines.append(tabulate(
            rows,
            headers=["Planet 1", "Aspect", "Planet 2", "Orb"],
            tablefmt="simple",
        ))
    else:
        lines.append("  {:<22} {:<15} {:<22} {}".format(
            "Planet 1", "Aspect", "Planet 2", "Orb"))
        for r in rows:
            lines.append("  {:<22} {:<15} {:<22} {}".format(*r))

    return "\n".join(lines)


def synastry_report(s1: AstrologicalSubject, s2: AstrologicalSubject) -> str:
    lines = []
    lines.append(header(f"Synastry — {s1.name}  ×  {s2.name}"))

    try:
        sa = SynastryAspects(s1, s2)
        aspects = sa.relevant_aspects
    except Exception as e:
        return f"  Could not calculate synastry: {e}"

    if not aspects:
        return "  No synastry aspects found."

    rows = []
    for asp in aspects:
        p1 = f"{s1.name}: {planet_sym(asp.p1_name)}"
        p2 = f"{s2.name}: {planet_sym(asp.p2_name)}"
        name = asp.aspect
        orb  = f"{abs(asp.orbit):.2f}°"
        rows.append([p1, name, p2, orb])

    if HAS_TABULATE:
        lines.append(tabulate(
            rows,
            headers=["Person 1", "Aspect", "Person 2", "Orb"],
            tablefmt="simple",
        ))
    else:
        for r in rows:
            lines.append("  {:<30} {:<15} {:<30} {}".format(*r))

    return "\n".join(lines)


def save_report(text: str, filename: str = "") -> str:
    if not filename:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"chart_{ts}.txt"
    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    path = output_dir / filename
    path.write_text(text, encoding="utf-8")
    return str(path)


def export_svg(subject: AstrologicalSubject) -> str:
    """Export a visual SVG natal wheel."""
    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    chart = KerykeionChartSVG(subject, new_output_directory=str(output_dir))
    chart.makeSVG()
    name_clean = subject.name.replace(" ", "_")
    expected = output_dir / f"{name_clean}_Natal_Chart.svg"
    return str(expected)


# ──────────────────────────────────────────────────────────────────────────────
# Interactive menu
# ──────────────────────────────────────────────────────────────────────────────

def main_menu() -> None:
    print(color("\n╔══════════════════════════════════════╗", Fore.CYAN if HAS_COLOR else ""))
    print(color("║   🔮 Personal Astrology Toolkit 🔮   ║", Fore.CYAN if HAS_COLOR else ""))
    print(color("╚══════════════════════════════════════╝", Fore.CYAN if HAS_COLOR else ""))
    print("  (local use only — all data stays on your machine)\n")

    stored_charts: dict[str, AstrologicalSubject] = {}

    while True:
        print("\nMain Menu:")
        print("  1. Natal chart (planets + elements)")
        print("  2. Aspect table (natal aspects)")
        print("  3. Synastry comparison (two people)")
        print("  4. Export SVG natal wheel")
        print("  5. Full report (natal + aspects) → save to file")
        print("  6. Recall a previously entered chart")
        print("  0. Exit")

        choice = prompt("\nChoice", "0")

        if choice == "0":
            print("\nGoodbye! ✨\n")
            break

        elif choice == "1":
            s = get_birth_data()
            stored_charts[s.name] = s
            report = natal_report(s)
            print(report)

        elif choice == "2":
            s = _pick_or_new(stored_charts)
            if s:
                report = aspect_report(s)
                print(report)

        elif choice == "3":
            print("\nFirst person:")
            s1 = _pick_or_new(stored_charts, label="Person 1")
            print("\nSecond person:")
            s2 = _pick_or_new(stored_charts, label="Person 2")
            if s1 and s2:
                report = synastry_report(s1, s2)
                print(report)

        elif choice == "4":
            s = _pick_or_new(stored_charts)
            if s:
                try:
                    path = export_svg(s)
                    print(f"\n  ✅ SVG saved → {path}")
                except Exception as e:
                    print(f"\n  [ERROR] Could not generate SVG: {e}")

        elif choice == "5":
            s = _pick_or_new(stored_charts)
            if s:
                full = natal_report(s) + "\n\n" + aspect_report(s)
                print(full)
                name_clean = s.name.replace(" ", "_")
                ts = datetime.now().strftime("%Y%m%d_%H%M%S")
                path = save_report(full, f"{name_clean}_{ts}.txt")
                print(f"\n  ✅ Saved → {path}")

        elif choice == "6":
            if not stored_charts:
                print("  No charts stored yet this session.")
            else:
                print("\nStored charts:")
                for i, name in enumerate(stored_charts, 1):
                    print(f"  {i}. {name}")

        else:
            print("  Invalid choice — try again.")


def _pick_or_new(
    stored: dict[str, AstrologicalSubject],
    label: str = "",
) -> Optional[AstrologicalSubject]:
    """Return a stored chart or prompt for a new one."""
    if stored:
        names = list(stored.keys())
        print("\n  Use a stored chart?")
        for i, n in enumerate(names, 1):
            print(f"    {i}. {n}")
        print("    n. Enter new person")
        pick = prompt("  Choice", "n").strip().lower()
        if pick.isdigit() and 1 <= int(pick) <= len(names):
            chosen = stored[names[int(pick) - 1]]
            print(f"  → Using: {chosen.name}")
            return chosen

    try:
        s = get_birth_data(label)
        stored[s.name] = s
        return s
    except Exception:
        return None


# ──────────────────────────────────────────────────────────────────────────────
# Batch mode
# ──────────────────────────────────────────────────────────────────────────────

def batch_mode(csv_path: str) -> None:
    """Process a CSV of birth records and save individual reports."""
    print(f"\nBatch mode: {csv_path}")
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                s = subject_from_row(row)
                full = natal_report(s) + "\n\n" + aspect_report(s)
                name_clean = s.name.replace(" ", "_")
                path = save_report(full, f"{name_clean}_natal.txt")
                print(f"  ✅ {s.name} → {path}")
            except Exception as e:
                print(f"  ❌ {row.get('name', '?')}: {e}")


# ──────────────────────────────────────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Personal Astrology Toolkit")
    parser.add_argument("--batch", metavar="CSV", help="Batch process a CSV file of birth records")
    args = parser.parse_args()

    if args.batch:
        batch_mode(args.batch)
    else:
        main_menu()
