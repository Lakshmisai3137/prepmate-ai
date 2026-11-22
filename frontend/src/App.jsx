import { useEffect, useRef, useState } from 'react'
import './App.css'

const subjects = [
  { id: 'ALL', label: 'All Subjects', icon: 'grid', placeholder: 'What would you like to understand?' },
  { id: 'OS', label: 'Operating Systems', icon: 'cpu', placeholder: 'Ask about deadlocks, paging, or threads…' },
  { id: 'DBMS', label: 'Database Systems', icon: 'database', placeholder: 'Ask about ACID, indexes, or normalization…' },
  { id: 'CN', label: 'Computer Networks', icon: 'grid', placeholder: 'Ask about DNS, routing, or subnetting…' },
  { id: 'DSA', label: 'Data Structures & Algorithms', icon: 'code', placeholder: 'Ask about arrays, graph traversal, or dynamic programming…' },
  { id: 'JAVA', label: 'Java', icon: 'code', placeholder: 'Ask about the JVM, collections, or threads…' },
  { id: 'PYTHON', label: 'Python', icon: 'code', placeholder: 'Ask about generators, decorators, or memory management…' },
  { id: 'OOP', label: 'Object-Oriented Programming', icon: 'grid', placeholder: 'Ask about polymorphism, inheritance, or SOLID…' },
  { id: 'HR', label: 'HR & Behavioral', icon: 'message', placeholder: 'Ask about behavioral interviews or the STAR method…' },
]

const prompts = [
  { subject: 'OS', text: 'What are the four Coffman conditions for deadlock?' },
  { subject: 'DBMS', text: 'Explain the ACID properties in DBMS.' },
  { subject: 'OS', text: 'What is the difference between a process and a thread?' },
  { subject: 'DBMS', text: 'What is database normalization and 3NF?' },
  { subject: 'CN', text: 'What role does DNS play when you visit a website?' },
  { subject: 'DSA', text: 'How does breadth-first search find shortest paths?' },
  { subject: 'JAVA', text: 'What is the difference between a List and a Set?' },
  { subject: 'PYTHON', text: 'How does a generator save memory in Python?' },
  { subject: 'OOP', text: 'What is the single responsibility principle?' },
  { subject: 'HR', text: 'How do I structure a behavioral answer using STAR?' },
]

const pipeline = [
  { label: 'Retrieve', title: 'Vector search', detail: 'ChromaDB finds the passages in your notes that match your question.', icon: 'database' },
  { label: 'Synthesize', title: 'Grounded synthesis', detail: 'Llama 3.1 uses those passages to explain the concept in context.', icon: 'cpu' },
  { label: 'Cite', title: 'Page-level citations', detail: 'Trace each source back to the document and page it came from.', icon: 'pages' },
]

const paths = {
  bot: 'M12 4v3 M5 10q0-3 3-3h8q3 0 3 3v6q0 3-3 3H8q-3 0-3-3z M2.5 11.5v3 M21.5 11.5v3 M9 12v2 M15 12v2',
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  cpu: 'M7 5h10q2 0 2 2v10q0 2-2 2H7q-2 0-2-2V7q0-2 2-2z M9 9h6v6H9z M9 2v3 M15 2v3 M9 19v3 M15 19v3 M2 9h3 M2 15h3 M19 9h3 M19 15h3',
  database: 'M20 6c0 2-3.6 3.5-8 3.5S4 8 4 6s3.6-3.5 8-3.5S20 4 20 6z M4 6v12c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5V6 M4 12c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5',
  sun: 'M16 12a4 4 0 1 1-8 0 4 4 0 1 1 8 0z M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1.5 1.5 M17.5 17.5 19 19 M19 5l-1.5 1.5 M6.5 17.5 5 19',
  moon: 'M20.5 14A8.8 8.8 0 0 1 10 3.5 8.8 8.8 0 1 0 20.5 14Z',
  sparkle: 'M10 3c.8 5.6 2.4 7.2 7 8-4.6.8-6.2 2.4-7 8-.8-5.6-2.4-7.2-7-8 4.6-.8 6.2-2.4 7-8z M19 2v5 M16.5 4.5h5',
  message: 'M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5.5 3v-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M7 9h10 M7 13h6',
  send: 'm21 3-6.4 18-4.1-7.5L3 9.5 21 3z M10.5 13.5 21 3',
  enter: 'M19 5v7a3 3 0 0 1-3 3H5 M9 11l-4 4 4 4',
  close: 'm6 6 12 12 M18 6 6 18',
  copy: 'M9 8h10v13H9z M15 5V3H4v13h2',
  check: 'm4 12 5 5L20 6',
  pages: 'M8 3h8l4 4v12H8z M15 3v5h5 M5 7H3v15h12v-1 M11 12h6 M11 15h4',
  warning: 'm12 3 10 18H2L12 3z M12 9v5 M12 17v.2',
  code: 'm8 7-5 5 5 5 M16 7l5 5-5 5 M14 4l-4 16',
}

function Icon({ name, className = '' }) {
  return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}

function initialTheme() {
  try {
    const saved = localStorage.getItem('prepmate_theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* Storage can be unavailable in private browsing. */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function tilt(event) {
  if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const card = event.currentTarget
  const bounds = card.getBoundingClientRect()
  const x = (event.clientX - bounds.left) / bounds.width
  const y = (event.clientY - bounds.top) / bounds.height
  card.style.setProperty('--rx', `${(0.5 - y) * 5}deg`)
  card.style.setProperty('--ry', `${(x - 0.5) * 6}deg`)
  card.style.setProperty('--spot-x', `${x * 100}%`)
  card.style.setProperty('--spot-y', `${y * 100}%`)
}

const tiltEvents = {
  onPointerMove: tilt,
  onPointerLeave: ({ currentTarget }) => {
    currentTarget.style.removeProperty('--rx')
    currentTarget.style.removeProperty('--ry')
  },
}

function StudyBuddy({ mood }) {
  const stage = useRef(null)
  useEffect(() => {
    const scene = stage.current
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const clamp = (n) => Math.max(-1, Math.min(1, n))
    let frame = 0
    let cursor = null
    function paint() {
      frame = 0
      if (motion.matches) return
      const box = scene.getBoundingClientRect()
      if (box.bottom < 0) return
      const x = cursor ? clamp((cursor.x - box.left - box.width / 2) / (innerWidth / 2)) : 0
      const y = cursor ? clamp((cursor.y - box.top - box.height / 2) / (innerHeight / 2)) : 0
      scene.style.setProperty('--look-x', x.toFixed(3))
      scene.style.setProperty('--look-y', y.toFixed(3))
      scene.style.setProperty('--scroll', Math.min(scrollY / Math.max(box.height, 1), 1).toFixed(3))
    }
    function schedule() {
      if (!frame && !motion.matches) frame = requestAnimationFrame(paint)
    }
    function track(event) {
      if (event.pointerType === 'touch') return
      cursor = { x: event.clientX, y: event.clientY }
      schedule()
    }
    function reset() { cursor = null; schedule() }
    window.addEventListener('pointermove', track, { passive: true })
    document.documentElement.addEventListener('pointerleave', reset)
    window.addEventListener('scroll', schedule, { passive: true })
    schedule()
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', track)
      document.documentElement.removeEventListener('pointerleave', reset)
      window.removeEventListener('scroll', schedule)
    }
  }, [])

  return (
    <figure className="buddy-stage" ref={stage} data-mood={mood} aria-label="Pip, your interactive study buddy">
      <div className="scene-art" aria-hidden="true">
        <div className="mesh-halo" /><div className="orbit orbit-wide" /><div className="orbit orbit-inner" />
        <div className="floor-grid" /><div className="floor-shadow" />
        <div className="floating-code"><Icon name="code" /></div>
        <i className="spark spark-one" /><i className="spark spark-two" /><i className="floating-ball" />
        <div className="robot-anchor"><div className="robot-motion"><div className="robot">
          <div className="foot foot-left" /><div className="foot foot-right" />
          <div className="arm arm-left" /><div className="arm arm-right" />
          <div className="torso"><div className="chest-panel"><i /><i /><i /></div></div>
          <div className="robot-head">
            <div className="antenna"><i /></div><div className="ear ear-left" /><div className="ear ear-right" />
            <div className="helmet"><div className="visor"><div className="expression">
              <i className="eye eye-left" /><i className="eye eye-right" /><i className="smile" />
              <i className="cheek cheek-left" /><i className="cheek cheek-right" />
            </div></div></div>
          </div>
        </div></div></div>
      </div>
      <figcaption><span className="buddy-light" />PIP <span className="caption-divider">/</span> {mood === 'thinking' ? 'THINKING' : mood === 'happy' ? 'ANSWER READY' : 'STUDY BUDDY'}</figcaption>
    </figure>
  )
}

function Pipeline() {
  const section = useRef(null)
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view')
          observer.unobserve(entry.target)
        }
      }
    }, { threshold: 0.12 })
    section.current.querySelectorAll('.step-wrap').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
  return (
    <section id="how-it-works" ref={section} aria-labelledby="pipeline-heading">
      <div className="section-heading"><h2 id="pipeline-heading">How it works</h2><span className="heading-rule" /></div>
      <ol className="pipeline">
        {pipeline.map((step, i) => <li className={`step-wrap step-${i + 1}`} key={step.label} style={{ '--delay': `${i * 85}ms` }}>
          <div className="step-card tilt" {...tiltEvents}>
            <div className="step-top"><span className="step-tile"><Icon name={step.icon} /></span><span className="step-label">0{i + 1} / {step.label}</span></div>
            <h3>{step.title}</h3><p>{step.detail}</p>
          </div>
        </li>)}
      </ol>
    </section>
  )
}

function Answer({ result }) {
  const [feedback, setFeedback] = useState('')
  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(''), 2400)
    return () => clearTimeout(timer)
  }, [feedback])
  async function copy() {
    try {
      await navigator.clipboard.writeText(result.answer)
      setFeedback('Copied!')
    } catch {
      setFeedback('Select the answer to copy it manually.')
    }
  }
  return (
    <section className="results" aria-label="Question results">
      <div className="result-reveal"><article className="answer-card panel tilt" {...tiltEvents}>
        <div className="answer-header">
          <div><span className="small-label">{result.scope}</span><h2>Your answer</h2></div>
          <button className="copy-button" onClick={copy}><Icon name={feedback === 'Copied!' ? 'check' : 'copy'} />{feedback === 'Copied!' ? feedback : 'Copy answer'}</button>
        </div>
        <p className="submitted-question">{result.question}</p>
        <div className="answer-text">{result.answer}</div>
        <span role="status" className={feedback.startsWith('Select') ? 'copy-error' : 'sr-only'}>{feedback}</span>
      </article></div>
      <h3 className="sources-title"><Icon name="pages" /> Sources <span>({result.sources.length})</span></h3>
      {result.sources.length ? <ul className="citations">
        {result.sources.map((src, i) => <li className="result-reveal" key={i} style={{ '--delay': `${60 * (i + 1)}ms` }}>
          <div className="source-card tilt" {...tiltEvents}>
            <span className="source-file"><Icon name="pages" /></span>
            <div className="source-info"><span className="source-subject">{src.subject || 'General'}</span><strong title={src.source}>{src.source.split(/[\\/]/).pop() || src.source}</strong></div>
            <span className="page-badge">Page {src.page_number}</span>
          </div>
        </li>)}
      </ul> : <p className="no-sources">No source pages were returned for this answer.</p>}
    </section>
  )
}

export default function App() {
  const [theme, setTheme] = useState(initialTheme)
  const [selectedSubject, setSelectedSubject] = useState('ALL')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [connection, setConnection] = useState('idle')
  const input = useRef(null)
  const busy = useRef(false)
  const subject = subjects.find((item) => item.id === selectedSubject)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('prepmate_theme', theme) } catch { /* Keep the in-session preference. */ }
  }, [theme])

  function choosePrompt(text) {
    setQuery(text)
    input.current.focus()
  }

  async function handleAsk(event) {
    event.preventDefault()
    const question = query.trim()
    if (!question || busy.current) return
    busy.current = true
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const payload = { question, top_k: 2, subject: selectedSubject === 'ALL' ? null : selectedSubject }
      const response = await fetch('http://127.0.0.1:8000/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error(`The local API returned HTTP ${response.status}. Try asking again.`)
      const data = await response.json()
      if (typeof data?.answer !== 'string' || !data.answer.trim() || !Array.isArray(data.sources) ||
          !data.sources.every((src) => src && typeof src.source === 'string' && Number.isInteger(src.page_number))) {
        throw new Error('The local API returned an unreadable answer. Try asking again.')
      }
      setResult({ answer: data.answer, sources: data.sources, question, scope: subject.label })
      setConnection('ready')
    } catch (err) {
      const unreachable = err instanceof TypeError
      setConnection(unreachable ? 'offline' : 'error')
      setError(unreachable ? 'Couldn’t reach the local FastAPI server at 127.0.0.1:8000. Check that it’s running, then ask again.'
        : err instanceof SyntaxError ? 'The local API returned an unreadable response. Try asking again.' : err.message)
    } finally {
      busy.current = false
      setLoading(false)
    }
  }

  function onQuestionKey(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.nativeEvent.keyCode !== 229) {
      event.preventDefault()
      event.currentTarget.form.requestSubmit()
    }
  }

  const status = loading ? 'busy' : connection
  const statusText = { idle: 'Local stack configured', busy: 'Retrieving an answer', ready: 'Last request succeeded', offline: 'Local server unreachable', error: 'Last request failed' }[status]

  return (
    <div id="top" className="app">
      <a className="skip-link" href="#workspace">Skip to study desk</a>
      <header className="topbar"><div className="wrap nav-inner">
        <a className="brand" href="#top" aria-label="PrepMate AI home"><span className="brand-mark"><Icon name="bot" /></span><span>PrepMate <b>AI</b></span></a>
        <nav aria-label="Main navigation"><a href="#workspace">Study desk</a><a href="#how-it-works">How it works</a></nav>
        <div className="nav-tools">
          <span className="stack-badge" data-status={status} title={statusText}><i /><span>Llama 3.1 · ChromaDB</span><span className="sr-only"> — {statusText}</span></span>
          <button className="theme-button" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}><Icon name={theme === 'light' ? 'moon' : 'sun'} /></button>
        </div>
      </div></header>
      <main className="wrap">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy"><p className="eyebrow"><span /> AI PLACEMENT ASSISTANT</p>
            <h1 id="hero-title">Your placement<br /><em>prep companion.</em></h1>
            <p className="hero-description">Ask a technical or behavioral interview question. Get a clear explanation grounded in your own notes, with a page for every source.</p>
          </div>
          <StudyBuddy mood={loading ? 'thinking' : result ? 'happy' : 'idle'} />
        </section>

        <div id="workspace" className="desk">
          <section className="composer panel" aria-labelledby="ask-title">
            <div className="panel-heading"><span className="heading-icon"><Icon name="message" /></span><h2 id="ask-title">Ask PrepMate</h2></div>
            <div className="subject-pills" role="group" aria-label="Filter by subject">
              {subjects.map((item) => <button type="button" className="subject-pill tilt" key={item.id} title={item.label} aria-label={item.label} aria-pressed={selectedSubject === item.id} disabled={loading} onClick={() => setSelectedSubject(item.id)} {...tiltEvents}><Icon name={item.icon} />{item.id === 'ALL' ? item.label : item.id}</button>)}
            </div>
            <form onSubmit={handleAsk} className="question-box">
              <label className="sr-only" htmlFor="question">Your placement question</label>
              <textarea ref={input} id="question" rows="2" placeholder={subject.placeholder} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onQuestionKey} disabled={loading} />
              {query && !loading && <button className="clear" type="button" aria-label="Clear question" onClick={() => choosePrompt('')}><Icon name="close" /></button>}
              <div className="form-bottom"><span className="key-hint"><kbd><Icon name="enter" /></kbd> Enter to ask</span>
                <button className="ask-button" type="submit" disabled={loading || !query.trim()}>{loading ? <><i className="spinner" /> Thinking…</> : <><Icon name="send" /> Ask question</>}</button>
              </div>
            </form>
          </section>
          <aside className="prompt-panel panel" aria-labelledby="prompts-title">
            <div className="panel-heading"><span className="heading-icon coral"><Icon name="sparkle" /></span><h2 id="prompts-title">Try a question</h2></div>
            <div className="prompts">{prompts.filter((p) => selectedSubject === 'ALL' || p.subject === selectedSubject).map((p) =>
              <button className="prompt" key={p.text} onClick={() => choosePrompt(p.text)} disabled={loading}><span className={`prompt-tag tag-${p.subject}`}>{p.subject}</span><span>{p.text}</span></button>
            )}</div>
          </aside>
        </div>
        <div className="sr-only" role="status">{loading ? 'Thinking & Retrieving…' : result ? `Answer ready with ${result.sources.length} sources.` : ''}</div>
        {loading && <div className="notice loading-notice"><i className="spinner" /><div><strong>Thinking &amp; Retrieving…</strong><p>Finding relevant pages and preparing your explanation.</p></div></div>}
        {error && <div className="notice error-notice" role="alert"><Icon name="warning" /><div><strong>Couldn’t get an answer</strong><p>{error}</p></div></div>}
        {result && <Answer result={result} />}
        <Pipeline />
      </main>
      <footer className="wrap footer"><span><Icon name="bot" /> PrepMate AI</span><span>Local retrieval · Page-level citations</span></footer>
    </div>
  )
}
