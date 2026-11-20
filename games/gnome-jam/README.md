# GBA GJAM

2-on-2 arcade gnome basketball inspired by classic N64 / arcade NBA Jam, set inside the indoor **Gnomerena**.

## Features

- **8 Pro GBA Teams** with 24 unique pro gnomes, team colours, and classic 4-stat ratings (Speed, 3-Pt, Dunk, Defense).
- **Custom Character Creator** integrated with `@lawn/gnome`: defaults to your Gnome Creator look, lets you customize appearance & allocate 24 stat points, and slots your custom gnome right onto any team.
- **2-on-2 Arcade Basketball** with smart AI teammate and selectable **vs AI** (Rookie / Pro / All-Star) or **2P Local** opponent mode.
- **Over-the-top Dunk Animations** (Tomahawk, 360 Helicopter, Front-Flip Cannonball, Windmill, and Meteor Flame Dunk), **Turbo**, **Shove/Steal**, **Alley-Oops**, and **HE'S ON FIRE!** streaks.
- **GBA Season & Top-6 Knockout Tournament**: 8-team round-robin season with live standings, followed by a 6-team knockout playoff where the **top 2 seeds earn a first-round bye** straight into the Semifinals.
- **Indoor Gnomerena** with hardwood court, `@lawn/prefabs` hoops and basketball, overhead jumbotron scoreboard, hanging team banners, and an animated cheering gnome crowd.
- **Mobile & Desktop Controls**: keyboard (WASD + J/Space, K/E, Shift/L; optional 2P on Arrows + N/M/,) and responsive on-screen touch joystick & action buttons.

## Run

```bash
npm run dev -w games/gnome-jam     # http://localhost:5201
npm run build -w games/gnome-jam   # typecheck + production bundle
npm test -w games/gnome-jam        # unit tests for season & top-6 bracket
```
