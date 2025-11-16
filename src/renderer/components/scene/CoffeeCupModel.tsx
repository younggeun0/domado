/* eslint-disable react/no-unknown-property */
import { useFrame, useLoader } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'

import cupMTL from '../../../../assets/3dmodel/coffee_cup.mtl'
import cupOBJ from '../../../../assets/3dmodel/coffee_cup.obj'

export interface FirePosition {
  x: number
  y: number
  z: number
}

// 간단한 화염 파티클 시스템을 위한 커스텀 shader
const fireVertexShader = `
  attribute float size;
  attribute float life;
  attribute vec3 velocity;
  
  varying float vLife;
  varying vec3 vColor;
  
  void main() {
    vLife = life;
    
    // 화염 색상 (생명력에 따라 변화)
    float lifePercent = 1.0 - life;
    vColor = mix(
      vec3(1.0, 0.3, 0.0),  // 오렌지
      vec3(1.0, 0.8, 0.2),  // 노란색
      lifePercent
    );
    
    // 파티클 위치 업데이트
    vec3 newPosition = position + velocity * life;
    
    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // 파티클 크기 (거리에 따라 조정)
    gl_PointSize = size * (300.0 / -mvPosition.z);
  }
`

const fireFragmentShader = `
  varying float vLife;
  varying vec3 vColor;
  
  void main() {
    // 원형 파티클 만들기
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if (dist > 0.5) discard;
    
    // 생명력에 따른 투명도
    float alpha = (1.0 - vLife) * (1.0 - dist * 2.0);
    
    gl_FragColor = vec4(vColor, alpha);
  }
`

function FireEffect({
  parentGroup,
  cupObj,
  positionOffset,
}: {
  parentGroup: any
  cupObj: THREE.Group
  positionOffset: FirePosition
}) {
  const fireParticlesRef = useRef<THREE.Points | null>(null)
  const geometryRef = useRef<THREE.BufferGeometry | null>(null)
  const positionsRef = useRef<Float32Array | null>(null)
  const livesRef = useRef<Float32Array | null>(null)
  const velocitiesRef = useRef<Float32Array | null>(null)

  useEffect(() => {
    // 컵의 bounding box를 계산하여 상단 위치 찾기
    const box = new THREE.Box3().setFromObject(cupObj)
    const cupTop = box.max.y
    const cupCenterX = (box.min.x + box.max.x) / 2
    const cupCenterZ = (box.min.z + box.max.z) / 2

    const fireX = cupCenterX + positionOffset.x
    const fireY = cupTop + 5 + positionOffset.y
    const fireZ = cupCenterZ + positionOffset.z

    // 간단한 화염 파티클 시스템 생성
    try {
      const particleCount = 500
      const fireRadius = 3
      
      // Geometry 생성
      const geometry = new THREE.BufferGeometry()
      geometryRef.current = geometry
      
      // 파티클 데이터 배열 생성
      const positions = new Float32Array(particleCount * 3)
      const sizes = new Float32Array(particleCount)
      const lives = new Float32Array(particleCount)
      const velocities = new Float32Array(particleCount * 3)
      
      positionsRef.current = positions
      livesRef.current = lives
      velocitiesRef.current = velocities
      
      // 파티클 초기화
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        
        // 초기 위치 (화염 중심 주변에 랜덤하게 배치)
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * fireRadius
        positions[i3] = fireX + Math.cos(angle) * radius
        positions[i3 + 1] = fireY + Math.random() * 2
        positions[i3 + 2] = fireZ + Math.sin(angle) * radius
        
        // 크기
        sizes[i] = 2 + Math.random() * 3
        
        // 생명력 (0 = 새로 생성, 1 = 사라짐)
        lives[i] = Math.random()
        
        // 속도 (위로 올라가며 약간 흔들림)
        velocities[i3] = (Math.random() - 0.5) * 0.5
        velocities[i3 + 1] = 2 + Math.random() * 3
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.5
      }
      
      // Geometry에 attribute 설정
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
      geometry.setAttribute('life', new THREE.BufferAttribute(lives, 1))
      geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
      
      // Material 생성
      const material = new THREE.ShaderMaterial({
        vertexShader: fireVertexShader,
        fragmentShader: fireFragmentShader,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false, // 화염 효과를 위해 depthWrite는 false
        depthTest: true, // 컵 모델 뒤의 파티클을 숨기기 위해 depthTest는 true
      })
      
      // Points 메시 생성
      const fireParticles = new THREE.Points(geometry, material)
      fireParticles.name = 'FireParticles'
      fireParticles.renderOrder = 0 // 컵 모델과 같은 순서로 렌더링 (depth test가 처리)
      parentGroup.add(fireParticles)
      fireParticlesRef.current = fireParticles
    } catch (error) {
      console.error('Failed to create fire effect:', error)
    }

    return () => {
      if (fireParticlesRef.current) {
        parentGroup.remove(fireParticlesRef.current)
        if (fireParticlesRef.current.geometry) {
          fireParticlesRef.current.geometry.dispose()
        }
        const material = fireParticlesRef.current.material
        if (material) {
          if (Array.isArray(material)) {
            material.forEach((m) => m.dispose())
          } else {
            material.dispose()
          }
        }
      }
    }
  }, [parentGroup, cupObj, positionOffset])

  // useFrame을 사용하여 매 프레임 파티클 애니메이션 업데이트
  useFrame((_state, delta) => {
    if (!fireParticlesRef.current || !geometryRef.current) return
    
    const positions = positionsRef.current
    const lives = livesRef.current
    const velocities = velocitiesRef.current
    
    if (!positions || !lives || !velocities) return
    
    const box = new THREE.Box3().setFromObject(cupObj)
    const cupTop = box.max.y
    const cupCenterX = (box.min.x + box.max.x) / 2
    const cupCenterZ = (box.min.z + box.max.z) / 2
    const fireX = cupCenterX + positionOffset.x
    const fireY = cupTop + 5 + positionOffset.y
    const fireZ = cupCenterZ + positionOffset.z
    
    // 파티클 업데이트
    for (let i = 0; i < lives.length; i++) {
      const i3 = i * 3
      
      // 생명력 증가
      lives[i] += delta * 0.5
      
      // 생명력이 1을 넘으면 재생성
      if (lives[i] >= 1.0) {
        lives[i] = 0
        // 새로운 위치로 재설정
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * 3
        positions[i3] = fireX + Math.cos(angle) * radius
        positions[i3 + 1] = fireY + Math.random() * 2
        positions[i3 + 2] = fireZ + Math.sin(angle) * radius
        
        // 새로운 속도
        velocities[i3] = (Math.random() - 0.5) * 0.5
        velocities[i3 + 1] = 2 + Math.random() * 3
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.5
      } else {
        // 위치 업데이트
        positions[i3] += velocities[i3] * delta
        positions[i3 + 1] += velocities[i3 + 1] * delta
        positions[i3 + 2] += velocities[i3 + 2] * delta
      }
    }
    
    // Geometry 업데이트
    const positionAttr = geometryRef.current.getAttribute('position') as THREE.BufferAttribute
    const lifeAttr = geometryRef.current.getAttribute('life') as THREE.BufferAttribute
    const velocityAttr = geometryRef.current.getAttribute('velocity') as THREE.BufferAttribute
    
    if (positionAttr) positionAttr.needsUpdate = true
    if (lifeAttr) lifeAttr.needsUpdate = true
    if (velocityAttr) velocityAttr.needsUpdate = true
  })

  return null
}

interface CoffeeCupModelProps {
  firePosition?: FirePosition
}

export const DEFAULT_FIRE_POSITION: FirePosition = { x: 0.5, y: -7, z: 0 }

export default function CoffeeCupModel({ firePosition = DEFAULT_FIRE_POSITION }: CoffeeCupModelProps) {
  const groupRef = useRef<any>(null)
  const [isGroupSet, setIsGroupSet] = useState(false)
  const cupMaterials = useLoader(MTLLoader, cupMTL) as any
  const cupObj = useLoader(OBJLoader, cupOBJ, (loader) => {
    cupMaterials.preload()
    loader.setMaterials(cupMaterials)
  }) as THREE.Group

  const scale = 12
  cupObj.scale.set(scale, scale, scale)
  cupObj.position.set(0, -75, 0)

  useEffect(() => {
    if (groupRef.current) {
      setIsGroupSet(true)
    }
  }, [groupRef])

  return (
    <group ref={groupRef}>
      <primitive object={cupObj} />
      {isGroupSet && <FireEffect parentGroup={groupRef.current} cupObj={cupObj} positionOffset={firePosition} />}
    </group>
  )
}

