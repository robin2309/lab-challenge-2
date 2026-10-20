import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Navbar from './Navbar'
import SidePanel from './SidePanel'
import SlotMenu, { type SlotMode } from './SlotMenu'
import ResourceDetail from './ResourceDetail'
import OwnResourceModal from './OwnResourceModal'
import GenerateModal from './GenerateModal'
import Stepper from './Stepper'
import ResourceCard from './ResourceCard'
import WaveCanvas from './WaveCanvas'
import { INTRO, appearAt, easeInOut, reducedMotion } from '../intro'
import { Circle, Star, Triangle } from './Decor'
import { LINE_EMPTY, type ColorStop } from './WaveCanvas'
import { IconX, TypeIcon } from './Icons'
import { alternativesFor, emptySlot, makeResource, ownResource, uid, type CatalogItem } from '../data/catalog'
import { TYPE_COLOR, type Course, type Resource, type ResourceType } from '../types'

/** Cible du menu du bas : remplacer une ressource, remplir un emplacement vide, ou ajouter en fin de séance. */
interface Target { mode: SlotMode; type: ResourceType; sessionId: string; id?: string; work?: string /* œuvre de la séance à respecter (résolution d'un conflit) */ }

const SPACING = 480   // distance entre deux emplacements sur la vague
const OFFSET = 340    // départ du premier emplacement après le début de séance
const START = 400     // début de la 1re séance (la zone défile sous le panneau latéral de 376 px)
const CY = 445        // axe de la vague
const AMP = 126       // amplitude
const NODE_R = 26
const SEP_GAP = 170   // distance entre la dernière ressource de la séance (demi-largeur 140 px) et le séparateur suivant ; reste < 180 pour que l’étiquette « Séance n » ne passe pas sous la 1re carte

/** Formes colorées derrière une ressource de ludopédagogie (dans le style des formes de la maquette). */
function LudoShape({ k, x, top, below }: { k: number; x: number; top: number; below: boolean }) {
  const c = TYPE_COLOR.ludo
  const v = k % 3
  // « below » : la carte est sous la ligne, la forme dépasse par le bas ; sinon elle dépasse par le haut
  const dy = (inner: number, size: number) => (below ? top + inner : top + 186 - inner - size)
  const common = { zIndex: 0, opacity: 0.75, animation: 'shape-in .45s cubic-bezier(.3,1.4,.5,1) both' } as const
  if (v === 0) return <Star color={c} style={{ ...common, left: x + 100, width: 160, height: 160, top: dy(70, 160) }} />
  if (v === 1) return <Circle color={c} style={{ ...common, left: x - 205, width: 130, height: 130, top: dy(50, 130) }} />
  return <Triangle color={c} style={{ ...common, left: x + 105, width: 140, height: 121, top: dy(60, 121) }} />
}

const waveY = (x: number, firstX: number) => CY + AMP * Math.cos((Math.PI * (x - firstX)) / SPACING)

interface Props {
  course: Course
  setCourse: (c: Course) => void
  onHome: () => void
  intro?: boolean   // joue la séquence d'apparition (arrivée depuis l'écran 1)
}

export default function TimelineScreen({ course, setCourse, onHome, intro = false }: Props) {
  const [active, setActive] = useState(course.sessions[course.sessions.length - 1]?.id ?? '')
  const [target, setTarget] = useState<Target | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [own, setOwn] = useState<Target | null>(null)
  const [genOpen, setGenOpen] = useState(false)
  const [genRun, setGenRun] = useState(false)
  const [passed, setPassed] = useState(0)
  const [genStep, setGenStep] = useState(0)
  const [pending, setPending] = useState<{ file: File; title: string; type: ResourceType } | null>(null)
  const [mine, setMine] = useState<CatalogItem[]>([]) // « Mes ressources » (en mémoire, le temps de la session)
  const [toast, setToast] = useState<{ msg: string; undo?: () => void } | null>(null)
  const trayOpen = !!target
  const [jump, setJump] = useState<string | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const [viewW, setViewW] = useState(1920)
  const [introOn, setIntroOn] = useState(intro && !reducedMotion())
  useEffect(() => {
    if (!introOn) return
    const id = window.setTimeout(() => setIntroOn(false), (INTRO.end + 0.4) * 1000)
    return () => window.clearTimeout(id)
  }, [introOn])
  // props d'animation d'une pièce de la timeline située en x (apparition quand l'ondulation l'atteint)
  const at = (x: number, extra = 0) => (introOn ? { className: 'in-fade', style: { animationDelay: `${(appearAt(x, viewW) + extra).toFixed(2)}s` } } : {})
  const delayed = (d: number) => (introOn ? { animationDelay: `${d}s` } : undefined)
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const ro = new ResizeObserver(() => setViewW(el.clientWidth))
    ro.observe(el); setViewW(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const toastTimer = useRef(0)
  const say = (msg: string, undo?: () => void) => {
    setToast({ msg, undo })
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), undo ? 6000 : 2600)
  }

  /* ---------- mutations ---------- */
  const mapSessions = (fn: (rs: Resource[], id: string) => Resource[]) =>
    setCourse({ ...course, sessions: course.sessions.map((s) => ({ ...s, resources: fn(s.resources, s.id) })) })

  const find = (id: string) => {
    for (const s of course.sessions) { const r = s.resources.find((x) => x.id === id); if (r) return { r, s } }
    return null
  }
  const rev = useRef(1)
  const addResource = (res: Resource, sessionId = active) => {
    mapSessions((rs, id) => (id === sessionId ? [...rs, res] : rs))
    setJump(res.id)
  }
  /** Remplace une ressource en place (la place et l’identifiant restent ceux de l’emplacement). */
  const putAt = (id: string, res: Resource, msg: string) => {
    const prev = course
    setCourse({ ...course, sessions: course.sessions.map((s) => ({ ...s, resources: s.resources.map((r) => (r.id === id ? { ...res, id } : r)) })) })
    say(msg, () => setCourse(prev))
  }
  const clearSlot = (id: string) => {
    const f = find(id); if (!f) return
    const prev = course
    setCourse({ ...course, sessions: course.sessions.map((s) => ({ ...s, resources: s.resources.map((r) => (r.id === id ? emptySlot(r.type, id) : r)) })) })
    setMenuClosed()
    say(`Emplacement vidé : « ${f.r.title} » retiré.`, () => setCourse(prev))
  }
  /** Ajoute un emplacement libre après la ressource n° idx de la séance, et ouvre le menu pour le remplir. */
  const insertAfter = (sessionId: string, idx: number) => {
    const slot = emptySlot('texte', uid())
    setCourse({ ...course, sessions: course.sessions.map((s) => (s.id === sessionId ? { ...s, resources: [...s.resources.slice(0, idx + 1), slot, ...s.resources.slice(idx + 1)] } : s)) })
    setActive(sessionId); setSelectedId(slot.id); setTarget({ mode: 'fill', type: 'texte', sessionId, id: slot.id }); setJump(slot.id)
  }
  const removeSlot = (id: string) => {
    mapSessions((rs) => rs.filter((r) => r.id !== id))
    if (selectedId === id) setSelectedId(null)
    if (target?.id === id) setTarget(null)
  }
  /** Fichier déposé / choisi depuis l’explorateur local : on prépare la ressource et on demande de confirmer titre, type, durée. */
  const importFile = (file: File, t: Target) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const type: ResourceType = file.type.startsWith('video/') || ['mp4', 'mov', 'webm'].includes(ext) ? 'video' : t.type
    setPending({ file, title: file.name.replace(/\.[^.]+$/, ''), type })
    setOwn(t)
  }
  /** Glisser-déposer depuis le Sommaire : déplace une ressource dans sa séance ou vers une autre. */
  const moveTo = (id: string, toSessionId: string, index: number) => {
    const prev = course
    const ss = course.sessions.map((s) => ({ ...s, resources: [...s.resources] }))
    const from = ss.find((s) => s.resources.some((r) => r.id === id)); const to = ss.find((s) => s.id === toSessionId)
    if (!from || !to) return
    const i = from.resources.findIndex((r) => r.id === id)
    const [r] = from.resources.splice(i, 1)
    const at = from === to && i < index ? index - 1 : index
    if (from === to && at === i) return
    to.resources.splice(Math.max(0, Math.min(at, to.resources.length)), 0, r)
    setCourse({ ...course, sessions: ss })
    setActive(toSessionId)
    say(from === to ? `« ${r.title} » déplacée.` : `« ${r.title} » déplacée vers la séance ${ss.indexOf(to) + 1}.`, () => setCourse(prev))
  }
  const setMenuClosed = () => { setTarget(null); setDetailId(null) }
  /** Document joint par le prof aux appareils pédagogiques d'une ressource. */
  const addAid = (id: string, file: File) => {
    const title = file.name.replace(/\.[^.]+$/, '')
    mapSessions((rs) => rs.map((r) => (r.id === id ? { ...r, aids: [...r.aids, { id: uid('a'), kind: 'document', title, items: [], file: file.name }] } : r)))
    say(`« ${title} » ajouté aux appareils pédagogiques.`)
  }
  const closeTray = useCallback(() => setTarget(null), [])
  const place = (t: Target, res0: Resource) => {
    const res = { ...res0, rev: ++rev.current } // la ressource la plus récemment choisie fait foi en cas d’incohérence
    if (t.mode === 'append') { addResource(res, t.sessionId); setSelectedId(res.id); say(`« ${res.title} » ajoutée à la séance ${course.sessions.findIndex((s) => s.id === t.sessionId) + 1}.`) }
    else if (t.id) { putAt(t.id, res, t.mode === 'replace' ? `Remplacée par « ${res.title} »${res.aids.length ? ' et ses appareils pédagogiques.' : '.'}` : `« ${res.title} » placée.`); setSelectedId(t.id) }
    setTarget(null)
  }
  const addSession = () => {
    const s = { id: uid('s'), resources: [] }
    setCourse({ ...course, sessions: [...course.sessions, s] })
    setActive(s.id); setTarget({ mode: 'append', type: 'texte', sessionId: s.id })
    setJump('end')
  }
  const deleteSession = (id: string) => {
    if (course.sessions.length === 1) return say('Un cours doit garder au moins une séance.')
    const rest = course.sessions.filter((s) => s.id !== id)
    setCourse({ ...course, sessions: rest })
    if (active === id) setActive(rest[rest.length - 1].id)
  }

  /* ---------- géométrie ---------- */
  const layout = useMemo(() => {
    const firstX = START + OFFSET
    let sx = START
    let g = 0
    const sessions = course.sessions.map((s) => {
      const slots = s.resources.map((r) => ({ r, x: firstX + SPACING * g++ }))
      // fin de séance : la dernière ressource, ou une place réservée si la séance est vide
      const phX = slots.length ? slots[slots.length - 1].x : firstX + SPACING * g++
      const out = { s, sx, slots, phX }
      sx = phX + SEP_GAP
      return out
    })
    const endX = sx + 60
    return { firstX, sessions, endX, width: Math.max(endX + 520, viewW) }
  }, [course.sessions, viewW])

  const innerW = trayOpen ? layout.width / 0.84 : layout.width

  /* couleurs de la ligne : une par emplacement (blanc si vide), en dégradé entre deux emplacements */
  const stopsKey = useMemo(() => {
    const st: ColorStop[] = []
    layout.sessions.forEach(({ slots, phX }) => {
      slots.forEach(({ r, x }) => st.push({ x, color: r.empty ? LINE_EMPTY : TYPE_COLOR[r.type] }))
      if (!slots.length) st.push({ x: phX, color: LINE_EMPTY })
    })
    if (st.length) st.unshift({ x: 0, color: st[0].color })
    return JSON.stringify(st)
  }, [layout])
  const lineStops = useMemo<ColorStop[]>(() => JSON.parse(stopsKey), [stopsKey])

  /* ---------- défilement fluide (easing) jusqu'à une position ---------- */
  const scrollAnim = useRef(0)
  const smoothScrollTo = (to: number) => {
    const sc = scroller.current; if (!sc) return
    cancelAnimationFrame(scrollAnim.current)
    const max = sc.scrollWidth - sc.clientWidth
    const target = Math.max(0, Math.min(max, to))
    const from = sc.scrollLeft
    const dist = target - from
    if (Math.abs(dist) < 2) return
    if (reducedMotion()) { sc.scrollLeft = target; return }
    const dur = Math.min(1300, 450 + Math.abs(dist) * 0.45)
    const t0 = performance.now()
    const stop = () => { cancelAnimationFrame(scrollAnim.current); sc.removeEventListener('wheel', stop); sc.removeEventListener('touchstart', stop) }
    sc.addEventListener('wheel', stop, { passive: true }); sc.addEventListener('touchstart', stop, { passive: true })
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur)
      sc.scrollLeft = from + dist * easeInOut(k)
      if (k < 1) scrollAnim.current = requestAnimationFrame(step)
      else stop()
    }
    scrollAnim.current = requestAnimationFrame(step)
  }

  /* ---------- scroll vers l'élément ajouté / choisi dans le sommaire ---------- */
  useEffect(() => {
    if (!jump || !scroller.current) return
    const el = jump === 'end' ? null : scroller.current.querySelector<HTMLElement>(`[data-rid="${jump}"]`)
    const target = el ? el.offsetLeft * (trayOpen ? 0.84 : 1) - 520 : scroller.current.scrollWidth
    smoothScrollTo(target)
    setJump(null)
  }, [jump, course])

  const ludoIdx = useMemo(() => {
    const m = new Map<string, number>(); let i = 0
    course.sessions.forEach((x) => x.resources.forEach((r) => { if (r.type === 'ludo' && !r.empty) m.set(r.id, i++) }))
    return m
  }, [course.sessions])

  const activeIdx = course.sessions.findIndex((s) => s.id === active)
  void activeIdx
  const subject = course.title
  const taken = useMemo(() => new Set(course.sessions.flatMap((x) => x.resources.filter((r) => !r.empty).map((r) => r.title))), [course.sessions])
  const targetSession = target ? course.sessions.find((x) => x.id === target.sessionId) : null
  const targetRes = target?.id ? find(target.id)?.r : undefined
  const fixWork = target?.work
  const alternatives = useMemo(
    () => (t: ResourceType): CatalogItem[] => {
      const list = [...mine.filter((m) => m.type === t && m.title !== targetRes?.title), ...alternativesFor(t, subject, taken, targetRes && !targetRes.empty ? targetRes.title : undefined)]
      // conflit : d'abord les ressources de l'œuvre de la séance, puis les neutres, en dernier celles qui recréeraient le conflit
      const rank = (c: CatalogItem) => (!fixWork ? 0 : c.work === fixWork ? 0 : c.work ? 2 : 1)
      return list.map((c, i) => ({ c, i })).sort((x, y) => rank(x.c) - rank(y.c) || x.i - y.i).map((x) => x.c).slice(0, 10)
    },
    [subject, taken, targetRes, mine, fixWork],
  )
  const detailRes = detailId ? find(detailId) : null

  // Échap : ferme la couche la plus haute (formulaire > vue détaillée > menu du bas > sélection)
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (genRun) setGenRun(false)
      else if (genOpen) setGenOpen(false)
      else if (own) setOwn(null)
      else if (detailId) setDetailId(null)
      else if (target) setTarget(null)
      else setSelectedId(null)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [genRun, genOpen, own, detailId, target])

  const selectCard = (id: string) => {
    const f = find(id); if (!f) return
    setActive(f.s.id)
    if (f.r.empty) { setSelectedId(id); setTarget({ mode: 'fill', type: f.r.type, sessionId: f.s.id, id }); setJump(id); return }
    if (selectedId === id) { setSelectedId(null); setTarget(null); return }
    setSelectedId(id)
    if (target && target.id !== id) setTarget(null)
  }
  const openReplace = (id: string, work?: string) => {
    const f = find(id); if (!f) return
    setDetailId(null); setActive(f.s.id)
    setTarget({ mode: 'replace', type: f.r.type, sessionId: f.s.id, id, work }); setJump(id)
  }
  const classShort = course.classe.replace(/[eè]me/i, 'e')

  /* ---------- détection de conflit : deux ressources voisines d’une séance qui portent sur des œuvres différentes ---------- */
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const xOf = useMemo(() => {
    const m = new Map<string, number>()
    layout.sessions.forEach((l) => l.slots.forEach((sl) => m.set(sl.r.id, sl.x)))
    return m
  }, [layout])
  const conflicts = useMemo(() => {
    const out: { key: string; a: Resource; b: Resource; anchor: Resource; stale: Resource }[] = []
    course.sessions.forEach((s) => {
      const list = s.resources.filter((r) => !r.empty)
      for (let i = 0; i < list.length - 1; i++) {
        const a = list[i], b = list[i + 1]
        if (!a.work || !b.work || a.work.id === b.work.id) continue
        const key = `${a.id}|${b.id}|${a.work.id}|${b.work.id}`
        if (dismissed.has(key)) continue
        const anchor = (a.rev ?? 0) > (b.rev ?? 0) ? a : b
        out.push({ key, a, b, anchor, stale: anchor === a ? b : a })
      }
    })
    return out
  }, [course.sessions, dismissed])
  const staleIds = new Set(conflicts.map((c) => c.stale.id))

  /* ---------- génération des supports : un point parcourt la timeline ---------- */
  const dotRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<SVGPathElement>(null)
  const order = useMemo(() => layout.sessions.flatMap((l) => l.slots.map((sl) => ({ id: sl.r.id, x: sl.x }))), [layout])
  const passedIds = useMemo(() => new Set(genRun ? order.slice(0, passed).map((o) => o.id) : []), [genRun, order, passed])
  const startGen = () => {
    setSelectedId(null); setTarget(null); setDetailId(null)
    if (reducedMotion()) { setGenOpen(true); return }
    setPassed(0); setGenStep(0); setGenRun(true)
  }
  useEffect(() => {
    if (!genRun) return
    const sc = scroller.current
    const x0 = 64, x1 = layout.endX
    const dur = Math.min(7, Math.max(3.2, (x1 - x0) / 750)) * 1000
    const t0 = performance.now()
    let raf = 0, lastPassed = 0, lastStep = 0
    const frame = () => {
      const p = easeInOut((performance.now() - t0) / dur)
      const x = x0 + (x1 - x0) * p
      const y = waveY(x, layout.firstX)
      if (dotRef.current) dotRef.current.style.transform = `translate(${x - 20}px, ${y - 20}px)`
      if (trailRef.current) {
        let d = `M${x0} ${waveY(x0, layout.firstX)}`
        for (let xx = x0 + 10; xx < x; xx += 10) d += ` L${xx} ${waveY(xx, layout.firstX)}`
        trailRef.current.setAttribute('d', d + ` L${x} ${y}`)
      }
      if (sc) sc.scrollLeft = Math.max(0, x - 820)
      const n = order.filter((o) => o.x - 60 <= x).length
      if (n !== lastPassed) { lastPassed = n; setPassed(n) }
      const st = p < 0.34 ? 0 : p < 0.67 ? 1 : 2
      if (st !== lastStep) { lastStep = st; setGenStep(st) }
      if (p >= 1) { setGenRun(false); setGenOpen(true); return }
      raf = requestAnimationFrame(frame)
    }
    frame()
    return () => cancelAnimationFrame(raf)
  }, [genRun])

  const isCrest = (x: number) => Math.round((x - layout.firstX) / SPACING) % 2 !== 0

  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <filter id="grain-shadow" x="-30%" y="-40%" width="160%" height="190%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="bg" />
          <feGaussianBlur in="SourceAlpha" stdDeviation="14" result="b" />
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="7" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0" result="na" />
          <feComposite in="b" in2="na" operator="arithmetic" k1="0" k2="1.7" k3="-1" k4="0" result="t" />
          <feComponentTransfer in="t" result="stip"><feFuncA type="linear" slope="30" intercept="0" /></feComponentTransfer>
          <feComposite in="bg" in2="stip" operator="in" />
        </filter>
      </svg>
      <Navbar logo="short" onHome={onHome} active="create" />

      <h1 className={'course-title' + (introOn ? ' in-fade' : '')} style={delayed(0.1)}>{course.title}</h1>
      <p className={'course-sub' + (introOn ? ' in-fade' : '')} style={delayed(0.2)}>Français {classShort} <span style={{ margin: '0 6px' }}>•</span> {course.sessions.length} séance{course.sessions.length > 1 ? 's' : ''} de {course.sessionMinutes} min.</p>

      <SidePanel
        className={introOn ? 'in-left' : ''} style={delayed(0.35)}
        course={course}
        onAddLudo={() => setTarget({ mode: 'append', type: 'ludo', sessionId: active })}
        onJump={(id) => { setJump(id); setSelectedId(id) }}
        onMove={moveTo}
        onGenerate={startGen}
        onJumpSession={(id) => {
          const l = layout.sessions.find((x) => x.s.id === id); if (!l) return
          setActive(id)
          smoothScrollTo(Math.max(0, (l.sx - 420) * (trayOpen ? 0.84 : 1)))
        }}
        hoverId={hoverId} selectedId={selectedId} onHover={setHoverId}
      />

      <div className="timeline-scroll" ref={scroller} onMouseDown={(e) => { if (!(e.target as HTMLElement).closest('.rcard, .session-tag-wrap, .add-session')) setSelectedId(null) }}>
        <div className="timeline-inner" style={{ width: innerW, transform: trayOpen ? 'translateY(-44px) scale(.84)' : undefined, transformOrigin: '0 150px', transition: 'transform .3s' }}>
          {/* vague */}
          <svg width={innerW} height={990} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
            {/* traits de liaison */}
            {layout.sessions.flatMap(({ slots }) => slots.map((s) => s.x)).map((x, i) => {
              const y = waveY(x, layout.firstX)
              const crest = isCrest(x)
              const fx = introOn ? { className: 'in-opacity', style: { animationDelay: `${appearAt(x, viewW).toFixed(2)}s` } } : {}
              return crest
                ? <line key={i} {...fx} x1={x} y1={y + NODE_R} x2={x - 6} y2={y + 196} stroke="#ecd9bb" strokeWidth="4" strokeLinecap="round" />
                : <line key={i} {...fx} x1={x} y1={y - NODE_R} x2={x + 8} y2={y - 190} stroke="#ecd9bb" strokeWidth="4" strokeLinecap="round" />
            })}
          </svg>
          <WaveCanvas width={innerW} viewW={viewW} height={990} cy={CY} amp={AMP} firstX={layout.firstX} spacing={SPACING} intro={introOn} stops={lineStops} />

          {genRun && (
            <>
              <svg width={innerW} height={990} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 7 }}>
                <path ref={trailRef} fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div ref={dotRef} className="gen-dot" aria-hidden />
            </>
          )}
          {conflicts.length > 0 && (
            <svg width={innerW} height={990} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
              {conflicts.map((c) => {
                const x0 = xOf.get(c.a.id) ?? 0, x1 = xOf.get(c.b.id) ?? 0
                let d = ''
                for (let x = x0; x <= x1; x += 6) d += `${d ? 'L' : 'M'}${x} ${waveY(x, layout.firstX)} `
                d += `L${x1} ${waveY(x1, layout.firstX)}`
                return <path key={c.key} className="conflict-seg" d={d} fill="none" stroke="#f0412e" strokeWidth="27" strokeLinecap="round" />
              })}
            </svg>
          )}
          {conflicts.map((c) => {
            const mx = ((xOf.get(c.a.id) ?? 0) + (xOf.get(c.b.id) ?? 0)) / 2
            const my = waveY(mx, layout.firstX)
            return (
              <div key={c.key} className="conflict-bubble" role="alert" style={{ left: mx - 175, top: my + 44 }}>
                <b>⚠ Cette séance n’est plus cohérente</b>
                <p>« {c.stale.title} » traite de <em>{c.stale.work!.label}</em>, alors que « {c.anchor.title} » porte désormais sur <em>{c.anchor.work!.label}</em>.</p>
                <div className="cb-actions">
                  <button className="btn primary small" onClick={() => openReplace(c.stale.id, c.anchor.work!.id)}>Remplacer</button>
                  <button className="btn ghost small" onClick={() => setDismissed(new Set(dismissed).add(c.key))}>Ignorer</button>
                </div>
              </div>
            )
          })}

          {layout.sessions.map(({ s, sx, slots, phX }, si) => {
            const isActive = s.id === active
            return (
              <div key={s.id}>
                <div className={'intro-wrap' + (introOn ? ' in-fade' : '')} style={introOn ? at(sx + 200).style : undefined}>
                <div className="session-line" style={{ left: sx }} />
                <div className="session-tag-wrap">
                  <button className={'session-tag' + (isActive ? ' active' : '')} style={{ left: sx + 4, top: 178 }} onClick={() => setActive(s.id)} title="Choisir cette séance pour les ajouts">
                    Séance {si + 1}
                  </button>
                  <button className="session-x" style={{ left: sx + 148, top: 166 }} onClick={() => deleteSession(s.id)} aria-label={`Supprimer la séance ${si + 1}`}><IconX size={12} /></button>
                </div>
                </div>

                {slots.map(({ x }, i) => {
                  if (conflicts.some((c) => c.a.id === slots[i].r.id)) return null
                  const mx = x + (i === slots.length - 1 ? SEP_GAP / 2 : SPACING / 2) // le dernier + reste avant le séparateur de séance
                  const my = waveY(mx, layout.firstX)
                  return (
                    <div key={'plus' + i} className={'intro-wrap' + (introOn ? ' in-fade' : '')} style={introOn ? at(mx).style : undefined}>
                      <button className="line-plus" style={{ left: mx - 28, top: my - 28 }} onClick={() => insertAfter(s.id, i)} aria-label="Ajouter un emplacement libre ici" title="Ajouter un emplacement libre">
                        <span>+</span>
                      </button>
                    </div>
                  )
                })}

                {slots.map(({ r, x }) => {
                  const y = waveY(x, layout.firstX)
                  const crest = isCrest(x)
                  const top = crest ? y + 200 : y - 416
                  return (
                    <div key={r.id} className={'intro-wrap' + (introOn ? ' in-fade' : '')} style={introOn ? at(x).style : undefined}>
                      {r.type === 'ludo' && !r.empty && <LudoShape k={ludoIdx.get(r.id) ?? 0} x={x} top={top} below={crest} />}
                      <ResourceCard resource={r} left={x - 140} top={top} hot={hoverId === r.id || selectedId === r.id} selected={selectedId === r.id}
                        onHover={(on) => setHoverId((h) => (on ? r.id : h === r.id ? null : h))}
                        onSelect={() => selectCard(r.id)} onConsult={() => setDetailId(r.id)} onReplace={() => openReplace(r.id)} onClear={() => clearSlot(r.id)} conflict={staleIds.has(r.id)} pulse={passedIds.has(r.id)}
                        onRemove={() => removeSlot(r.id)} onDropFile={(f) => importFile(f, { mode: 'fill', type: r.type, sessionId: s.id, id: r.id })} />
                      <div style={{ position: 'absolute', left: x - NODE_R, top: y - NODE_R, width: NODE_R * 2, height: NODE_R * 2, borderRadius: '50%', background: '#e3cfa6', color: '#fff', display: 'grid', placeItems: 'center', pointerEvents: 'none', boxShadow: '0 2px 6px rgba(80,50,10,.18)' }}>
                        <div style={{ width: 28, height: 28 }}><TypeIcon type={r.type} /></div>
                      </div>
                    </div>
                  )
                })}

              </div>
            )
          })}

          <button className={'add-session' + (introOn ? ' in-fade' : '')} style={{ left: layout.endX - 40, top: CY - 26, ...(delayed(INTRO.end - 1.0) ?? {}) }} onClick={addSession}>+ Ajouter une séance</button>
        </div>
      </div>

      {target && targetSession && (
        <SlotMenu
          className={introOn ? 'in-up' : ''} style={delayed(0.7)}
          mode={target.mode} type={target.type} subject={subject}
          heading={target.mode === 'replace' && targetRes ? `Remplacer « ${targetRes.title} »` : target.mode === 'fill' ? 'Choisir une ressource pour cet emplacement' : `Ajouter à la séance ${course.sessions.indexOf(targetSession) + 1}`}
          alternatives={alternatives}
          room={course.sessionMinutes - targetSession.resources.reduce((a, r) => a + (r.id === target.id ? 0 : r.duration), 0)}
          onPick={(it) => place(target, makeResource(it, subject))}
          onFile={(f) => importFile(f, target)}
          onClose={closeTray}
        />
      )}

      <Stepper step={2} className={introOn ? 'in-fade' : ''} style={delayed(0.3)} />

      {toast && <div className="toast-box" role="status">{toast.msg}{toast.undo && <button onClick={() => { toast.undo?.(); setToast(null) }}>Annuler</button>}</div>}

      {genRun && (
        <div className="gen-status" role="status">
          <i className="spin" />
          {['Rédaction du livre du prof…', 'Intégration des vidéos au support de projection…', 'Mise en page des fiches élèves…'][genStep]}
        </div>
      )}
      {genOpen && <GenerateModal title={course.title} onClose={() => setGenOpen(false)} />}
      {detailRes && (
        <ResourceDetail
          resource={detailRes.r}
          onClose={() => setDetailId(null)}
          onReplace={() => openReplace(detailRes.r.id)}
          onAddAid={(f) => addAid(detailRes.r.id, f)}
        />
      )}
      {own && (
        <OwnResourceModal
          type={own.type}
          initial={pending ? { title: pending.title, type: pending.type, file: pending.file.name } : undefined}
          heading={own.mode === 'replace' && own.id ? `Remplace « ${find(own.id)?.r.title ?? 'la ressource'} »` : own.mode === 'fill' ? 'Dans l’emplacement vide' : `À la fin de la séance ${course.sessions.findIndex((x) => x.id === own.sessionId) + 1}`}
          onClose={() => { setOwn(null); setPending(null) }}
          onSave={(v) => {
            const t = own; const f = pending?.file
            const thumb = f && f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined
            const res = { ...ownResource(v.type, v.title, v.duration, f ? `Fichier importé : ${f.name}` : v.note), thumb }
            setMine((m) => [{ type: v.type, title: v.title, duration: v.duration, origin: 'mine', uses: 0, thumb, file: f?.name }, ...m])
            setOwn(null); setPending(null); setDetailId(null); place(t, res)
          }}
        />
      )}
    </>
  )
}
