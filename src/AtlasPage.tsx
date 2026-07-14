import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
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
    copy: 'I competed in the 2023 National VEX Robotics Elite Competition here.',
    copyZh: '2023 年，我在上海参加全国 VEX 机器人精英赛。',
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
    copy: 'I came to Qingdao for a VEX competition in 2022.',
    copyZh: '2022 年，我来青岛参加 VEX 比赛。',
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
    copy: 'I competed in the 2020 VEX IQ China National Final and a later China–Canada VEX event in Chongqing.',
    copyZh: '我在重庆参加过 2020 VEX IQ 中国总决赛，以及之后的中国—加拿大 VEX 比赛。',
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
    copy: 'I have kept a few photos from a robotics competition in Hainan here.',
    copyZh: '这里放了几张我在海南参加机器人比赛时的照片。',
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
    copy: 'Chengdu is where I started building and competing with VEX robots.',
    copyZh: '我在成都开始做 VEX 机器人，也从这里参加比赛。',
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
    copy: 'I now study Computer Science at the University of Auckland.',
    copyZh: '我现在在奥克兰大学读计算机科学。',
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
    copy: 'I came to Seoul for the 13th VEX Asia-Pacific Robotics Championship in 2019.',
    copyZh: '2019 年，我来首尔参加第十三届 VEX 亚太机器人锦标赛。',
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

function waitForTiles(map: VectorMap, maxWait = 1700) {
  return new Promise<void>((resolve) => {
    const started = window.performance.now()
    const check = () => {
      if (map.areTilesLoaded() || window.performance.now() - started > maxWait) {
        resolve()
        return
      }
      window.setTimeout(check, 90)
    }
    check()
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
  const warmedCitiesRef = useRef<Set<AtlasLocationId>>(new Set())
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
    const map = makeMap(mapElementRef.current)
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
      window.clearTimeout(timeoutId)
      map.remove()
      mapRef.current = null
    }
  }, [])

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

  async function preheatCityTiles(location: AtlasLocation) {
    if (warmedCitiesRef.current.has(location.id)) return
    const container = document.createElement('div')
    container.className = 'atlas-preheat-map'
    document.body.appendChild(container)
    const preheatMap = makeMap(container, {
      center: location.lngLat,
      zoom: Math.max(location.focus.zoom - 0.35, 10.8),
      pitch: location.focus.pitch,
      bearing: location.focus.bearing,
      interactive: false,
    })
    try {
      await new Promise<void>((resolve) => {
        const timeoutId = window.setTimeout(resolve, 1300)
        preheatMap.once('load', () => {
          window.clearTimeout(timeoutId)
          preheatMap.jumpTo({
            center: location.lngLat,
            zoom: Math.max(location.focus.zoom - 0.35, 10.8),
            pitch: location.focus.pitch,
            bearing: location.focus.bearing,
          })
          waitForTiles(preheatMap, 1200).then(resolve)
        })
      })
      warmedCitiesRef.current.add(location.id)
    } finally {
      preheatMap.remove()
      container.remove()
    }
  }

  function activateNode(location: AtlasLocation) {
    const map = mapRef.current
    if (!map) return
    const flight = flightRef.current + 1
    flightRef.current = flight
    map.stop()
    disableExplore(map)
    setSelectedId(location.id)
    setPreviewId(null)
    setLanded(false)
    setManualView(false)
    setView('flight')
    showBasemapLabels(map, true)
    const warmPromise = preheatCityTiles(location)
    map.flyTo({
      center: location.lngLat,
      zoom: 4.8,
      pitch: 20,
      bearing: location.focus.bearing * 0.45,
      duration: 850,
      curve: 1.28,
      essential: true,
    })
    map.once('moveend', async () => {
      if (flightRef.current !== flight) return
      await Promise.race([
        warmPromise,
        new Promise<void>((resolve) => window.setTimeout(resolve, warmedCitiesRef.current.has(location.id) ? 0 : 520)),
      ])
      if (flightRef.current !== flight) return
      map.flyTo({
        center: location.lngLat,
        zoom: location.focus.zoom,
        pitch: location.focus.pitch,
        bearing: location.focus.bearing,
        duration: 1850,
        curve: 1.18,
        essential: true,
      })
      map.once('moveend', async () => {
        if (flightRef.current !== flight) return
        await warmPromise.catch(() => undefined)
        if (flightRef.current !== flight) return
        await waitForTiles(map, 720)
        if (flightRef.current !== flight) return
        enableExplore(map)
        setZoom(map.getZoom())
        setLanded(true)
        setView('city')
      })
    })
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
    map.flyTo({ ...WORLD_VIEW, duration: 1450, curve: 1.35, essential: true })
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
      duration: 850,
      essential: true,
    })
  }

  function adjustZoom(delta: number) {
    const map = mapRef.current
    if (!map || !landed) return
    setManualView(true)
    map.easeTo({ zoom: map.getZoom() + delta, duration: 280 })
  }

  return (
    <section className="atlas-page" aria-label="Places from Cheng's story">
      <header className="atlas-header">
        <a className="atlas-back" href="/" onClick={(event) => followRoute(event, '/')}>
          <ArrowLeft size={16} aria-hidden="true" />
          <span>KLzc</span>
        </a>
        <div className="atlas-heading">
          <p className="atlas-kicker">01 / PLACES ALONG THE WAY</p>
          <h1>
            Coordinate Atlas <span>坐标档案</span>
          </h1>
        </div>
        <button
          className="atlas-reset"
          type="button"
          onClick={resetWorld}
          aria-label="Reset to world overview"
          title="World overview"
        >
          <Crosshair size={18} aria-hidden="true" />
        </button>
      </header>

      <div className="atlas-layout">
        <section
          className={`atlas-map-frame is-${view}${landed ? ' is-landed' : ''}`}
          aria-label="Interactive map of cities from Cheng's story"
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
              <div className="atlas-label-layer" aria-label="City labels">
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
                      aria-label={`View ${location.city}`}
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
          {mapError ? <p className="atlas-map-loading is-error">MAP CONNECTION UNAVAILABLE / 地图连接失败</p> : null}

          {view === 'world' && previewLocation && previewImage ? (
            <aside className="atlas-preview-card">
              <img src={previewImage} alt="" />
              <div>
                <span>{previewLocation.category}</span>
                <strong>{previewLocation.city} / {previewLocation.cityZh}</strong>
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
                <span>PLACE / {selectedLocation.category}</span>
                <strong>{selectedLocation.city} / {selectedLocation.cityZh}</strong>
              </div>
            </>
          ) : null}

          {landed ? (
            <>
              <div className="atlas-city-controls" aria-label="Map controls">
                <button type="button" onClick={() => adjustZoom(-0.7)} aria-label="Zoom out">
                  <Minus size={16} aria-hidden="true" />
                </button>
                <span className="atlas-zoom-level">Z {zoom.toFixed(1)}</span>
                <button type="button" onClick={() => adjustZoom(0.7)} aria-label="Zoom in">
                  <Plus size={16} aria-hidden="true" />
                </button>
                <button className="atlas-control-text" type="button" onClick={resetCityFocus}>
                  <LocateFixed size={15} aria-hidden="true" />
                  Reset focus
                </button>
                <button className="atlas-control-text" type="button" onClick={resetWorld}>
                  <Globe2 size={15} aria-hidden="true" />
                  World view
                </button>
              </div>
              <p className={`atlas-city-hint${manualView ? ' is-used' : ''}`}>
                Drag to explore / Scroll or +/- to zoom
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
                {selectedLocation.city}
                <span>{selectedLocation.cityZh}</span>
              </h2>
              <div className="atlas-record-type">
                <MapPinned size={15} aria-hidden="true" />
                {selectedLocation.category} / {selectedLocation.categoryZh}
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
                {locations.length} places
                <span>{locations.length} 个地点</span>
              </h2>
              <p className="atlas-copy-zh">这些城市串起了我的学校、机器人比赛，以及现在在奥克兰的学习。地图标记只到城市，不代表具体赛场。</p>
              <p className="atlas-copy-en">
                These cities connect school, robotics competitions and my studies in Auckland. The markers show cities, not exact venues.
              </p>
            </div>
          )}

          <nav className="atlas-index" aria-label="Places">
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
            <span>Next chapter / 02</span>
            <strong>
              Robotics <em>机器人经历</em>
            </strong>
            <ArrowRight size={17} aria-hidden="true" />
          </a>
        </aside>
      </div>
    </section>
  )
}
