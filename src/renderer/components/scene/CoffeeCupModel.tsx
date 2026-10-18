import { ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

// 모델 파일을 따로 불러오지 않도록 OBJ·MTL을 텍스트로 번들해 바로 파싱한다
import cupMTL from '../../../../assets/3dmodel/coffee_cup.mtl?raw'
import cupOBJ from '../../../../assets/3dmodel/coffee_cup.obj?raw'

// 모델 좌표(OBJ 단위) 기준 잔 안 커피 면. 안쪽 벽 단면을 원으로 맞춘 중심이고,
// 반지름은 안쪽 벽(0.35)과 바깥 벽(0.39) 사이라 가장자리가 잔 두께 안에 숨어 빈틈이 없다
const COFFEE_SURFACE = { x: 0.1758, y: 6.58, z: 0.0079, radius: 0.37 }

// 커피 색: 가운데는 짙고, 잔 벽에 닿는 가장자리는 크레마처럼 밝은 갈색
function createCoffeeColor() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const c = size / 2
  const gradient = ctx.createRadialGradient(c, c, 0, c, c, c)
  gradient.addColorStop(0, '#1e0d05')
  gradient.addColorStop(0.7, '#2b1308')
  gradient.addColorStop(0.88, '#5a3218')
  gradient.addColorStop(0.95, '#8a5a32')
  gradient.addColorStop(1, '#4a2812')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

// 잔잔한 물결 노멀 맵. 정수 주파수 사인파의 합이라 이음매 없이 반복되고, 흘려보내면 반사가 일렁인다
function createRippleNormals() {
  const size = 256
  const waves = [
    [1, 0, 0.0, 1.0],
    [0, 1, 1.3, 0.9],
    [1, -1, 2.1, 0.6],
    [2, 1, 0.7, 0.35],
    [-1, 2, 2.8, 0.25],
  ]
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // 높이의 기울기(dx, dy)로 노멀을 만든다
      let dx = 0
      let dy = 0
      for (const [fx, fy, phase, amp] of waves) {
        const k = Math.cos(((fx * x + fy * y) / size) * Math.PI * 2 + phase) * amp
        dx += k * fx
        dy += k * fy
      }
      const nx = -dx * 0.05
      const ny = -dy * 0.05
      const len = Math.hypot(nx, ny, 1)
      const i = (y * size + x) * 4
      data[i] = ((nx / len) * 0.5 + 0.5) * 255
      data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255
      data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255
      data[i + 3] = 255
    }
  }
  const texture = new THREE.DataTexture(data, size, size)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(0.6, 0.6)
  texture.needsUpdate = true
  return texture
}

const STEAM_COUNT = 140

// 김 파티클: 올라가며 커지고, 나타났다 흐려진다
const steamVertexShader = `
  attribute float size;
  attribute float life;
  varying float vLife;

  void main() {
    vLife = life;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = size * (0.6 + life * 1.8) * (300.0 / -mvPosition.z);
  }
`

const steamFragmentShader = `
  varying float vLife;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float fade = smoothstep(0.0, 0.3, vLife) * (1.0 - vLife);
    float alpha = fade * pow(1.0 - dist * 2.0, 2.0) * 0.18;
    gl_FragColor = vec4(vec3(1.0, 0.97, 0.92), alpha);
  }
`

function SteamEffect({ cupObj }: { cupObj: THREE.Group }) {
  const steam = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cupObj)
    const origin = new THREE.Vector3((box.min.x + box.max.x) / 2 + 0.5, box.max.y + 0.5, (box.min.z + box.max.z) / 2)

    const positions = new Float32Array(STEAM_COUNT * 3)
    const sizes = new Float32Array(STEAM_COUNT)
    const lives = new Float32Array(STEAM_COUNT)
    const velocities = new Float32Array(STEAM_COUNT * 3)
    const respawn = (i: number) => {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 1.2
      positions.set([origin.x + Math.cos(angle) * radius, origin.y, origin.z + Math.sin(angle) * radius], i * 3)
      velocities.set([(Math.random() - 0.5) * 0.4, 2.5 + Math.random() * 1.5, (Math.random() - 0.5) * 0.6], i * 3)
    }
    for (let i = 0; i < STEAM_COUNT; i++) {
      respawn(i)
      sizes[i] = 2.5 + Math.random() * 2
      lives[i] = Math.random()
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('life', new THREE.BufferAttribute(lives, 1))
    const material = new THREE.ShaderMaterial({
      vertexShader: steamVertexShader,
      fragmentShader: steamFragmentShader,
      transparent: true,
      depthWrite: false,
    })
    return { points: new THREE.Points(geometry, material), positions, lives, velocities, respawn }
  }, [cupObj])

  useEffect(
    () => () => {
      steam.points.geometry.dispose()
      ;(steam.points.material as THREE.Material).dispose()
    },
    [steam],
  )

  useFrame(({ clock }, delta) => {
    const { points, positions, lives, velocities, respawn } = steam
    const time = clock.elapsedTime
    for (let i = 0; i < STEAM_COUNT; i++) {
      lives[i] += delta * 0.2
      if (lives[i] >= 1) {
        lives[i] = 0
        respawn(i)
        continue
      }
      // 위로 올라가며 좌우로 천천히 흔들린다
      positions[i * 3] += (velocities[i * 3] + Math.sin(time * 0.8 + positions[i * 3 + 1] * 0.3) * 1.2) * delta
      positions[i * 3 + 1] += velocities[i * 3 + 1] * delta
      positions[i * 3 + 2] += velocities[i * 3 + 2] * delta
    }
    points.geometry.getAttribute('position').needsUpdate = true
    points.geometry.getAttribute('life').needsUpdate = true
  })

  return <primitive object={steam.points} />
}

interface CoffeeCupModelProps {
  onTogglePlay?: () => void
}

export default function CoffeeCupModel({ onTogglePlay }: CoffeeCupModelProps) {
  const gl = useThree(state => state.gl)
  // 커피 면에 비칠 실내 조명 환경. 외부 HDR 파일 없이 three가 만든 방을 쓴다
  const environment = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const target = pmrem.fromScene(new RoomEnvironment(), 0.04)
    pmrem.dispose()
    return target
  }, [gl])

  const { cupObj, liquid } = useMemo(() => {
    const materials = new MTLLoader().parse(cupMTL, '')
    materials.preload()
    const obj = new OBJLoader().setMaterials(materials).parse(cupOBJ)

    const scale = 12
    obj.scale.set(scale, scale, scale)
    obj.position.set(0, -75, 0)

    // 잔 안의 커피 면. 모델의 자식이라 모델 좌표로 놓는다.
    // 매끈한 면이 주변을 비추고(비스듬히 볼수록 강하게) 물결 노멀이 그 반사를 일렁이게 한다
    const surface = new THREE.Mesh(
      new THREE.CircleGeometry(1, 64),
      new THREE.MeshPhysicalMaterial({
        map: createCoffeeColor(),
        roughness: 0.18,
        normalMap: createRippleNormals(),
        normalScale: new THREE.Vector2(0.6, 0.6),
        envMapIntensity: 0.6,
        ior: 1.34,
        specularIntensity: 1,
      }),
    )
    surface.rotation.x = -Math.PI / 2
    surface.position.set(COFFEE_SURFACE.x, COFFEE_SURFACE.y, COFFEE_SURFACE.z)
    surface.scale.setScalar(COFFEE_SURFACE.radius)
    obj.add(surface)
    return { cupObj: obj, liquid: surface }
  }, [])

  useEffect(() => {
    ;(liquid.material as THREE.MeshPhysicalMaterial).envMap = environment.texture
    ;(liquid.material as THREE.MeshPhysicalMaterial).needsUpdate = true
    return () => environment.dispose()
  }, [liquid, environment])

  useEffect(
    () => () => {
      liquid.geometry.dispose()
      const material = liquid.material as THREE.MeshPhysicalMaterial
      material.map?.dispose()
      material.normalMap?.dispose()
      material.dispose()
    },
    [liquid],
  )

  // 물결을 천천히 흘려 반사가 일렁이게 한다
  useFrame((_state, delta) => {
    const normalMap = (liquid.material as THREE.MeshPhysicalMaterial).normalMap
    if (normalMap) normalMap.offset.x += delta * 0.02
    if (normalMap) normalMap.offset.y += delta * 0.013
  })

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    onTogglePlay?.()
  }

  return (
    <group>
      <primitive object={cupObj} onClick={handleClick} />
      <SteamEffect cupObj={cupObj} />
    </group>
  )
}
