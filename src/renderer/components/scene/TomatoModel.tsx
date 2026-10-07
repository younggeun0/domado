import { useGLTF } from '@react-three/drei'
import { ThreeEvent, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

import tomatoGLB from '../../../../assets/3dmodel/tomato.glb?url'

interface TomatoModelProps {
  paused: boolean
  onTogglePlay: () => void
}

export default function TomatoModel({ paused, onTogglePlay }: TomatoModelProps) {
  const groupRef = useRef<THREE.Group | null>(null)

  // tomato.glb는 원본 OBJ+텍스처를 obj2gltf → gltf-transform optimize(meshopt, webp)로 변환한 것
  const { scene } = useGLTF(tomatoGLB)

  const tomatoObj = useMemo(() => {
    const clonedTomatoObj = scene.clone(true)

    // glTF는 PBR 재질로 들어오므로, 기존 MTL(blinn1SG, Kd 1.0)이 만들던 Phong 재질로 바꿔 같은 질감을 유지한다
    clonedTomatoObj.traverse((child: THREE.Object3D) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh) {
        const map = (mesh.material as THREE.MeshStandardMaterial).map
        // GLTFLoader는 map을 sRGB로 지정하지만, 기존 OBJ 경로는 색공간 지정이 없었다 — 기존 색감 유지
        if (map) map.colorSpace = THREE.NoColorSpace
        mesh.material = new THREE.MeshPhongMaterial({ map })
      }
    })

    // 토마토를 세우기 위해 회전 (누워있는 모델을 일으킴)
    clonedTomatoObj.rotation.x = -Math.PI / 2

    // rotation이 적용된 후의 bounding box 계산
    clonedTomatoObj.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(clonedTomatoObj)
    const center = box.getCenter(new THREE.Vector3())

    // 회전된 모델의 중심을 원점으로 이동 (카메라가 원점을 볼 때 토마토가 중앙에 오도록)
    clonedTomatoObj.position.sub(center)

    return clonedTomatoObj
  }, [scene])

  // 애니메이션
  useFrame(() => {
    if (groupRef.current && !paused) {
      groupRef.current.rotation.z += 0.01
    }
  })

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    onTogglePlay()
  }

  return <primitive ref={groupRef} object={tomatoObj} onClick={handleClick} />
}
