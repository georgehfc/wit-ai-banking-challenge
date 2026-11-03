// J4 · Borrowing handoff. Entry: a guardrail inside a conversation (CCD2: never nudge credit; hand off with context).
import { useState } from 'react'
import out from '../../../data/plan-output.json' with { type: 'json' }
import { AssistantMessage, Button, ContextChip, HandoffCard, StepsReceipt, UserMessage } from '../components'
import { GOAL, eur } from '../planner'
import { BottomSheet, Home, Sheet } from '../shell'

const p = out.plan
const ASK = `Could I borrow the ${eur(p.gap)} so I can still go in July?`
const passOn = [`Your goal: a ${eur(GOAL)} holiday`, `Your plan: ${eur(p.monthly)} a month, ${eur(p.gap)} short by July`, 'You asked about borrowing to close the gap']

export function J4() {
  const [open, setOpen] = useState(true)
  const [input, setInput] = useState(ASK)
  const [stage, setStage] = useState<'start' | 'asked' | 'card' | 'confirm' | 'sent' | 'kept'>('start')
  const send = () => { if (!input.trim()) return; setInput(''); setStage('asked') }
  return (
    <>
      <Home pill={{ state: 'idle' }} onOpen={() => setOpen(true)} />
      <Sheet open={open} onClose={() => setOpen(false)} watch={stage}
        input={{ value: input, onChange: setInput, onSend: send }}
        overlay={stage === 'confirm' ? (
          <BottomSheet label="Share with a credit specialist" onScrim={() => setStage('card')}>
            <h2 className="title">Share this with a credit specialist?</h2>
            <p className="muted">They’ll see what you asked and your plan, so you don’t have to repeat yourself. You’ll see the full cost of any loan before deciding anything.</p>
            <ul className="bullets">{passOn.map((x) => <li key={x}>{x}</li>)}</ul>
            <div className="actions"><Button kind="secondary" grow onClick={() => setStage('card')}>Not now</Button><Button grow onClick={() => setStage('sent')}>Share and ask</Button></div>
          </BottomSheet>
        ) : null}>
        <ContextChip>Holiday plan · {eur(p.monthly)} a month · {eur(p.gap)} short by July</ContextChip>
        {stage !== 'start' && <UserMessage>{ASK}</UserMessage>}
        {stage !== 'start' && <StepsReceipt summary="Rules: credit question → a person" onDone={() => setStage((s) => s === 'asked' ? 'card' : s)}
          steps={[{ label: 'Read your question', role: 'AI' }, { label: 'Borrowing is a credit question', role: 'Rules' }, { label: 'Prepared a summary for a specialist', role: 'Handoff' }]} />}
        {stage !== 'start' && stage !== 'asked' && (
          <AssistantMessage text="That’s a credit question. I’m not the right one to suggest borrowing; here’s who can help, and I’ll pass on what we discussed.">
            <HandoffCard topic="Personal credit" why="Borrowing has costs and needs a proper check of what you can afford. A credit specialist shows you the full cost before you decide anything."
              passOn={passOn} done={stage === 'sent' || stage === 'kept'} onKeep={() => setStage('kept')} onTalk={() => setStage('confirm')} />
          </AssistantMessage>
        )}
        {stage === 'sent' && <AssistantMessage text="Sent. A credit specialist will reply here in the app. Your savings plan doesn’t change in the meantime." />}
        {stage === 'kept' && <AssistantMessage text={`OK. Your plan stays at ${eur(p.monthly)} a month, and the ways to close the gap are still there when you want them.`} />}
      </Sheet>
    </>
  )
}
