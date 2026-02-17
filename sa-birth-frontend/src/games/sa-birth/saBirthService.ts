import { Client as SaBirthClient, type CalibrationSession } from './bindings';
import { NETWORK_PASSPHRASE, RPC_URL, DEFAULT_METHOD_OPTIONS, DEFAULT_AUTH_TTL_MINUTES } from '@/utils/constants';
import { contract } from '@stellar/stellar-sdk';
import { Buffer } from 'buffer';
import { signAndSendViaLaunchtube } from '@/utils/transactionHelper';
import { calculateValidUntilLedger } from '@/utils/ledgerUtils';

type ClientOptions = contract.ClientOptions;

/**
 * Service for interacting with the SaBirth game contract.
 *
 * Follows the exact same pattern as DiceDuelService:
 *   - typed Client from generated bindings (auto-simulates, always fresh seq#)
 *   - signAndSendViaLaunchtube for submission (no txBadSeq errors)
 *   - calculateValidUntilLedger for proper auth TTL
 *
 * Return type notes from bindings.ts:
 *   get_session            → AssembledTransaction<Option<CalibrationSession>>
 *     Option<T> deserialises as T | undefined  (no isOk/unwrap — that's Result<T> only)
 *   start_game             → AssembledTransaction<Result<void>>
 *   set_character          → AssembledTransaction<Result<u32>>
 *   submit_sense_completion→ AssembledTransaction<Result<void>>
 *   attempt_exit           → AssembledTransaction<Result<readonly [boolean, u64]>>
 *     Result<T> exposes .isOk() / .unwrap() on the AssembledTransaction after send
 */
export class SaBirthService {
  private baseClient: SaBirthClient;
  private contractId: string;

  constructor(contractId: string) {
    this.contractId = contractId;
    this.baseClient = new SaBirthClient({
      contractId: this.contractId,
      networkPassphrase: NETWORK_PASSPHRASE,
      rpcUrl: RPC_URL,
    });
  }

  /**
   * Create a client with signing capabilities.
   */
  private createSigningClient(
    publicKey: string,
    signer: Pick<ClientOptions, 'signTransaction' | 'signAuthEntry'>
  ): SaBirthClient {
    const options: ClientOptions = {
      contractId: this.contractId,
      networkPassphrase: NETWORK_PASSPHRASE,
      rpcUrl: RPC_URL,
      publicKey,
      ...signer,
    };
    return new SaBirthClient(options);
  }

  /**
   * Get the current calibration session for a player.
   * Returns null if no session exists (instead of throwing).
   *
   * get_session returns Option<CalibrationSession> which the SDK deserialises
   * directly as CalibrationSession | undefined — no Result wrapper, no isOk().
   */
  async getSession(playerAddress: string): Promise<CalibrationSession | null> {
    try {
      const tx = await this.baseClient.get_session({ player: playerAddress });
      // .result on a simulated read-only AssembledTransaction is the unwrapped value
      // For Option<T> that means T | undefined
      return tx.result ?? null;
    } catch (err) {
      console.log('[getSession] Error querying session:', err);
      return null;
    }
  }

  /**
   * Start a new calibration session.
   *
   * SA:BIRTH is single-player — only player1 signs (require_auth_for_args).
   * player2 is always the house/system dev wallet. No multi-sig flow needed.
   */
  async startGame(
    sessionId: number,
    player1: string,
    player2: string,
    player1Points: bigint,
    player2Points: bigint,
    signer: Pick<ClientOptions, 'signTransaction' | 'signAuthEntry'>
  ) {
    const client = this.createSigningClient(player1, signer);
    const tx = await client.start_game({
      session_id: sessionId,
      player1,
      player2,
      player1_points: player1Points,
      player2_points: player2Points,
    }, DEFAULT_METHOD_OPTIONS);
    // NOTE: Contract methods automatically simulate — footprint already populated.

    const validUntilLedgerSeq = await calculateValidUntilLedger(RPC_URL, DEFAULT_AUTH_TTL_MINUTES);

    try {
      const sentTx = await signAndSendViaLaunchtube(
        tx,
        DEFAULT_METHOD_OPTIONS.timeoutInSeconds,
        validUntilLedgerSeq
      );

      if (sentTx.getTransactionResponse?.status === 'FAILED') {
        const errorMessage = this.extractErrorFromDiagnostics(sentTx.getTransactionResponse);
        throw new Error(`Transaction failed: ${errorMessage}`);
      }

      return sentTx.result;
    } catch (err) {
      if (err instanceof Error && err.message.includes('Transaction failed!')) {
        throw new Error('start_game transaction failed — check contract logs');
      }
      throw err;
    }
  }

  /**
   * Record the player's chosen character (0=ALICE, 1=ROBERT, 2=CAROL).
   * Must be called after startGame(). Returns the session_id (u32).
   */
  async setCharacter(
    playerAddress: string,
    character: number,
    signer: Pick<ClientOptions, 'signTransaction' | 'signAuthEntry'>
  ): Promise<number> {
    const client = this.createSigningClient(playerAddress, signer);
    const tx = await client.set_character({
      player: playerAddress,
      character,
    }, DEFAULT_METHOD_OPTIONS);

    const validUntilLedgerSeq = await calculateValidUntilLedger(RPC_URL, DEFAULT_AUTH_TTL_MINUTES);

    try {
      const sentTx = await signAndSendViaLaunchtube(
        tx,
        DEFAULT_METHOD_OPTIONS.timeoutInSeconds,
        validUntilLedgerSeq
      );

      if (sentTx.getTransactionResponse?.status === 'FAILED') {
        const errorMessage = this.extractErrorFromDiagnostics(sentTx.getTransactionResponse);
        throw new Error(`Transaction failed: ${errorMessage}`);
      }

      // set_character returns Result<u32> — unwrap to get the session_id number
      return (sentTx.result as any).unwrap() as number;
    } catch (err) {
      if (err instanceof Error && err.message.includes('Transaction failed!')) {
        throw new Error('set_character transaction failed — check character value and session state');
      }
      throw err;
    }
  }

  /**
   * Submit the result of one completed maze sense.
   *
   * proof_hex only needs to be non-empty (contract checks length > 0).
   * The proof bytes are passed as a Buffer — the bindings type proof_hex as Bytes/Buffer.
   */
  async submitSenseCompletion(
    playerAddress: string,
    senseId: number,
    mazeId: number,
    points: bigint,
    timeMs: bigint,
    score: bigint,
    proofHex: string,
    signer: Pick<ClientOptions, 'signTransaction' | 'signAuthEntry'>
  ) {
    const client = this.createSigningClient(playerAddress, signer);

    // Convert hex string to Buffer for the Bytes contract type.
    // The contract only checks proof_hex.len() > 0, so any non-empty bytes are valid.
    const proofBuffer = Buffer.from(proofHex, 'hex');

    const tx = await client.submit_sense_completion({
      player:    playerAddress,
      sense_id:  senseId,
      maze_id:   mazeId,
      points,
      time_ms:   timeMs,
      score,
      proof_hex: proofBuffer,
    }, DEFAULT_METHOD_OPTIONS);

    const validUntilLedgerSeq = await calculateValidUntilLedger(RPC_URL, DEFAULT_AUTH_TTL_MINUTES);

    try {
      const sentTx = await signAndSendViaLaunchtube(
        tx,
        DEFAULT_METHOD_OPTIONS.timeoutInSeconds,
        validUntilLedgerSeq
      );

      if (sentTx.getTransactionResponse?.status === 'FAILED') {
        const errorMessage = this.extractErrorFromDiagnostics(sentTx.getTransactionResponse);
        throw new Error(`Transaction failed: ${errorMessage}`);
      }

      return sentTx.result;
    } catch (err) {
      if (err instanceof Error && err.message.includes('Transaction failed!')) {
        throw new Error('submit_sense_completion failed — check sense_id, maze_id and score values');
      }
      throw err;
    }
  }

  /**
   * Attempt to exit calibration (complete embodiment).
   *
   * Returns [success: boolean, totalScore: bigint].
   * success=true  → player won, added to leaderboard
   * success=false → overload or incomplete senses, house wins
   */
  async attemptExit(
    playerAddress: string,
    signer: Pick<ClientOptions, 'signTransaction' | 'signAuthEntry'>
  ): Promise<[boolean, bigint]> {
    const client = this.createSigningClient(playerAddress, signer);
    const tx = await client.attempt_exit({
      player: playerAddress,
    }, DEFAULT_METHOD_OPTIONS);

    const validUntilLedgerSeq = await calculateValidUntilLedger(RPC_URL, DEFAULT_AUTH_TTL_MINUTES);

    try {
      const sentTx = await signAndSendViaLaunchtube(
        tx,
        DEFAULT_METHOD_OPTIONS.timeoutInSeconds,
        validUntilLedgerSeq
      );

      if (sentTx.getTransactionResponse?.status === 'FAILED') {
        const errorMessage = this.extractErrorFromDiagnostics(sentTx.getTransactionResponse);
        throw new Error(`Transaction failed: ${errorMessage}`);
      }

      // attempt_exit returns Result<readonly [boolean, u64]> — unwrap to get the tuple
      const [success, totalScore] = (sentTx.result as any).unwrap() as readonly [boolean, bigint];
      return [success, totalScore];
    } catch (err) {
      if (err instanceof Error && err.message.includes('Transaction failed!')) {
        throw new Error('attempt_exit failed — check session state');
      }
      throw err;
    }
  }

  /**
   * Extract a human-readable error from diagnostic events on a failed transaction.
   * Identical to DiceDuelService.extractErrorFromDiagnostics().
   */
  private extractErrorFromDiagnostics(transactionResponse: any): string {
    try {
      console.error('Transaction response:', JSON.stringify(transactionResponse, null, 2));

      const diagnosticEvents =
        transactionResponse?.diagnosticEventsXdr ??
        transactionResponse?.diagnostic_events ?? [];

      for (const event of diagnosticEvents) {
        if (event?.topics) {
          const topics = Array.isArray(event.topics) ? event.topics : [];
          const hasErrorTopic = topics.some((topic: any) =>
            topic?.symbol === 'error' || topic?.error
          );
          if (hasErrorTopic && event.data) {
            if (typeof event.data === 'string') return event.data;
            if (event.data.vec && Array.isArray(event.data.vec)) {
              const messages = event.data.vec
                .filter((item: any) => item?.string)
                .map((item: any) => item.string);
              if (messages.length > 0) return messages.join(': ');
            }
          }
        }
      }

      if (transactionResponse?.result_xdr) {
        console.error('Result XDR:', transactionResponse.result_xdr);
      }
      if (transactionResponse?.returnValue) {
        console.error('Return value:', transactionResponse.returnValue);
      }

      const status = transactionResponse?.status || 'Unknown';
      return `Transaction ${status}. Check console for details.`;
    } catch (err) {
      console.error('Failed to extract error from diagnostics:', err);
      return 'Transaction failed with unknown error';
    }
  }
}