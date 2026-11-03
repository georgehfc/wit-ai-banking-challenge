// Screen stubs from plan/04 section 4. Content and layout follow George's Figma screens;
// these stubs only wire the planner numbers each screen must show.
import { data, eur } from '../data'

export type Screen = { id: string; title: string; mustShow: string[] }

const p = data.plan
export const screens: Screen[] = [
  { id: '01', title: 'Intent', mustShow: ['"I want to…" input', '3 shortcuts: Save for something · Where did my money go · Check a message', 'AI label'] },
  { id: '02', title: 'Understanding', mustShow: [`Margins: ${data.picture.map((m) => eur(m.margin)).join(' / ')}`, `Fixed costs: ${eur(data.fixed_avg)}`, 'Steps ticking'] },
  { id: '03', title: 'Recommendation', mustShow: [`Buffer ${eur(data.buffer.balance)} kept`, `Needs ${eur(p.needed_for_full_goal)} a month = stretch`, `${eur(p.monthly)} + ${eur(p.christmas_share)} → ${eur(p.total_by_deadline)}`, `Gap ${eur(p.gap)}`] },
  { id: '04', title: 'Adjust (state change)', mustShow: [`${eur(p.monthly)} → new value: re-run planner with --monthly`, 'Chat line and slider update together'] },
  { id: '04b', title: 'Gap', mustShow: data.gap_options.map((g) => `${g.label}${g.certain ? '' : ' (uncertain)'}`) },
  { id: '05', title: 'Review', mustShow: [`${eur(p.monthly)} monthly · Conta à ordem → Holiday`, `First transfer ${p.first_transfer} · ${p.transfers} transfers`, 'Pause any time · Face ID'] },
  { id: '06', title: 'Confirmation', mustShow: [`Goal created · next transfer ${p.first_transfer}`, 'Christmas reminder', 'Pause / Revert'] },
  { id: '07', title: 'Handoff (optional)', mustShow: ['Credit question → HandoffCard'] },
]

export function ScreenStub({ screen }: { screen: Screen }) {
  return (
    <div className="stub">
      <p className="stub-id">{screen.id}</p>
      <h1 className="stub-title">{screen.title}</h1>
      <ul className="stub-list">{screen.mustShow.map((m) => <li key={m}>{m}</li>)}</ul>
      <p className="stub-note">Stub. Build this screen from the Figma frame.</p>
    </div>
  )
}
