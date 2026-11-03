// J3 · Off-track month. Entry: the planner sees a short month coming (3 days before the transfer).
// Numbers: plan-output.json → scenarios.j3_off_track_month (computed on the September plan chosen in J1).
import { useState } from 'react'
import out from '../../../data/plan-output.json' with { type: 'json' }
import { AssistantMessage, Button, FaceId, OptionList, ProgressBar, Row, StatusBadge } from '../components'
import { GOAL, day, eur, list, monthLong } from '../planner'
import { Home, Screen, Sheet, account, last4, savingsName } from '../shell'

const s = out.scenarios.j3_off_track_month
const [skip, spread, keep] = s.options as [typeof s.options[0] & { total_by_deadline: number; short_of_plan: number }, typeof s.options[1] & { count: number; extra: number; new_monthly: number; total_by_deadline: number; short_months_in_history_at_new_monthly: string[] }, typeof s.options[2] & { buffer_dip: number }]
const buffer = out.buffer.balance
const firstJan = `${s.month}-01`
const firstFeb = '2027-02-01'
const lastSep = out.scenarios.j1_chosen.last_transfer
const shortAt = list(spread.short_months_in_history_at_new_monthly.map(monthLong))

const options = [
  { id: 'skip', label: `Skip January’s ${eur(s.transfer)}`, result: `${eur(skip.total_by_deadline)} by September · ${eur(skip.short_of_plan)} short of the plan` },
  { id: 'spread', label: `Spread it: +${eur(spread.extra)} on the next ${spread.count}`, result: `${eur(spread.new_monthly)} a month Feb–Sep · ${eur(spread.total_by_deadline)} by September. More than you had left in ${shortAt}.` },
  { id: 'keep', label: 'Keep it as planned', result: `${eur(keep.buffer_dip)} comes from your ${eur(buffer)} buffer` },
]

export function J3({ entered = false }: { entered?: boolean }) {
  const [where, setWhere] = useState<'home' | 'chat' | 'review' | 'faceid' | 'landed'>(entered ? 'chat' : 'home')
  const [pick, setPick] = useState<string | null>(null)
  const [stage, setStage] = useState<'ask' | 'done' | 'kept'>('ask')
  const [toast, setToast] = useState<null | { text: string; action?: string; onAction?: () => void }>(null)
  const open = where === 'chat' || where === 'review' || where === 'faceid'
  const next = pick === 'spread' ? `${day(firstFeb)} · ${eur(spread.new_monthly, 2)}` : pick === 'skip' ? `${day(firstFeb)} · ${eur(s.transfer, 2)}` : `${day(firstJan)} · ${eur(s.transfer, 2)}`
  const undo = () => { setStage('ask'); setPick(null); setToast({ text: `Undone. The plan is back to ${eur(s.transfer)} on ${day(firstJan)}.` }) }

  const reviewOverlay = (where === 'review' || where === 'faceid') && pick && pick !== 'keep' ? (
    <Screen label="Review change" title="Review change" sub="Drafted by AI · you approve" onBack={() => setWhere('chat')}
      dock={<><p className="caption muted">You can undo this until {day(firstJan)}. Calculated by the planner.</p>
        <div className="actions"><Button kind="secondary" grow onClick={() => setWhere('chat')}>Not now</Button><Button grow onClick={() => setWhere('faceid')}>Approve with Face ID</Button></div></>}>
      <h1 className="title">{pick === 'spread' ? `Skip the ${eur(s.transfer)} on ${day(firstJan)}, then move ${eur(spread.new_monthly)} a month from ${day(firstFeb)} to ${day(lastSep)}.` : `Skip the ${eur(s.transfer)} transfer on ${day(firstJan)}.`}</h1>
      <div className="card">
        <Row k={day(firstJan)} v={`Skipped · ${eur(0, 2)}`} />
        <Row k={`From ${day(firstFeb)}`} v={`${eur(pick === 'spread' ? spread.new_monthly : s.transfer, 2)} a month`} strong />
        <hr />
        <Row k="From" v={`${account.name} ··${last4}`} />
        <Row k="To" v={`Holiday · ${savingsName}`} />
        <Row k={`By ${day(lastSep)}`} v={`${eur(pick === 'spread' ? spread.total_by_deadline : skip.total_by_deadline)} saved`} />
      </div>
      <div className="card flat">
        <StatusBadge kind="warning">{pick === 'spread' ? 'Stretch' : 'Short of the plan'}</StatusBadge>
        <p>{pick === 'spread' ? `${eur(spread.new_monthly)} is more than you had left in ${shortAt}. If a month gets tight, I’ll check with you again.` : `That leaves you ${eur(skip.short_of_plan)} short of the plan by September. You can look at the gap again later.`}</p>
      </div>
      {where === 'faceid' && <FaceId onDone={() => { setStage('done'); setWhere('chat') }} />}
    </Screen>
  ) : null

  return (
    <>
      <Home masked toast={toast} recentTitle="Coming up" recent={[{ initial: s.bill.label[0], title: s.bill.label, sub: `Due ${day(s.bill.due)} · scheduled`, amount: -s.bill.amount }]}
        pill={stage === 'ask' ? { state: 'nudge', label: 'January looks short', action: 'Review' } : { state: 'idle' }}
        onOpen={() => setWhere('chat')}
        goal={{ saved: s.saved_now, goal: GOAL, highlight: where === 'landed',
          status: stage === 'ask' ? { kind: 'warning', label: 'Short this month' } : { kind: 'positive', label: 'Active' },
          line: stage === 'ask' ? `The ${eur(s.transfer)} on ${day(firstJan)} would dip into your buffer` : stage === 'kept' ? `Next transfer ${next} · ${eur(keep.buffer_dip)} from your buffer` : `${day(firstJan)} skipped · next transfer ${next}`,
          tone: stage === 'ask' ? 'warn' : 'muted' }} />
      <Sheet open={open} onClose={() => setWhere('home')} overlay={reviewOverlay} watch={[pick, stage]}>
        <div className="date-sep caption muted">29 Dec · 18:40</div>
        <AssistantMessage text={`Your ${eur(s.bill.amount)} ${s.bill.label.toLowerCase()} (due ${day(s.bill.due)}) leaves about ${eur(s.expected_left_estimate)} for January. The ${eur(s.transfer)} transfer on ${day(firstJan)} would dip into your buffer. Change January?`}>
          <div className="card">
            <div className="row-between"><span className="body-strong">Holiday · {eur(s.saved_now)} saved</span><StatusBadge kind="warning">Short this month</StatusBadge></div>
            <p className="estimate caption">January left after bills: about {eur(s.expected_left_estimate)} (estimate from Aug–Oct)</p>
            <OptionList label="Ways to handle January" options={options} picked={pick} onPick={(id) => stage === 'ask' && setPick(id)} />
            <p className="caption muted">I won’t pick for you. Whatever you choose can be undone until {day(firstJan)}.</p>
            {stage === 'ask' && <Button disabled={!pick} onClick={() => pick === 'keep' ? setStage('kept') : setWhere('review')}>{pick === 'keep' ? 'Keep the plan' : 'Review change'}</Button>}
          </div>
        </AssistantMessage>
        {stage === 'kept' && <AssistantMessage text={`OK, nothing changes. The ${eur(s.transfer)} goes out on ${day(firstJan)} and ${eur(keep.buffer_dip)} will come from your buffer. I’ll check in again if February looks tight.`}><Button onClick={() => setWhere('landed')}>Done</Button></AssistantMessage>}
        {stage === 'done' && (
          <AssistantMessage text={pick === 'spread' ? `Done. January is skipped, and from ${day(firstFeb)} your plan moves ${eur(spread.new_monthly)} a month.` : `Done. January is skipped. From ${day(firstFeb)} it’s ${eur(s.transfer)} a month again.`}>
            <div className="card">
              <div className="row-between"><span className="body-strong">Holiday</span><StatusBadge kind="positive">Active</StatusBadge></div>
              <div className="row-baseline"><span className="amount">{eur(s.saved_now)}</span><span className="muted">of {eur(GOAL)}</span></div>
              <ProgressBar value={s.saved_now / GOAL} />
              <hr />
              <Row k={day(firstJan)} v="Skipped" />
              <Row k="Next transfer" v={next} />
              <p className="caption muted">Approved with Face ID · 29 Dec, 18:44</p>
            </div>
            <Button onClick={() => { setWhere('landed'); setToast({ text: `Change saved · undo until ${day(firstJan)}`, action: 'Undo', onAction: undo }) }}>Done</Button>
          </AssistantMessage>
        )}
      </Sheet>
    </>
  )
}
