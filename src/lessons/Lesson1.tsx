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


const stepsData = [
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


function SceneSetup({ sliderValue }: { sliderValue: number }) {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);

  // Pre-allocate THREE objects to avoid GC spikes in useFrame
  const tempPos = useRef(new THREE.Vector3());
  const tempKeyColor = useRef(new THREE.Color());
  const tempFillColor = useRef(new THREE.Color());

  // Smoothly interpolate light position and colors based on slider float value
  useFrame((_, delta) => {
    if (lightRef.current && ambientRef.current) {
      const targetPos = tempPos.current;
      const targetKeyColor = tempKeyColor.current;
      const targetFillColor = tempFillColor.current;
      let targetFillIntensity = 0.5;
      let targetKeyIntensity = 2.5;

      if (sliderValue <= 2) {
        const t = sliderValue - 1;
        targetPos.lerpVectors(stepsData[0].lightPosition, stepsData[1].lightPosition, t);
        targetKeyColor.copy(stepsData[0].keyLightColor).lerp(stepsData[1].keyLightColor, t);
        targetFillColor.copy(stepsData[0].fillLightColor).lerp(stepsData[1].fillLightColor, t);
        targetFillIntensity = THREE.MathUtils.lerp(stepsData[0].fillLightIntensity, stepsData[1].fillLightIntensity, t);
        targetKeyIntensity = THREE.MathUtils.lerp(stepsData[0].keyLightIntensity, stepsData[1].keyLightIntensity, t);
      } else {
        const t = sliderValue - 2;
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
  const currentData = stepsData[activeStep - 1];

  // Audio state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Load new audio when active step changes, and Auto-play if started (with 2 sec delay)
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | undefined;

    if (audioRef.current) {
      audioRef.current.load();
      if (hasStarted) {
        timerId = window.setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play()
              .then(() => setIsPlaying(true))
              .catch(e => console.log('Playback error:', e));
          }
        }, 2000); // 2 second delay before playback
      } else {
        setIsPlaying(false);
      }
    }

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [activeStep, hasStarted]);

  const togglePlay = () => {
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
    setActiveStep(step);
    setSliderValue(step);
    if (!hasStarted) setHasStarted(true);
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

  const rewindAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      if (!isPlaying && hasStarted) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(e => console.log('Playback error:', e));
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && isPlaying && activeStep < 3) {
      let progress = 0;

      if (activeStep === 2) {
        // 40 second delay before slider starts moving
        const delay = 30.0;
        if (audioRef.current.currentTime <= delay) {
          progress = 0;
        } else {
          progress = (audioRef.current.currentTime - delay) / (audioRef.current.duration - delay);
        }
      } else {
        progress = audioRef.current.currentTime / audioRef.current.duration;
      }

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
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Start Button Overlay */}
      {!hasStarted && (
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', backdropFilter: 'blur(5px)'
          }}
          onClick={() => setHasStarted(true)}
        >
          <div style={{
            padding: '1.5rem 4rem', background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px',
            color: 'white', fontSize: '1.5rem', letterSpacing: '0.2em',
            textTransform: 'uppercase', transition: 'all 0.3s ease'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Start Experience
          </div>
        </div>
      )}

      <div className="canvas-wrapper">
        {/* Cinematic Background Crossfader */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '185%', zIndex: -1 }}>
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
                opacity: Math.max(0, 1 - Math.abs(sliderValue - s)),
              }}
            />
          ))}
        </div>

        <Canvas shadows gl={{ alpha: true, antialias: true }}>
          <GltfCamera />
          <SceneSetup sliderValue={sliderValue} />
        </Canvas>

        {/* OVERLAYS */}
        <div className="top-gradient-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', position: 'relative', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ textAlign: 'left' }}>
                <h1>{currentData.title}</h1>
                <div className="subtitle">{currentData.sublabel}</div>
              </div>
              <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.2)' }} />
              {/* Tooltip hidden */}
            </div>
            {/* Audio Controls */}
            <div style={{ position: 'absolute', right: 0, display: 'flex', gap: '0.25rem' }}>
              <button
                onClick={rewindAudio}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: 'white',
                  width: '28px', height: '28px', borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', padding: 0
                }}
                title="Rewind Voice Over"
              >
                ⏪
              </button>
              <button
                onClick={togglePlay}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: 'white',
                  width: '28px', height: '28px', borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', padding: 0
                }}
                title={isPlaying ? "Pause Voice Over" : "Play Voice Over"}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-bar">
        <div className="slider-controls">
          <div className="slider-container">
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={sliderValue}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                const newStep = Math.min(3, Math.floor(val));
                if (newStep === activeStep || (newStep === 3 && activeStep === 3)) {
                  setSliderValue(val);
                  if (audioRef.current && !isNaN(audioRef.current.duration)) {
                    let progress = val - (activeStep === 3 ? 3 : activeStep);
                    
                    // Sync with handleTimeUpdate's 30s delay for Step 2
                    if (activeStep === 2) {
                      const delay = 30.0;
                      const duration = audioRef.current.duration;
                      audioRef.current.currentTime = delay + (progress * (duration - delay));
                    } else {
                      audioRef.current.currentTime = progress * audioRef.current.duration;
                    }
                  }
                  if (!hasStarted) setHasStarted(true);
                } else {
                  handleStepClick(newStep);
                }
              }}
            />
            <div className="step-labels">
              <div className="step-label" onClick={() => handleStepClick(1)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div>First contact</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 300, letterSpacing: '0.05em', opacity: 0.7, marginTop: '4px', textTransform: 'uppercase' }}>Feb 12</div>
              </div>
              <div className="step-label" onClick={() => handleStepClick(2)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div>The descent</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 300, letterSpacing: '0.05em', opacity: 0.7, marginTop: '4px', textTransform: 'uppercase' }}>Apr 9</div>
              </div>
              <div className="step-label" onClick={() => handleStepClick(3)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div>Zenith gate</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 300, letterSpacing: '0.05em', opacity: 0.7, marginTop: '4px', textTransform: 'uppercase' }}>May 24</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Audio Element - defaulting to EN tracks */}
      <audio
        ref={audioRef}
        src={`/assets/audio/L01_VO_00${activeStep}_EN.mp3`}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
      />
    </div>
  );
}
