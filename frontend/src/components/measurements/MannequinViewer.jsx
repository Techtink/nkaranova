import { useRef, useState, useEffect, Suspense, Component } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF, Center } from '@react-three/drei';
import * as THREE from 'three';
import './MannequinViewer.scss';

// Error boundary to catch GLTF loading errors
class ModelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.log('3D Model loading error:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Measurement point marker component in 3D space
function MeasurementPoint({ point, position, isSelected, isHighlighted, onClick, showLabel }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      // Pulse animation for highlighted points
      if (isHighlighted || isSelected) {
        meshRef.current.scale.setScalar(1 + Math.sin(Date.now() * 0.005) * 0.2);
      } else {
        meshRef.current.scale.setScalar(hovered ? 1.3 : 1);
      }
    }
  });

  const color = isSelected ? '#22c55e' : isHighlighted ? '#f59e0b' : hovered ? '#3b82f6' : '#ef4444';

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick(point);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      {(hovered || showLabel) && (
        <Html center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="measurement-point-label">
            {point.name}
          </div>
        </Html>
      )}
    </group>
  );
}

// GLTF Female Body Model
function FemaleGLTFBody({ measurements, selectedPoint, highlightedPoint, onPointClick, showLabels }) {
  const { scene } = useGLTF('/models/female-body.gltf');
  const modelRef = useRef();

  useEffect(() => {
    if (scene) {
      // Apply skin-like material to all meshes
      scene.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: '#d4b896',
            roughness: 0.7,
            metalness: 0.1
          });
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [scene]);

  // Measurement point positions for female GLTF model
  // These will need adjustment based on your specific model's scale and proportions
  const getPosition = (point) => {
    if (!point.position) return [0, 0, 0.15];
    const pos = point.position.female;
    if (!pos || !pos.front) return [0, 0, 0.15];

    // Convert percentage to 3D coordinates
    // Adjust these values based on your specific GLTF model's dimensions
    const x = (pos.front.x - 50) / 50 * 0.3;
    const y = (50 - pos.front.y) / 50 * 0.9;
    const z = 0.12;

    return [x, y, z];
  };

  return (
    <group ref={modelRef}>
      <Center>
        <primitive
          object={scene}
          scale={1.0} // Model already has internal scaling
          position={[0, 0, 0]} // Center will handle positioning
        />
      </Center>
      {/* Measurement Points */}
      {measurements.map((point) => (
        <MeasurementPoint
          key={point.key}
          point={point}
          position={getPosition(point)}
          isSelected={selectedPoint?.key === point.key}
          isHighlighted={highlightedPoint?.key === point.key}
          onClick={onPointClick}
          showLabel={showLabels}
        />
      ))}
    </group>
  );
}

// Human body mesh - simplified stylized body (used for male or fallback)
function HumanBody({ gender, measurements, selectedPoint, highlightedPoint, onPointClick, showLabels }) {
  const groupRef = useRef();

  // Body proportions based on gender
  const proportions = gender === 'male' ? {
    headSize: 0.18,
    shoulderWidth: 0.45,
    chestWidth: 0.4,
    waistWidth: 0.35,
    hipWidth: 0.38,
    torsoHeight: 0.7,
    legHeight: 0.9,
    armLength: 0.65,
    neckHeight: 0.1
  } : {
    headSize: 0.17,
    shoulderWidth: 0.38,
    chestWidth: 0.35,
    waistWidth: 0.28,
    hipWidth: 0.4,
    torsoHeight: 0.65,
    legHeight: 0.85,
    armLength: 0.58,
    neckHeight: 0.08
  };

  const bodyColor = gender === 'male' ? '#c4a67a' : '#d4b896';

  // Convert 2D position percentages to 3D coordinates
  const getPosition = (point) => {
    if (!point.position) return [0, 0, 0.2];
    const pos = point.position[gender];
    if (!pos || !pos.front) return [0, 0, 0.2];

    // Convert percentage to 3D coordinates
    // x: -1 to 1 (left to right)
    // y: -1.5 to 1.5 (bottom to top, body is centered at 0)
    // z: front of body
    const x = (pos.front.x - 50) / 50 * 0.5;
    const y = (50 - pos.front.y) / 50 * 1.5;
    const z = 0.25;

    return [x, y, z];
  };

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh position={[0, 1.25, 0]}>
        <sphereGeometry args={[proportions.headSize, 32, 32]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.06, 0.08, proportions.neckHeight, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} />
      </mesh>

      {/* Torso */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[proportions.waistWidth / 2, proportions.shoulderWidth / 2, proportions.torsoHeight, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} />
      </mesh>

      {/* Hips */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[proportions.hipWidth / 2.5, proportions.waistWidth / 2, 0.2, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} />
      </mesh>

      {/* Left Arm */}
      <group position={[-proportions.shoulderWidth / 2 - 0.05, 0.85, 0]} rotation={[0, 0, Math.PI / 12]}>
        <mesh position={[0, -0.15, 0]}>
          <capsuleGeometry args={[0.05, 0.25, 8, 16]} />
          <meshStandardMaterial color={bodyColor} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.45, 0]}>
          <capsuleGeometry args={[0.04, 0.25, 8, 16]} />
          <meshStandardMaterial color={bodyColor} roughness={0.8} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group position={[proportions.shoulderWidth / 2 + 0.05, 0.85, 0]} rotation={[0, 0, -Math.PI / 12]}>
        <mesh position={[0, -0.15, 0]}>
          <capsuleGeometry args={[0.05, 0.25, 8, 16]} />
          <meshStandardMaterial color={bodyColor} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.45, 0]}>
          <capsuleGeometry args={[0.04, 0.25, 8, 16]} />
          <meshStandardMaterial color={bodyColor} roughness={0.8} />
        </mesh>
      </group>

      {/* Left Leg */}
      <group position={[-0.1, -0.1, 0]}>
        <mesh position={[0, -0.3, 0]}>
          <capsuleGeometry args={[0.08, 0.4, 8, 16]} />
          <meshStandardMaterial color={bodyColor} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.75, 0]}>
          <capsuleGeometry args={[0.06, 0.4, 8, 16]} />
          <meshStandardMaterial color={bodyColor} roughness={0.8} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group position={[0.1, -0.1, 0]}>
        <mesh position={[0, -0.3, 0]}>
          <capsuleGeometry args={[0.08, 0.4, 8, 16]} />
          <meshStandardMaterial color={bodyColor} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.75, 0]}>
          <capsuleGeometry args={[0.06, 0.4, 8, 16]} />
          <meshStandardMaterial color={bodyColor} roughness={0.8} />
        </mesh>
      </group>

      {/* Measurement Points */}
      {measurements.map((point) => (
        <MeasurementPoint
          key={point.key}
          point={point}
          position={getPosition(point)}
          isSelected={selectedPoint?.key === point.key}
          isHighlighted={highlightedPoint?.key === point.key}
          onClick={onPointClick}
          showLabel={showLabels}
        />
      ))}
    </group>
  );
}

// Camera controller for auto-rotate and reset
function CameraController({ autoRotate, resetKey }) {
  const { camera } = useThree();
  const controlsRef = useRef();

  useEffect(() => {
    if (resetKey && controlsRef.current) {
      // Reset camera position
      camera.position.set(0, 0.5, 3);
      controlsRef.current.target.set(0, 0.3, 0);
      controlsRef.current.update();
    }
  }, [resetKey, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={true}
      enablePan={false}
      minDistance={2}
      maxDistance={5}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI * 3 / 4}
      autoRotate={autoRotate}
      autoRotateSpeed={0.5}
      target={[0, 0.3, 0]}
    />
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <Html center>
      <div className="mannequin-loading">
        <div className="spinner"></div>
        <span>Loading 3D Model...</span>
      </div>
    </Html>
  );
}

// Main Mannequin Viewer Component
export default function MannequinViewer({
  gender = 'male',
  measurements = [],
  selectedPoint = null,
  highlightedPoint = null,
  onPointClick = () => {},
  showLabels = false,
  autoRotate = false,
  className = ''
}) {
  const [resetKey, setResetKey] = useState(0);
  const [viewMode, setViewMode] = useState('front'); // front, back, side

  const handleViewChange = (mode) => {
    setViewMode(mode);
    setResetKey(prev => prev + 1);
  };

  return (
    <div className={`mannequin-viewer ${className}`}>
      <div className="mannequin-controls">
        <div className="gender-indicator">
          <span className={`gender-badge ${gender}`}>
            {gender === 'male' ? '♂ Male' : '♀ Female'}
          </span>
        </div>
        <div className="view-controls">
          <button
            className={`view-btn ${viewMode === 'front' ? 'active' : ''}`}
            onClick={() => handleViewChange('front')}
            title="Front View"
          >
            Front
          </button>
          <button
            className={`view-btn ${viewMode === 'back' ? 'active' : ''}`}
            onClick={() => handleViewChange('back')}
            title="Back View"
          >
            Back
          </button>
          <button
            className="reset-btn"
            onClick={() => setResetKey(prev => prev + 1)}
            title="Reset View"
          >
            ↻
          </button>
        </div>
      </div>

      <div className="mannequin-canvas-container">
        <Canvas
          camera={{ position: [0, 0.5, 3], fov: 40 }}
          gl={{ antialias: true, alpha: true }}
        >
          <color attach="background" args={['#f8f9fa']} />

          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
          <directionalLight position={[-5, 5, -5]} intensity={0.4} />
          <pointLight position={[0, 2, 3]} intensity={0.3} />

          <Suspense fallback={<LoadingFallback />}>
            {gender === 'female' ? (
              <ModelErrorBoundary
                fallback={
                  <HumanBody
                    gender="female"
                    measurements={measurements}
                    selectedPoint={selectedPoint}
                    highlightedPoint={highlightedPoint}
                    onPointClick={onPointClick}
                    showLabels={showLabels}
                  />
                }
              >
                <FemaleGLTFBody
                  measurements={measurements}
                  selectedPoint={selectedPoint}
                  highlightedPoint={highlightedPoint}
                  onPointClick={onPointClick}
                  showLabels={showLabels}
                />
              </ModelErrorBoundary>
            ) : (
              <HumanBody
                gender={gender}
                measurements={measurements}
                selectedPoint={selectedPoint}
                highlightedPoint={highlightedPoint}
                onPointClick={onPointClick}
                showLabels={showLabels}
              />
            )}
          </Suspense>

          <CameraController autoRotate={autoRotate} resetKey={resetKey} />

          {/* Ground plane for reference */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]} receiveShadow>
            <circleGeometry args={[1, 32]} />
            <meshStandardMaterial color="#e5e7eb" transparent opacity={0.5} />
          </mesh>
        </Canvas>
      </div>

      <div className="mannequin-instructions">
        <p>🖱️ Drag to rotate • Scroll to zoom • Click points to measure</p>
      </div>
    </div>
  );
}
