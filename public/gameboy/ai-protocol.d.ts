import type { GamePlatform } from "../../src/lib/gameboy/library";
export type AiButton = "up" | "down" | "left" | "right" | "a" | "b" | "start" | "select" | "l" | "r";
export type AiCommandKind = "observe" | "act" | "wait";
export type AiErrorCode = "invalid-argument" | "not-connected" | "no-session" | "not-ready" | "stale-session"
  | "user-control" | "page-hidden" | "busy" | "queue-full" | "cancelled" | "stopped" | "timeout" | "interrupted"
  | "capture-failed" | "session-changed" | "disconnected" | "budget-exhausted" | "request-id-conflict"
  | "duplicate-request" | "protocol" | "internal";
export const AI_PROTOCOL: string;
export const AI_PROTOCOL_VERSION: number;
export const AI_SUBPROTOCOL: string;
export const AI_DEFAULT_PORT: number;
export const AI_PATH: string;
export const AI_BUTTONS: Readonly<Record<AiButton, string>>;
export const GBA_ONLY_BUTTONS: readonly AiButton[];
export const MAX_SIMULTANEOUS_BUTTONS: number;
type Range = { readonly min: number; readonly max: number };
export const AI_LIMITS: Readonly<{ holdMs: Range; settleMs: Range & { readonly default: number }; waitMs: Range; scale: Range; overheadMs: number }>;
export const NATIVE_SIZES: Readonly<Record<GamePlatform, readonly [number, number]>>;
export const DEFAULT_SCALES: Readonly<Record<GamePlatform, number>>;
export class AiProtocolError extends Error {
  constructor(code: AiErrorCode, message: string);
  code: AiErrorCode;
}
export function isRequestId(value: unknown): value is string;
export function nativeSize(platform: unknown): readonly [number, number];
export function validateInteger(value: unknown, range: Range, name: string): number;
export function validateButtons(value: unknown, platform?: GamePlatform): AiButton[];
export function normalizeActParams(params: unknown, platform?: GamePlatform): { buttons: AiButton[]; keys: string[]; holdMs: number; settleMs: number };
export function normalizeWaitParams(params: unknown): { durationMs: number };
export function commandTimeoutMs(kind: AiCommandKind, params: { holdMs?: number; settleMs?: number; durationMs?: number }): number;
export function validateFrame<T extends { width: number; height: number; data: { length: number } }>(frame: T, platform: GamePlatform): T;
export function encodeBase64(bytes: ArrayBufferView): string;
