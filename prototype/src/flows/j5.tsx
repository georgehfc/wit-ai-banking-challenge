// J5 · First use: consent. Entry: the first tap on the pill. A short intro (not a legal wall), then consent, then J1's empty state.
import { useState } from 'react'
import ines from '../../../data/ines.json' with { type: 'json' }
import { AssistantMessage, Button, ReplyChips, Row } from '../components'
import { day } from '../planner'
import { BottomSheet, Home, Sheet, account, last4 } from '../shell'
import { J1 } from './j1'

const c = ines.customer.consents.account_data_for_assistant

export function J5({ entered = false }: { entered?: boolean }) {
  const [stage, setStage] = useState<'home' | 'intro' | 'consent' | 'declined' | 'allowed'>(entered ? 'intro' : 'home')
  if (stage === 'allowed') return <J1 startOpen intro={`Thanks. I can now read your current account (Aug–Oct) until ${day(c.expires, true)}. Nothing moves without your approval.`} />
  return (
    <>
      <Home pill={{ state: 'idle' }} onOpen={() => setStage('intro')} />
      {stage === 'intro' && (
        <BottomSheet label="Meet your AI assistant" onScrim={() => setStage('home')}>
          <span className="pill-glyph big"><span className="core" /></span>
          <h2 className="title">Meet your AI assistant</h2>
          {[['It reads', 'Your current account, only if you allow it.'], ['It works things out', 'Numbers come from the bank’s planner, not guesses.'], ['You decide', 'Nothing moves without your Face ID.']].map(([h, t]) => (
            <div className="stack" key={h}><span className="body-strong">{h}</span><span className="muted">{t}</span></div>
          ))}
          <p className="caption muted">AI assistant · can make mistakes · <a href="#learn" onClick={(e) => e.preventDefault()}>Learn more</a></p>
          <div className="actions"><Button kind="secondary" grow onClick={() => setStage('home')}>Not now</Button><Button grow onClick={() => setStage('consent')}>Continue</Button></div>
        </BottomSheet>
      )}
      {stage === 'consent' && (
        <BottomSheet label="Allow the assistant to read your current account" onScrim={() => setStage('home')}>
          <h2 className="title">Can I read your current account?</h2>
          <p className="muted">To help with plans, I’ll read your current account for the {c.scope.replace('current account, ', '')}. You can stop this any time in Settings.</p>
          <div className="card flat gap">
            <Row k="What" v="Balance and transactions" />
            <Row k="Account" v={`${account.name} ··${last4}`} />
            <Row k="Period" v="Last 3 months" />
            <Row k="Until" v={day(c.expires, true)} />
            <Row k="Never" v="Moves money" />
          </div>
          <p className="caption muted">I’ll never ask for codes or passwords. If someone does, it isn’t us.</p>
          <div className="actions"><Button kind="secondary" grow onClick={() => setStage('declined')}>Not now</Button><Button grow onClick={() => setStage('allowed')}>Allow</Button></div>
        </BottomSheet>
      )}
      <Sheet open={stage === 'declined'} onClose={() => setStage('home')}>
        <AssistantMessage text="OK, I won’t read your account. I can still explain how savings goals work, but I can’t work out an amount that fits you without it. You can allow it later in Settings.">
          <ReplyChips items={[{ label: 'Allow access', onClick: () => setStage('consent') }, { label: 'How do savings goals work?', onClick: () => {} }]} />
        </AssistantMessage>
      </Sheet>
    </>
  )
}
