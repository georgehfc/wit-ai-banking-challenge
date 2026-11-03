// J0 · The assistant asleep: entry points hub. Each pill state is one way the assistant wakes up; tapping it opens that journey.
import { Home } from '../shell'
import type { PillState } from '../components'

export type FlowId = 'j0' | 'j1' | 'j2' | 'j3' | 'j4' | 'j5'
export const J0_STATES: { id: string; name: string; pill: { state: PillState; label?: string; action?: string }; goes: FlowId; variant?: string; why: string }[] = [
  { id: 'first', name: 'First time', pill: { state: 'idle' }, goes: 'j5', why: 'First tap → short intro and consent (J5).' },
  { id: 'idle', name: 'Asleep', pill: { state: 'idle' }, goes: 'j1', why: 'You ask → the conversation (J1).' },
  { id: 'working', name: 'Working', pill: { state: 'working', label: 'Working on your holiday plan…' }, goes: 'j1', why: 'You left mid-task; it keeps going.' },
  { id: 'money', name: 'Money arrived', pill: { state: 'nudge', label: 'Christmas allowance arrived', action: 'Review' }, goes: 'j2', variant: 'open', why: 'Event: money arrives (J2).' },
  { id: 'forecast', name: 'Short month', pill: { state: 'nudge', label: 'January looks short', action: 'Review' }, goes: 'j3', why: 'Planner forecast, 3 days before (J3).' },
]

export function J0({ state, go }: { state: string; go: (f: FlowId, variant?: string, from?: string) => void }) {
  const s = J0_STATES.find((x) => x.id === state) ?? J0_STATES[1]
  return <Home pill={s.pill} masked={s.goes === 'j2' || s.goes === 'j3'} onOpen={() => go(s.goes, s.variant, s.id)} />
}
