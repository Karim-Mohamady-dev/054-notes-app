import { useEffect, useMemo, useState } from 'react'
import {
  ClipboardText,
  Folder,
  FolderPlus,
  Globe,
  GridFour,
  Heart,
  List,
  MagnifyingGlass,
  NotePencil,
  Plus,
  Star,
  Trash,
  X,
} from '@phosphor-icons/react'
import { loadLang, loadStored, saveStored, translate, uid, type Lang } from './lib/i18n'

interface Note {
  id: string
  title: string
  body: string
  tags: string[]
  folder: string
  favorite: boolean
  createdAt: number
  updatedAt: number
}

const DEMO_NOTES: Note[] = [
  {
    id: 'demo-1',
    title: 'Weekend shopping list',
    body: 'Olive oil, fresh bread, lemons, mint, and yoghurt. Check the pantry before buying rice.',
    tags: ['home', 'shopping'],
    folder: 'personal',
    favorite: true,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'demo-2',
    title: 'Ideas for the kids channel',
    body: 'A song about the colours of the sea. A short story where Nono counts to ten with shells on the beach.',
    tags: ['ideas', 'channel'],
    folder: 'ideas',
    favorite: false,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'demo-3',
    title: 'Meeting notes, Monday',
    body: 'Confirm the delivery date with the supplier. Send the updated price list to the team before Thursday.',
    tags: ['work'],
    folder: 'work',
    favorite: false,
    createdAt: Date.now() - 43200000,
    updatedAt: Date.now() - 7200000,
  },
]

const DEFAULT_FOLDERS = ['personal', 'work', 'ideas']

type SortKey = 'newest' | 'oldest' | 'title'

function wordCount(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean)
  return words.length
}

function fmtDate(ts: number, lang: Lang): string {
  return new Date(ts).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => loadLang('notely-lang'))
  const t = (key: string) => translate(lang, key)
  const [notes, setNotes] = useState<Note[]>(() => loadStored('notely-notes', DEMO_NOTES))
  const [folders, setFolders] = useState<string[]>(() => loadStored('notely-folders', DEFAULT_FOLDERS))
  const [query, setQuery] = useState('')
  const [folderFilter, setFolderFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [favOnly, setFavOnly] = useState(false)
  const [sort, setSort] = useState<SortKey>('newest')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [editing, setEditing] = useState<Note | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const [draftTags, setDraftTags] = useState('')
  const [draftFolder, setDraftFolder] = useState('personal')
  const [draftError, setDraftError] = useState('')
  const [newFolder, setNewFolder] = useState('')
  const [showFolderForm, setShowFolderForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    saveStored('notely-lang', lang)
  }, [lang])
  useEffect(() => saveStored('notely-notes', notes), [notes])
  useEffect(() => saveStored('notely-folders', folders), [folders])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    notes.forEach((n) => n.tags.forEach((tag) => set.add(tag)))
    return [...set].sort()
  }, [notes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let out = notes.filter((n) => {
      if (folderFilter !== 'all' && n.folder !== folderFilter) return false
      if (favOnly && !n.favorite) return false
      if (tagFilter && !n.tags.includes(tagFilter)) return false
      if (!q) return true
      return (
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        n.folder.toLowerCase().includes(q)
      )
    })
    out = [...out].sort((a, b) => {
      if (sort === 'newest') return b.updatedAt - a.updatedAt
      if (sort === 'oldest') return a.updatedAt - b.updatedAt
      return a.title.localeCompare(b.title, lang === 'ar' ? 'ar' : 'en')
    })
    return out
  }, [notes, query, folderFilter, favOnly, tagFilter, sort, lang])

  function openNew() {
    setIsNew(true)
    setDraftTitle('')
    setDraftBody('')
    setDraftTags('')
    setDraftFolder(folders[0] ?? 'personal')
    setDraftError('')
    setEditing({ id: uid(), title: '', body: '', tags: [], folder: folders[0] ?? 'personal', favorite: false, createdAt: Date.now(), updatedAt: Date.now() })
  }

  function openEdit(note: Note) {
    setIsNew(false)
    setDraftTitle(note.title)
    setDraftBody(note.body)
    setDraftTags(note.tags.join(', '))
    setDraftFolder(note.folder)
    setDraftError('')
    setEditing(note)
  }

  function saveNote() {
    if (!draftTitle.trim()) {
      setDraftError(t('titleRequired'))
      return
    }
    if (!editing) return
    const tags = draftTags.split(',').map((tag) => tag.trim()).filter(Boolean)
    const saved: Note = {
      ...editing,
      title: draftTitle.trim(),
      body: draftBody.trim(),
      tags,
      folder: draftFolder,
      updatedAt: Date.now(),
    }
    setNotes((prev) => (isNew ? [saved, ...prev] : prev.map((n) => (n.id === saved.id ? saved : n))))
    setEditing(null)
    setNotice('')
  }

  function addFolder() {
    const name = newFolder.trim().toLowerCase().replace(/\s+/g, '-')
    if (!name || folders.includes(name)) return
    setFolders((prev) => [...prev, name])
    setNewFolder('')
    setShowFolderForm(false)
    setFolderFilter(name)
  }

  function copyNote(note: Note) {
    const text = `${note.title}\n\n${note.body}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => setNotice(t('copied'))).catch(() => setNotice(''))
    }
  }

  function downloadNote(note: Note) {
    const blob = new Blob([`${note.title}\n\n${note.body}`], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${note.title.replace(/[^\w\- ]/g, '').trim().replace(/\s+/g, '-') || 'note'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold">
        {t('skipToContent')}
      </a>
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 pt-8">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#181818] text-white">
            <NotePencil size={24} weight="fill" />
          </span>
          <div>
            <p className="title-1 font-semibold">{t('appName')}</p>
            <p className="caption-2 text-neutral-500">{t('appTagline')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openNew}
            className="flex items-center gap-2 rounded-full bg-[#b45309] px-4 py-2 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#92400e]"
          >
            <Plus size={18} />
            {t('addNote')}
          </button>
          <button
            type="button"
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold transition-colors duration-300 hover:bg-neutral-100"
            aria-label={t('language')}
          >
            <Globe size={18} />
            {lang === 'en' ? t('arabic') : t('english')}
          </button>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-4 pb-16 pt-8">
        {notice && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl bg-[#d1fae5] px-4 py-3 text-sm font-medium text-[#065f46]" role="status">
            {notice}
            <button type="button" onClick={() => setNotice('')} className="ms-auto text-xs font-semibold underline">{t('close')}</button>
          </div>
        )}

        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <MagnifyingGlass size={18} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <label className="sr-only" htmlFor="search">{t('searchPlaceholder')}</label>
            <input
              id="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full rounded-2xl border border-neutral-300 bg-white py-3 pe-4 ps-11 text-base outline-none focus:border-[#b45309]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="caption-4 text-neutral-500" htmlFor="sort">{t('sortLabel')}</label>
            <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="rounded-full border border-neutral-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-[#b45309]">
              <option value="newest">{t('sortNewest')}</option>
              <option value="oldest">{t('sortOldest')}</option>
              <option value="title">{t('sortTitle')}</option>
            </select>
            <div className="flex rounded-full border border-neutral-300 bg-white p-1" role="group" aria-label={t('viewLabel')}>
              <button type="button" onClick={() => setView('grid')} aria-pressed={view === 'grid'} className={`rounded-full p-2 ${view === 'grid' ? 'bg-[#181818] text-white' : 'text-neutral-500'}`} aria-label={t('grid')}>
                <GridFour size={18} />
              </button>
              <button type="button" onClick={() => setView('list')} aria-pressed={view === 'list'} className={`rounded-full p-2 ${view === 'list' ? 'bg-[#181818] text-white' : 'text-neutral-500'}`} aria-label={t('list')}>
                <List size={18} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setFavOnly(!favOnly)}
              aria-pressed={favOnly}
              className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors duration-300 ${favOnly ? 'bg-[#fef3c7] text-[#92400e]' : 'border border-neutral-300 bg-white text-neutral-600'}`}
            >
              <Star size={18} weight={favOnly ? 'fill' : 'regular'} />
              {t('favorites')}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-56" aria-label={t('allFolders')}>
            <p className="title-3 font-semibold">{t('folder')}</p>
            <ul className="mt-3 space-y-1">
              <li>
                <button type="button" onClick={() => { setFolderFilter('all'); setTagFilter(null) }} aria-current={folderFilter === 'all' ? 'true' : undefined} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-300 ${folderFilter === 'all' ? 'bg-[#181818] text-white' : 'hover:bg-neutral-200'}`}>
                  <Folder size={18} />
                  {t('allFolders')} ({notes.length})
                </button>
              </li>
              {folders.map((folder) => (
                <li key={folder}>
                  <button type="button" onClick={() => setFolderFilter(folder)} aria-current={folderFilter === folder ? 'true' : undefined} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-300 ${folderFilter === folder ? 'bg-[#181818] text-white' : 'hover:bg-neutral-200'}`}>
                    <Folder size={18} />
                    <span className="min-w-0 flex-1 truncate text-start">{folder}</span>
                    <span className="caption-4 opacity-70">{notes.filter((n) => n.folder === folder).length}</span>
                  </button>
                </li>
              ))}
            </ul>
            {showFolderForm ? (
              <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); addFolder() }}>
                <label className="sr-only" htmlFor="folder-name">{t('folderNamePlaceholder')}</label>
                <input id="folder-name" value={newFolder} onChange={(e) => setNewFolder(e.target.value)} placeholder={t('folderNamePlaceholder')} className="min-w-0 flex-1 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#b45309]" />
                <button type="submit" className="rounded-full bg-[#181818] px-3 py-2 text-xs font-semibold text-white">{t('addFolder')}</button>
              </form>
            ) : (
              <button type="button" onClick={() => setShowFolderForm(true)} className="mt-3 flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[#92400e] transition-colors duration-300 hover:bg-[#fef3c7]">
                <FolderPlus size={18} />
                {t('addFolder')}
              </button>
            )}
            {allTags.length > 0 && (
              <div className="mt-8">
                <p className="title-3 font-semibold">{t('tags')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                      aria-pressed={tagFilter === tag}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-300 ${tagFilter === tag ? 'bg-[#b45309] text-white' : 'bg-white text-neutral-600 hover:bg-neutral-200'}`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <section className="min-w-0 flex-1" aria-label={t('allNotes')}>
            <p className="caption-2 text-neutral-500">{filtered.length} {t('notesCount')}</p>
            {notes.length === 0 ? (
              <div className="mt-4 rounded-3xl border border-neutral-300 bg-white px-6 py-12 text-center">
                <NotePencil size={32} className="mx-auto text-neutral-400" />
                <p className="title-1 mt-4 font-semibold">{t('noNotes')}</p>
                <p className="body-3 mt-2 text-neutral-600">{t('noNotesBody')}</p>
                <button type="button" onClick={openNew} className="mt-6 rounded-full bg-[#181818] px-6 py-3 text-base font-semibold text-white">{t('newNote')}</button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="mt-4 rounded-3xl border border-neutral-300 bg-white px-6 py-12 text-center">
                <MagnifyingGlass size={32} className="mx-auto text-neutral-400" />
                <p className="title-1 mt-4 font-semibold">{t('noResults')}</p>
                <p className="body-3 mt-2 text-neutral-600">{t('noResultsBody')}</p>
              </div>
            ) : (
              <div className={view === 'grid' ? 'mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'mt-4 space-y-3'}>
                {filtered.map((note) => (
                  <article key={note.id} className="flex flex-col rounded-3xl border border-neutral-200 bg-white p-6 transition-transform duration-500 hover:-translate-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="title-1 min-w-0 flex-1 font-semibold">{note.title}</h3>
                      <button
                        type="button"
                        onClick={() => setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, favorite: !n.favorite } : n)))}
                        aria-label={t('favorite')}
                        aria-pressed={note.favorite}
                        className="shrink-0 rounded-full p-1 text-[#b45309] transition-colors duration-300 hover:bg-[#fef3c7]"
                      >
                        <Star size={20} weight={note.favorite ? 'fill' : 'regular'} />
                      </button>
                    </div>
                    <p className="body-3 mt-2 line-clamp-4 flex-1 whitespace-pre-wrap text-neutral-600">{note.body}</p>
                    {note.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {note.tags.map((tag) => (
                          <button key={tag} type="button" onClick={() => setTagFilter(tag)} className="rounded-full bg-[#fef3c7] px-2 py-1 text-xs font-semibold text-[#92400e]">#{tag}</button>
                        ))}
                      </div>
                    )}
                    <p className="caption-4 mt-4 text-neutral-400">
                      {note.folder} · {t('updated')} {fmtDate(note.updatedAt, lang)} · {wordCount(note.body)} {t('words')}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
                      <button type="button" onClick={() => openEdit(note)} className="rounded-full bg-[#181818] px-3 py-2 text-xs font-semibold text-white">{t('editNote')}</button>
                      <button type="button" onClick={() => copyNote(note)} className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-2 text-xs font-semibold">
                        <ClipboardText size={14} />
                        {t('copy')}
                      </button>
                      <button type="button" onClick={() => downloadNote(note)} className="rounded-full bg-neutral-100 px-3 py-2 text-xs font-semibold">.txt</button>
                      {confirmDelete === note.id ? (
                        <span className="flex items-center gap-2">
                          <button type="button" onClick={() => { setNotes((prev) => prev.filter((n) => n.id !== note.id)); setConfirmDelete(null) }} className="rounded-full bg-[#a83232] px-3 py-2 text-xs font-semibold text-white">{t('delete')}</button>
                          <button type="button" onClick={() => setConfirmDelete(null)} className="rounded-full bg-neutral-100 px-3 py-2 text-xs font-semibold">{t('cancel')}</button>
                        </span>
                      ) : (
                        <button type="button" onClick={() => setConfirmDelete(note.id)} aria-label={t('delete')} className="ms-auto rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-[#a83232]">
                          <Trash size={16} />
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={t('editNote')}>
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="heading-5">{isNew ? t('newNote') : t('editNote')}</h2>
              <button type="button" onClick={() => setEditing(null)} aria-label={t('close')} className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100">
                <X size={20} />
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <label className="title-3 font-medium" htmlFor="note-title">{t('noteTitle')}</label>
                <input id="note-title" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder={t('titlePlaceholder')} className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-[#b45309]" />
              </div>
              <div>
                <label className="title-3 font-medium" htmlFor="note-body">{t('noteBody')}</label>
                <textarea id="note-body" value={draftBody} onChange={(e) => setDraftBody(e.target.value)} placeholder={t('bodyPlaceholder')} rows={8} className="mt-2 w-full resize-y rounded-2xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-[#b45309]" />
                <p className="caption-4 mt-1 text-neutral-400">{wordCount(draftBody)} {t('words')}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="title-3 font-medium" htmlFor="note-tags">{t('tags')}</label>
                  <input id="note-tags" value={draftTags} onChange={(e) => setDraftTags(e.target.value)} placeholder={t('tagPlaceholder')} className="mt-2 w-full rounded-2xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-[#b45309]" />
                </div>
                <div>
                  <label className="title-3 font-medium" htmlFor="note-folder">{t('folder')}</label>
                  <select id="note-folder" value={draftFolder} onChange={(e) => setDraftFolder(e.target.value)} className="mt-2 w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-[#b45309]">
                    {folders.map((folder) => (
                      <option key={folder} value={folder}>{folder}</option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={editing.favorite} onChange={(e) => setEditing({ ...editing, favorite: e.target.checked })} className="h-5 w-5 accent-[#b45309]" />
                <span className="body-5 flex items-center gap-2"><Heart size={16} />{t('favorite')}</span>
              </label>
              {draftError && <p className="text-sm font-medium text-[#a83232]" role="alert">{draftError}</p>}
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="rounded-full bg-neutral-100 px-6 py-3 text-base font-semibold">{t('cancel')}</button>
                <button type="button" onClick={saveNote} className="rounded-full bg-[#181818] px-6 py-3 text-base font-semibold text-white">{t('save')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-neutral-200 py-8 text-center">
        <p className="caption-2 text-neutral-500">{t('footerNote')}</p>
      </footer>
    </div>
  )
}
