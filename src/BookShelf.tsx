import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'

type Book = { id: string; title: string; author: string; year: number; isbn: string; colors: [string, string]; pages: number }
const SHAKESPEARE: Book[] = [
  { id: 'hamlet', title: 'Hamlet', author: 'William Shakespeare', year: 1603, isbn: '9780743477123', colors: ['#9a774c','#30251d'], pages: 8 },
  { id: 'macbeth', title: 'Macbeth', author: 'William Shakespeare', year: 1606, isbn: '9780743477109', colors: ['#7e2525','#260d12'], pages: 8 },
  { id: 'romeo-juliet', title: 'Romeo and Juliet', author: 'William Shakespeare', year: 1597, isbn: '9780743477116', colors: ['#8e4351','#321d2a'], pages: 8 },
  { id: 'midsummer', title: "A Midsummer Night's Dream", author: 'William Shakespeare', year: 1605, isbn: '9780743477543', colors: ['#48694d','#172a23'], pages: 8 },
  { id: 'othello', title: 'Othello', author: 'William Shakespeare', year: 1604, isbn: '9780743477550', colors: ['#343d56','#141a2c'], pages: 8 },
  { id: 'king-lear', title: 'King Lear', author: 'William Shakespeare', year: 1606, isbn: '9780743479974', colors: ['#8c744b','#30281b'], pages: 8 },
]
const DEATH_NOTE: Book[] = Array.from({ length: 13 }, (_, i) => {
  const number = i + 1
  return {
    id: 'death-note-' + number, title: number === 13 ? 'Death Note: How to Read' : 'Death Note, Vol. ' + number,
    author: number === 13 ? 'Tsugumi Ohba & Takeshi Obata' : 'Tsugumi Ohba · Takeshi Obata',
    year: number === 13 ? 2006 : 2004 + Math.ceil(number / 3),
    isbn: ['1421501686','1421501694','1421501708','1421501716','1421501724','1421501732','1421501740','1421501759','1421501767','1421501775','1421501783','1421501791','1421525813'][i],
    colors: ['#292929','#080808'], pages: 8,
  }
})
const ALL_BOOKS = [...SHAKESPEARE, ...DEATH_NOTE]
const RATIO = 1.414
const coverUrl = (book: Book) => 'https://covers.openlibrary.org/b/isbn/' + book.isbn + '-L.jpg'

function BookObject({ book, size, rotation = 0, turned = 0, dragging = false }: { book: Book; size: number; rotation?: number; turned?: number; dragging?: boolean }) {
  const height = Math.round(size * RATIO)
  const depth = Math.round(size * .12)
  const leaves = book.pages / 2
  const face = (style: React.CSSProperties): React.CSSProperties => ({ position: 'absolute', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', ...style })
  const cover = coverUrl(book)
  return <div style={{ width:size,height,position:'relative',transformStyle:'preserve-3d',transform:'rotateX(-7deg) rotateY('+rotation+'deg)',transition:dragging?'none':'transform .55s ease' }}>
    <div style={face({inset:0,transform:'translateZ('+(-depth/2)+'px) rotateY(180deg)',background:book.colors[1]})}/>
    <div style={face({inset:0,transform:'translateZ('+(-depth/2+1)+'px)',background:'#e9e0ce'})}/>
    <div style={face({width:depth,height,left:-depth/2,transform:'rotateY(-90deg)',background:'linear-gradient(90deg,'+book.colors[0]+','+book.colors[1]+')',backfaceVisibility:'visible',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',color:'#fff',font:'600 8px Georgia,serif',letterSpacing:'.03em',writingMode:'vertical-rl',textAlign:'center',textShadow:'0 1px 2px #000'})}><span style={{maxHeight:'90%',overflow:'hidden'}}>{book.title}</span></div>
    <div style={face({width:depth,height,left:size-depth/2,transform:'rotateY(90deg)',background:'repeating-linear-gradient(90deg,#f5f0e6 0 1px,#cfc7b6 1px 2px)',backfaceVisibility:'visible'})}/>
    <div style={face({width:size,height:depth,top:-depth/2,transform:'rotateX(90deg)',background:'#ded6c5',backfaceVisibility:'visible'})}/>
    <div style={face({width:size,height:depth,top:height-depth/2,transform:'rotateX(-90deg)',background:'#ded6c5',backfaceVisibility:'visible'})}/>
    {Array.from({length:leaves},(_,i)=><div key={i} style={{position:'absolute',inset:0,transformStyle:'preserve-3d',transformOrigin:'left center',transform:'translateZ('+(depth/2-(i+1)*depth/(leaves+2))+'px) rotateY('+(turned>i+1?-180:0)+'deg)',transition:dragging?'none':'transform .7s cubic-bezier(.3,.7,.2,1)',pointerEvents:'none'}}>
      <div style={face({inset:0,background:'#f4efe4'})}><div style={{position:'absolute',inset:'11% 13% 17%',backgroundImage:'repeating-linear-gradient(180deg,rgba(60,50,40,.22) 0 1px,transparent 1px 7px)'}}/></div>
      <div style={face({inset:0,transform:'rotateY(180deg)',background:'#f4efe4'})}><div style={{position:'absolute',inset:'11% 13% 17%',backgroundImage:'repeating-linear-gradient(180deg,rgba(60,50,40,.22) 0 1px,transparent 1px 7px)'}}/></div>
    </div>)}
    <div style={{position:'absolute',inset:0,transformStyle:'preserve-3d',transformOrigin:'left center',transform:'translateZ('+(depth/2)+'px) rotateY('+(turned>0?-179:0)+'deg)',transition:'transform .75s cubic-bezier(.3,.7,.2,1)',pointerEvents:'none'}}>
      <div style={face({inset:0,backgroundColor:book.colors[0],backgroundImage:'url('+cover+')',backgroundSize:'cover',backgroundPosition:'center',boxShadow:'inset 0 0 0 2px #ffffff20'})}/>
      <div style={face({inset:0,transform:'rotateY(180deg)',background:'#e4dcc8'})}/>
    </div>
    <div style={{position:'absolute',left:0,top:0,bottom:0,width:'9%',transform:'translateZ('+(depth/2+1)+'px)',background:'linear-gradient(90deg,#0008,#fff2 35%,transparent)'}}/>
  </div>
}

function ShelfBook({ book, onOpen }: { book: Book; onOpen: (book: Book) => void }) {
  const [rotation,setRotation] = useState(22)
  const [active,setActive] = useState(false)
  return <button type="button" className="book-shelf-item" onClick={()=>onOpen(book)} onPointerMove={e=>{if(e.pointerType==='touch')return;const r=e.currentTarget.getBoundingClientRect();setRotation(22+((e.clientX-r.left)/r.width-.5)*35);setActive(true)}} onPointerLeave={()=>{setRotation(22);setActive(false)}} aria-label={'Open '+book.title}>
    <span className="book-shelf-object"><BookObject book={book} size={112} rotation={rotation} dragging={active}/></span>
    <span className="book-shelf-copy"><strong>{book.title}</strong><small>{book.author}</small><small>{book.year}</small></span>
  </button>
}

function BookViewer({ book, onClose }: { book: Book; onClose:()=>void }) {
  const [turned,setTurned]=useState(0)
  const [rotation,setRotation]=useState(22)
  const [dragging,setDragging]=useState(false)
  const drag=useRef<{x:number;y:number;rotation:number}|null>(null)
  const size=Math.max(150,Math.min(310,(typeof window==='undefined'?600:window.innerWidth-50)/2.3))
  const count=book.pages/2
  const next=useCallback(()=>setTurned(v=>Math.min(count+1,v+1)),[count])
  const prev=useCallback(()=>setTurned(v=>Math.max(0,v-1)),[])
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();if(e.key==='ArrowRight')next();if(e.key==='ArrowLeft')prev()};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[onClose,next,prev])
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
    <div className="book-viewer-meta"><strong>{book.title}</strong><span>{book.author} · {book.year}</span><small>{label}</small></div>
    <div className="book-viewer-controls">
      <button style={buttonStyle} onClick={()=>setTurned(v=>v===0?1:0)}>{turned?'Close book':'Open book'}</button>
      <button style={buttonStyle} disabled={turned===0} onClick={prev}>← Previous</button>
      <button style={buttonStyle} disabled={turned>count} onClick={next}>Next →</button>
    </div>
    <small className="book-viewer-hint">Drag to rotate · use arrow keys to turn pages</small>
  </div>
}

export default function BookShelf() {
  const [collection,setCollection]=useState<'All'|'Shakespeare'|'Death Note'>('All')
  const [selected,setSelected]=useState<Book|null>(null)
  const close=useCallback(()=>setSelected(null),[])
  const books=collection==='Shakespeare'?SHAKESPEARE:collection==='Death Note'?DEATH_NOTE:ALL_BOOKS
  return <section className="book-shelf">
    <div className="book-shelf-toolbar"><div><strong>Books</strong><span>{books.length} volumes</span></div><nav aria-label="Book collection filter">{(['All','Shakespeare','Death Note'] as const).map(item=><button key={item} className={collection===item?'active':''} onClick={()=>setCollection(item)}>{item}</button>)}</nav></div>
    <div className="book-shelf-grid">{books.map(book=><ShelfBook key={book.id} book={book} onOpen={setSelected}/>)}</div>
    {selected&&<BookViewer key={selected.id} book={selected} onClose={close}/>}
  </section>
}
