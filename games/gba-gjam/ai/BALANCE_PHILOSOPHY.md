# GBA GJAM — Balance Commentary & Tuning Philosophy

After 15 bot-strategy experiments (5,500+ full 4-quarter matches), we mapped the exact mechanical exploits that shaped the competitive bot meta. This document defines our **balance philosophy**, **target arcade health metrics**, and **iterative sim-driven balance loop** (`npm run eval:balance -w games/gnome-jam`).

---

## 1. Observed Egregious Areas (What Broke Fun & Parity)

1. **Turbo-Shove Is a Zero-Risk Turnover Machine (`90–109` Shove TO/g):**
   - `tryStealOrShove` with turbo (`>=22`) has a `0.55s` cooldown, no whiff penalty, and a **100% guaranteed instant possession steal + 0.85s stun**.
   - Result: Defense degenerates into sprinting straight at the ball-handler; passing, dribbling, and half-court offense collapse.
2. **Quick-Release 3PT Spam (`262 PPG`, `93.6%` 3P%, `0.38s` Possessions):**
   - `threeBaseChance = 0.28 + 0.055 * (threePt/10)` gives a 75-3PT player `69.3%` base make rate *before* timing! Even releasing at `0.06s` (`timingQuality ~ 0.17`) still hits `~90%+` open, letting bots fire before defenders can close.
3. **Unchecked On-Fire Snowballing (`±200` Point Margins):**
   - Once a player hits 3 straight baskets, `onFire` grants **infinite turbo** (unlimited free turbo-shoves + dunk reach), `+28%` shooting, and unblockable Meteor Dunks—turning the first 1–2 stops into irreversible 200-point blowouts.
4. **Under-Rewarded Rim Defense & Alley-Oops (`0.1–0.3` Blocks/g):**
   - Dunk rejection chance (`0.04` per tick in a narrow window) and `2.2m` shot block reach are too conservative relative to `93%` 3s and `100%` shoves.

---

## 2. Balance Philosophy: What Makes GBA GJAM Fun

1. **Physicality With Risk-Reward (Shoves Disrupt, Steals Pickpocket):**
   - A turbo-shove should knock the carrier down/loose (`shoveKnocksLoose: true`) or have a bounded turnover chance with a **meaningful cooldown (`~1.0–1.25s`)** and **whiff penalty**—making reckless shove-spam punishable by an open lane or pass.
2. **Skill-Expressive Shooting (Reward Apex Timing & Spacing):**
   - Open, apex-timed 3s from high-3PT gnomes should be dangerous (`~48–58%`), while **early quick-release heaves (`shootHold < 0.14s`)** and **contested 3s** should suffer steep penalties (`~20–35%`).
3. **Archetype & Roster Diversity:**
   - Shooters, Dunkers, Alley-Oop duos, and Rim Protectors should all have viable paths to win. No single degenerate loop should sweep 93% across all rosters.
4. **Electric—Not Game-Breaking—On-Fire:**
   - On-Fire should feel explosive (Meteor Dunks, +14–18% shooting, faster turbo regen/lower drain) without giving infinite free turbo-shoves.

---

## 3. Target Healthy Arcade Metrics (4×45s Quarters)

| Metric | Broken Baseline (v1) | Healthy Target Range | Why |
|---|---:|---:|---|
| **PPG (Top Bots)** | `180 – 262` | **`38 – 80`** | Readable NBA Jam arcade scores |
| **3P%** | `91% – 94%` | **`36% – 54%`** | Rewards apex timing & open looks |
| **Shove TO / game** | `85 – 109` | **`6 – 22`** | Physicality without turnover chaos |
| **Dunks / game** | `16 – 99` | **`6 – 22`** | Exciting rim finishes |
| **Blocks / game** | `0.1 – 0.3` | **`0.8 – 4.0`** | Rim protection feels real |
| **Avg Possession (s)** | `0.38s` | **`1.2s – 3.5s`** | Actual half-court & transition play |
| **Top-5 Win% Spread** | `55% – 93%` | **`45% – 75%`** | Competitive parity, no ±200 blowouts |

---

## 4. The 3-Round Sim-Driven Balance Process

1. **Round 1 (`bal1`):** Nerf the #1/#2 egregious exploits (**Shove Cooldown/Turnover/Loose-Ball** + **3PT Base/Early-Release Penalty**). Evaluate across the 9-bot field in both 60Hz and 150ms.
2. **Round 2 (`bal2`):** Tune **Contest Scaling, Dunk Reach, & Shot/Dunk Block Windows** so shooting, dunking, alley-oops, and rim defense balance cleanly.
3. **Round 3 (`bal3`):** Tune **On-Fire Snowballing** (`fireShotBonus`, `fireTurboDrainScale`, `fireStreakThreshold`) and validate **Human-Fair 150ms + Classic Bot** playability before promoting to `DEFAULT_BALANCE_CONFIG`.
