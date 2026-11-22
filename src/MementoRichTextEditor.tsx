import { useMemo, type DragEventHandler, type Ref } from 'react'
import { Highlighter, ImagePlus, ListChecks } from 'lucide-react'
import { RichTextEditor, RichTextEditorToolbar, type RichTextEditorRef } from '@astryxdesign/richtext'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { $patchStyleText } from '@lexical/selection'
import { CodeHighlightNode, CodeNode } from '@lexical/code'
import { AutoLinkNode, LinkNode } from '@lexical/link'
import { HorizontalRuleNode } from '@lexical/extension'
import { ListItemNode, ListNode, $createListItemNode, $createListNode, $isListItemNode, $isListNode } from '@lexical/list'
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { $createParagraphNode, $createTextNode, $getRoot, $getSelection, $isRangeSelection } from 'lexical'
import { createHeadlessEditor } from '@lexical/headless'

const IMPORT_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  CodeNode,
  CodeHighlightNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  HorizontalRuleNode,
]

export function htmlToLexicalState(html: string): string {
  const documentForImport = new DOMParser().parseFromString(html || '', 'text/html')
  const legacyChecklists = Array.from(documentForImport.querySelectorAll('ul.entry-checklist')).map(list => ({
    text: (list.textContent || '').replace(/\\s+/g, ' ').trim(),
    checked: Array.from(list.querySelectorAll(':scope > li')).map(item => {
      const checkbox = item.querySelector(':scope > input[type="checkbox"]') as HTMLInputElement | null
      const checked = checkbox?.checked || checkbox?.hasAttribute('checked') || item.getAttribute('aria-checked') === 'true' || item.getAttribute('data-checked') === 'true'
      checkbox?.remove()
      item.removeAttribute('role')
      item.removeAttribute('aria-checked')
      item.removeAttribute('data-checked')
      return checked
    }),
  }))

  const editor = createHeadlessEditor({
    namespace: 'memento-html-import',
    nodes: IMPORT_NODES,
    onError(error) { throw error },
  })
  editor.update(() => {
    const root = $getRoot()
    root.clear()
    const nodes = $generateNodesFromDOM(editor, documentForImport)
    if (nodes.length) root.append(...nodes)
    else root.append($createParagraphNode())
    const lists: ListNode[] = []
    const visit = (node: any) => {
      if ($isListNode(node)) lists.push(node)
      if (typeof node.getChildren === 'function') node.getChildren().forEach(visit)
    }
    root.getChildren().forEach(visit)
    for (const legacy of legacyChecklists) {
      const list = lists.find(candidate =>
        candidate.getListType() !== 'check' &&
        candidate.getTextContent().replace(/\\s+/g, ' ').trim() === legacy.text &&
        candidate.getChildrenSize() === legacy.checked.length
      )
      if (!list) continue
      list.setListType('check')
      list.getChildren().forEach((item, index) => {
        if ($isListItemNode(item)) item.setChecked(legacy.checked[index] === true)
      })
    }
  }, { discrete: true })
  return JSON.stringify(editor.getEditorState().toJSON())
}

export function htmlWithMementoChecklists(html: string, liveRoot: HTMLElement | null): string {
  const template = document.createElement('template')
  template.innerHTML = html
  const liveTasks = liveRoot ? Array.from(liveRoot.querySelectorAll<HTMLLIElement>('li[data-richtext-task]')) : []
  const outputItems = Array.from(template.content.querySelectorAll<HTMLLIElement>('li'))
  let outputCursor = 0
  for (const sourceItem of liveTasks) {
    const sourceText = (sourceItem.textContent || '').replace(/\\s+/g, ' ').trim()
    let outputItem: HTMLLIElement | undefined
    for (let i = outputCursor; i < outputItems.length; i++) {
      if ((outputItems[i].textContent || '').replace(/\\s+/g, ' ').trim() === sourceText) {
        outputItem = outputItems[i]
        outputCursor = i + 1
        break
      }
    }
    if (!outputItem) continue
    const checkboxId = sourceItem.getAttribute('aria-owns')
    const checkbox = checkboxId ? document.getElementById(checkboxId)?.querySelector('input[type="checkbox"]') as HTMLInputElement | null : null
    const checked = checkbox?.checked ?? sourceItem.getAttribute('aria-checked') === 'true'
    outputItem.dataset.mementoTask = 'true'
    outputItem.dataset.checked = checked ? 'true' : 'false'
    outputItem.setAttribute('role', 'checkbox')
    outputItem.setAttribute('aria-checked', checked ? 'true' : 'false')
    const list = outputItem.parentElement
    if (list?.tagName === 'UL') list.classList.add('entry-checklist')
    if (!outputItem.querySelector(':scope > input[type="checkbox"]')) {
      const input = document.createElement('input')
      input.type = 'checkbox'
      input.setAttribute('contenteditable', 'false')
      input.setAttribute('aria-label', 'Mark checklist item complete')
      input.checked = checked
      if (checked) input.setAttribute('checked', '')
      outputItem.insertBefore(input, outputItem.firstChild)
    }
  }
  template.content.querySelectorAll('ul[data-lexical-list-type="check"]').forEach(list => {
    list.classList.add('entry-checklist')
    list.querySelectorAll(':scope > li').forEach(item => {
      if (item.querySelector(':scope > input[type="checkbox"]')) return
      const checked = item.getAttribute('aria-checked') === 'true' || item.getAttribute('data-checked') === 'true'
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.setAttribute('contenteditable', 'false')
      checkbox.setAttribute('aria-label', 'Mark checklist item complete')
      checkbox.checked = checked
      if (checked) checkbox.setAttribute('checked', '')
      item.insertBefore(checkbox, item.firstChild)
    })
  })
  template.content.querySelectorAll('sup').forEach(marker => {
    const number = Number((marker.textContent || '').trim())
    if (Number.isInteger(number) && number > 0) {
      marker.classList.add('entry-footnote-ref')
      marker.dataset.footnote = String(number)
    }
  })
  template.content.querySelectorAll('a[href]').forEach(link => {
    link.classList.add('entry-inline-link')
    if (!link.dataset.linkPreview) link.dataset.linkPreview = link.href
    if (!link.querySelector('svg')) {
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      icon.setAttribute('viewBox', '0 0 24 24')
      icon.setAttribute('width', '13')
      icon.setAttribute('height', '13')
      icon.setAttribute('fill', 'none')
      icon.setAttribute('stroke', 'currentColor')
      icon.setAttribute('stroke-width', '2')
      icon.setAttribute('stroke-linecap', 'round')
      icon.setAttribute('stroke-linejoin', 'round')
      icon.setAttribute('aria-hidden', 'true')
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('d', 'M7 17 17 7M7 7h10v10')
      icon.append(path)
      link.append(icon)
    }
  })
  return template.innerHTML
}

function MementoToolbarExtras({ highlightColor, onHighlightColorChange, onAddFiles }: {
  highlightColor: string
  onHighlightColorChange: (color: string) => void
  onAddFiles: (files: FileList | null) => void
}) {
  const [editor] = useLexicalComposerContext()
  const applyHighlight = (color: string) => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection) && !selection.isCollapsed()) {
        $patchStyleText(selection, { backgroundColor: color })
      }
    })
  }
  const insertChecklist = () => {
    editor.update(() => {
      const list = $createListNode('check')
      const item = $createListItemNode(false)
      item.append($createTextNode('Checklist item'))
      list.append(item)
      const selection = $getSelection()
      if ($isRangeSelection(selection)) selection.insertNodes([list])
      else $getRoot().append(list)
    })
  }
  const swatches = ['#fff2a8', '#bde8c8', '#c9ddff', '#f6c6d5', '#decaff']

  return (
    <div className="memento-astryx-toolbar-extras">
      <button type="button" title="Highlight selection" aria-label="Highlight selection" onMouseDown={event => event.preventDefault()} onClick={() => applyHighlight(highlightColor)}>
        <Highlighter size={16} />
      </button>
      <label className="memento-astryx-highlight-picker" title="Choose highlight colour">
        <span aria-hidden="true" style={{ background: highlightColor }} />
        <input type="color" aria-label="Choose highlight colour" value={highlightColor} onChange={event => { onHighlightColorChange(event.target.value); applyHighlight(event.target.value) }} />
      </label>
      {swatches.map(color => (
        <button key={color} type="button" className="memento-astryx-highlight-swatch" title={'Highlight ' + color} aria-label={'Highlight ' + color} style={{ background: color }} onMouseDown={event => event.preventDefault()} onClick={() => { onHighlightColorChange(color); applyHighlight(color) }} />
      ))}
      <button type="button" title="Insert checklist" aria-label="Insert checklist" onMouseDown={event => event.preventDefault()} onClick={insertChecklist}>
        <ListChecks size={16} />
      </button>
      <label className="memento-astryx-media-button" title="Attach media">
        <ImagePlus size={16} />
        <input type="file" multiple accept="image/*,video/*,audio/*" aria-label="Attach media" onChange={event => { onAddFiles(event.target.files); event.currentTarget.value = '' }} />
      </label>
    </div>
  )
}

export default function MementoRichTextEditor({
  editorRef,
  entryId,
  html,
  onChange,
  highlightColor,
  onHighlightColorChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onAddFiles,
  dragging = false,
}: {
  editorRef: Ref<RichTextEditorRef>
  entryId: number
  html: string
  onChange: (html: string) => void
  highlightColor: string
  onHighlightColorChange: (color: string) => void
  onDragOver: DragEventHandler<HTMLDivElement>
  onDragLeave: DragEventHandler<HTMLDivElement>
  onDrop: DragEventHandler<HTMLDivElement>
  onAddFiles: (files: FileList | null) => void
  dragging?: boolean
}) {
  const defaultValue = useMemo(() => htmlToLexicalState(html), [entryId])
  return (
    <div className={'memento-astryx-editor-wrap' + (dragging ? ' drag-active' : '')} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <RichTextEditor
        ref={editorRef}
        label="Journal entry"
        isLabelHidden
        className="memento-astryx-richtext"
        defaultValue={defaultValue}
        placeholder="Start writing…"
        minHeight="320px"
        toolbar={<RichTextEditorToolbar size="sm" endContent={<MementoToolbarExtras highlightColor={highlightColor} onHighlightColorChange={onHighlightColorChange} onAddFiles={onAddFiles} />} />}
        onChange={(editorState, editor) => {
          const html = editorState.read(() => $generateHtmlFromNodes(editor))
          onChange(htmlWithMementoChecklists(html, editor.getRootElement()))
        }}
      />
    </div>
  )
}
