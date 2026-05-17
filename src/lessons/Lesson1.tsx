import { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Pre-load the model
useGLTF.preload('/assets/Pyramid_v003.glb');
useGLTF.preload('/assets/Floor_v003.glb');

function GltfCamera() {
  const { cameras } = useGLTF('/assets/Pyramid_v003.glb');
  const set = useThree((state) => state.set);
  const size = useThree((state) => state.size);

  useEffect(() => {
    if (cameras && cameras.length > 0) {
      const cam = cameras[0] as THREE.PerspectiveCamera;
      cam.fov = 32;
      cam.aspect = size.width / size.height;
      cam.updateProjectionMatrix();
      set({ camera: cam });
    }
  }, [cameras, size, set]);

  return null;
}

function Pyramid() {
  const { scene } = useGLTF('/assets/Pyramid_v003.glb');

  useEffect(() => {
    // Ensure all meshes cast and receive shadows
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return <primitive object={scene} />;
}

function Floor() {
  const { scene } = useGLTF('/assets/Floor_v003.glb');

  useEffect(() => {
    // Ensure all meshes receive shadows
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.receiveShadow = true;
        child.castShadow = true;
      }
    });
  }, [scene]);

  return <primitive object={scene} />;
}


const stepsDataEN = [
  {
    title: "First contact",
    sublabel: "Feb 12 · 52 days from winter solstice",
    tooltip: "The first shadow triangle pierces the staircase. The calendar has awakened.",
    caption: "It begins quietly. On the twelfth of February — fifty-two days after the winter solstice — the angle of the afternoon sun catches the edge of the first terrace. A single triangle of shadow appears on the north staircase. This is not an accident. The Maya architects of Chichén Itzá designed this building to do exactly this, on exactly this day. Fifty-two days. The same number of years it takes for the two Maya calendars to realign. The same number written into the very stone of this pyramid — fifty-two niches per side, on every face.",
    lightPosition: new THREE.Vector3(-70, 22, -140),
    keyLightColor: new THREE.Color('#ffdcab'), // Matches Step 2
    keyLightIntensity: 4, // Editable sun intensity
    fillLightColor: new THREE.Color('#d4beb0'), // Matches Step 2
    fillLightIntensity: 0.75 // Matches Step 2
  },
  {
    title: "The descent",
    sublabel: "Apr 9 / Sep 2 · 73 days from summer solstice",
    tooltip: "All 9 triangles lock in. Kukulcán's body is complete. 73 × 8 = 584 — the Venus period.",
    caption: "April ninth. The sun reaches its position seventy-three days before the summer solstice. And the staircase comes alive. Nine triangles of light and shadow descend the north balustrade — one for each of the nine terraces of this pyramid. Together they trace the body of Kukulcán, the feathered serpent, his head already waiting at the base. But there is a deeper message hidden here. Seventy-three days. Multiply by eight — and you get five hundred and eighty-four. The exact length of Venus's journey around the sky, as seen from Earth. This pyramid doesn't just mark the Maya calendar. It marks the orbit of Venus.",
    lightPosition: new THREE.Vector3(-60.80, 33.26, -133.03),
    keyLightColor: new THREE.Color('#ffdcab'), // Warmer Step 2
    keyLightIntensity: 4, // Editable sun intensity
    fillLightColor: new THREE.Color('#d4beb0'), // Warmer Step 2 fill
    fillLightIntensity: 1 // Normal intensity
  },
  {
    title: "Zenith gate",
    sublabel: "May 24 · Sun passes directly overhead",
    tooltip: "Full staircase ablaze. The sun stands at the zenith. The portal opens.",
    caption: "May twenty-fourth. The sun reaches the zenith — directly overhead. At this latitude, there is no shadow at noon. The staircase blazes. For the Maya, this was the zenith passage — the moment the sun stood at the center of the sky. It marked the approach of the first rains. The beginning of the planting cycle. The turning of the year. The pyramid's north staircase has now guided you through fifty-two days, seventy-three days, and the zenith. Each position a number. Each number a gear in an astronomical machine the Maya built from stone — a machine that still runs, five centuries after the last astronomers walked these steps.",
    lightPosition: new THREE.Vector3(0, 150, 0),
    keyLightColor: new THREE.Color('#fff4e6'), // Warmer Step 3 (zenith)
    keyLightIntensity: 1.5, // Editable sun intensity
    fillLightColor: new THREE.Color('#fff4e6'), // Warmer Step 3 fill
    fillLightIntensity: 1.55// Normal intensity
  }
];

const stepsDataES = [
  {
    title: "Primer contacto",
    sublabel: "12 Feb · 52 días desde el solsticio de invierno",
    tooltip: "El primer triángulo de sombra perfora la escalinata. El calendario ha despertado.",
    caption: "Comienza en silencio. El doce de febrero — cincuenta y dos días después del solsticio de invierno — el ángulo del sol de la tarde atrapa el borde de la primera terraza. Un único triángulo de sombra aparece en la escalinata norte. Esto no es un accidente. Los arquitectos mayas de Chichén Itzá diseñaron este edificio para hacer exactamente esto, en exactamente este día. Cincuenta y dos días. El mismo número de años que tardan los dos calendarios mayas en realinearse. El mismo número escrito en la propia piedra de esta pirámide — cincuenta y dos nichos por lado, en cada cara.",
    lightPosition: new THREE.Vector3(-70, 22, -140),
    keyLightColor: new THREE.Color('#ffdcab'),
    keyLightIntensity: 4,
    fillLightColor: new THREE.Color('#d4beb0'),
    fillLightIntensity: 0.75
  },
  {
    title: "El descenso",
    sublabel: "9 Abr / 2 Sep · 73 días desde el solsticio de verano",
    tooltip: "Los 9 triángulos encajan. El cuerpo de Kukulcán está completo. 73 × 8 = 584 — el período de Venus.",
    caption: "Nueve de abril. El sol alcanza su posición setenta y tres días antes del solsticio de verano. Y la escalinata cobra vida. Nueve triángulos de luz y sombra descienden por la balaustrada norte — uno por cada una de las nueve terrazas de esta pirámide. Juntos trazan el cuerpo de Kukulcán, la serpiente emplumada, cuya cabeza ya aguarda en la base. Pero hay un mensaje más profundo oculto aquí. Setenta y tres días. Multiplícalo por ocho — y obtienes quinientos ochenta y cuatro. La duración exacta del viaje de Venus por el cielo, visto desde la Tierra. Esta pirámide no solo marca el calendario maya. Marca la órbita de Venus.",
    lightPosition: new THREE.Vector3(-60.80, 33.26, -133.03),
    keyLightColor: new THREE.Color('#ffdcab'),
    keyLightIntensity: 4,
    fillLightColor: new THREE.Color('#d4beb0'),
    fillLightIntensity: 1
  },
  {
    title: "Puerta cenital",
    sublabel: "24 May · El sol pasa directamente sobre nuestras cabezas",
    tooltip: "Escalinata iluminada por completo. El sol está en el cenit. El portal se abre.",
    caption: "Veinticuatro de mayo. El sol alcanza el cenit — directamente encima. En esta latitud, no hay sombra al mediodía. La escalinata resplandece. Para los mayas, este era el paso cenital — el momento en que el sol se situaba en el centro del cielo. Marcaba la llegada de las primeras lluvias. El inicio del ciclo de siembra. El cambio de año. La escalinata norte de la pirámide te ha guiado a través de cincuenta y dos días, setenta y tres días y el cenit. Cada posición un número. Cada número un engranaje en una máquina astronómica que los mayas construyeron en piedra — una máquina que sigue funcionando, cinco siglos después de que los últimos astrónomos caminaran por estos escalones.",
    lightPosition: new THREE.Vector3(0, 150, 0),
    keyLightColor: new THREE.Color('#fff4e6'),
    keyLightIntensity: 1.5,
    fillLightColor: new THREE.Color('#fff4e6'),
    fillLightIntensity: 1.55
  }
];


function SceneSetup({ lightT, lang }: { lightT: number, lang: 'EN' | 'ES' }) {
  const stepsData = lang === 'ES' ? stepsDataES : stepsDataEN;
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);

  // Pre-allocate THREE objects to avoid GC spikes in useFrame
  const tempPos = useRef(new THREE.Vector3());
  const tempKeyColor = useRef(new THREE.Color());
  const tempFillColor = useRef(new THREE.Color());

  // Smoothly interpolate light position and colors based on lightT float value
  useFrame((_, delta) => {
    if (lightRef.current && ambientRef.current) {
      const targetPos = tempPos.current;
      const targetKeyColor = tempKeyColor.current;
      const targetFillColor = tempFillColor.current;
      let targetFillIntensity = 0.5;
      let targetKeyIntensity = 2.5;

      if (lightT <= 2) {
        const t = lightT - 1;
        targetPos.lerpVectors(stepsData[0].lightPosition, stepsData[1].lightPosition, t);
        targetKeyColor.copy(stepsData[0].keyLightColor).lerp(stepsData[1].keyLightColor, t);
        targetFillColor.copy(stepsData[0].fillLightColor).lerp(stepsData[1].fillLightColor, t);
        targetFillIntensity = THREE.MathUtils.lerp(stepsData[0].fillLightIntensity, stepsData[1].fillLightIntensity, t);
        targetKeyIntensity = THREE.MathUtils.lerp(stepsData[0].keyLightIntensity, stepsData[1].keyLightIntensity, t);
      } else {
        const t = lightT - 2;
        targetPos.lerpVectors(stepsData[1].lightPosition, stepsData[2].lightPosition, t);
        targetKeyColor.copy(stepsData[1].keyLightColor).lerp(stepsData[2].keyLightColor, t);
        targetFillColor.copy(stepsData[1].fillLightColor).lerp(stepsData[2].fillLightColor, t);
        targetFillIntensity = THREE.MathUtils.lerp(stepsData[1].fillLightIntensity, stepsData[2].fillLightIntensity, t);
        targetKeyIntensity = THREE.MathUtils.lerp(stepsData[1].keyLightIntensity, stepsData[2].keyLightIntensity, t);
      }

      lightRef.current.position.lerp(targetPos, delta * 10); // Fast lerp for real-time responsiveness
      lightRef.current.color.lerp(targetKeyColor, delta * 10);
      lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, targetKeyIntensity, delta * 10);
      ambientRef.current.color.lerp(targetFillColor, delta * 10);
      ambientRef.current.intensity = THREE.MathUtils.lerp(ambientRef.current.intensity, targetFillIntensity, delta * 10);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={stepsData[0].fillLightIntensity} color={stepsData[1].fillLightColor} />

      <directionalLight
        ref={lightRef}
        castShadow
        intensity={2.5}
        position={stepsData[1].lightPosition.toArray()} // Initial position
        shadow-mapSize-width={4096} // 2x resolution
        shadow-mapSize-height={4096}
        shadow-camera-far={300}
        shadow-camera-left={-80} // Tighter bounds = higher shadow pixel density
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-bias={-0.0001}
      />
      <Pyramid />
      {/* Imported Floor Geometry */}
      <Floor />
    </>
  );
}

export default function Lesson1() {
  const [sliderValue, setSliderValue] = useState(1);
  const [activeStep, setActiveStep] = useState(1);
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Track loading state
  useEffect(() => {
    const checkLoading = async () => {
      try {
        // We use the preloaded assets to ensure they are ready
        await Promise.all([
          useGLTF.preload('/assets/Pyramid_v003.glb'),
          useGLTF.preload('/assets/Floor_v003.glb'),
        ]);
        // Small delay to ensure GPU upload and scene initialization
        setTimeout(() => setIsLoading(false), 500);
      } catch (error) {
        console.error("Error loading assets:", error);
        setIsLoading(false); // Avoid infinite loading
      }
    };
    checkLoading();
  }, []);
  const [lang, setLang] = useState<'EN' | 'ES'>('EN');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');

    if (urlLang?.toLowerCase() === 'es') {
      setLang('ES');
    } else if (urlLang?.toLowerCase() === 'en') {
      setLang('EN');
    } else if (navigator.language && navigator.language.toLowerCase().startsWith('es')) {
      setLang('ES');
    }
  }, []);

  const stepsData = lang === 'ES' ? stepsDataES : stepsDataEN;


  const baseLightT = sliderValue <= 2 ? sliderValue : (sliderValue <= 3 ? 2 : sliderValue - 1);
  const [manualLightT, setManualLightT] = useState<number | null>(null);
  const lightT = manualLightT !== null ? manualLightT : baseLightT;

  // Audio state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Load new audio when active step changes
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | undefined;

    if (audioRef.current) {
      audioRef.current.load();
      // If we are currently playing, automatically continue to the next track
      // Otherwise, wait for user input (removes forced autoplay)
      if (isPlaying) {
        timerId = window.setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play()
              .catch(e => {
                console.log('Playback error:', e);
                setIsPlaying(false);
              });
          }
        }, 500);
      }
    }

    return () => {
      if (timerId) clearTimeout(timerId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep]);

  const togglePlay = () => {
    setManualLightT(null);
    if (!hasStarted) {
      setHasStarted(true);
      return;
    }
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(e => console.log('Playback error:', e));
      }
    }
  };

  const handleStepClick = (step: number) => {
    setManualLightT(null);
    if (!hasStarted) setHasStarted(true);

    if (step !== activeStep) {
      setActiveStep(step);
      setSliderValue(step);
      setIsPlaying(true);
    } else {
      if (!isPlaying && audioRef.current) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(e => console.log('Playback error:', e));
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent page scrolling
        togglePlay();
      } else if (e.key === 'ArrowLeft') {
        setActiveStep(prev => {
          const next = Math.max(1, prev - 1);
          setSliderValue(next);
          return next;
        });
      } else if (e.key === 'ArrowRight') {
        setActiveStep(prev => {
          const next = Math.min(3, prev + 1);
          setSliderValue(next);
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasStarted, isPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current && isPlaying) {
      const progress = audioRef.current.currentTime / audioRef.current.duration;
      if (!isNaN(progress)) {
        setSliderValue(activeStep + progress);
      }
    }
  };

  const handleAudioEnded = () => {
    if (activeStep < 3) {
      const nextStep = activeStep + 1;
      setActiveStep(nextStep);
      setSliderValue(nextStep);
    } else {
      setIsPlaying(false);
      setSliderValue(4.0);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Start Button Overlay */}
      {!hasStarted && (
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: isLoading ? 'black' : 'rgba(0,0,0,0.6)',
            zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: isLoading ? 'default' : 'pointer',
            backdropFilter: isLoading ? 'none' : 'blur(5px)',
            transition: 'background 0.5s ease, backdrop-filter 0.5s ease'
          }}
          onClick={() => !isLoading && setHasStarted(true)}
        >
          <div style={{
            padding: '1.5rem 4rem',
            background: isLoading ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0.1)',
            border: isLoading ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            color: isLoading ? 'rgba(255,255,255,0.3)' : 'white',
            fontSize: '1.5rem', letterSpacing: '0.2em',
            textTransform: 'uppercase', transition: 'all 0.3s ease',
            pointerEvents: isLoading ? 'none' : 'auto'
          }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            {isLoading ? (lang === 'ES' ? 'Cargando Recursos...' : 'Loading Assets...') : (lang === 'ES' ? 'Iniciar Experiencia' : 'Start Experience')}
          </div>
        </div>
      )}

      <div className="canvas-wrapper">
        {/* Cinematic Background Crossfader */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '184.6%', zIndex: -1 }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                position: 'absolute',
                top: 0, left: -380, right: 0, bottom: 0,
                backgroundImage: `url('/assets/Sky_0${s}.webp')`,
                backgroundSize: 'cover', /* Uses cover on a 186vh container to always fill width while keeping horizon low */
                backgroundPosition: 'center top', /* Anchors top so the height pushes down correctly */
                backgroundRepeat: 'no-repeat',
                transform: 'scaleX(-1)', /* Flips horizontally only */
                opacity: Math.max(0, 1 - Math.abs(lightT - s)),
              }}
            />
          ))}
        </div>

        <Canvas shadows gl={{ alpha: true, antialias: true }}>
          <GltfCamera />
          <SceneSetup lightT={lightT} lang={lang} />
        </Canvas>

        {/* OVERLAYS */}
        <div className="top-gradient-panel">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4rem' }}>
              {stepsData.map((step, index) => {
                const stepNum = index + 1;
                const isActive = activeStep === stepNum;
                // Only the title that is currently playing is yellow
                const isYellow = isActive && isPlaying && manualLightT === null;
                return (
                  <div
                    key={stepNum}
                    onClick={() => handleStepClick(stepNum)}
                    style={{
                      cursor: 'pointer',
                      opacity: isActive ? 1 : 0.4,
                      transition: 'all 0.3s ease',
                      textAlign: 'center',
                      transform: isActive ? 'scale(1.05)' : 'scale(1)'
                    }}
                  >
                    <h1 style={{ fontSize: '1.2rem', margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase', color: isYellow ? '#ffd54f' : 'white' }}>{step.title}</h1>
                    <div className="subtitle" style={{ fontSize: '0.8rem', marginTop: '6px', opacity: 0.8, color: 'white' }}>{step.sublabel}</div>
                  </div>
                );
              })}
            </div>

            {/* Manual Lighting Slider */}
            <div style={{ marginTop: '2rem', width: '100%', maxWidth: '800px', display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.8 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'white' }}>{lang === 'ES' ? 'Línea de Tiempo' : 'Lighting Timeline'}</span>
              </div>
              <div className="slider-container" style={{ flexGrow: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', height: '2px', background: 'rgba(255,255,255,0.8)', width: `${((lightT - 1) / 2) * 100}%`, pointerEvents: 'none', zIndex: 1 }} />
                <input
                  type="range"
                  className="lighting-slider"
                  min="1" max="3" step="0.01"
                  value={lightT}
                  onChange={(e) => {
                    if (isPlaying) {
                      if (audioRef.current) audioRef.current.pause();
                      setIsPlaying(false);
                    }
                    setManualLightT(parseFloat(e.target.value));
                  }}
                  style={{ zIndex: 2, position: 'relative', width: '100%', background: 'rgba(255, 255, 255, 0.2)', height: '2px', appearance: 'none', outline: 'none' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-bar">
        <div className="slider-controls">
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '800px', margin: '0 auto', gap: '1rem' }}>
            <button
              onClick={togglePlay}
              style={{
                background: 'transparent', border: 'none', color: 'white',
                width: '40px', height: '40px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', padding: 0,
                cursor: 'pointer', transition: 'all 0.3s ease', flexShrink: 0
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              title={isPlaying ? "Pause Voice Over" : "Play Voice Over"}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <div className="slider-container" style={{ flexGrow: 1, marginBottom: 0, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', height: '2px', background: 'rgba(255,255,255,0.8)', width: `${((sliderValue - 1) / 3) * 100}%`, pointerEvents: 'none', zIndex: 1 }} />
              <div style={{ position: 'absolute', left: 0, right: 0, height: '100%', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                {[1, 2, 3].map((step) => {
                  const percent = ((step - 1) / 3) * 100;
                  return (
                    <div key={step} style={{
                      position: 'absolute',
                      left: `${percent}%`,
                      transform: 'translateX(-50%)',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#ffd54f',
                      zIndex: 2,
                      boxShadow: '0 0 5px rgba(255, 213, 79, 0.5)'
                    }} />
                  );
                })}
              </div>
              <input
                type="range"
                style={{ zIndex: 3, position: 'relative', width: '100%', background: 'rgba(255,255,255,0.2)' }}
                min="1"
                max="4"
                step="0.01"
                value={sliderValue}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  let newStep = Math.floor(val);
                  if (newStep >= 4) newStep = 3;

                  if (newStep === activeStep) {
                    setSliderValue(val);
                    if (audioRef.current && !isNaN(audioRef.current.duration)) {
                      const progress = val - activeStep;
                      audioRef.current.currentTime = progress * audioRef.current.duration;
                    }
                    if (!hasStarted) setHasStarted(true);
                  } else {
                    handleStepClick(newStep);
                    setSliderValue(val);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Audio Element - defaulting to EN tracks */}
      <audio
        ref={audioRef}
        src={`/assets/audio/L01_VO_00${activeStep}_${lang}.mp3`}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
      />
    </div>
  );
}
