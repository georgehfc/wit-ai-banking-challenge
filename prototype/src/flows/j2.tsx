// J2 · Christmas allowance lands (proactive). Entry: money arrives.
// App closed → lock-screen push (amounts hidden). App open → pill nudge + goal card line. Never auto-opens; never moves money from a nudge.
import { useState } from 'react'
import out from '../../../data/plan-output.json' with { type: 'json' }
import { ApprovalCard, AssistantMessage, Button, FaceId, ProgressBar, Row, StatusBadge } from '../components'
import { GOAL, day, eur } from '../planner'
import { Home, LockScreen, Sheet, account, last4 } from '../shell'

const s = out.scenarios.j2_christmas_lands
const nextAfter = out.scenarios.j1_chosen.projection.find((r) => r.date > s.date && r.kind === 'monthly')!

export function J2({ variant, entered = false }: { variant: 'closed' | 'open'; entered?: boolean }) {
  const [where, setWhere] = useState<'lock' | 'home' | 'chat' | 'faceid' | 'done' | 'landed'>(entered ? 'chat' : variant === 'closed' ? 'lock' : 'home')
  const [state, setState] = useState<'pending' | 'approved' | 'declined'>('pending')
  const [toast, setToast] = useState<null | { text: string; action?: string; onAction?: () => void }>(null)
  const saved = state === 'approved' ? s.goal_saved_after : s.goal_saved_before
  const open = where === 'chat' || where === 'faceid' || where === 'done'

  if (where === 'lock') return <LockScreen date="Tuesday 15 December" time="09:12" title="Your Christmas allowance arrived" body="Tap to review a transfer to Holiday." onOpen={() => setWhere('chat')} />

  const landed = where === 'landed'
  const recent = [
    ...(state === 'approved' ? [{ initial: 'H', title: 'To Holiday', sub: 'Today, 09:13 · approved with Face ID', amount: -s.to_goal }] : []),
    { initial: 'S', title: 'Subsídio de Natal · Agência Lumen', sub: 'Today, 09:12', amount: s.allowance },
  ]
  return (
    <>
      <Home masked recentTitle="Today" recent={recent} toast={toast}
        pill={state === 'pending' ? { state: 'nudge', label: 'Christmas allowance arrived', action: 'Review' } : { state: 'idle' }}
        onOpen={() => setWhere('chat')}
        goal={{ saved, goal: GOAL, highlight: landed, status: { kind: 'positive', label: 'Active' },
          line: state === 'pending' ? `${eur(s.to_goal)} of it is waiting for your OK` : `Next transfer ${day(nextAfter.date)} · ${eur(nextAfter.add, 2)}`, tone: state === 'pending' ? 'accent' : 'muted' }} />
      <Sheet open={open} onClose={() => setWhere('home')} watch={[state, where]}
        overlay={where === 'faceid' ? <div className="screen-overlay"><FaceId onDone={() => { setState('approved'); setWhere('done') }} /></div> : null}>
        <div className="date-sep caption muted">{day(s.date)} · 09:12</div>
        <AssistantMessage text={`Your Christmas allowance arrived: ${eur(s.allowance)}. When you set up your plan, you asked me to check with you before moving ${eur(s.to_goal)} of it to Holiday. Shall I?`}>
          <ApprovalCard title="AI wants to move money" state={state}
            rows={[['Amount', eur(s.to_goal, 2), true], ['From', `${account.name} ··${last4}`], ['To', 'Holiday goal'], ['When', 'Today, once']]}
            after={[['Stays in your account', eur(s.stays_in_account, 2)], ['Holiday after this', `${eur(s.goal_saved_after)} of ${eur(GOAL)}`]]}
            note="Nothing moves until you confirm. Money transfers never get “always allow”."
            onDecline={() => setState('declined')} onApprove={() => setWhere('faceid')} />
          {state === 'pending' && <div className="mandate"><span className="caption muted">Standing instruction: ask before moving up to {eur(s.to_goal)} when the allowance lands.</span><button className="label accent">Change</button></div>}
        </AssistantMessage>
        {state === 'declined' && <AssistantMessage text={`No problem. The ${eur(s.allowance)} stays in your account. You can move money to Holiday yourself any time.`}><Button kind="secondary" onClick={() => setWhere('landed')}>Back to Home</Button></AssistantMessage>}
        {state === 'approved' && (
          <AssistantMessage text={`Done. ${eur(s.to_goal)} is in Holiday, and ${eur(s.stays_in_account)} stayed in your account.`}>
            <div className="card">
              <div className="row-between"><span className="body-strong">Holiday</span><StatusBadge kind="positive">Active</StatusBadge></div>
              <div className="row-baseline"><span className="amount">{eur(s.goal_saved_after)}</span><span className="muted">of {eur(GOAL)}</span></div>
              <ProgressBar value={s.goal_saved_after / GOAL} />
              <hr />
              <Row k="Moved today" v={eur(s.to_goal, 2)} />
              <Row k="Next transfer" v={`${day(nextAfter.date)} · ${eur(nextAfter.add, 2)}`} />
              <p className="caption muted">Approved with Face ID · {day(s.date)}, 09:13</p>
            </div>
            <Button onClick={() => { setWhere('landed'); setToast({ text: `${eur(s.to_goal)} moved to Holiday`, action: 'Undo', onAction: () => { setState('pending'); setToast({ text: 'Moved back. Nothing else changed.' }) } }) }}>Done</Button>
          </AssistantMessage>
        )}
      </Sheet>
    </>
  )
}
