import BookShelf from './BookShelf'
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
  ratio?: number
  tmdbId?: number
  mediaType?: 'movie' | 'tv'
  description?: string
}

export const ALBUMS: Album[] = []

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
  const ratio = album.ratio || 1
  const height = Math.round(size * ratio)
  const depth = Math.round(size * (ratio > 1 ? 0.1 : 0.11))
  const diameter = size * 0.88
  const pull = (height / 2 + diameter / 2) * 0.68
  const face = (extra: CSSProperties): CSSProperties => ({
    position: 'absolute', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', ...extra,
  })
  const plastic = 'linear-gradient(135deg, rgba(255,255,255,.2), rgba(255,255,255,.025) 40%, rgba(0,0,0,.25))'

  return (
    <div className="cd-case-object" style={{
      width: size, height, transformStyle: 'preserve-3d',
      transform: `translateY(${discOut ? Math.max(0, pull - (height / 2 - diameter / 2)) / 2 : 0}px) translateX(${open ? size * 0.36 : 0}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
      transition: dragging ? 'none' : 'transform .6s cubic-bezier(.2,.8,.2,1)',
    }}>
      <div style={face({ inset: 0, transform: `translateZ(${-depth / 2}px) rotateY(180deg)`, background: '#151515', backgroundImage: plastic })} />
      <div style={face({ inset: 0, transform: `translateZ(${-depth / 2}px)`, background: '#1c1c1e' })} />
      <div style={{ position: 'absolute', inset: size * 0.04, transform: `translateZ(${-depth / 2 + 2}px)`, background: '#26262a', borderRadius: 4, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.06)' }} />
      <div style={{ position: 'absolute', left: size / 2 - size * 0.07, top: height / 2 - size * 0.07, width: size * 0.14, height: size * 0.14, borderRadius: '50%', transform: `translateZ(${-depth / 2 + 3}px)`, background: 'radial-gradient(circle, #111 0 35%, #3a3a40 38% 100%)' }} />
      <div style={face({ width: depth, height, left: -depth / 2, transform: 'rotateY(-90deg)', background: `linear-gradient(90deg, ${album.colors[1]}, #0a0a0a)`, backfaceVisibility: 'visible' })} />
      <div style={face({ width: depth, height, left: size - depth / 2, transform: 'rotateY(90deg)', background: '#0e0e0f', backfaceVisibility: 'visible' })} />
      <div style={face({ width: size, height: depth, top: -depth / 2, transform: 'rotateX(90deg)', background: '#0e0e0f', backfaceVisibility: 'visible' })} />
      <div style={face({ width: size, height: depth, top: height - depth / 2, transform: 'rotateX(-90deg)', background: '#0e0e0f', backfaceVisibility: 'visible' })} />

      <div ref={discRef} onPointerDown={open ? onDiscDown : undefined} className="cd-case-disc" style={{
        left: size / 2 - diameter / 2, top: height / 2 - diameter / 2, width: diameter, height: diameter,
        pointerEvents: open ? 'auto' : 'none', cursor: open ? 'grab' : 'default',
        transform: discOut ? `translate3d(0, ${-pull}px, ${depth * 1.4}px)` : `translateZ(${-depth / 2 + 6}px)`,
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
        <strong>{album.title}</strong><span>{album.creator || ''}</span>
        <small>{album.detail || `${album.year} · ${album.year === 2016 || album.year === 2017 ? 'MIXTAPE' : 'ALBUM'}`}</small>
      </span>
    </button>
  )
}

function Viewer({ album, onClose, onRemove, onEdit }: { album: Album; onClose: () => void; onRemove?: () => void; onEdit?: () => void }) {
  const ratio = album.ratio || 1
  const [size, setSize] = useState(() => Math.max(140, Math.min(330, (typeof window !== 'undefined' ? window.innerWidth : 400) * 0.62, ((typeof window !== 'undefined' ? window.innerHeight : 750) - 250) / (ratio + 0.55))))
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
    const resize = () => setSize(Math.max(140, Math.min(340, window.innerWidth * 0.62, (window.innerHeight - 250) / (ratio + 0.55))))
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('resize', resize)
    window.addEventListener('keydown', keydown)
    return () => { window.removeEventListener('resize', resize); window.removeEventListener('keydown', keydown) }
  }, [onClose, ratio])

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
        <div className="cd-shelf-viewer-meta"><strong>{album.title}</strong><span>{album.creator || ''}</span><small>{album.detail || album.year}</small>{album.description && <p className="cd-shelf-viewer-description">{album.description}</p>}</div>
        <div className="cd-shelf-controls">
          <button type="button" className={open ? 'is-active' : ''} onClick={toggleOpen}>{open ? 'Close case' : 'Open case'}</button>
          <button type="button" disabled={!open} className={discOut ? 'is-active' : ''} onClick={() => setDiscOut(value => !value)}>{discOut ? 'Put disc back' : 'Pull disc out'}</button>
          <button type="button" disabled={!open} onClick={spin}>Spin disc</button>
          {album.link && <a className="cd-shelf-external-link" href={album.link} target="_blank" rel="noreferrer">Open link ↗</a>}
          {onEdit && <button type="button" onClick={onEdit}>Edit details</button>}{onRemove && <button type="button" className="cd-shelf-remove" onClick={onRemove}>Remove from shelf</button>}
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


type KitsuAnimeResult = { id:string; attributes:{ canonicalTitle?:string; titles?:{en?:string|null;en_jp?:string|null;ja_jp?:string|null}; startDate?:string|null; synopsis?:string|null; posterImage?:{small?:string;medium?:string;large?:string}|null; subtype?:string|null } }
type TMDBShelfResult = {
  id:number; title?:string; name?:string; overview?:string; media_type?:string; original_language?:string; genre_ids?:number[]
  release_date?:string; first_air_date?:string; poster_path?:string|null; backdrop_path?:string|null
}
const TMDB_POSTER='https://image.tmdb.org/t/p/w500'
function MovieTvShelf({category}:{category:'Movies'|'Shows'|'Anime'}){
  const mediaType=category==='Movies'?'movie':'tv'
  const storageKey='memento.shelf.'+(category==='Anime'?'anime':mediaType)
  const [items,setItems]=useState<Album[]>(()=>{try{return JSON.parse(localStorage.getItem(storageKey)||'[]') as Album[]}catch{return []}})
  const [query,setQuery]=useState('')
  const [results,setResults]=useState<(TMDBShelfResult|KitsuAnimeResult)[]>([])
  const [loading,setLoading]=useState(false)
  const [hasSearched,setHasSearched]=useState(false)
  const [error,setError]=useState('')
  const [selected,setSelected]=useState<Album|null>(null),[editing,setEditing]=useState<Album|null>(null),[showManual,setShowManual]=useState(false)
  const apiKey=localStorage.getItem('memento.tmdbKey')||''
  useEffect(()=>{localStorage.setItem(storageKey,JSON.stringify(items))},[items,storageKey])
  const search=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault()
    if(!query.trim())return
    setLoading(true);setError('');setResults([]);setHasSearched(true)
    try{
      if(category==='Anime'){
        const url=new URL('https://kitsu.io/api/edge/anime')
        url.searchParams.set('filter[text]',query.trim());url.searchParams.set('page[limit]','12');url.searchParams.set('sort','-userCount')
        const response=await fetch(url.toString(),{headers:{Accept:'application/vnd.api+json'}})
        if(!response.ok)throw new Error('Kitsu anime search failed ('+response.status+'). Try again in a moment.')
        const data=await response.json();setResults((data.data||[]) as KitsuAnimeResult[])
      }else{
        if(!apiKey){setError('Add your TMDB API key in Watchlist → TMDB connection first.');return}
        const url=new URL('https://api.themoviedb.org/3/search/'+mediaType)
        url.searchParams.set('api_key',apiKey);url.searchParams.set('query',query.trim());url.searchParams.set('include_adult','false')
        const response=await fetch(url.toString())
        if(!response.ok)throw new Error(response.status===401?'TMDB rejected your API key. Check it in Watchlist settings.':'TMDB search failed. Try again.')
        const data=await response.json();setResults((data.results||[]) as TMDBShelfResult[])
      }
    }catch(err){setError(err instanceof Error?err.message:'Search failed.')}finally{setLoading(false)}
  }
  const saveManual=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();if(!editing?.title.trim())return;setItems(old=>old.some(item=>item.id===editing.id)?old.map(item=>item.id===editing.id?editing: item):[...old,editing]);setEditing(null);setShowManual(false)}
  const blank=():Album=>({id:'custom-'+Date.now(),title:'',year:new Date().getFullYear(),cover:'',colors:['#34465d','#10141c'],ink:'#fff',creator:'',detail:'',link:'',ratio:1.4})
  const add=(result:TMDBShelfResult|KitsuAnimeResult)=>{
    const isKitsu='attributes' in result
    const anime=isKitsu?(result as KitsuAnimeResult).attributes:null
    const title=isKitsu?(anime?.titles?.en||anime?.canonicalTitle||'Untitled'):((result as TMDBShelfResult).title||(result as TMDBShelfResult).name||'Untitled')
    const date=isKitsu?(anime?.startDate||''):((result as TMDBShelfResult).release_date||(result as TMDBShelfResult).first_air_date||'')
    const item:Album=isKitsu?{id:'kitsu-anime-'+(result as KitsuAnimeResult).id,title,year:Number(date.slice(0,4))||0,cover:anime?.posterImage?.large||anime?.posterImage?.medium||anime?.posterImage?.small||'',colors:['#385b45','#0b1510'],ink:'#fff',creator:'ANIME',detail:date.slice(0,4)||'ANIME',ratio:1.4,description:anime?.synopsis||'',link:'https://kitsu.io/anime/'+(result as KitsuAnimeResult).id}:{id:'tmdb-'+(result as TMDBShelfResult).media_type+'-'+(result as TMDBShelfResult).id,tmdbId:(result as TMDBShelfResult).id,mediaType:mediaType,title,year:Number(date.slice(0,4))||0,cover:(result as TMDBShelfResult).poster_path?TMDB_POSTER+(result as TMDBShelfResult).poster_path:'',colors:category==='Movies'?['#34465d','#10141c']:['#385b45','#0b1510'],ink:'#fff',creator:category==='Movies'?'FILM':'TV SERIES',detail:date.slice(0,4)||category.toUpperCase(),ratio:1.4,description:(result as TMDBShelfResult).overview||''}
    setItems(current=>current.some(existing=>existing.id===item.id)?current:[...current,item])
    setResults(current=>current.filter(existing=>('attributes' in existing?existing.id:(existing as TMDBShelfResult).id)!==('attributes' in result?result.id:(result as TMDBShelfResult).id)))
  }
  return <div className="media-case-shelf">
    <div className="media-case-toolbar"><form onSubmit={search}><input value={query} onChange={event=>setQuery(event.target.value)} placeholder={category==='Anime'?'Search anime on Kitsu…':'Search '+category.toLowerCase()+' on TMDB…'}/><button type="submit" disabled={loading||!query.trim()}>{loading?'Searching…':category==='Anime'?'Search Kitsu':'Search TMDB'}</button></form><button type="button" onClick={()=>{setEditing(blank());setShowManual(true)}}>＋ Add manually</button><span>{items.length} {items.length===1?'title':'titles'}</span></div>
    {error&&<p className="media-case-error" role="alert">{error}</p>}{hasSearched&&!loading&&!error&&query.trim()&&results.length===0&&<p className="media-case-error" role="status">No {category.toLowerCase()} found for “{query}”. Try another search.</p>}
    {results.length>0&&<div className="media-case-results"><div className="media-case-results-heading"><strong>Search results</strong><button type="button" onClick={()=>setResults([])}>Clear</button></div><div className="media-case-results-grid">{results.map(result=>{const kitsu='attributes' in result;const anime=kitsu?(result as KitsuAnimeResult).attributes:null;const title=kitsu?(anime?.titles?.en||anime?.canonicalTitle):((result as TMDBShelfResult).title||(result as TMDBShelfResult).name);const cover=kitsu?(anime?.posterImage?.medium||anime?.posterImage?.small):((result as TMDBShelfResult).poster_path?TMDB_POSTER+(result as TMDBShelfResult).poster_path:'');const year=kitsu?(anime?.startDate||'').slice(0,4):((result as TMDBShelfResult).release_date||(result as TMDBShelfResult).first_air_date||'').slice(0,4);return <article key={kitsu?'kitsu-'+(result as KitsuAnimeResult).id:'tmdb-'+(result as TMDBShelfResult).id}><img src={cover||''} alt="" onError={event=>{event.currentTarget.style.visibility='hidden'}}/><div><strong>{title}</strong><small>{year||'Release date unknown'}</small><button type="button" onClick={()=>add(result)}>＋ Add to shelf</button></div></article>})}</div></div>}
    {items.length?<div className="cd-shelf-grid">{items.map(item=><ShelfItem key={item.id} album={item} onOpen={setSelected}/>)}</div>:<div className="shelf-empty"><div className="shelf-empty-case"><span>{category==='Movies'?'FILM':category==='Anime'?'ANIME':'TV'}</span></div><strong>Your {category.toLowerCase()} shelf is empty</strong><span>Search TMDB above or add your own {category.toLowerCase()} entry.</span></div>}
    {selected&&<Viewer key={selected.id} album={selected} onClose={()=>setSelected(null)} onEdit={()=>{setEditing(selected);setSelected(null);setShowManual(true)}} onRemove={()=>{setItems(current=>current.filter(item=>item.id!==selected.id));setSelected(null)}}/>}{showManual&&editing&&<AlbumEditor album={editing} category={category} onChange={setEditing} onClose={()=>{setShowManual(false);setEditing(null)}} onSave={saveManual}/>}
    <p className="media-case-attribution">{category==='Anime'?'Anime metadata provided by Kitsu.':'This product uses the TMDB API but is not endorsed or certified by TMDB.'}</p>
  </div>
}

function AlbumEditor({album,category,onChange,onClose,onSave}:{album:Album;category:string;onChange:(v:Album)=>void;onClose:()=>void;onSave:(e:FormEvent<HTMLFormElement>)=>void}){return <div className="album-editor-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><form className="album-editor" onSubmit={onSave}><header><strong>{album.title?'Edit':'Add'} {category}</strong><button type="button" onClick={onClose}>×</button></header><label>Title<input required value={album.title} onChange={e=>onChange({...album,title:e.target.value})}/></label><label>Artist / creator<input value={album.creator||''} onChange={e=>onChange({...album,creator:e.target.value})}/></label><div className="album-editor-row"><label>Year<input type="number" value={album.year||''} onChange={e=>onChange({...album,year:Number(e.target.value)})}/></label><label>Details<input value={album.detail||''} onChange={e=>onChange({...album,detail:e.target.value})}/></label></div><label>Cover image URL<input value={album.cover} onChange={e=>onChange({...album,cover:e.target.value})} placeholder="https://…"/></label><label>Optional link<input value={album.link||''} onChange={e=>onChange({...album,link:e.target.value})} placeholder="https://…"/></label><label>Description<input value={album.description||''} onChange={e=>onChange({...album,description:e.target.value})} placeholder="Optional notes"/></label><footer><button type="button" onClick={onClose}>Cancel</button><button type="submit">Save to shelf</button></footer></form></div>}

function ManualCatalogueShelf({category}:{category:'Music'|'Anime'}){const key='memento.shelf.'+category.toLowerCase();const [items,setItems]=useState<Album[]>(()=>{try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return []}});const [apiKey,setApiKey]=useState(localStorage.getItem('memento.lastfmApiKey')||'');const [query,setQuery]=useState('');const [results,setResults]=useState<any[]>([]);const [error,setError]=useState('');const [loading,setLoading]=useState(false);const [selected,setSelected]=useState<Album|null>(null);const [editing,setEditing]=useState<Album|null>(null);useEffect(()=>{localStorage.setItem(key,JSON.stringify(items))},[items,key]);useEffect(()=>{localStorage.setItem('memento.lastfmApiKey',apiKey)},[apiKey]);const blank=():Album=>({id:'custom-'+Date.now(),title:'',year:new Date().getFullYear(),cover:'',colors:['#45404c','#17141c'],ink:'#fff',creator:'',detail:category==='Music'?'ALBUM':'ANIME',link:'',ratio:1});const search=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();if(!query.trim())return;if(category==='Music'&&!apiKey.trim()){setError('Add your Last.fm API key below first.');return}setLoading(true);setError('');try{const url=new URL('https://ws.audioscrobbler.com/2.0/');url.searchParams.set('method','album.search');url.searchParams.set('album',query.trim());url.searchParams.set('api_key',apiKey.trim());url.searchParams.set('format','json');const res=await fetch(url.toString());const data=await res.json();if(data.error)throw new Error(data.message||'Search failed');setResults((data.results?.albummatches?.album||[]).slice(0,12))}catch(err){setError(err instanceof Error?err.message:'Search failed.')}finally{setLoading(false)}};const add=(r:any)=>{const item:Album={id:'lastfm-'+(r.mbid||encodeURIComponent(r.artist+'-'+r.name)),title:r.name,year:0,cover:(r.image||[]).find((x:any)=>x.size==='extralarge')?.['#text']||(r.image||[]).find((x:any)=>x.size==='large')?.['#text']||'',colors:['#403c46','#17141c'],ink:'#fff',creator:r.artist,detail:'ALBUM',link:r.url,ratio:1};setItems(old=>old.some(x=>x.id===item.id)?old:[...old,item]);setResults(old=>old.filter(x=>x.name!==r.name||x.artist!==r.artist))};const save=(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();if(!editing?.title.trim())return;setItems(old=>old.some(x=>x.id===editing.id)?old.map(x=>x.id===editing.id?editing:x):[...old,editing]);setEditing(null)};return <div className="media-case-shelf"><div className="media-case-toolbar"><form onSubmit={search}><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search albums on Last.fm…"/><button disabled={loading||!query.trim()}>{loading?'Searching…':'Search'}</button></form><button type="button" onClick={()=>setEditing(blank())}>＋ Add manually</button><span>{items.length} records</span></div>{category==='Music'&&<details className="media-case-api" open={!apiKey}><summary>Last.fm connection</summary><label>Last.fm API key<input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="Paste your Last.fm API key"/></label><small>Uses the Last.fm public album search API.</small></details>}{error&&<p className="media-case-error">{error}</p>}{results.length>0&&<div className="media-case-results"><div className="media-case-results-heading"><strong>Search results</strong><button type="button" onClick={()=>setResults([])}>Clear</button></div><div className="media-case-results-grid">{results.map((r,i)=><article key={r.mbid||r.name+'-'+r.artist+i}><img src={(r.image||[]).find((x:any)=>x.size==='large')?.['#text']||''} alt=""/><div><strong>{r.name}</strong><small>{r.artist}</small><button type="button" onClick={()=>add(r)}>＋ Add to shelf</button></div></article>)}</div></div>}{items.length?<div className="cd-shelf-grid">{items.map(item=><ShelfItem key={item.id} album={item} onOpen={setSelected}/>)}</div>:<div className="shelf-empty"><div className="shelf-empty-case"><span>{category==='Music'?'CD':'ANIME'}</span></div><strong>Your {category.toLowerCase()} shelf is empty</strong><span>Search above or add your own entry.</span></div>}{selected&&<Viewer album={selected} onClose={()=>setSelected(null)} onEdit={()=>{setEditing(selected);setSelected(null)}} onRemove={()=>{setItems(old=>old.filter(x=>x.id!==selected.id));setSelected(null)}}/>}{editing&&<AlbumEditor album={editing} category={category} onChange={setEditing} onClose={()=>setEditing(null)} onSave={save}/>} </div>}

function EmptyMediaShelf({ category }: { category: ShelfCategory }) {
  const initials: Record<ShelfCategory,string> = {Music:'CD',Games:'GAME',Movies:'FILM',Anime:'ANIME',Shows:'TV',Books:'BOOK'}
  return <div className="shelf-empty"><div className="shelf-empty-case"><span>{initials[category]}</span></div><strong>Your {category.toLowerCase()} shelf is empty</strong><span>There's nothing here yet. This shelf is ready for your collection.</span></div>
}

export default function CdShelf({ category }: { category: ShelfCategory }) {
    return <section className="cd-shelf">
    {category === 'Music' ? <><div className="cd-shelf-subheading"><strong>Music</strong><span>YOUR COLLECTION</span></div><ManualCatalogueShelf category="Music"/>
    </> : category === 'Games' ? <>
      <div className="cd-shelf-subheading"><strong>Games</strong><span>ROBLOX EXPERIENCES</span></div>
      <GamesShelf/>
    </>  : category === 'Movies' || category === 'Shows' || category === 'Anime' ? <><div className="cd-shelf-subheading"><strong>{category}</strong><span>YOUR COLLECTION</span></div><MovieTvShelf key={category} category={category}/></> : category === 'Books' ? <BookShelf/> : <><div className="cd-shelf-subheading"><strong>{category}</strong><span>YOUR COLLECTION</span></div><EmptyMediaShelf category={category}/></>}
  </section>
}
