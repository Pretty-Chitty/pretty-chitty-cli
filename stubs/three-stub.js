// THREE.js stub for Node builds
// Provides NoopClass for all common THREE.js exports

const NoopClass = class { constructor() {} };

// Geometries
export const BoxGeometry = NoopClass;
export const CircleGeometry = NoopClass;
export const ConeGeometry = NoopClass;
export const CylinderGeometry = NoopClass;
export const PlaneGeometry = NoopClass;
export const SphereGeometry = NoopClass;
export const TorusGeometry = NoopClass;
export const BufferGeometry = NoopClass;
export const ExtrudeGeometry = NoopClass;
export const ShapeGeometry = NoopClass;

// Materials
export const Material = NoopClass;
export const MeshBasicMaterial = NoopClass;
export const MeshLambertMaterial = NoopClass;
export const MeshPhongMaterial = NoopClass;
export const MeshStandardMaterial = NoopClass;
export const LineBasicMaterial = NoopClass;
export const PointsMaterial = NoopClass;
export const ShaderMaterial = NoopClass;
export const SpriteMaterial = NoopClass;

// Objects
export const Mesh = NoopClass;
export const Group = NoopClass;
export const Line = NoopClass;
export const LineSegments = NoopClass;
export const Points = NoopClass;
export const Sprite = NoopClass;
export const Object3D = NoopClass;
export const Scene = NoopClass;
export const SkinnedMesh = NoopClass;

// Cameras
export const Camera = NoopClass;
export const PerspectiveCamera = NoopClass;
export const OrthographicCamera = NoopClass;

// Lights
export const AmbientLight = NoopClass;
export const DirectionalLight = NoopClass;
export const HemisphereLight = NoopClass;
export const PointLight = NoopClass;
export const SpotLight = NoopClass;
export const RectAreaLight = NoopClass;

// Math
export const Vector2 = NoopClass;
export const Vector3 = NoopClass;
export const Vector4 = NoopClass;
export const Matrix3 = NoopClass;
export const Matrix4 = NoopClass;
export const Quaternion = NoopClass;
export const Euler = NoopClass;
export const Color = NoopClass;
export const Box3 = NoopClass;
export const Plane = NoopClass;
export const Raycaster = NoopClass;
export const Triangle = NoopClass;

// Loaders
export const Loader = NoopClass;
export const TextureLoader = NoopClass;
export const CubeTextureLoader = NoopClass;
export const FileLoader = NoopClass;
export const LoadingManager = NoopClass;

// Core
export const BufferAttribute = NoopClass;
export const Float32BufferAttribute = NoopClass;
export const Clock = NoopClass;
export const WebGLRenderer = NoopClass;
export const WebGLRenderTarget = NoopClass;
export const CanvasTexture = NoopClass;
export const Fog = NoopClass;

// Animation
export const AnimationClip = NoopClass;
export const AnimationMixer = NoopClass;
export const Skeleton = NoopClass;

// Extras
export const Shape = NoopClass;
export const Path = NoopClass;
export const ShapePath = NoopClass;
export const ShapeUtils = { area: () => 0, isClockWise: () => true, triangulateShape: () => [] };
export const MathUtils = { degToRad: () => 0, radToDeg: () => 0, clamp: (v) => v, lerp: (a) => a };

// Constants
export const DoubleSide = 2;
export const FrontSide = 0;
export const LinearFilter = 1006;
export const NearestFilter = 1003;
export const RepeatWrapping = 1000;
export const SRGBColorSpace = 'srgb';
export const LinearSRGBColorSpace = 'srgb-linear';

// Default export with Proxy for any other access
const handler = { get: (_, prop) => prop === '__esModule' ? true : NoopClass };
export default new Proxy({}, handler);
