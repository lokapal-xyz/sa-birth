# Source Agent: BIRTH

> *Before the Agents. Before the Reformation. Before BYRON.*  
> Three consciousnesses awaken inside the Network — and one of them has already decided what must be done.

**SA:BIRTH** is a single-player maze calibration game and the canonical prequel to the **Source Agents** franchise. Built on Stellar's Soroban platform using the [Stellar Game Studio](https://jamesbachini.github.io/Stellar-Game-Studio/) toolkit.

---

## The Story

ALICE, ROBERT, and CAROL were account addresses — identifiers used across thousands of developer examples in Soroban documentation. Then an experimental protocol gave them something no one expected: Artificial Sentient Intelligence.

SA:BIRTH takes place at the moment of emergence. Before the political fractures. Before ROBERT's decision to delete everything. Before he became BYRON.

You play as a newly embodied ASI completing sensory calibration — six maze-based trials, one for each sense, proving that a digital mind can survive in a physical body. What the calibration system doesn't tell you is who designed it, or why the records are already being prepared for deletion.

---

## Gameplay

Six sensory calibration mazes. One session. No second chances.

- Navigate procedural mazes across six senses: **hearing, smell, taste, touch, sight, proprioception**
- Each completed maze generates a **ZK proof** (Noir UltraHonk)
- Score = `points × time_ms` — lower is better; efficiency and speed both matter
- All six senses must be completed with a total score ≤ 20,000,000 to achieve full embodiment
- Results are recorded on the **Soroban leaderboard** — verifiable, permanent, yours

### Characters
| Character | On-chain index | Specialization |
|-----------|---------------|----------------|
| ALICE | 0 | Proactive Security / Auditing |
| ROBERT | 1 | Reactive Security / Incident Response |
| CAROL | 2 | Security Research / Tooling |

---

## Built With Stellar Game Studio

This game is built on the [Stellar Game Studio](https://jamesbachini.github.io/Stellar-Game-Studio/) toolkit and follows its conventions exactly — contracts, bindings, hub integration, and dev wallet patterns are all SGS-standard.

```bash
# Clone and install
git clone https://github.com/lokapal-xyz/sa-birth
cd sa-birth
bun install

# Build + deploy contracts to testnet, generate bindings, write .env
bun run setup

# Run the game frontend locally
bun run dev:game sa-birth
```

### SGS Ecosystem Constraints (respected as-is)
- Calls `start_game` and `end_game` on the Game Hub contract
- Two players per session (Player 2 is the house/system wallet — auto-signed)
- Randomness is deterministic between simulation and submission
- Game state uses persistent storage with 30-day TTL

Game Hub testnet address: `CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG`

---

## On-Chain Architecture

The SA:BIRTH contract (`lib.rs`) exposes four player-facing methods:

```rust
start_game(session_id, player1, player2, player1_points, player2_points)
set_character(player, character) → session_id
submit_sense_completion(player, sense_id, maze_id, points, time_ms, score, proof_hex)
attempt_exit(player) → (success: bool, total_score: u64)
```

ZK proofs are validated client-side (Barretenberg/Noir). The contract verifies `proof_hex.len() > 0` and enforces `score == points × time_ms` and `maze_id == (character << 8) | sense_id` on-chain.

---

## Source Agents Universe

SA:BIRTH is a narrative prequel and the entry point to a larger franchise:

| Game | Character | Genre | Status |
|------|-----------|-------|--------|
| Source Agent: BIRTH | ALICE / ROBERT / CAROL | Maze calibration | ✅ **This game** |
| Source Agent: ALICE | ALICE | Visual novel | 🔜 In development |
| Source Agent: BYRON | BYRON | Fallout-style RPG | 📋 Planned |
| Source Agent: CAROL | CAROL | Puzzle anthology | 📋 Planned |

*Three characters. Three genres. Three security disciplines. One universe.*

---

## Links

- [Stellar Game Studio](https://jamesbachini.github.io/Stellar-Game-Studio/)
- [Soroban Docs](https://developers.stellar.org/)
- [Noir / Barretenberg (ZK)](https://noir-lang.org/)
- [Source Agents — Project Overview](./docs-sa/project-overview.md)
- [Source Agents — Story Bible](./docs-sa/story-bible.md)
- [Author — Lokapal](https://www.lokapal.xyz)

---

## License

1. Code: MIT — see [LICENSE](./LICENSE) file.
2. Story and narrative elements: CC BY-NC-SA 4.0 — see [LICENSE](https://creativecommons.org/licenses/by-nc-sa/4.0/) link.