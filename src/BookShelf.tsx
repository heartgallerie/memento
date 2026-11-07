import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'

type BookKind = 'book' | 'manga'
type Book = {
  id: string
  title: string
  author: string
  year: number
  isbn?: string
  cover?: string
  colors: [string, string]
  pages: number
  kind: BookKind
}
type GoogleVolume = {
  id: string
  volumeInfo?: {
    title?: string
    authors?: string[]
    publishedDate?: string
    pageCount?: number
    industryIdentifiers?: { type: string; identifier: string }[]
    imageLinks?: Record<string, string>
  }
}
type KitsuManga = { id:string; attributes:{ canonicalTitle?:string; titles?:{en?:string|null;en_jp?:string|null;ja_jp?:string|null}; startDate?:string|null; volumeCount?:number|null; chapterCount?:number|null; posterImage?:{small?:string;medium?:string;large?:string}|null } }
type SavedShelf = { customBooks: Book[]; edits: Record<string, Book> }

const SHAKESPEARE: Book[] = [
  { id: 'hamlet', title: 'Hamlet', author: 'William Shakespeare', year: 1603, isbn: '9780743477123', colors: ['#9a774c','#30251d'], pages: 8, kind: 'book' },
  { id: 'macbeth', title: 'Macbeth', author: 'William Shakespeare', year: 1606, isbn: '9780743477109', colors: ['#7e2525','#260d12'], pages: 8, kind: 'book' },
  { id: 'romeo-juliet', title: 'Romeo and Juliet', author: 'William Shakespeare', year: 1597, isbn: '9780743477116', colors: ['#8e4351','#321d2a'], pages: 8, kind: 'book' },
  { id: 'midsummer', title: "A Midsummer Night's Dream", author: 'William Shakespeare', year: 1605, isbn: '9780743477543', colors: ['#48694d','#172a23'], pages: 8, kind: 'book' },
  { id: 'othello', title: 'Othello', author: 'William Shakespeare', year: 1604, isbn: '9780743477550', colors: ['#343d56','#141a2c'], pages: 8, kind: 'book' },
  { id: 'king-lear', title: 'King Lear', author: 'William Shakespeare', year: 1606, isbn: '9780743479974', colors: ['#8c744b','#30281b'], pages: 8, kind: 'book' },
]
const DEATH_NOTE: Book[] = Array.from({ length: 13 }, (_, i) => {
  const number = i + 1
  return {
    id: 'death-note-' + number,
    title: number === 13 ? 'Death Note: How to Read' : 'Death Note, Vol. ' + number,
    author: number === 13 ? 'Tsugumi Ohba & Takeshi Obata' : 'Tsugumi Ohba · Takeshi Obata',
    year: number === 13 ? 2006 : 2004 + Math.ceil(number / 3),
    isbn: ['1421501686','1421501694','1421501708','1421501716','1421501724','1421501732','1421501740','1421501759','1421501767','1421501775','1421501783','1421501791','1421525813'][i],
    colors: ['#292929','#080808'], pages: 8, kind: 'manga' as const,
  }
})
const ALL_BOOKS = [...SHAKESPEARE, ...DEATH_NOTE]
const STORAGE_KEY = 'memento-book-shelf-v2'
const coverUrl = (book: Book) => book.cover || (book.isbn ? 'https://covers.openlibrary.org/b/isbn/' + book.isbn + '-L.jpg?default=false' : '')

function BookObject({ book, size, rotation = 0, turned = 0, dragging = false }: { book: Book; size: number; rotation?: number; turned?: number; dragging?: boolean }) {
  const rtl = book.kind === 'manga'
  const width = Math.round(size * (rtl ? .8 : 1))
  const height = Math.round(size * (rtl ? 1.2 : 1.414))
  const depth = Math.round(size * .12)
  const leaves = Math.max(2, Math.ceil(book.pages / 2))
  const hinge = rtl ? 'right center' : 'left center'
  const swing = rtl ? 1 : -1
  const cover = coverUrl(book)
  const face = (style: CSSProperties): CSSProperties => ({ position:'absolute', backfaceVisibility:'hidden', WebkitBackfaceVisibility:'hidden', ...style })
  const pageFace = (index:number) => <div style={{position:'absolute',inset:0,background:'#f4efe4',overflow:'hidden'}}>
    {rtl
      ? <div style={{position:'absolute',inset:'8% 8% 12%',display:'grid',gridTemplateColumns:'1fr 1fr',gridTemplateRows:'1fr 1fr 1fr',gap:'3%'}}>
          {['1 / 1 / 2 / 3','2 / 1 / 3 / 2','2 / 2 / 4 / 3','3 / 1 / 4 / 2'].map((area,i)=><div key={i} style={{gridArea:area,border:'1px solid #302b27',background:'#ebe5d9'}}/> )}
        </div>
      : <div style={{position:'absolute',inset:'12% 13% 17%',backgroundImage:'repeating-linear-gradient(180deg,rgba(60,50,40,.26) 0 1px,transparent 1px 7px)'}}/>}
    {index===0&&!rtl&&<div style={{position:'absolute',inset:'12%',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',fontFamily:'Georgia,serif',textAlign:'center',color:'#302820',gap:8}}><strong style={{fontSize:Math.max(13,size*.085)}}>{book.title}</strong><small>{book.author}</small></div>}
    <small style={{position:'absolute',bottom:'5%',left:0,right:0,textAlign:'center',font:'10px Georgia,serif',color:'#8a8170'}}>{index+1}</small>
  </div>
  const edgeV = 'repeating-linear-gradient(90deg,#f6f1e6 0 1.5px,#cfc7b4 1.5px 2.5px)'
  const edgeH = 'repeating-linear-gradient(0deg,#f6f1e6 0 1.5px,#cfc7b4 1.5px 2.5px)'
  const spine = 'linear-gradient(90deg,'+book.colors[0]+','+book.colors[1]+')'
  return <div style={{width,height,position:'relative',transformStyle:'preserve-3d',transform:'translateX('+(turned>0?(rtl?-width/2:width/2):0)+'px) rotateX(-7deg) rotateY('+rotation+'deg)',transition:dragging?'none':'transform .55s cubic-bezier(.2,.8,.2,1)'}}>
    <div style={face({inset:0,transform:'translateZ('+(-depth/2)+'px) rotateY(180deg)',background:'linear-gradient(135deg,'+book.colors[1]+',#080808)'})}/>
    <div style={face({inset:0,transform:'translateZ('+(-depth/2+1)+'px)',background:'#e4dcc8'})}/>
    <div style={face({width:depth,height,left:-depth/2,transform:'rotateY(-90deg)',background:rtl?edgeV:spine,backfaceVisibility:'visible'})}/>
    <div style={face({width:depth,height,left:width-depth/2,transform:'rotateY(90deg)',background:rtl?spine:edgeV,backfaceVisibility:'visible'})}/>
    <div style={face({width,height:depth,top:-depth/2,transform:'rotateX(90deg)',background:edgeH,backfaceVisibility:'visible'})}/>
    <div style={face({width,height:depth,top:height-depth/2,transform:'rotateX(-90deg)',background:edgeH,backfaceVisibility:'visible'})}/>
    {Array.from({length:leaves},(_,i)=>{
      const k=i+1, turnedLeaf=turned>k, z=turnedLeaf?-depth/2+k*depth/(leaves+2):depth/2-k*depth/(leaves+2)
      return <div key={k} style={{position:'absolute',inset:0,transformStyle:'preserve-3d',transformOrigin:hinge,transform:'translateZ('+z+'px) rotateY('+(turnedLeaf?swing*180:0)+'deg)',transition:dragging?'none':'transform .8s cubic-bezier(.3,.7,.2,1)',pointerEvents:'none'}}>
        <div style={face({inset:0})}>{pageFace(2*k-2)}</div>
        <div style={face({inset:0,transform:'rotateY(180deg)'})}>{pageFace(2*k-1)}</div>
      </div>
    })}
    <div style={{position:'absolute',inset:0,transformStyle:'preserve-3d',transformOrigin:hinge,transform:'translateZ('+(turned>0?-depth/2:depth/2)+'px) rotateY('+(turned>0?swing*179:0)+'deg)',transition:'transform .8s cubic-bezier(.3,.7,.2,1)',pointerEvents:'none'}}>
      <div style={face({inset:0,backgroundColor:book.colors[0],backgroundImage:cover?'url('+cover+')':'none',backgroundSize:'cover',backgroundPosition:'center',boxShadow:'inset 0 0 0 2px #ffffff20'})}>
        {!cover&&<div style={{position:'absolute',inset:'12%',display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center',font:'bold 18px Georgia,serif',color:'#fff',textShadow:'0 2px 8px #000'}}>{book.title}</div>}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(115deg,rgba(255,255,255,.18),transparent 35%,transparent 75%,rgba(255,255,255,.08))'}}/>
      </div>
      <div style={face({inset:0,transform:'rotateY(180deg)',background:'#e4dcc8'})}/>
    </div>
  </div>
}
function ShelfBook({ book, onOpen }: { book: Book; onOpen: (book: Book) => void }) {
  const [rotation,setRotation] = useState(22)
  const [active,setActive] = useState(false)
  return <button type="button" className="book-shelf-item" onClick={()=>onOpen(book)} onPointerMove={e=>{if(e.pointerType==='touch')return;const r=e.currentTarget.getBoundingClientRect();setRotation(22+((e.clientX-r.left)/r.width-.5)*35);setActive(true)}} onPointerLeave={()=>{setRotation(22);setActive(false)}} aria-label={'Open '+book.title}>
    <span className="book-shelf-object"><BookObject book={book} size={112} rotation={rotation} dragging={active}/></span>
    <span className="book-shelf-copy"><strong>{book.title}</strong><small>{book.author}</small><small>{book.year || 'Year unknown'} · {book.kind === 'manga' ? 'MANGA' : 'BOOK'}</small></span>
  </button>
}

function BookViewer({ book, onClose, onEdit, onRemove }: { book: Book; onClose:()=>void; onEdit:()=>void; onRemove?:()=>void }) {
  const [turned,setTurned]=useState(0)
  const [rotation,setRotation]=useState(22)
  const [dragging,setDragging]=useState(false)
  const drag=useRef<{x:number;y:number;rotation:number}|null>(null)
  const size=Math.max(150,Math.min(310,(typeof window==='undefined'?600:window.innerWidth-50)/2.3))
  const count=Math.max(2,book.pages/2)
  const rtl=book.kind==='manga'
  const next=useCallback(()=>setTurned(v=>Math.min(count+1,v+1)),[count])
  const prev=useCallback(()=>setTurned(v=>Math.max(0,v-1)),[])
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();if((rtl&&e.key==='ArrowLeft')||(!rtl&&e.key==='ArrowRight'))next();if((rtl&&e.key==='ArrowRight')||(!rtl&&e.key==='ArrowLeft'))prev()};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[onClose,next,prev,rtl])
  const down=(e:PointerEvent<HTMLDivElement>)=>{drag.current={x:e.clientX,y:e.clientY,rotation};setDragging(true);e.currentTarget.setPointerCapture(e.pointerId)}
  const move=(e:PointerEvent<HTMLDivElement>)=>{if(!drag.current)return;setRotation(drag.current.rotation+(e.clientX-drag.current.x)*.5)}
  const up=()=>{drag.current=null;setDragging(false)}
  const label=turned===0?'Cover':turned===count+1?'Back cover':'Pages '+(turned*2-1)+'–'+(turned*2)
  const buttonStyle={border:'1px solid var(--line)',borderRadius:999,padding:'9px 15px',background:'var(--panel)',color:'var(--text)',font:'11px "DM Sans"',cursor:'pointer' as const}
  return <div className="book-viewer-overlay" role="dialog" aria-modal="true" aria-label={book.title}>
    <button className="book-viewer-close" onClick={onClose}>×</button>
    <div className="book-viewer-stage" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} style={{cursor:dragging?'grabbing':'grab',touchAction:'none'}}>
      <BookObject book={book} size={size} rotation={rotation} turned={turned} dragging={dragging}/>
    </div>
    <div className="book-viewer-meta"><strong>{book.title}</strong><span>{book.author} · {book.year || 'Year unknown'}</span><small>{label} · {rtl?'Right-to-left':'Left-to-right'}</small></div>
    <div className="book-viewer-controls">
      <button style={buttonStyle} onClick={()=>setTurned(v=>v===0?1:0)}>{turned?'Close book':'Open book'}</button>
      <button style={buttonStyle} disabled={turned===0} onClick={prev}>{rtl?'Previous →':'← Previous'}</button>
      <button style={buttonStyle} disabled={turned>count} onClick={next}>{rtl?'← Next':'Next →'}</button>
      <button style={buttonStyle} onClick={onEdit}>Edit / find cover</button>
      {onRemove&&<button style={buttonStyle} onClick={onRemove}>Remove</button>}
    </div>
    <small className="book-viewer-hint">Drag to rotate · use arrow keys to turn pages</small>
  </div>
}

function Editor({ initial, mode, onClose, onSave }: { initial: Partial<Book>; mode:'search'|'manual'; onClose:()=>void; onSave:(book:Book)=>void }) {
  const [tab,setTab]=useState<'search'|'manual'>(mode)
  const [query,setQuery]=useState([initial.title,initial.author].filter(Boolean).join(' '))
  const [kind,setKind]=useState<BookKind>(initial.kind || 'book')
  const [title,setTitle]=useState(initial.title || '')
  const [author,setAuthor]=useState(initial.author || '')
  const [year,setYear]=useState(String(initial.year || ''))
  const [cover,setCover]=useState(initial.cover || '')
  const [isbn,setIsbn]=useState(initial.isbn || '')
  const [pages,setPages]=useState(String(initial.pages || 8))
  const [results,setResults]=useState<GoogleVolume[]>([])
  const [mangaResults,setMangaResults]=useState<KitsuManga[]>([])
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const search=async()=>{
    if(!query.trim())return
    setLoading(true);setError('');setResults([]);setMangaResults([])
    try{
      if(kind==='manga'){
        const url=new URL('https://kitsu.io/api/edge/manga')
        url.searchParams.set('filter[text]',query.trim());url.searchParams.set('page[limit]','12');url.searchParams.set('sort','-userCount')
        const response=await fetch(url.toString(),{headers:{Accept:'application/vnd.api+json'}})
        if(!response.ok)throw new Error('Kitsu manga search failed ('+response.status+'). Try again in a moment.')
        const data=await response.json();const found=(data.data||[]) as KitsuManga[];setMangaResults(found)
        if(!found.length)setError('No manga found. Try another title or author.')
      }else{
        const response=await fetch('https://www.googleapis.com/books/v1/volumes?q='+encodeURIComponent(query.trim())+'&maxResults=20&printType=books')
        if(!response.ok)throw new Error('Google Books returned an error ('+response.status+').')
        const data=await response.json();const found=(data.items||[]).filter((item:GoogleVolume)=>item.volumeInfo);setResults(found)
        if(!found.length)setError('No matches found. Try another title, author or ISBN.')
      }
    }catch(e){setError(e instanceof Error?e.message:'Could not search catalogue.')}
    finally{setLoading(false)}
  }
  const choose=(item:GoogleVolume)=>{
    const info=item.volumeInfo || {}
    const images=info.imageLinks || {}
    const image=images.extraLarge || images.large || images.medium || images.thumbnail || images.smallThumbnail || ''
    const identifier=info.industryIdentifiers?.find(x=>x.type==='ISBN_13')?.identifier || info.industryIdentifiers?.[0]?.identifier || ''
    const date=info.publishedDate || ''
    const foundYear=Number(date.slice(0,4)) || 0
    onSave({
      id:initial.id || '',
      title:info.title || title,
      author:(info.authors || []).join(', ') || author,
      year:foundYear || Number(year) || 0,
      isbn:identifier || isbn,
      cover:image.replace(/^http:/,'https:'),
      colors:initial.colors || (kind==='manga'?['#292929','#080808']:['#80684d','#30251d']),
      pages:info.pageCount || Number(pages) || 8,
      kind,
    })
  }
  const chooseManga=(item:KitsuManga)=>{const attrs=item.attributes;const date=attrs.startDate||'';onSave({id:initial.id||'',title:attrs.titles?.en||attrs.canonicalTitle||'Untitled',author:'',year:Number(date.slice(0,4))||0,isbn:'',cover:attrs.posterImage?.large||attrs.posterImage?.medium||attrs.posterImage?.small||'',colors:initial.colors||['#292929','#080808'],pages:8,kind:'manga'})}
  const saveManual=()=>{
    if(!title.trim())return
    onSave({id:initial.id || '',title:title.trim(),author:author.trim() || 'Unknown author',year:Number(year)||0,isbn:isbn.trim(),cover:cover.trim(),colors:initial.colors || (kind==='manga'?['#292929','#080808']:['#80684d','#30251d']),pages:Math.max(2,Number(pages)||8),kind})
  }
  return <div className="book-editor-overlay" role="dialog" aria-modal="true" aria-label="Add or edit a book">
    <div className="book-editor">
      <header><div><strong>{initial.id?'Edit book':'Add a book'}</strong><small>Search a catalogue or enter the details yourself.</small></div><button onClick={onClose} aria-label="Close">×</button></header>
      <nav><button className={tab==='search'?'active':''} onClick={()=>setTab('search')}>Search catalogue</button><button className={tab==='manual'?'active':''} onClick={()=>setTab('manual')}>Enter manually</button></nav>
      {tab==='search'?<div className="book-editor-search">
        <div className="book-editor-query"><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')search()}} placeholder={kind==='manga'?'Search manga on Kitsu…':'Title, author or ISBN…'}/><button onClick={search} disabled={loading||!query.trim()}>{loading?'Searching…':kind==='manga'?'Search Kitsu':'Search Google Books'}</button></div>
        <label className="book-editor-kind">Add as <select value={kind} onChange={e=>setKind(e.target.value as BookKind)}><option value="book">Regular book</option><option value="manga">Manga (right-to-left)</option></select></label>
        {error&&<p className="book-editor-error" role="status">{error}</p>}
        <div className="book-editor-results">{kind==='manga'&&mangaResults.map(item=><button key={item.id} className="book-editor-result" onClick={()=>chooseManga(item)}><span className="book-editor-result-cover">{(item.attributes.posterImage?.medium||item.attributes.posterImage?.small)?<img src={item.attributes.posterImage.medium||item.attributes.posterImage.small} alt=""/>:<span>NO COVER</span>}</span><span><strong>{item.attributes.titles?.en||item.attributes.canonicalTitle||'Untitled'}</strong><small>{item.attributes.startDate?.slice(0,4)||'Year unknown'} · {item.attributes.volumeCount||'?'} volumes</small></span><b>＋</b></button>)}{kind==='book'&&results.map(item=>{const info=item.volumeInfo||{};const images=info.imageLinks||{};const image=images.thumbnail||images.smallThumbnail||images.small||'';return <button key={item.id} className="book-editor-result" onClick={()=>choose(item)}><span className="book-editor-result-cover">{image?<img src={image.replace(/^http:/,'https:')} alt=""/>:<span>NO COVER</span>}</span><span><strong>{info.title||'Untitled'}</strong><small>{(info.authors||[]).join(', ')||'Unknown author'}</small><small>{info.publishedDate||'Year unknown'} · {info.pageCount||'?'} pages</small></span><b>＋</b></button>})}</div>
        <small className="book-editor-attribution">{kind==='manga'?'Manga search powered by Kitsu.':'Book search powered by Google Books.'} Selecting a result adds it to your shelf or updates the book you opened.</small>
      </div>:<div className="book-editor-manual">
        <label>Title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Book title"/></label>
        <label>Author<input value={author} onChange={e=>setAuthor(e.target.value)} placeholder="Author / creator"/></label>
        <div className="book-editor-fields"><label>Year<input type="number" value={year} onChange={e=>setYear(e.target.value)} placeholder="e.g. 2004"/></label><label>Pages<input type="number" min="2" value={pages} onChange={e=>setPages(e.target.value)}/></label></div>
        <label>Format<select value={kind} onChange={e=>setKind(e.target.value as BookKind)}><option value="book">Regular book · left-to-right</option><option value="manga">Manga · right-to-left</option></select></label>
        <label>ISBN (optional)<input value={isbn} onChange={e=>setIsbn(e.target.value)} placeholder="ISBN-10 or ISBN-13"/></label>
        <label>Cover image URL (optional)<input value={cover} onChange={e=>setCover(e.target.value)} placeholder="https://…"/></label>
        <div className="book-editor-actions"><button onClick={onClose}>Cancel</button><button className="primary" onClick={saveManual} disabled={!title.trim()}>Save to shelf</button></div>
      </div>}
    </div>
  </div>
}

export default function BookShelf() {
  const [collection,setCollection]=useState<'All'|'Shakespeare'|'Death Note'|'My books'>('All')
  const [selected,setSelected]=useState<Book|null>(null)
  const [savedShelf]=useState<SavedShelf>(()=>{try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const parsed=JSON.parse(raw) as SavedShelf;return {customBooks:Array.isArray(parsed.customBooks)?parsed.customBooks:[],edits:parsed.edits||{}}}}catch{/* Ignore malformed local shelf data. */}return {customBooks:[],edits:{}}})
  const [customBooks,setCustomBooks]=useState<Book[]>(savedShelf.customBooks)
  const [edits,setEdits]=useState<Record<string,Book>>(savedShelf.edits)
  const [editor,setEditor]=useState<{targetId:string|null;mode:'search'|'manual';initial:Partial<Book>}|null>(null)
  const close=useCallback(()=>setSelected(null),[])
  useEffect(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify({customBooks,edits} satisfies SavedShelf))}catch{ /* Storage may be unavailable or full. */ }},[customBooks,edits])
  const books=[...ALL_BOOKS.map(book=>edits[book.id]||book),...customBooks]
  const visible=collection==='Shakespeare'?books.filter(book=>SHAKESPEARE.some(base=>base.id===book.id)):collection==='Death Note'?books.filter(book=>DEATH_NOTE.some(base=>base.id===book.id)):collection==='My books'?customBooks:books
  const openAdd=(mode:'search'|'manual')=>setEditor({targetId:null,mode,initial:{kind:'book',pages:8,colors:['#80684d','#30251d']}})
  const openEdit=(book:Book,mode:'search'|'manual'='manual')=>{setSelected(null);setEditor({targetId:book.id,mode,initial:book})}
  const save=(value:Book)=>{
    const target=editor?.targetId
    const next={...value,id:target||value.id||('book-'+Date.now()+'-'+Math.random().toString(36).slice(2,7))}
    if(target&&customBooks.some(book=>book.id===target))setCustomBooks(current=>current.map(book=>book.id===target?next:book))
    else if(target)setEdits(current=>({...current,[target]:next}))
    else setCustomBooks(current=>[...current,next])
    setEditor(null);setSelected(null);setCollection(target?'All':'My books')
  }
  const remove=(book:Book)=>{
    if(customBooks.some(item=>item.id===book.id))setCustomBooks(current=>current.filter(item=>item.id!==book.id))
    setSelected(null)
  }
  return <section className="book-shelf">
    <div className="book-shelf-toolbar"><div><strong>Books</strong><span>{visible.length} volumes</span></div><nav aria-label="Book collection filter">{(['All','Shakespeare','Death Note','My books'] as const).map(item=><button key={item} className={collection===item?'active':''} onClick={()=>setCollection(item)}>{item}</button>)}</nav><button className="book-shelf-add" onClick={()=>openAdd('search')}>＋ Add a book</button></div>
    <div className="book-shelf-grid">{visible.map(book=><ShelfBook key={book.id} book={book} onOpen={setSelected}/>)}</div>
    {selected&&<BookViewer key={selected.id} book={selected} onClose={close} onEdit={()=>openEdit(selected,'search')} onRemove={customBooks.some(item=>item.id===selected.id)?()=>remove(selected):undefined}/>}
    {editor&&<Editor key={(editor.targetId||'new')+editor.mode} initial={editor.initial} mode={editor.mode} onClose={()=>setEditor(null)} onSave={save}/>}
  </section>
}
