/**
 * useZkProof.ts  –  v5
 *
 * Fixes in this version:
 *
 *  FIX A – "Buffer is not defined"
 *    Buffer.from(proof).toString('hex') throws if the Buffer polyfill
 *    hasn't loaded yet when bb.js resolves its promise.  Replaced with a
 *    native Uint8Array → hex conversion that needs no polyfill at all.
 *
 *  FIX B – Status flickering (proving → verifying → proving → error)
 *    React StrictMode double-invokes callbacks in development.  The module-
 *    level `initWasm()` had no guard against two concurrent calls – the
 *    second invocation would start a fresh Promise.all while the first was
 *    still in flight, causing a race.  Fixed with a promise-mutex pattern:
 *    any concurrent caller just awaits the already-running promise.
 *
 * ── Prerequisites ─────────────────────────────────────────────────────────
 *  bun add @noir-lang/noir_js@1.0.0-beta.15
 *  bun add @aztec/bb.js@3.0.0-nightly.20251104
 *  bun add @noir-lang/noirc_abi@1.0.0-beta.15
 *  bun add @noir-lang/acvm_js@1.0.0-beta.15
 *
 *  Compile circuit:
 *    cd circuit && nargo compile    # nargo 1.0.0-beta.15
 *    cp target/maze_score.json ../src/circuit/maze_score.json
 * ──────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback, useRef } from 'react';
import { Noir }                           from '@noir-lang/noir_js';
import { UltraHonkBackend }               from '@aztec/bb.js';
import type { CompiledCircuit }           from '@noir-lang/types';
import initACVM                           from '@noir-lang/acvm_js';
import initNoirC                          from '@noir-lang/noirc_abi';
import acvmWasm from '@noir-lang/acvm_js/web/acvm_js_bg.wasm?url';
import norcWasm from '@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm?url';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type ZkStatus =
  | 'idle'
  | 'initializing'
  | 'ready'
  | 'proving'
  | 'verifying'
  | 'done'
  | 'error';

export interface ProofResult {
  proofHex:     string;    // hex-encoded proof bytes
  publicInputs: string[];  // [score, score_cap, maze_id] as 0x-hex
  verified:     boolean;
  mazeId:       number;    // (characterIndex << 8) | senseIndex
  score:        number;
}

// --------------------------------------------------------------------------
// Module-level singletons (survive React re-renders / HMR)
// --------------------------------------------------------------------------

// Promise-mutex: any second caller while init is in flight just awaits this
// instead of spawning a duplicate Promise.all (which caused the flickering).
let _wasmInitPromise: Promise<void> | null = null;
let _wasmInitialised  = false;
let _circuitCache: CompiledCircuit | null  = null;

async function initWasm(): Promise<void> {
  if (_wasmInitialised) return;
  if (!_wasmInitPromise) {
    _wasmInitPromise = (async () => {
      await Promise.all([
        initACVM({ module_or_path: fetch(acvmWasm) }),
        initNoirC({ module_or_path: fetch(norcWasm) }),
      ]);
      _wasmInitialised = true;
    })();
  }
  return _wasmInitPromise;
}

async function loadCircuit(): Promise<CompiledCircuit> {
  if (_circuitCache) return _circuitCache;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let raw: any;
  try {
    raw = await import('../src/circuit/maze_score.json');
  } catch {
    throw new Error(
      '[ZK] Circuit JSON not found at src/circuit/maze_score.json\n' +
      '→ Run: cd circuit && nargo compile\n' +
      '→ Then: cp circuit/target/maze_score.json src/circuit/maze_score.json',
    );
  }

  const circuit = (raw.default ?? raw) as unknown as CompiledCircuit;

  if (typeof circuit?.bytecode !== 'string' || !circuit.bytecode) {
    throw new Error('[ZK] maze_score.json missing bytecode – re-run nargo compile');
  }

  _circuitCache = circuit;
  return circuit;
}

// Native Uint8Array → hex, no Buffer polyfill needed.
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// --------------------------------------------------------------------------
// Hook
// --------------------------------------------------------------------------

export function useZkProof() {
  const [status, setStatus]       = useState<ZkStatus>('idle');
  const [error, setError]         = useState<string | null>(null);
  const [lastProof, setLastProof] = useState<ProofResult | null>(null);

  const noirRef    = useRef<Noir | null>(null);
  const backendRef = useRef<UltraHonkBackend | null>(null);

  // ── init() ────────────────────────────────────────────────────────────────
  const init = useCallback(async (): Promise<boolean> => {
    if (noirRef.current && backendRef.current) return true;

    setStatus('initializing');
    setError(null);

    try {
      await initWasm();
      const circuit = await loadCircuit();

      const noir    = new Noir(circuit);
      const backend = new UltraHonkBackend(circuit.bytecode);

      noirRef.current    = noir;
      backendRef.current = backend;

      setStatus('ready');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setStatus('error');
      console.error('[ZK] init failed:', msg);
      return false;
    }
  }, []);

  // ── generateMazeProof() ───────────────────────────────────────────────────
  const generateMazeProof = useCallback(
    async (opts: {
      points:    number;
      time_ms:   number;
      score:     number;
      mazeId:    number;
      scoreCap?: number;
    }): Promise<ProofResult | null> => {
      const { points, time_ms, score, mazeId, scoreCap = 20_000_000 } = opts;

      if (score > scoreCap) {
        setError(`Score ${score.toLocaleString()} exceeds cap – proof skipped`);
        setStatus('error');
        return null;
      }

      const ready = await init();
      if (!ready || !noirRef.current || !backendRef.current) return null;

      setStatus('proving');
      setError(null);

      try {
        const { witness } = await noirRef.current.execute({
          points:    points.toString(),
          time_ms:   time_ms.toString(),
          score:     score.toString(),
          score_cap: scoreCap.toString(),
          maze_id:   mazeId.toString(),
        });

        const proofData = await backendRef.current.generateProof(witness);

        setStatus('verifying');
        const verified = await backendRef.current.verifyProof(proofData);

        // Native hex conversion – no Buffer polyfill required
        const proofHex = toHex(proofData.proof as Uint8Array);

        const result: ProofResult = {
          proofHex,
          publicInputs: proofData.publicInputs,
          verified,
          mazeId,
          score,
        };

        setLastProof(result);
        setStatus('done');

        console.info(
          '[ZK] ✅ Proof OK\n' +
          `  maze_id  : 0x${mazeId.toString(16)}\n` +
          `  score    : ${score.toLocaleString()}\n` +
          `  verified : ${verified}\n` +
          `  proof    : …${proofHex.slice(32, 64)}…`,
        );

        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        setStatus('error');
        console.error('[ZK] proving failed:', msg);
        return null;
      }
    },
    [init],
  );

  // ── reset() ───────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setStatus(noirRef.current ? 'ready' : 'idle');
    setError(null);
    setLastProof(null);
  }, []);

  return {
    status,
    error,
    lastProof,
    init,
    generateMazeProof,
    reset,
    isReady:
      status === 'ready'   ||
      status === 'done'    ||
      status === 'proving' ||
      status === 'verifying',
  };
}