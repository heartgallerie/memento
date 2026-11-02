import { useEffect, useMemo, useState } from 'react'
import { BookOpen, CalendarDays, Search, UserRound, Settings, Sparkles, Plus, ChevronLeft, ChevronRight, MoreHorizontal, PanelLeftClose, Archive, Clock3, Check, ArrowUpRight, FilePlus2, Command } from 'lucide-react'

type Entry = { id: number; title: string; date: string; preview: string; body: string; tag?: string }
const initialEntries: Entry[] = [
  { id: 1, title: 'a quiet kind of progress', date: '2026-11-02', preview: 'Some things are changing so slowly that I almost miss them.', body: 'Some things are changing so slowly that I almost miss them.\n\nI think I am learning to let a day be a day without needing to turn it into something bigger. There is still a lot I want to do, but maybe it is okay to take things one at a time.\n\nA small note to remember this feeling.', tag: 'personal' },
  { id: 2, title: 'things worth keeping', date: '2026-10-30', preview: 'A list of little things I want to remember.', body: 'A list of little things I want to remember.\n\n- The light in the late afternoon\n- A song that finds you at the right time\n- Conversations that do not need to go anywhere\n- Making something just because', tag: 'notes' },
  { id: 3, title: 'on making things', date: '2026-10-26', preview: 'I want to make more things without worrying about where they lead.', body: 'I want to make more things without worrying about where they lead.\n\nThe process should be allowed to be enough sometimes. Start small, follow an idea, see what happens.', tag: 'creative' },
  { id: 4, title: 'sunday afternoon', date: '2026-10-19', preview: 'A slow afternoon, with nowhere in particular to be.', body: 'A slow afternoon, with nowhere in particular to be. The kind of day that feels like a page with plenty of space left on it.', tag: 'personal' },
]
const nav = [
  { label: 'Journal', icon: BookOpen }, { label: 'Calendar', icon: CalendarDays },
  { label: 'Archive', icon: Archive }, { label: 'Profile', icon: UserRound },
]
const fmt = (date: string) => new Date(date + 'T12:00:00').toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })

export default function App() {
  const [entries, setEntries] = useState<Entry[]>(() => {
    try { const saved = localStorage.getItem('memento.entries'); return saved ? JSON.parse(saved) : initialEntries } catch { return initialEntries }
  })
  const [activeId, setActiveId] = useState<number>(entries[0]?.id ?? 1)
  const [section, setSection] = useState('Journal')
  const [query, setQuery] = useState('')
  const [showMemo, setShowMemo] = useState(false)
  const [memoText, setMemoText] = useState('')
  const [draftTitle, setDraftTitle] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const [saved, setSaved] = useState(true)
  const active = entries.find(e => e.id === activeId)
  useEffect(() => { localStorage.setItem('memento.entries', JSON.stringify(entries)) }, [entries])
  useEffect(() => {
    if (!active) return
    setDraftTitle(active.title); setDraftBody(active.body); setSaved(true)
  }, [activeId])
  const filtered = useMemo(() => entries.filter(e => (e.title + ' ' + e.preview + ' ' + e.body).toLowerCase().includes(query.toLowerCase())), [entries, query])
  const updateEntry = () => {
    if (!active) return
    setEntries(all => all.map(e => e.id === active.id ? { ...e, title: draftTitle || 'untitled', preview: draftBody.slice(0, 92), body: draftBody } : e))
    setSaved(true)
  }
  const createEntry = () => {
    const e: Entry = { id: Date.now(), title: 'untitled', date: new Date().toISOString().slice(0,10), preview: '', body: '' }
    setEntries(all => [e, ...all]); setActiveId(e.id); setSection('Journal'); setDraftTitle(''); setDraftBody(''); setSaved(true)
  }
  const chooseSection = (label: string) => { setSection(label); setShowMemo(false) }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">m.</div><span>memento</span><button className="icon-btn sidebar-toggle" aria-label="Collapse sidebar"><PanelLeftClose size={17}/></button></div>
      <button className="new-entry" onClick={createEntry}><Plus size={16}/> <span>New entry</span><kbd>⌘ N</kbd></button>
      <div className="nav-label">WORKSPACE</div>
      <nav>{nav.map(item => <button key={item.label} className={section === item.label ? 'nav-item active' : 'nav-item'} onClick={() => chooseSection(item.label)}><item.icon size={17}/>{item.label}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="nav-label">ASSISTANT</div>
        <button className={showMemo ? 'nav-item active' : 'nav-item'} onClick={() => setShowMemo(v => !v)}><Sparkles size={17}/>Memo<span className="soon-dot"/></button>
        <button className="nav-item" onClick={() => chooseSection('Settings')}><Settings size={17}/>Settings</button>
        <div className="storage-card"><div className="storage-icon"><LockIcon/></div><div><strong>Your space</strong><span>Stored on this device</span></div><span className="local-dot"/></div>
        <div className="user-row"><div className="avatar">M</div><div><strong>Local workspace</strong><span>Personal space</span></div><MoreHorizontal size={18}/></div>
      </div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="breadcrumbs"><span>Workspace</span><span className="slash">/</span><strong>{showMemo ? 'Memo' : section}</strong></div><div className="top-actions"><div className="saved-state"><span className="green-dot"/>{saved ? 'All changes saved' : 'Unsaved changes'}</div><button className="avatar small">M</button></div></header>
      {showMemo ? <section className="memo-view"><div className="memo-heading"><div className="eyebrow"><Sparkles size={14}/> YOUR AI COMPANION</div><h1>What’s on your mind?</h1><p>Memo will be able to search your archive, help you reflect, and prepare changes for your approval.</p></div><div className="memo-empty"><div className="sparkle-large"><Sparkles size={24}/></div><strong>Memo is not connected yet</strong><span>We'll connect your chosen AI model after the journal foundation is in place.</span><div className="suggestions"><button onClick={() => setMemoText('What have I been writing about lately?')}>What have I been writing about lately?</button><button onClick={() => setMemoText('Help me organise my thoughts.')}>Help me organise my thoughts</button></div></div><div className="memo-composer"><input value={memoText} onChange={e => setMemoText(e.target.value)} placeholder="Ask Memo anything…" onKeyDown={e => e.key === 'Enter' && setMemoText('')}/><button aria-label="Send message" onClick={() => setMemoText('')}><ArrowUpRight size={18}/></button></div><p className="fine-print">Memo responses and editing tools will be added in a later milestone.</p></section>
      : section === 'Journal' ? <div className="journal-layout">
        <section className="entry-list"><div className="section-heading"><div><div className="eyebrow">YOUR SPACE</div><h1>Journal</h1><p>A place to leave your thoughts.</p></div><button className="square-btn" onClick={createEntry}><Plus size={18}/></button></div><div className="search-box"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search entries…"/><kbd>/</kbd></div><div className="list-meta"><span>RECENT ENTRIES</span><span>{filtered.length} entries</span></div><div className="entries">{filtered.map(entry => <button key={entry.id} className={entry.id === activeId ? 'entry-card selected' : 'entry-card'} onClick={() => setActiveId(entry.id)}><div className="entry-date">{fmt(entry.date)}</div><strong>{entry.title || 'untitled'}</strong><p>{entry.preview || 'A new page, waiting for you…'}</p><div className="entry-foot">{entry.tag && <span className="tag">{entry.tag}</span>}<span>{entry.body.trim().split(/\s+/).filter(Boolean).length} words</span></div></button>)}</div><button className="view-archive" onClick={() => chooseSection('Archive')}>View all entries <ChevronRight size={15}/></button></section>
        <section className="editor-area">{active ? <><div className="editor-toolbar"><div className="editor-date"><CalendarDays size={15}/>{fmt(active.date)}</div><div className="toolbar-actions"><span className="autosave"><span className="green-dot"/>{saved ? 'Saved' : 'Editing'}</span><button className="icon-btn"><MoreHorizontal size={19}/></button></div></div><div className="editor-content"><div className="entry-kicker">PERSONAL JOURNAL <span>·</span> {fmt(active.date).toUpperCase()}</div><input className="title-input" value={draftTitle} onChange={e => {setDraftTitle(e.target.value);setSaved(false)}} placeholder="Give this entry a title…"/><textarea className="body-input" value={draftBody} onChange={e => {setDraftBody(e.target.value);setSaved(false)}} placeholder="Start writing…" spellCheck/><div className="editor-footer"><span>{draftBody.trim().split(/\s+/).filter(Boolean).length} words</span><button className="save-btn" disabled={saved} onClick={updateEntry}><Check size={15}/> Save changes</button></div></div></> : <div className="empty-editor"><FilePlus2 size={26}/><strong>No entry selected</strong><button onClick={createEntry}>Create an entry</button></div>}</section>
      </div> : <section className="placeholder-view"><div className="eyebrow">WORKSPACE</div><h1>{section}</h1><p>{section === 'Calendar' ? 'A calendar view of your writing will live here.' : section === 'Archive' ? 'Your imported journals and older entries will be organised here.' : section === 'Profile' ? 'An editable profile of the information you choose to keep.' : 'Application preferences and data controls.'}</p><div className="placeholder-card"><Clock3 size={19}/><div><strong>{section} is coming next</strong><span>We're building the journal experience first. This section will follow.</span></div></div></section>}
    </main>
  </div>
}
function LockIcon() { return <span className="lock-shape">⌑</span> }