import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { useReducedMotion } from 'framer-motion'
import maplibregl, { type Map as VectorMap, type MapLayerMouseEvent } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { ArrowLeft, ArrowRight, Crosshair, Globe2, LocateFixed, MapPinned, Minus, Plus } from 'lucide-react'
import './AtlasPage.css'

export type AtlasLocationId =
  | 'shanghai'
  | 'qingdao'
  | 'chongqing'
  | 'hainan'
  | 'chengdu'
  | 'auckland'
  | 'seoul'

type AtlasView = 'world' | 'flight' | 'city'

type AtlasLocation = {
  id: AtlasLocationId
  city: string
  cityZh: string
  category: string
  categoryZh: string
  coordinates: string
  lngLat: [number, number]
  callout: [number, number]
  focus: { zoom: number; pitch: number; bearing: number; zone: string }
  copy: string
  copyZh: string
  image?: string
  imageCaption?: string
}

type PointProperties = {
  id: AtlasLocationId
  name: string
}

type AtlasPointFeature = {
  type: 'Feature'
  id: AtlasLocationId
  properties: PointProperties
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
}

export type AtlasPageProps = {
  navigate: (href: string) => void
  media?: Partial<Record<AtlasLocationId, string | null>>
}

type LabelPosition = {
  id: AtlasLocationId
  point: { x: number; y: number }
  callout: { x: number; y: number }
  visible: boolean
}

const BASEMAP_STYLE = 'https://tiles.openfreemap.org/styles/dark'
const WORLD_VIEW = {
  center: [64, 10] as [number, number],
  zoom: 1.04,
  pitch: 0,
  bearing: 0,
}
const MAP_PERFORMANCE_OPTIONS = {
  fadeDuration: 0,
  maxTileCacheSize: 360,
  cancelPendingTileRequestsWhileZooming: false,
}

const locations: AtlasLocation[] = [
  {
    id: 'shanghai',
    city: 'Shanghai',
    cityZh: '上海',
    category: 'VEX competition',
    categoryZh: 'VEX 比赛',
    coordinates: '31.2304 N / 121.4737 E',
    lngLat: [121.4737, 31.2304],
    callout: [156, 27],
    focus: { zoom: 11.8, pitch: 42, bearing: -16, zone: 'INNER RING / CORE' },
    copy: '2023 National VEX Robotics Elite Competition. First prize, high-school division.',
    copyZh: '2023 年，全国 VEX 机器人精英赛，高中组一等奖。',
    image: '/assets/atlas-shanghai.webp',
    imageCaption: 'Competition in Shanghai / 上海比赛照片',
  },
  {
    id: 'qingdao',
    city: 'Qingdao',
    cityZh: '青岛',
    category: 'VEX competition',
    categoryZh: 'VEX 比赛',
    coordinates: '36.0671 N / 120.3826 E',
    lngLat: [120.3826, 36.0671],
    callout: [150, 50],
    focus: { zoom: 11.7, pitch: 39, bearing: 17, zone: 'COASTAL CORE' },
    copy: 'The 15th VEX Asia Championship in 2022.',
    copyZh: '2022 年，第十五届 VEX 亚洲锦标赛。',
    image: '/assets/atlas-qingdao.webp',
    imageCaption: 'Competition in Qingdao / 青岛比赛照片',
  },
  {
    id: 'chongqing',
    city: 'Chongqing',
    cityZh: '重庆',
    category: 'VEX competitions',
    categoryZh: 'VEX 比赛',
    coordinates: '29.5630 N / 106.5516 E',
    lngLat: [106.5516, 29.563],
    callout: [70, 24],
    focus: { zoom: 11.65, pitch: 43, bearing: -24, zone: 'CENTRAL PENINSULA' },
    copy: 'The 2020 VEX IQ China National Final and a later China–Canada VEX event.',
    copyZh: '2020 年 VEX IQ 中国总决赛，以及之后的中国—加拿大 VEX 比赛。',
    image: '/assets/atlas-chongqing.webp',
    imageCaption: 'Competition in Chongqing / 重庆比赛照片',
  },
  {
    id: 'hainan',
    city: 'Hainan',
    cityZh: '海南',
    category: 'Competition photos',
    categoryZh: '比赛照片',
    coordinates: '20.0440 N / 110.1983 E',
    lngLat: [110.1983, 20.044],
    callout: [82, 8],
    focus: { zoom: 10.7, pitch: 35, bearing: -12, zone: 'HAIKOU NODE' },
    copy: 'A few photographs from a robotics competition.',
    copyZh: '机器人比赛时留下的几张照片。',
    image: '/assets/atlas-hainan.webp',
    imageCaption: 'Competition in Hainan / 海南比赛照片',
  },
  {
    id: 'chengdu',
    city: 'Chengdu',
    cityZh: '成都',
    category: 'School and robotics',
    categoryZh: '学校与机器人',
    coordinates: '30.5728 N / 104.0668 E',
    lngLat: [104.0668, 30.5728],
    callout: [73, 49],
    focus: { zoom: 11.6, pitch: 40, bearing: 21, zone: 'CITY CENTRE' },
    copy: 'Where I first started VEX robotics.',
    copyZh: '开始接触 VEX 机器人的地方。',
  },
  {
    id: 'auckland',
    city: 'Auckland',
    cityZh: '奥克兰',
    category: 'Current studies',
    categoryZh: '现在的学习',
    coordinates: '36.8485 S / 174.7633 E',
    lngLat: [174.7633, -36.8485],
    callout: [148, -27],
    focus: { zoom: 11.55, pitch: 40, bearing: -28, zone: 'CENTRAL ISTHMUS' },
    copy: 'Where I currently live and study Computer Science.',
    copyZh: '现在生活和学习的地方。',
    image: '/assets/uoa-campus.webp',
    imageCaption: 'University of Auckland campus / 奥克兰大学校园',
  },
  {
    id: 'seoul',
    city: 'Seoul',
    cityZh: '首尔',
    category: 'VEX competition',
    categoryZh: 'VEX 比赛',
    coordinates: '37.5665 N / 126.9780 E',
    lngLat: [126.978, 37.5665],
    callout: [163, 57],
    focus: { zoom: 11.7, pitch: 40, bearing: -12, zone: 'SEOUL CORE' },
    copy: 'My first VEX competition outside China, in 2019.',
    copyZh: '2019 年，第一次去国外参加 VEX 比赛。',
  },
]

const pointCollection = {
  type: 'FeatureCollection' as const,
  features: locations.map(
    (location): AtlasPointFeature => ({
      type: 'Feature',
      id: location.id,
      properties: { id: location.id, name: `${location.city}  ${location.cityZh}` },
      geometry: { type: 'Point', coordinates: location.lngLat },
    }),
  ),
}

function locationFromEvent(event: MapLayerMouseEvent) {
  const id = event.features?.[0]?.properties.id as AtlasLocationId | undefined
  return locations.find((location) => location.id === id)
}

function disableExplore(map: VectorMap) {
  map.dragPan.disable()
  map.scrollZoom.disable()
  map.boxZoom.disable()
  map.dragRotate.disable()
  map.touchZoomRotate.disable()
  map.doubleClickZoom.disable()
  map.keyboard.disable()
}

function enableExplore(map: VectorMap) {
  map.dragPan.enable()
  map.scrollZoom.enable()
  map.boxZoom.enable()
  map.dragRotate.enable()
  map.touchZoomRotate.enable()
  map.doubleClickZoom.enable()
  map.keyboard.enable()
}

function showBasemapLabels(map: VectorMap, show: boolean) {
  for (const layer of map.getStyle().layers) {
    if (layer.type === 'symbol' && !layer.id.startsWith('atlas-')) {
      map.setLayoutProperty(layer.id, 'visibility', show ? 'visible' : 'none')
    }
  }
}

function addArchiveLayers(map: VectorMap) {
  map.addSource('atlas-points', { type: 'geojson', data: pointCollection })
  map.addLayer({
    id: 'atlas-point-aura',
    type: 'circle',
    source: 'atlas-points',
    paint: {
      'circle-radius': ['case', ['boolean', ['feature-state', 'active'], false], 21, ['boolean', ['feature-state', 'hover'], false], 18, 12],
      'circle-color': '#e65049',
      'circle-opacity': ['case', ['boolean', ['feature-state', 'active'], false], 0.18, ['boolean', ['feature-state', 'hover'], false], 0.13, 0],
      'circle-blur': 0.3,
    },
  })
  map.addLayer({
    id: 'atlas-points',
    type: 'circle',
    source: 'atlas-points',
    paint: {
      'circle-radius': ['case', ['boolean', ['feature-state', 'active'], false], 7, ['boolean', ['feature-state', 'hover'], false], 6.5, 5.5],
      'circle-color': ['case', ['boolean', ['feature-state', 'active'], false], '#e65049', ['boolean', ['feature-state', 'hover'], false], '#e65049', '#e5edf2'],
      'circle-stroke-color': '#091017',
      'circle-stroke-width': 2,
    },
  })
}

function makeMap(container: HTMLElement, options: Partial<ConstructorParameters<typeof maplibregl.Map>[0]> = {}) {
  return new maplibregl.Map({
    container,
    style: BASEMAP_STYLE,
    center: WORLD_VIEW.center,
    zoom: WORLD_VIEW.zoom,
    pitch: WORLD_VIEW.pitch,
    bearing: WORLD_VIEW.bearing,
    minZoom: 0.65,
    maxZoom: 18,
    attributionControl: false,
    ...MAP_PERFORMANCE_OPTIONS,
    ...options,
  })
}

export default function AtlasPage({ navigate, media = {} }: AtlasPageProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<VectorMap | null>(null)
  const flightRef = useRef(0)
  const reducedMotion = useReducedMotion()
  const [mapVersion, setMapVersion] = useState(0)
  const activateRef = useRef<(location: AtlasLocation) => void>(() => undefined)
  const hoverRef = useRef<(location: AtlasLocation | null) => void>(() => undefined)
  const [selectedId, setSelectedId] = useState<AtlasLocationId | null>(null)
  const [previewId, setPreviewId] = useState<AtlasLocationId | null>(null)
  const [view, setView] = useState<AtlasView>('world')
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [landed, setLanded] = useState(false)
  const [manualView, setManualView] = useState(false)
  const [zoom, setZoom] = useState(WORLD_VIEW.zoom)
  const [labelPositions, setLabelPositions] = useState<LabelPosition[]>([])
  const selectedLocation = locations.find((location) => location.id === selectedId)
  const previewLocation = locations.find((location) => location.id === previewId)
  const labelPositionMap = useMemo(
    () => new Map(labelPositions.map((position) => [position.id, position])),
    [labelPositions],
  )
  const image =
    selectedLocation && media[selectedLocation.id] !== undefined
      ? media[selectedLocation.id]
      : selectedLocation?.image
  const previewImage =
    previewLocation && media[previewLocation.id] !== undefined
      ? media[previewLocation.id]
      : previewLocation?.image

  useEffect(() => {
    if (!mapElementRef.current) return
    let disposed = false
    let map: VectorMap
    try {
      map = makeMap(mapElementRef.current)
    } catch {
      queueMicrotask(() => { if (!disposed) setMapError(true) })
      return () => { disposed = true }
    }
    mapRef.current = map
    disableExplore(map)
    const updateLabelPositions = () => {
      const bounds = mapElementRef.current?.getBoundingClientRect()
      if (!bounds) return
      const padding = 72
      setLabelPositions(
        locations.map((location) => {
          const point = map.project(location.lngLat)
          const callout = map.project(location.callout)
          return {
            id: location.id,
            point: { x: point.x, y: point.y },
            callout: { x: callout.x, y: callout.y },
            visible:
              callout.x > -padding &&
              callout.y > -padding &&
              callout.x < bounds.width + padding &&
              callout.y < bounds.height + padding,
          }
        }),
      )
    }
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
      }),
      'bottom-left',
    )
    map.on('styleimagemissing', (event) => {
      if (!map.hasImage(event.id)) {
        map.addImage(event.id, new ImageData(new Uint8ClampedArray([0, 0, 0, 0]), 1, 1))
      }
    })

    const timeoutId = window.setTimeout(() => {
      if (!disposed && !map.loaded()) setMapError(true)
    }, 9000)

    map.on('load', () => {
      if (disposed) return
      window.clearTimeout(timeoutId)
      addArchiveLayers(map)
      showBasemapLabels(map, false)
      updateLabelPositions()
      setMapReady(true)
      setMapError(false)
    })
    map.on('error', () => {
      if (!disposed && !map.isStyleLoaded()) setMapError(true)
    })
    map.on('move', updateLabelPositions)
    map.on('resize', updateLabelPositions)
    map.on('zoom', () => {
      setZoom(map.getZoom())
      updateLabelPositions()
    })
    map.on('dragstart', () => setManualView(true))

    const activateFeature = (event: MapLayerMouseEvent) => {
      const location = locationFromEvent(event)
      if (location) activateRef.current(location)
    }
    const hoverFeature = (event: MapLayerMouseEvent) => {
      const location = locationFromEvent(event)
      if (location) hoverRef.current(location)
      map.getCanvas().style.cursor = 'pointer'
    }
    const leaveFeature = () => {
      hoverRef.current(null)
      map.getCanvas().style.cursor = ''
    }

    for (const layer of ['atlas-points']) {
      map.on('click', layer, activateFeature)
      map.on('mouseenter', layer, hoverFeature)
      map.on('mouseleave', layer, leaveFeature)
    }

    return () => {
      disposed = true
      flightRef.current += 1
      window.clearTimeout(timeoutId)
      map.remove()
      mapRef.current = null
    }
  }, [mapVersion])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map) return
    for (const location of locations) {
      map.setFeatureState(
        { source: 'atlas-points', id: location.id },
        { active: selectedId === location.id, hover: previewId === location.id },
      )
    }
  }, [mapReady, previewId, selectedId])

  function followRoute(event: MouseEvent<HTMLAnchorElement>, href: string) {
    event.preventDefault()
    navigate(href)
  }

  function activateNode(location: AtlasLocation) {
    const map = mapRef.current
    const flight = ++flightRef.current
    setSelectedId(location.id)
    setPreviewId(null)
    setLanded(false)
    setManualView(false)
    // Records remain usable even without WebGL or a basemap connection.
    if (!map || !mapReady || mapError) return
    map.stop()
    disableExplore(map)
    setView('flight')
    showBasemapLabels(map, true)
    const finishFlight = () => {
      if (flightRef.current !== flight || mapRef.current !== map) return
      enableExplore(map)
      setZoom(map.getZoom())
      setLanded(true)
      setView('city')
    }
    // Register first: reduced-motion transitions may finish immediately.
    map.once('moveend', finishFlight)
    map.flyTo({
      center: location.lngLat,
      zoom: location.focus.zoom,
      pitch: reducedMotion ? 0 : location.focus.pitch,
      bearing: location.focus.bearing,
      duration: reducedMotion ? 0 : 1700,
      curve: 1.25,
      essential: false,
    })
    if (reducedMotion || !map.isMoving()) finishFlight()
  }
  function hoverNode(location: AtlasLocation | null) {
    if (view === 'world') setPreviewId(location?.id ?? null)
  }

  useEffect(() => {
    activateRef.current = activateNode
    hoverRef.current = hoverNode
  })

  function resetWorld() {
    const map = mapRef.current
    flightRef.current += 1
    setSelectedId(null)
    setPreviewId(null)
    setLanded(false)
    setManualView(false)
    setView('world')
    if (!map) return
    map.stop()
    disableExplore(map)
    showBasemapLabels(map, false)
    map.flyTo({ ...WORLD_VIEW, duration: reducedMotion ? 0 : 1100, curve: 1.35, essential: false })
  }

  function resetCityFocus() {
    const map = mapRef.current
    if (!map || !selectedLocation) return
    setManualView(false)
    map.flyTo({
      center: selectedLocation.lngLat,
      zoom: selectedLocation.focus.zoom,
      pitch: selectedLocation.focus.pitch,
      bearing: selectedLocation.focus.bearing,
      duration: reducedMotion ? 0 : 850,
      essential: false,
    })
  }

  function adjustZoom(delta: number) {
    const map = mapRef.current
    if (!map || !landed) return
    setManualView(true)
    map.easeTo({ zoom: map.getZoom() + delta, duration: reducedMotion ? 0 : 280 })
  }

  return (
    <section className="atlas-page" aria-label="地点记录 / Places">
      <header className="atlas-header">
        <a className="atlas-back" href="/" onClick={(event) => followRoute(event, '/')}>
          <ArrowLeft size={16} aria-hidden="true" />
          <span>首页<small>Home</small></span>
        </a>
        <div className="atlas-heading">
          <p className="atlas-kicker">01 / 地点 / PLACES</p>
          <h1>
            坐标档案 <span>Coordinate Atlas</span>
          </h1>
        </div>
        <button
          className="atlas-reset"
          type="button"
          onClick={resetWorld}
          aria-label="返回世界视图 / Reset to world overview"
          title="世界视图 / World overview"
        >
          <Crosshair size={18} aria-hidden="true" />
        </button>
      </header>

      <div className="atlas-layout">
        <section
          className={`atlas-map-frame is-${view}${landed ? ' is-landed' : ''}`}
          aria-label="地点地图 / Map of places"
        >
          <div className="atlas-map-status" aria-hidden="true">
            <span>{view === 'city' ? 'CITY MAP / DRAG TO EXPLORE' : 'WORLD MAP / CHOOSE A CITY'}</span>
            <span>{selectedLocation ? selectedLocation.coordinates : 'CITY-LEVEL MARKERS'}</span>
          </div>

          <div className="atlas-vector-map" ref={mapElementRef} />

          {view === 'world' && mapReady ? (
            <>
              <svg className="atlas-label-lines" aria-hidden="true">
                {locations.map((location) => {
                  const position = labelPositionMap.get(location.id)
                  if (!position?.visible) return null
                  const active = previewId === location.id || selectedId === location.id
                  return (
                    <g className={`atlas-label-line${active ? ' is-active' : ''}`} key={location.id}>
                      <line
                        x1={position.point.x}
                        y1={position.point.y}
                        x2={position.callout.x}
                        y2={position.callout.y}
                      />
                      <circle cx={position.point.x} cy={position.point.y} r="3.5" />
                      <circle className="atlas-label-terminal" cx={position.callout.x} cy={position.callout.y} r="2" />
                    </g>
                  )
                })}
              </svg>
              <div className="atlas-label-layer" aria-label="城市标签 / City labels">
                {locations.map((location) => {
                  const position = labelPositionMap.get(location.id)
                  if (!position?.visible) return null
                  const active = previewId === location.id || selectedId === location.id
                  return (
                    <button
                      className={`atlas-map-label${active ? ' is-active' : ''}`}
                      key={location.id}
                      type="button"
                      style={{ left: position.callout.x, top: position.callout.y }}
                      onPointerEnter={() => hoverNode(location)}
                      onPointerLeave={() => hoverNode(null)}
                      onFocus={() => hoverNode(location)}
                      onBlur={() => hoverNode(null)}
                      onClick={() => activateNode(location)}
                      aria-label={`查看${location.cityZh} / View ${location.city}`}
                    >
                      <span className="atlas-map-label__city">
                        {location.cityZh}
                        <small>{location.city}</small>
                      </span>
                      <span className="atlas-map-label__meta">{location.categoryZh}</span>
                    </button>
                  )
                })}
              </div>
            </>
          ) : null}

          {!mapReady && !mapError ? <p className="atlas-map-loading">LOADING MAP / 地图载入中</p> : null}
          {mapError ? <div className="atlas-map-loading is-error" role="status">
            <p>地图暂未连接，仍可从地点列表查看全部记录。</p>
            <button type="button" onClick={() => {
              setMapError(false); setMapReady(false); setSelectedId(null); setView('world'); setLanded(false)
              setMapVersion((version) => version + 1)
            }}>重试地图 / Retry map</button>
          </div> : null}

          {view === 'world' && previewLocation && previewImage ? (
            <aside className="atlas-preview-card">
              <img src={previewImage} alt="" />
              <div>
                <span>{previewLocation.categoryZh} / {previewLocation.category}</span>
                <strong>{previewLocation.cityZh} / {previewLocation.city}</strong>
                <small>{previewLocation.coordinates}</small>
              </div>
            </aside>
          ) : null}

          {selectedLocation ? (
            <>
              <div className="atlas-flight-hud" aria-hidden="true">
                <div className="atlas-hud-ring" />
                <div className="atlas-hud-cross" />
                <div className="atlas-hud-data">
                  <span>VIEWING / {selectedLocation.city.toUpperCase()}</span>
                  <span>CITY-LEVEL LOCATION</span>
                  <span>{landed ? 'MAP / READY' : 'OPENING CITY MAP'}</span>
                </div>
              </div>
              <div className="atlas-city-caption">
                  <span>地点 / PLACE · {selectedLocation.categoryZh}</span>
                  <strong>{selectedLocation.cityZh} / {selectedLocation.city}</strong>
              </div>
            </>
          ) : null}

          {landed ? (
            <>
              <div className="atlas-city-controls" aria-label="地图控制 / Map controls">
                <button type="button" onClick={() => adjustZoom(-0.7)} aria-label="缩小 / Zoom out">
                  <Minus size={16} aria-hidden="true" />
                </button>
                <span className="atlas-zoom-level">Z {zoom.toFixed(1)}</span>
                <button type="button" onClick={() => adjustZoom(0.7)} aria-label="放大 / Zoom in">
                  <Plus size={16} aria-hidden="true" />
                </button>
                <button className="atlas-control-text" type="button" onClick={resetCityFocus}>
                  <LocateFixed size={15} aria-hidden="true" />
                  重新居中 <small>Reset focus</small>
                </button>
                <button className="atlas-control-text" type="button" onClick={resetWorld}>
                  <Globe2 size={15} aria-hidden="true" />
                  世界视图 <small>World view</small>
                </button>
              </div>
              <p className={`atlas-city-hint${manualView ? ' is-used' : ''}`}>
                拖动探索 · 滚动或 +/- 缩放 / Drag and zoom
              </p>
            </>
          ) : null}
        </section>

        <aside className="atlas-panel" aria-live="polite">
          {selectedLocation ? (
            <article className="atlas-record" key={selectedLocation.id}>
              <div className="atlas-record-topline">
                <span className="atlas-record-number">{selectedLocation.category}</span>
                <span className="atlas-record-coordinate">{selectedLocation.coordinates}</span>
              </div>
              <h2>
                {selectedLocation.cityZh}
                <span>{selectedLocation.city}</span>
              </h2>
              <div className="atlas-record-type">
                <MapPinned size={15} aria-hidden="true" />
                {selectedLocation.categoryZh} / {selectedLocation.category}
              </div>
              <p className="atlas-copy-zh">{selectedLocation.copyZh}</p>
              <p className="atlas-copy-en">{selectedLocation.copy}</p>
              {image ? (
                <figure className="atlas-media">
                  <img src={image} alt="" />
                  <figcaption>
                    {media[selectedLocation.id] !== undefined
                      ? 'Location photo / 地点照片'
                      : selectedLocation.imageCaption}
                  </figcaption>
                </figure>
              ) : null}
            </article>
          ) : (
            <div className="atlas-overview">
              <p className="atlas-record-number">PLACES</p>
              <h2>
                {locations.length} 个地点
                <span>{locations.length} places</span>
              </h2>
              <p className="atlas-copy-zh">地图收录了七个与学习和 VEX 比赛有关的地点。标记只到城市，不代表具体赛场。</p>
              <p className="atlas-copy-en">
                The map contains seven places connected to my studies and VEX competitions. Markers show cities, not exact venues.
              </p>
            </div>
          )}

          <nav className="atlas-index" aria-label="地点 / Places">
            {locations.map((location) => (
              <button
                className={`atlas-index-item${selectedId === location.id ? ' is-active' : ''}`}
                key={location.id}
                type="button"
                onPointerEnter={() => hoverNode(location)}
                onPointerLeave={() => hoverNode(null)}
                onFocus={() => hoverNode(location)}
                onBlur={() => hoverNode(null)}
                onClick={() => activateNode(location)}
                aria-current={selectedId === location.id ? 'true' : undefined}
              >
                <span>{location.categoryZh}</span>
                <strong>{location.cityZh}</strong>
                <small>{location.city}</small>
              </button>
            ))}
          </nav>

          <a className="atlas-next-chapter" href="/robotics" onClick={(event) => followRoute(event, '/robotics')}>
            <span>下一章 / Next chapter · 02</span>
            <strong>
              机器人经历 <em>Robotics</em>
            </strong>
            <ArrowRight size={17} aria-hidden="true" />
          </a>
        </aside>
      </div>
    </section>
  )
}
