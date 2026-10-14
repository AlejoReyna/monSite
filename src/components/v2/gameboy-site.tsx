"use client";

import GameBoyPlayer from "./gameboy-player";
import { GAMEBOY_PORTFOLIO_URL } from "@/lib/gameboy/site";

export default function GameBoySite() {
  return <div style={{ minHeight: "100svh", background: "#18191d" }}>
    <GameBoyPlayer onExit={() => window.location.assign(GAMEBOY_PORTFOLIO_URL)} />
  </div>;
}
