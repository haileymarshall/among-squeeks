import { useState } from "react";
import { CODE_LENGTH, HAMSTER_COUNT, hamsterName, normalizeCode, type JoinOptions } from "@/shared/protocol";
import { createPrivate, friendlyError, joinCode, quickPlay, type GameRoom } from "@/net/net";

export const TOTAL_HAMSTERS = HAMSTER_COUNT;
export const randomHamster = () => 1 + Math.floor(Math.random() * TOTAL_HAMSTERS);

export type Busy = "quick" | "create" | "join" | null;

export type MenuProps = {
  initial: { name: string; hamsterId: number; code: string; suit: number };
  error: string | null;
  onJoined: (room: GameRoom, me: JoinOptions) => void;
};

/**
 * Everything the title screen does, independent of how it looks. Entry is free: no wallet, no sign-in.
 */
export function useMenu({ initial, error: initialError, onJoined }: MenuProps) {
  const [name, setName] = useState(initial.name);
  const [hamsterId, setHamster] = useState(initial.hamsterId);
  const [suit, setSuit] = useState(initial.suit);
  const [code, setCodeRaw] = useState(initial.code);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState(initialError);

  const setHamsterId = (n: number) => {
    if (!Number.isInteger(n) || n < 1 || n > TOTAL_HAMSTERS) return;
    setHamster(n);
  };

  /** Next/previous hamster. */
  const step = (dir: 1 | -1) => setHamster((id) => ((id - 1 + dir + TOTAL_HAMSTERS) % TOTAL_HAMSTERS) + 1);

  async function go(kind: "quick" | "create" | "join") {
    if (busy) return;
    if (kind === "join" && normalizeCode(code).length !== CODE_LENGTH) {
      setError(`Room codes are ${CODE_LENGTH} letters.`);
      return;
    }
    setBusy(kind);
    setError(null);
    try {
      const o: JoinOptions = { name: name.trim() || hamsterName(hamsterId), hamsterId, suit };
      const room = kind === "quick" ? await quickPlay(o) : kind === "create" ? await createPrivate(o) : await joinCode(code, o);
      onJoined(room, o);
    } catch (e) {
      setError(friendlyError(e));
      setBusy(null);
    }
  }

  return {
    name,
    setName,
    hamsterId,
    setHamsterId,
    prev: () => step(-1),
    next: () => step(1),
    shuffle: () => setHamster(randomHamster()),
    suit,
    setSuit,
    code,
    setCode: (s: string) => setCodeRaw(normalizeCode(s)),
    busy,
    error,
    go,
  };
}

export type MenuApi = ReturnType<typeof useMenu>;
