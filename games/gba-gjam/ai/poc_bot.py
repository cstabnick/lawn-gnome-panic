#!/usr/bin/env python3
"""
GBA GJAM — Proof-of-Concept Python Bot / ML Policy Server.

Zero external dependencies (Python 3 standard library only).
Receives GameStateSnapshot + BotDecisionContext JSON via POST /decide
and returns a PlayerControlInput JSON action.

Usage:
    python games/gba-gjam/ai/poc_bot.py
    python games/gba-gjam/ai/poc_bot.py --port 8765

Then in GBA GJAM -> Team Select -> "Bot AI", choose "Python / Remote HTTP"
(default http://127.0.0.1:8765/decide) and tip off!
"""

from __future__ import annotations

import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import math
import random
from typing import Any


def steer_toward(player: dict[str, Any], tx: float, tz: float, turbo: bool = False) -> dict[str, Any]:
    px, _, pz = player["pos"]
    dx = tx - px
    dz = tz - pz
    dist = math.hypot(dx, dz)
    if dist <= 0.35:
        return {"moveX": 0.0, "moveZ": 0.0, "turbo": False}
    return {"moveX": dx / dist, "moveZ": dz / dist, "turbo": bool(turbo)}


def decide(state: dict[str, Any], ctx: dict[str, Any]) -> dict[str, Any]:
    """
    Replace this policy function with your PyTorch / ONNX / RL model inference!

    Args:
        state: GameStateSnapshot JSON dict (tick, phase, quarter, clockSec, shotClock, score, court, ball, players)
        ctx:   BotDecisionContext JSON dict (playerIndex, role, difficulty, dt, humanInput)

    Returns:
        Partial or full PlayerControlInput dict.
    """
    idx = int(ctx["playerIndex"])
    p = state["players"][idx]
    if p["stunTimer"] > 0 or p["isDunking"]:
        return {}

    team = p["team"]
    attack_dir = 1 if team == 0 else -1
    hoop_x = attack_dir * state["court"]["hoopX"]
    three_r = state["court"]["threePtRadius"]
    mate_idx = (1 if idx == 0 else 0) if team == 0 else (3 if idx == 2 else 2)
    mate = state["players"][mate_idx]

    ball = state["ball"]
    carrier_idx = ball["carrier"]

    # 1. Loose ball -> sprint to rebound
    if ball["mode"] == "loose":
        out = steer_toward(p, ball["pos"][0], ball["pos"][2], turbo=True)
        dist_ball = math.sqrt(sum((a - b) ** 2 for a, b in zip(p["pos"], ball["pos"])))
        if ball["pos"][1] > 1.5 and dist_ball < 1.8 and p["grounded"]:
            out["shootPressed"] = True
        return out

    # 2. This bot has the ball
    if carrier_idx == idx:
        human = ctx.get("humanInput")
        if ctx.get("role") == "teammate" and human:
            if human.get("passPressed"):
                return {"passPressed": True}
            if human.get("shootPressed"):
                return {"shootPressed": True, "shootDown": True}

        if p["isShooting"]:
            return {"shootReleased": True} if p["vel"][1] <= 0.3 else {"shootDown": True}

        dist_hoop = math.hypot(hoop_x - p["pos"][0], p["pos"][2])
        # Drive in and dunk when close
        if dist_hoop < 3.4 + (p["stats"]["dunk"] / 10.0) * 0.16:
            return {"turbo": True, "shootPressed": True, "shootDown": True}

        # Pull up for 3 if high 3pt stat and open on the wing
        if (
            p["stats"]["threePt"] >= 70
            and abs(p["pos"][2]) > 2.0
            and three_r + 0.3 < dist_hoop < 7.2
            and random.random() < 0.04
        ):
            return {"shootPressed": True, "shootDown": True}

        target_z = math.sin(state["clockSec"] * 1.4 + idx) * 2.2
        return steer_toward(
            p,
            hoop_x - attack_dir * 1.4,
            target_z,
            turbo=p["turbo"] > 35 and dist_hoop < 9.0,
        )

    # 3. Teammate has the ball -> space the floor
    if carrier_idx is not None and state["players"][carrier_idx]["team"] == team:
        want_z = -3.2 if mate["pos"][2] >= 0 else 3.2
        want_x = (
            hoop_x - attack_dir * 2.6
            if p["stats"]["dunk"] >= 70
            else hoop_x - attack_dir * (three_r + 0.7)
        )
        dist = math.hypot(want_x - p["pos"][0], want_z - p["pos"][2])
        return steer_toward(p, want_x, want_z, turbo=dist > 3.5)

    # 4. Defense
    if carrier_idx is not None:
        carrier = state["players"][carrier_idx]
        my_dist = math.sqrt(sum((a - b) ** 2 for a, b in zip(p["pos"], carrier["pos"])))
        mate_dist = math.sqrt(sum((a - b) ** 2 for a, b in zip(mate["pos"], carrier["pos"])))
        own_hoop_x = (1 if carrier["team"] == 0 else -1) * state["court"]["hoopX"]

        if my_dist <= mate_dist + 0.5:
            gx = carrier["pos"][0] + math.copysign(1.1, own_hoop_x - carrier["pos"][0])
            gz = carrier["pos"][2] * 0.92
            out = steer_toward(p, gx, gz, turbo=my_dist > 2.4 and p["turbo"] > 30)
            if my_dist < 1.55 and p["stealCooldown"] <= 0 and random.random() < 1.6 * ctx["dt"]:
                out["passPressed"] = True
                out["turbo"] = random.random() < 0.45
            if (not carrier["grounded"] or carrier["isDunking"]) and my_dist < 2.3 and p["grounded"]:
                out["shootPressed"] = True
            return out

        opp_off = next(
            (o for o in state["players"] if o["team"] != team and o["index"] != carrier_idx),
            None,
        )
        if opp_off is not None:
            gx = (opp_off["pos"][0] + own_hoop_x * 0.35) / 1.35
            return steer_toward(p, gx, opp_off["pos"][2] * 0.85, turbo=False)

    return {}


class BotRequestHandler(BaseHTTPRequestHandler):
    request_count = 0

    def _send_cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._send_cors()
        self.end_headers()

    def do_GET(self) -> None:
        self.send_response(200)
        self._send_cors()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"status":"ok","game":"gba-gjam"}')

    def do_POST(self) -> None:
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length)
        try:
            payload = json.loads(raw)
            state = payload["state"]
            ctx = payload["ctx"]
            action = decide(state, ctx)
            BotRequestHandler.request_count += 1
            if BotRequestHandler.request_count % 120 == 1:
                print(
                    f"[tick {state['tick']}] Q{state['quarter']} {state['clockSec']:.1f}s "
                    f"score={state['score'][0]}-{state['score'][1]} "
                    f"slot={ctx['playerIndex']} action={action}"
                )
            body = json.dumps(action).encode("utf-8")
            self.send_response(200)
        except Exception as exc:
            body = json.dumps({"error": str(exc)}).encode("utf-8")
            self.send_response(400)

        self._send_cors()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args: Any) -> None:
        # Suppress per-request HTTP spam; periodic tick logs are printed above.
        return


def main() -> None:
    parser = argparse.ArgumentParser(description="GBA GJAM Python Bot POC Server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), BotRequestHandler)
    print(f"GBA GJAM Python Bot listening on http://{args.host}:{args.port}/decide")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.server_close()


if __name__ == "__main__":
    main()
