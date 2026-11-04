import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent, type RefObject, type FormEvent } from 'react'

export type Album = {
  id: string
  title: string
  year: number
  cover: string
  disc?: string
  colors: [string, string]
  ink: string
  creator?: string
  detail?: string
  link?: string
}

export const ALBUMS: Album[] = [
  { id: 'playboi-carti', title: 'Playboi Carti', year: 2017, cover: 'https://coverartarchive.org/release/0d70a1d7-5465-4fa6-8520-9891527fbe6e/front-500', colors: ['#e9e9e9', '#8b9096'], ink: '#111' },
  { id: 'die-lit', title: 'Die Lit', year: 2018, cover: 'https://coverartarchive.org/release/c8cf2491-a79c-4b08-a2a8-9f365bb06047/front-500', colors: ['#ff58a8', '#35081f'], ink: '#fff' },
  { id: 'whole-lotta-red', title: 'Whole Lotta Red', year: 2020, cover: 'https://coverartarchive.org/release/c918c647-aa05-486d-8422-4f9c1751c9fc/front-500', colors: ['#e60f0f', '#2a0000'], ink: '#fff' },
  { id: 'music', title: 'MUSIC', year: 2025, cover: 'https://coverartarchive.org/release/63c43988-5c32-47d4-a36b-9691281e7bdc/front-500', colors: ['#2b2b2b', '#000000'], ink: '#fff' },
  { id: 'in-abundance', title: 'In Abundance', year: 2016, cover: 'https://coverartarchive.org/release/8e5ecbe3-7eb7-4012-942c-39bf73de26ff/front-500', colors: ['#8b8b8b', '#252525'], ink: '#fff' },
]

function placeholderArt(album: Album) {
  const [first, second] = album.colors
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${first}"/><stop offset="1" stop-color="${second}"/></linearGradient></defs><rect width="600" height="600" fill="url(#g)"/></svg>`
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`
}

const coverArt = (album: Album) => `url("${album.cover || `/covers/${album.id}.jpg`}"), ${placeholderArt(album)}`
const discArt = (album: Album) => album.disc ? `url("${album.disc}"), ${placeholderArt(album)}` : coverArt(album)
const holeMask = 'radial-gradient(circle at center, transparent 0 8.5%, #000 9%)'

function CdCase({
  album, size, rotX = 0, rotY = 0, open = false, discOut = false,
  discAngle = 0, dragging = false, onDiscDown, discRef,
}: {
  album: Album
  size: number
  rotX?: number
  rotY?: number
  open?: boolean
  discOut?: boolean
  discAngle?: number
  dragging?: boolean
  onDiscDown?: (event: PointerEvent<HTMLDivElement>) => void
  discRef?: RefObject<HTMLDivElement | null>
}) {
  const depth = Math.round(size * 0.11)
  const diameter = size * 0.88
  const face = (extra: CSSProperties): CSSProperties => ({
    position: 'absolute', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', ...extra,
  })
  const plastic = 'linear-gradient(135deg, rgba(255,255,255,.2), rgba(255,255,255,.025) 40%, rgba(0,0,0,.25))'

  return (
    <div className="cd-case-object" style={{
      width: size, height: size, transformStyle: 'preserve-3d',
      transform: `translateX(${open ? size * 0.36 : 0}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
      transition: dragging ? 'none' : 'transform .6s cubic-bezier(.2,.8,.2,1)',
    }}>
      <div style={face({ inset: 0, transform: `translateZ(${-depth / 2}px) rotateY(180deg)`, background: '#151515', backgroundImage: plastic })} />
      <div style={face({ inset: 0, transform: `translateZ(${-depth / 2}px)`, background: '#1c1c1e' })} />
      <div style={{ position: 'absolute', inset: size * 0.04, transform: `translateZ(${-depth / 2 + 2}px)`, background: '#26262a', borderRadius: 4, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.06)' }} />
      <div style={{ position: 'absolute', left: size / 2 - size * 0.07, top: size / 2 - size * 0.07, width: size * 0.14, height: size * 0.14, borderRadius: '50%', transform: `translateZ(${-depth / 2 + 3}px)`, background: 'radial-gradient(circle, #111 0 35%, #3a3a40 38% 100%)' }} />
      <div style={face({ width: depth, height: size, left: -depth / 2, transform: 'rotateY(-90deg)', background: `linear-gradient(90deg, ${album.colors[1]}, #0a0a0a)`, backfaceVisibility: 'visible' })} />
      <div style={face({ width: depth, height: size, left: size - depth / 2, transform: 'rotateY(90deg)', background: '#0e0e0f', backfaceVisibility: 'visible' })} />
      <div style={face({ width: size, height: depth, top: -depth / 2, transform: 'rotateX(90deg)', background: '#0e0e0f', backfaceVisibility: 'visible' })} />
      <div style={face({ width: size, height: depth, top: size - depth / 2, transform: 'rotateX(-90deg)', background: '#0e0e0f', backfaceVisibility: 'visible' })} />

      <div ref={discRef} onPointerDown={open ? onDiscDown : undefined} className="cd-case-disc" style={{
        left: size / 2 - diameter / 2, top: size / 2 - diameter / 2, width: diameter, height: diameter,
        pointerEvents: open ? 'auto' : 'none', cursor: open ? 'grab' : 'default',
        transform: discOut ? `translate3d(0, ${-size * 0.64}px, ${depth * 1.4}px)` : `translateZ(${-depth / 2 + 6}px)`,
        transition: 'transform .7s cubic-bezier(.2,.8,.2,1)', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.45))',
      }}>
        <div className="cd-case-disc-art" style={{ backgroundImage: discArt(album), transform: `rotate(${discAngle}deg)`, WebkitMaskImage: holeMask, maskImage: holeMask }} />
        <div className="cd-case-disc-sheen" />
        <div className="cd-case-disc-iridescence" />
        <div className="cd-case-disc-hub" />
        <div className="cd-case-disc-rim" />
      </div>

      <div className="cd-case-lid" style={{ transform: `translateZ(${depth / 2}px) rotateY(${open ? -138 : 0}deg)` }}>
        <div className="cd-case-lid-front" style={{ backgroundImage: coverArt(album) }}>
          <span className="cd-case-lid-gloss" /><span className="cd-case-lid-spine" />
        </div>
        <div className="cd-case-lid-inside" style={{ backgroundImage: plastic }} />
      </div>
    </div>
  )
}

function ShelfItem({ album, onOpen }: { album: Album; onOpen: (album: Album) => void }) {
  const [tilt, setTilt] = useState({ x: 0, y: -22, active: false })
  const size = 174
  const onMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'touch') return
    const rect = event.currentTarget.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width - 0.5
    const py = (event.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: -py * 22, y: px * 44 - 12, active: true })
  }
  return (
    <button type="button" className="cd-shelf-item" onClick={() => onOpen(album)} onPointerMove={onMove}
      onPointerLeave={() => setTilt({ x: 0, y: -22, active: false })} aria-label={`Open ${album.title}${album.creator ? `, ${album.creator}` : ', by Playboi Carti'}`}>
      <span className="cd-shelf-case-shadow"><CdCase album={album} size={size} rotX={tilt.x} rotY={tilt.y} dragging={tilt.active} /></span>
      <span className="cd-shelf-item-copy">
        <strong>{album.title}</strong><span>{album.creator || 'PLAYBOI CARTI'}</span>
        <small>{album.detail || `${album.year} · ${album.year === 2016 || album.year === 2017 ? 'MIXTAPE' : 'ALBUM'}`}</small>
      </span>
    </button>
  )
}

function Viewer({ album, onClose, onRemove }: { album: Album; onClose: () => void; onRemove?: () => void }) {
  const [size, setSize] = useState(() => Math.min(330, (typeof window !== 'undefined' ? window.innerWidth : 400) * 0.62))
  const [rotation, setRotation] = useState({ x: -8, y: -24 })
  const [open, setOpen] = useState(false)
  const [discOut, setDiscOut] = useState(false)
  const [angle, setAngle] = useState(0)
  const [dragging, setDragging] = useState(false)
  const discRef = useRef<HTMLDivElement>(null)
  const velocity = useRef(0)
  const angleRef = useRef(0)
  const discDrag = useRef<{ last: number } | null>(null)
  const caseDrag = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null)

  useEffect(() => {
    const resize = () => setSize(Math.min(330, window.innerWidth * 0.62))
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('resize', resize)
    window.addEventListener('keydown', keydown)
    return () => { window.removeEventListener('resize', resize); window.removeEventListener('keydown', keydown) }
  }, [onClose])

  useEffect(() => {
    let frame = 0
    const tick = () => {
      if (!discDrag.current && Math.abs(velocity.current) > 0.02) {
        angleRef.current += velocity.current
        velocity.current *= 0.975
        setAngle(angleRef.current)
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  const pointerAngle = (event: PointerEvent<HTMLDivElement>) => {
    const rect = discRef.current?.getBoundingClientRect()
    if (!rect) return 0
    return Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2)) * 180 / Math.PI
  }
  const onDiscDown = (event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    discDrag.current = { last: pointerAngle(event) }
    velocity.current = 0
  }
  const onDiscMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!discDrag.current) return
    const current = pointerAngle(event)
    let delta = current - discDrag.current.last
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    discDrag.current.last = current
    angleRef.current += delta
    velocity.current = delta
    setAngle(angleRef.current)
  }
  const onStageDown = (event: PointerEvent<HTMLDivElement>) => {
    caseDrag.current = { x: event.clientX, y: event.clientY, rx: rotation.x, ry: rotation.y }
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onStageMove = (event: PointerEvent<HTMLDivElement>) => {
    if (discDrag.current) { onDiscMove(event); return }
    const start = caseDrag.current
    if (!start) return
    setRotation({
      x: Math.max(-60, Math.min(60, start.rx - (event.clientY - start.y) * 0.4)),
      y: start.ry + (event.clientX - start.x) * 0.5,
    })
  }
  const onStageUp = () => { caseDrag.current = null; discDrag.current = null; setDragging(false) }
  const toggleOpen = () => {
    if (open) setDiscOut(false)
    setOpen(value => !value)
    if (!open) setRotation({ x: -6, y: -14 })
  }
  const spin = () => { velocity.current = 18 }

  return (
    <div className="cd-shelf-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <section className="cd-shelf-viewer" role="dialog" aria-modal="true" aria-label={album.title + ' CD case'}>
        <button type="button" className="cd-shelf-close" onClick={onClose} aria-label="Close viewer">×</button>
        <div className="cd-shelf-stage" onPointerDown={onStageDown} onPointerMove={onStageMove} onPointerUp={onStageUp} onPointerCancel={onStageUp}>
          <CdCase album={album} size={size} rotX={rotation.x} rotY={rotation.y} open={open} discOut={discOut}
            discAngle={angle} dragging={dragging} onDiscDown={onDiscDown} discRef={discRef} />
        </div>
        <div className="cd-shelf-viewer-meta"><strong>{album.title}</strong><span>{album.creator || 'PLAYBOI CARTI'}</span><small>{album.detail || album.year}</small></div>
        <div className="cd-shelf-controls">
          <button type="button" className={open ? 'is-active' : ''} onClick={toggleOpen}>{open ? 'Close case' : 'Open case'}</button>
          <button type="button" disabled={!open} className={discOut ? 'is-active' : ''} onClick={() => setDiscOut(value => !value)}>{discOut ? 'Put disc back' : 'Pull disc out'}</button>
          <button type="button" disabled={!open} onClick={spin}>Spin disc</button>
          {album.link && <a className="cd-shelf-external-link" href={album.link} target="_blank" rel="noreferrer">Open on Roblox ↗</a>}
          {onRemove && <button type="button" className="cd-shelf-remove" onClick={onRemove}>Remove from shelf</button>}
        </div>
        <p className="cd-shelf-hint">Drag to turn the case. Open it, then drag the disc to spin it.</p>
      </section>
    </div>
  )
}

type ShelfCategory = 'Music' | 'Games' | 'Movies' | 'Anime' | 'Shows' | 'Books'
type RobloxGame = { placeId: string; universeId: number; name: string; playing: number; image: string; url: string }

const CATEGORIES: ShelfCategory[] = ['Music', 'Games', 'Movies', 'Anime', 'Shows', 'Books']
const ROBLOX_PROXY = 'https://proxy.cors.dev/'
const readRobloxJson = async (url: string) => {
  const response = await fetch(ROBLOX_PROXY + url)
  if (!response.ok) throw new Error('Roblox returned an error. Try again in a moment.')
  return response.json()
}
const getPlaceId = (input: string) => {
  let url: URL
  try { url = new URL(input.trim()) } catch { throw new Error('Paste a valid Roblox game link.') }
  if (!/(^|\.)roblox\.com$/i.test(url.hostname)) throw new Error('That link does not look like a Roblox game URL.')
  const match = url.pathname.match(/\/games\/(\d+)/i)
  if (!match) throw new Error('Use a link in the format roblox.com/games/123456789/...') 
  return match[1]
}
async function fetchRobloxGame(input: string): Promise<RobloxGame> {
  const placeId = getPlaceId(input)
  const universe = await readRobloxJson('https://apis.roblox.com/universes/v1/places/' + placeId + '/universe')
  if (!universe?.universeId) throw new Error('Could not find that Roblox experience.')
  const [details, icons] = await Promise.all([
    readRobloxJson('https://games.roblox.com/v1/games?universeIds=' + universe.universeId),
    readRobloxJson('https://thumbnails.roblox.com/v1/games/icons?universeIds=' + universe.universeId + '&size=512x512&format=Png&isCircular=false'),
  ])
  const game = details?.data?.[0]
  if (!game) throw new Error('Roblox did not return details for that experience.')
  return {
    placeId, universeId: universe.universeId, name: game.name, playing: Number(game.playing) || 0,
    image: icons?.data?.[0]?.imageUrl || '', url: 'https://www.roblox.com/games/' + placeId,
  }
}

function gameAsAlbum(game: RobloxGame): Album {
  return {
    id: 'roblox-' + game.placeId,
    title: game.name,
    year: 0,
    cover: game.image || '',
    colors: ['#30303a', '#101014'],
    ink: '#fff',
    creator: 'ROBLOX EXPERIENCE',
    detail: game.playing.toLocaleString() + ' PLAYING',
    link: game.url,
  }
}

function GamesShelf() {
  const [games, setGames] = useState<RobloxGame[]>(() => {
    try {
      const saved = localStorage.getItem('memento-roblox-shelf')
      return saved ? JSON.parse(saved) as RobloxGame[] : []
    } catch { return [] }
  })
  const [link, setLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    try { localStorage.setItem('memento-roblox-shelf', JSON.stringify(games)) }
    catch { /* storage may be unavailable */ }
  }, [games])

  const refreshCounts = useCallback(async () => {
    if (!games.length) return
    try {
      const response = await readRobloxJson('https://games.roblox.com/v1/games?universeIds=' + games.map(g => g.universeId).join(','))
      const counts = new Map<number, number>((response?.data || []).map((g: { id: number; playing: number }) => [g.id, Number(g.playing) || 0]))
      setGames(current => current.map(game => counts.has(game.universeId) ? { ...game, playing: counts.get(game.universeId)! } : game))
    } catch { /* preserve saved counts while Roblox is unavailable */ }
  }, [games])

  useEffect(() => {
    if (!games.length) return
    const timer = window.setInterval(refreshCounts, 60000)
    return () => window.clearInterval(timer)
  }, [games.length, refreshCounts])

  const addGame = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const game = await fetchRobloxGame(link)
      if (games.some(existing => existing.universeId === game.universeId)) throw new Error('That game is already on your shelf.')
      setGames(current => [...current, game])
      setLink('')
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not add that game.') }
    finally { setLoading(false) }
  }

  const selectedGame = games.find(game => game.universeId === selectedId) || null
  const selectedAlbum = selectedGame ? gameAsAlbum(selectedGame) : null

  return <div className="shelf-games">
    <form className="shelf-game-add" onSubmit={addGame}>
      <div><strong>Add a Roblox experience</strong><span>Paste a Roblox game link to add its cover and live player count.</span></div>
      <div className="shelf-game-input-row"><input value={link} onChange={event => setLink(event.target.value)} placeholder="https://www.roblox.com/games/…" aria-label="Roblox game link"/>
        <button type="submit" disabled={loading || !link.trim()}>{loading ? 'Adding…' : 'Add game'}</button></div>
      {error && <p role="alert">{error}</p>}
    </form>
    {games.length ? <div className="cd-shelf-grid">{games.map(game => <ShelfItem key={game.universeId} album={gameAsAlbum(game)} onOpen={() => setSelectedId(game.universeId)}/>)}</div>
      : <div className="shelf-empty"><div className="shelf-empty-case"><span>ROBLOX</span></div><strong>Your game shelf is empty</strong><span>Add a Roblox experience using its link above.</span></div>}
    {selectedAlbum && <Viewer key={selectedAlbum.id} album={selectedAlbum} onClose={() => setSelectedId(null)}
      onRemove={() => { setGames(current => current.filter(game => game.universeId !== selectedId)); setSelectedId(null) }}/>}
  </div>
}

function EmptyMediaShelf({ category }: { category: ShelfCategory }) {
  const initials: Record<ShelfCategory,string> = {Music:'CD',Games:'GAME',Movies:'FILM',Anime:'ANIME',Shows:'TV',Books:'BOOK'}
  return <div className="shelf-empty"><div className="shelf-empty-case"><span>{initials[category]}</span></div><strong>Your {category.toLowerCase()} shelf is empty</strong><span>There's nothing here yet. This shelf is ready for your collection.</span></div>
}

export default function CdShelf() {
  const [category, setCategory] = useState<ShelfCategory>('Music')
  const [selected, setSelected] = useState<Album | null>(null)
  const close = useCallback(() => setSelected(null), [])
  return <section className="cd-shelf">
    <div className="cd-shelf-heading"><div><span className="eyebrow">THE COLLECTION</span><h2>Shelves</h2><p>A little space for the things you enjoy.</p></div></div>
    <nav className="shelf-category-tabs" aria-label="Shelf categories">
      {CATEGORIES.map(item => <button type="button" key={item} className={category===item?'active':''} onClick={() => {setCategory(item);setSelected(null)}}>{item}</button>)}
    </nav>
    {category === 'Music' ? <>
      <div className="cd-shelf-subheading"><strong>Music</strong><span>{ALBUMS.length} records</span></div>
      <div className="cd-shelf-grid">{ALBUMS.map(album => <ShelfItem key={album.id} album={album} onOpen={setSelected}/>)}</div>
      {selected && <Viewer key={selected.id} album={selected} onClose={close}/>}
    </> : category === 'Games' ? <>
      <div className="cd-shelf-subheading"><strong>Games</strong><span>ROBLOX EXPERIENCES</span></div>
      <GamesShelf/>
    </> : <><div className="cd-shelf-subheading"><strong>{category}</strong><span>YOUR COLLECTION</span></div><EmptyMediaShelf category={category}/></>}
  </section>
}
