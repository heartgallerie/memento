import { useEffect, useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, Plus, Settings2, X } from 'lucide-react'

type ScrapPage = { id:string; title:string; text:string; image:string }
type ScrapData = { title:string; subtitle:string; cover:string; pages:ScrapPage[] }
const KEY='memento.scrapbook'
const makePage=(n:number):ScrapPage=>({id:'page-'+n+'-'+Date.now(),title:'',text:'',image:''})
const initial:ScrapData={title:'Scrapbook',subtitle:'A collection of little things.',cover:'',pages:[makePage(1),makePage(2)]}

export default function Scrapbook(){
 const [data,setData]=useState<ScrapData>(()=>{try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');return saved&&Array.isArray(saved.pages)?{...initial,...saved,pages:saved.pages.length?saved.pages:[makePage(1),makePage(2)]}:initial}catch{return initial}})
 const [opened,setOpened]=useState(false),[page,setPage]=useState(0),[settings,setSettings]=useState(false),[jump,setJump]=useState('1')
 useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch{/* Browser storage can be full. */}},[data])
 const total=data.pages.length
 const spread=Math.min(Math.floor(page/2),Math.max(0,Math.ceil(total/2)-1))
 const leftIndex=spread*2,rightIndex=spread*2+1
 const updatePage=(index:number,patch:Partial<ScrapPage>)=>setData(v=>({...v,pages:v.pages.map((p,i)=>i===index?{...p,...patch}:p)}))
 const addPage=()=>{const next=data.pages.length;setData(v=>({...v,pages:[...v.pages,makePage(v.pages.length+1)]}));setPage(next);setOpened(true)}
 const go=(n:number)=>{const target=Math.max(1,Math.min(total,Math.floor(Number(n)||1)));setPage(target-1);setJump(String(target));setOpened(true)}
 const pageNumber=page+1
 const pageEditor=(index:number)=>{const p=data.pages[index];if(!p)return <div className="scrapbook-blank"><span>Endpaper</span></div>;return <div className="scrapbook-paper"><input aria-label="Page title" value={p.title} onChange={e=>updatePage(index,{title:e.target.value})} placeholder="A little title…"/><textarea aria-label="Page contents" value={p.text} onChange={e=>updatePage(index,{text:e.target.value})} placeholder="Write, collect, remember…"/><input className="scrapbook-image-input" aria-label="Image URL" value={p.image} onChange={e=>updatePage(index,{image:e.target.value})} placeholder="Add an image URL (optional)"/>{p.image&&<img className="scrapbook-page-image" src={p.image} alt="Scrapbook page" onError={e=>{e.currentTarget.style.display='none'}}/>}<small>{index+1}</small></div>}
 return <section className="scrapbook-page">
  <header className="scrapbook-heading"><div><div className="eyebrow"><BookOpen size={14}/> YOUR JOURNAL</div><h1>Scrapbook</h1><p>A book for pictures, notes and little things worth keeping.</p></div><button type="button" className="scrapbook-settings-button" onClick={()=>setSettings(v=>!v)}><Settings2 size={15}/> Cover settings</button></header>
  {settings&&<div className="scrapbook-settings"><label>Book title<input value={data.title} onChange={e=>setData(v=>({...v,title:e.target.value}))}/></label><label>Subtitle<input value={data.subtitle} onChange={e=>setData(v=>({...v,subtitle:e.target.value}))}/></label><label>Cover image URL<input value={data.cover} onChange={e=>setData(v=>({...v,cover:e.target.value}))} placeholder="https://…"/></label><button type="button" onClick={()=>setSettings(false)}><X size={14}/> Close</button></div>}
  {!opened?<div className="scrapbook-cover-stage"><button type="button" className="scrapbook-cover" onClick={()=>setOpened(true)} style={data.cover?{backgroundImage:'linear-gradient(135deg,#0002,#0007),url('+data.cover+')'}:undefined}><span className="scrapbook-cover-spine"/><span className="scrapbook-cover-title">{data.title||'Scrapbook'}</span><span className="scrapbook-cover-subtitle">{data.subtitle}</span><span className="scrapbook-cover-open">Open book <BookOpen size={15}/></span></button></div>
  :<><div className="scrapbook-book-stage"><div className="scrapbook-book-spread"><div className="scrapbook-book-page scrapbook-left-page">{pageEditor(leftIndex)}</div><div className="scrapbook-book-page scrapbook-right-page">{pageEditor(rightIndex)}</div></div></div><div className="scrapbook-reader-controls"><button type="button" onClick={()=>setOpened(false)}><BookOpen size={14}/> Close book</button><button type="button" disabled={page<=0} onClick={()=>{setPage(v=>Math.max(0,v-2));setJump(String(Math.max(1,page-1)))}}><ChevronLeft size={15}/> Previous</button><span>Page {pageNumber} of {total}</span><button type="button" disabled={page>=total-1} onClick={()=>{setPage(v=>Math.min(total-1,v+2));setJump(String(Math.min(total,page+3)))}}>Next <ChevronRight size={15}/></button><form onSubmit={e=>{e.preventDefault();go(jump)}}><label htmlFor="scrapbook-jump">Go to</label><input id="scrapbook-jump" type="number" min="1" max={total} value={jump} onChange={e=>setJump(e.target.value)}/><button type="submit">Go</button></form></div></>}
  <div className="scrapbook-footer"><span>{total} pages · saved in this browser</span><button type="button" onClick={addPage}><Plus size={15}/> Add a page</button></div>
 </section>
}
