import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CCUU5JAAPEZYBLKBOCBUGJG5U23T2CBIGY22DCT4SKQOBWDHCROX27IC",
  }
} as const

export const Errors = {
  1: {message:"GameNotFound"},
  2: {message:"NotPlayer"},
  3: {message:"AlreadyGuessed"},
  4: {message:"BothPlayersNotGuessed"},
  5: {message:"GameAlreadyEnded"},
  6: {message:"SessionAlreadyActive"},
  7: {message:"InvalidCharacter"},
  8: {message:"InvalidSense"},
  9: {message:"VerificationFailed"},
  10: {message:"SessionNotActive"},
  11: {message:"HubCallFailed"},
  12: {message:"OverloadExceeded"}
}

/**
 * DataKey enum mirrors the SGS template pattern so the setup script's
 * `__constructor` call works without modification.
 */
export type DataKey = {tag: "Session", values: readonly [string]} | {tag: "GameHubAddress", values: void} | {tag: "Admin", values: void} | {tag: "SessionCounter", values: void} | {tag: "Leaderboard", values: void} | {tag: "SenseResult", values: readonly [string, u32]};



/**
 * Per-sense result stored on-chain.
 * Note: Proofs are emitted in events for off-chain verification but not stored.
 */
export interface SenseResult {
  points: u64;
  score: u64;
  sense_id: u32;
  time_ms: u64;
}




/**
 * Leaderboard entry — only successful (score ≤ cap) exits are recorded.
 */
export interface LeaderboardEntry {
  character: u32;
  player: string;
  timestamp: u64;
  total_score: u64;
}


/**
 * A player's active calibration session.
 * Stored in instance storage, keyed by player address.
 */
export interface CalibrationSession {
  active: boolean;
  character: u32;
  completed_senses: u32;
  player: string;
  player1_points: i128;
  player2: string;
  player2_points: i128;
  session_id: u32;
  total_score: u64;
}


export interface Client {
  /**
   * Construct and simulate a get_hub transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_hub: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a set_hub transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_hub: ({new_hub}: {new_hub: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a upgrade transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  upgrade: ({new_wasm_hash}: {new_wasm_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_game transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get current (or last) calibration session for a player.
   */
  get_game: ({session_id}: {session_id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Option<CalibrationSession>>>

  /**
   * Construct and simulate a get_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_admin: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a set_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_admin: ({new_admin}: {new_admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a start_game transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Start a calibration session.
   * 
   * Called by the frontend when Player 1 wants to begin a new game.
   * Player 2 is the system/house wallet — only Player 1 needs to authorize
   * since they're committing their own stake. The Hub locks both players' points.
   * 
   * After calling this, the frontend should call `set_character()` to record
   * the player's chosen character (ALICE/ROBERT/CAROL).
   * 
   * Returns Ok(()) on success.
   */
  start_game: ({session_id, player1, player2, player1_points, player2_points}: {session_id: u32, player1: string, player2: string, player1_points: i128, player2_points: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_session transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get calibration session by player address (preferred over get_game).
   */
  get_session: ({player}: {player: string}, options?: MethodOptions) => Promise<AssembledTransaction<Option<CalibrationSession>>>

  /**
   * Construct and simulate a attempt_exit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Attempt to exit calibration (complete embodiment).
   * 
   * Success requires all 6 senses completed AND total_score ≤ SCORE_CAP.
   * Regardless of outcome, closes the session and calls hub.end_game().
   * 
   * Returns (success: bool, total_score: u64) tuple.
   * success=true means player won; success=false means overload or incomplete.
   */
  attempt_exit: ({player}: {player: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<readonly [boolean, u64]>>>

  /**
   * Construct and simulate a set_character transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Record the player's chosen character (ALICE/ROBERT/CAROL).
   * 
   * Must be called after `start_game()` and before any maze attempts.
   * Returns the session_id for the active session.
   */
  set_character: ({player, character}: {player: string, character: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u32>>>

  /**
   * Construct and simulate a get_leaderboard transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get leaderboard sorted by total_score ascending (lower = better).
   */
  get_leaderboard: (options?: MethodOptions) => Promise<AssembledTransaction<Array<LeaderboardEntry>>>

  /**
   * Construct and simulate a get_sense_result transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Get stored sense result for a player (includes proof bytes).
   */
  get_sense_result: ({player, sense_id}: {player: string, sense_id: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Option<SenseResult>>>

  /**
   * Construct and simulate a submit_sense_completion transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Submit the result of one maze sense.
   * 
   * On-chain validation mirrors the ZK circuit constraints:
   * • score == points × time_ms
   * • maze_id == (character << 8) | sense_id
   * • proof_hex must be non-empty
   * 
   * Full Barretenberg UltraHonk verification can be wired in here once a
   * Soroban-native verifier is available; for now proofs are stored for
   * off-chain auditability.
   * 
   * `sense_id`: 0=hearing, 1=smell, 2=taste, 3=touch, 4=sight, 5=proprioception
   */
  submit_sense_completion: ({player, sense_id, maze_id, points, time_ms, score, proof_hex}: {player: string, sense_id: u32, maze_id: u32, points: u64, time_ms: u64, score: u64, proof_hex: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin, game_hub}: {admin: string, game_hub: string},
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy({admin, game_hub}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAADAAAAAAAAAAMR2FtZU5vdEZvdW5kAAAAAQAAAAAAAAAJTm90UGxheWVyAAAAAAAAAgAAAAAAAAAOQWxyZWFkeUd1ZXNzZWQAAAAAAAMAAAAAAAAAFUJvdGhQbGF5ZXJzTm90R3Vlc3NlZAAAAAAAAAQAAAAAAAAAEEdhbWVBbHJlYWR5RW5kZWQAAAAFAAAAAAAAABRTZXNzaW9uQWxyZWFkeUFjdGl2ZQAAAAYAAAAAAAAAEEludmFsaWRDaGFyYWN0ZXIAAAAHAAAAAAAAAAxJbnZhbGlkU2Vuc2UAAAAIAAAAAAAAABJWZXJpZmljYXRpb25GYWlsZWQAAAAAAAkAAAAAAAAAEFNlc3Npb25Ob3RBY3RpdmUAAAAKAAAAAAAAAA1IdWJDYWxsRmFpbGVkAAAAAAAACwAAAAAAAAAQT3ZlcmxvYWRFeGNlZWRlZAAAAAw=",
        "AAAAAgAAAHREYXRhS2V5IGVudW0gbWlycm9ycyB0aGUgU0dTIHRlbXBsYXRlIHBhdHRlcm4gc28gdGhlIHNldHVwIHNjcmlwdCdzCmBfX2NvbnN0cnVjdG9yYCBjYWxsIHdvcmtzIHdpdGhvdXQgbW9kaWZpY2F0aW9uLgAAAAAAAAAHRGF0YUtleQAAAAAGAAAAAQAAADxBY3RpdmUvY29tcGxldGVkIGNhbGlicmF0aW9uIHNlc3Npb24ga2V5ZWQgYnkgcGxheWVyIGFkZHJlc3MAAAAHU2Vzc2lvbgAAAAABAAAAEwAAAAAAAAAsQWRkcmVzcyBvZiB0aGUgZGVwbG95ZWQgTW9ja0dhbWVIdWIgY29udHJhY3QAAAAOR2FtZUh1YkFkZHJlc3MAAAAAAAAAAAAoQWRtaW4gYWRkcmVzcyAoY2FuIHVwZ3JhZGUgdGhlIGNvbnRyYWN0KQAAAAVBZG1pbgAAAAAAAAAAAAAhQXV0by1pbmNyZW1lbnRpbmcgc2Vzc2lvbiBjb3VudGVyAAAAAAAADlNlc3Npb25Db3VudGVyAAAAAAAAAAAAI0xlYWRlcmJvYXJkIChWZWM8TGVhZGVyYm9hcmRFbnRyeT4pAAAAAAtMZWFkZXJib2FyZAAAAAABAAAAOFBlci1wbGF5ZXIsIHBlci1zZW5zZSByZXN1bHQga2V5ZWQgYnkgKHBsYXllciwgc2Vuc2VfaWQpAAAAC1NlbnNlUmVzdWx0AAAAAAIAAAATAAAABA==",
        "AAAABQAAAAAAAAAAAAAAClN0YXJ0RXZlbnQAAAAAAAEAAAAFc3RhcnQAAAAAAAACAAAAAAAAAAljaGFyYWN0ZXIAAAAAAAAEAAAAAAAAAAAAAAAKc2Vzc2lvbl9pZAAAAAAABAAAAAAAAAAC",
        "AAAAAQAAAG9QZXItc2Vuc2UgcmVzdWx0IHN0b3JlZCBvbi1jaGFpbi4KTm90ZTogUHJvb2ZzIGFyZSBlbWl0dGVkIGluIGV2ZW50cyBmb3Igb2ZmLWNoYWluIHZlcmlmaWNhdGlvbiBidXQgbm90IHN0b3JlZC4AAAAAAAAAAAtTZW5zZVJlc3VsdAAAAAAEAAAAAAAAAAZwb2ludHMAAAAAAAYAAAAAAAAABXNjb3JlAAAAAAAABgAAAAAAAAAIc2Vuc2VfaWQAAAAEAAAAAAAAAAd0aW1lX21zAAAAAAY=",
        "AAAABQAAAAAAAAAAAAAADUNvbXBsZXRlRXZlbnQAAAAAAAABAAAACGNvbXBsZXRlAAAAAgAAAAAAAAAJY2hhcmFjdGVyAAAAAAAABAAAAAAAAAAAAAAAC3RvdGFsX3Njb3JlAAAAAAYAAAAAAAAAAg==",
        "AAAABQAAAAAAAAAAAAAADU92ZXJsb2FkRXZlbnQAAAAAAAABAAAACG92ZXJsb2FkAAAAAgAAAAAAAAAJY2hhcmFjdGVyAAAAAAAABAAAAAAAAAAAAAAAC3RvdGFsX3Njb3JlAAAAAAYAAAAAAAAAAg==",
        "AAAAAQAAAElMZWFkZXJib2FyZCBlbnRyeSDigJQgb25seSBzdWNjZXNzZnVsIChzY29yZSDiiaQgY2FwKSBleGl0cyBhcmUgcmVjb3JkZWQuAAAAAAAAAAAAABBMZWFkZXJib2FyZEVudHJ5AAAABAAAAAAAAAAJY2hhcmFjdGVyAAAAAAAABAAAAAAAAAAGcGxheWVyAAAAAAATAAAAAAAAAAl0aW1lc3RhbXAAAAAAAAAGAAAAAAAAAAt0b3RhbF9zY29yZQAAAAAG",
        "AAAAAAAAAAAAAAAHZ2V0X2h1YgAAAAAAAAAAAQAAABM=",
        "AAAAAAAAAAAAAAAHc2V0X2h1YgAAAAABAAAAAAAAAAduZXdfaHViAAAAABMAAAAA",
        "AAAAAAAAAAAAAAAHdXBncmFkZQAAAAABAAAAAAAAAA1uZXdfd2FzbV9oYXNoAAAAAAAD7gAAACAAAAAA",
        "AAAAAAAAADdHZXQgY3VycmVudCAob3IgbGFzdCkgY2FsaWJyYXRpb24gc2Vzc2lvbiBmb3IgYSBwbGF5ZXIuAAAAAAhnZXRfZ2FtZQAAAAEAAAAAAAAACnNlc3Npb25faWQAAAAAAAQAAAABAAAD6AAAB9AAAAASQ2FsaWJyYXRpb25TZXNzaW9uAAA=",
        "AAAAAQAAAFtBIHBsYXllcidzIGFjdGl2ZSBjYWxpYnJhdGlvbiBzZXNzaW9uLgpTdG9yZWQgaW4gaW5zdGFuY2Ugc3RvcmFnZSwga2V5ZWQgYnkgcGxheWVyIGFkZHJlc3MuAAAAAAAAAAASQ2FsaWJyYXRpb25TZXNzaW9uAAAAAAAJAAAAAAAAAAZhY3RpdmUAAAAAAAEAAAAAAAAACWNoYXJhY3RlcgAAAAAAAAQAAAAAAAAAEGNvbXBsZXRlZF9zZW5zZXMAAAAEAAAAAAAAAAZwbGF5ZXIAAAAAABMAAAAAAAAADnBsYXllcjFfcG9pbnRzAAAAAAALAAAAAAAAAAdwbGF5ZXIyAAAAABMAAAAAAAAADnBsYXllcjJfcG9pbnRzAAAAAAALAAAAAAAAAApzZXNzaW9uX2lkAAAAAAAEAAAAAAAAAAt0b3RhbF9zY29yZQAAAAAG",
        "AAAAAAAAAAAAAAAJZ2V0X2FkbWluAAAAAAAAAAAAAAEAAAAT",
        "AAAAAAAAAAAAAAAJc2V0X2FkbWluAAAAAAAAAQAAAAAAAAAJbmV3X2FkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAAY5TdGFydCBhIGNhbGlicmF0aW9uIHNlc3Npb24uCgpDYWxsZWQgYnkgdGhlIGZyb250ZW5kIHdoZW4gUGxheWVyIDEgd2FudHMgdG8gYmVnaW4gYSBuZXcgZ2FtZS4KUGxheWVyIDIgaXMgdGhlIHN5c3RlbS9ob3VzZSB3YWxsZXQg4oCUIG9ubHkgUGxheWVyIDEgbmVlZHMgdG8gYXV0aG9yaXplCnNpbmNlIHRoZXkncmUgY29tbWl0dGluZyB0aGVpciBvd24gc3Rha2UuIFRoZSBIdWIgbG9ja3MgYm90aCBwbGF5ZXJzJyBwb2ludHMuCgpBZnRlciBjYWxsaW5nIHRoaXMsIHRoZSBmcm9udGVuZCBzaG91bGQgY2FsbCBgc2V0X2NoYXJhY3RlcigpYCB0byByZWNvcmQKdGhlIHBsYXllcidzIGNob3NlbiBjaGFyYWN0ZXIgKEFMSUNFL1JPQkVSVC9DQVJPTCkuCgpSZXR1cm5zIE9rKCgpKSBvbiBzdWNjZXNzLgAAAAAACnN0YXJ0X2dhbWUAAAAAAAUAAAAAAAAACnNlc3Npb25faWQAAAAAAAQAAAAAAAAAB3BsYXllcjEAAAAAEwAAAAAAAAAHcGxheWVyMgAAAAATAAAAAAAAAA5wbGF5ZXIxX3BvaW50cwAAAAAACwAAAAAAAAAOcGxheWVyMl9wb2ludHMAAAAAAAsAAAABAAAD6QAAAAIAAAAD",
        "AAAABQAAAAAAAAAAAAAAE1NlbnNlQ29tcGxldGVkRXZlbnQAAAAAAQAAAA9zZW5zZV9jb21wbGV0ZWQAAAAABAAAAAAAAAAIc2Vuc2VfaWQAAAAEAAAAAAAAAAAAAAAFc2NvcmUAAAAAAAAGAAAAAAAAAAAAAAAGcG9pbnRzAAAAAAAGAAAAAAAAAAAAAAAHdGltZV9tcwAAAAAGAAAAAAAAAAI=",
        "AAAAAAAAAERHZXQgY2FsaWJyYXRpb24gc2Vzc2lvbiBieSBwbGF5ZXIgYWRkcmVzcyAocHJlZmVycmVkIG92ZXIgZ2V0X2dhbWUpLgAAAAtnZXRfc2Vzc2lvbgAAAAABAAAAAAAAAAZwbGF5ZXIAAAAAABMAAAABAAAD6AAAB9AAAAASQ2FsaWJyYXRpb25TZXNzaW9uAAA=",
        "AAAAAAAAATtBdHRlbXB0IHRvIGV4aXQgY2FsaWJyYXRpb24gKGNvbXBsZXRlIGVtYm9kaW1lbnQpLgoKU3VjY2VzcyByZXF1aXJlcyBhbGwgNiBzZW5zZXMgY29tcGxldGVkIEFORCB0b3RhbF9zY29yZSDiiaQgU0NPUkVfQ0FQLgpSZWdhcmRsZXNzIG9mIG91dGNvbWUsIGNsb3NlcyB0aGUgc2Vzc2lvbiBhbmQgY2FsbHMgaHViLmVuZF9nYW1lKCkuCgpSZXR1cm5zIChzdWNjZXNzOiBib29sLCB0b3RhbF9zY29yZTogdTY0KSB0dXBsZS4Kc3VjY2Vzcz10cnVlIG1lYW5zIHBsYXllciB3b247IHN1Y2Nlc3M9ZmFsc2UgbWVhbnMgb3ZlcmxvYWQgb3IgaW5jb21wbGV0ZS4AAAAADGF0dGVtcHRfZXhpdAAAAAEAAAAAAAAABnBsYXllcgAAAAAAEwAAAAEAAAPpAAAD7QAAAAIAAAABAAAABgAAAAM=",
        "AAAAAAAAAHVDYWxsZWQgb25jZSBieSB0aGUgU0dTIGRlcGxveSBzY3JpcHQ6CmBzdGVsbGFyIGNvbnRyYWN0IGludm9rZSAuLi4gLS0gX19jb25zdHJ1Y3RvciAtLWFkbWluIDxBRERSPiAtLWdhbWVfaHViIDxBRERSPmAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAIZ2FtZV9odWIAAAATAAAAAA==",
        "AAAAAAAAAKxSZWNvcmQgdGhlIHBsYXllcidzIGNob3NlbiBjaGFyYWN0ZXIgKEFMSUNFL1JPQkVSVC9DQVJPTCkuCgpNdXN0IGJlIGNhbGxlZCBhZnRlciBgc3RhcnRfZ2FtZSgpYCBhbmQgYmVmb3JlIGFueSBtYXplIGF0dGVtcHRzLgpSZXR1cm5zIHRoZSBzZXNzaW9uX2lkIGZvciB0aGUgYWN0aXZlIHNlc3Npb24uAAAADXNldF9jaGFyYWN0ZXIAAAAAAAACAAAAAAAAAAZwbGF5ZXIAAAAAABMAAAAAAAAACWNoYXJhY3RlcgAAAAAAAAQAAAABAAAD6QAAAAQAAAAD",
        "AAAAAAAAAEFHZXQgbGVhZGVyYm9hcmQgc29ydGVkIGJ5IHRvdGFsX3Njb3JlIGFzY2VuZGluZyAobG93ZXIgPSBiZXR0ZXIpLgAAAAAAAA9nZXRfbGVhZGVyYm9hcmQAAAAAAAAAAAEAAAPqAAAH0AAAABBMZWFkZXJib2FyZEVudHJ5",
        "AAAAAAAAADxHZXQgc3RvcmVkIHNlbnNlIHJlc3VsdCBmb3IgYSBwbGF5ZXIgKGluY2x1ZGVzIHByb29mIGJ5dGVzKS4AAAAQZ2V0X3NlbnNlX3Jlc3VsdAAAAAIAAAAAAAAABnBsYXllcgAAAAAAEwAAAAAAAAAIc2Vuc2VfaWQAAAAEAAAAAQAAA+gAAAfQAAAAC1NlbnNlUmVzdWx0AA==",
        "AAAAAAAAAbZTdWJtaXQgdGhlIHJlc3VsdCBvZiBvbmUgbWF6ZSBzZW5zZS4KCk9uLWNoYWluIHZhbGlkYXRpb24gbWlycm9ycyB0aGUgWksgY2lyY3VpdCBjb25zdHJhaW50czoK4oCiIHNjb3JlID09IHBvaW50cyDDlyB0aW1lX21zCuKAoiBtYXplX2lkID09IChjaGFyYWN0ZXIgPDwgOCkgfCBzZW5zZV9pZArigKIgcHJvb2ZfaGV4IG11c3QgYmUgbm9uLWVtcHR5CgpGdWxsIEJhcnJldGVuYmVyZyBVbHRyYUhvbmsgdmVyaWZpY2F0aW9uIGNhbiBiZSB3aXJlZCBpbiBoZXJlIG9uY2UgYQpTb3JvYmFuLW5hdGl2ZSB2ZXJpZmllciBpcyBhdmFpbGFibGU7IGZvciBub3cgcHJvb2ZzIGFyZSBzdG9yZWQgZm9yCm9mZi1jaGFpbiBhdWRpdGFiaWxpdHkuCgpgc2Vuc2VfaWRgOiAwPWhlYXJpbmcsIDE9c21lbGwsIDI9dGFzdGUsIDM9dG91Y2gsIDQ9c2lnaHQsIDU9cHJvcHJpb2NlcHRpb24AAAAAABdzdWJtaXRfc2Vuc2VfY29tcGxldGlvbgAAAAAHAAAAAAAAAAZwbGF5ZXIAAAAAABMAAAAAAAAACHNlbnNlX2lkAAAABAAAAAAAAAAHbWF6ZV9pZAAAAAAEAAAAAAAAAAZwb2ludHMAAAAAAAYAAAAAAAAAB3RpbWVfbXMAAAAABgAAAAAAAAAFc2NvcmUAAAAAAAAGAAAAAAAAAAlwcm9vZl9oZXgAAAAAAAAOAAAAAQAAA+kAAAACAAAAAw==" ]),
      options
    )
  }
  public readonly fromJSON = {
    get_hub: this.txFromJSON<string>,
        set_hub: this.txFromJSON<null>,
        upgrade: this.txFromJSON<null>,
        get_game: this.txFromJSON<Option<CalibrationSession>>,
        get_admin: this.txFromJSON<string>,
        set_admin: this.txFromJSON<null>,
        start_game: this.txFromJSON<Result<void>>,
        get_session: this.txFromJSON<Option<CalibrationSession>>,
        attempt_exit: this.txFromJSON<Result<readonly [boolean, u64]>>,
        set_character: this.txFromJSON<Result<u32>>,
        get_leaderboard: this.txFromJSON<Array<LeaderboardEntry>>,
        get_sense_result: this.txFromJSON<Option<SenseResult>>,
        submit_sense_completion: this.txFromJSON<Result<void>>
  }
}