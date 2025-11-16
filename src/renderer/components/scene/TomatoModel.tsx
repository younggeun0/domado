/* eslint-disable react/no-unknown-property */
import { useTexture } from '@react-three/drei'
import { useFrame, useLoader } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'

import tomatoMTL from '../../../../assets/3dmodel/tomato.mtl'
import tomatoOBJ from '../../../../assets/3dmodel/tomato.obj'
import tomatoTexture from '../../../../assets/3dmodel/tomato_texture.jpg'

interface TomatoModelProps {
  paused: boolean
}

export default function TomatoModel({ paused }: TomatoModelProps) {
  const groupRef = useRef<THREE.Group | null>(null)

  const tomatoMaterials = useLoader(MTLLoader, tomatoMTL) as any
  const tomatoObj = useLoader(OBJLoader, tomatoOBJ, (loader) => {
    tomatoMaterials.preload()
    loader.setMaterials(tomatoMaterials)
  }) as THREE.Group

  const texture = useTexture(tomatoTexture)
  // 텍스처를 모델에 적용
  tomatoObj.traverse((child: THREE.Object3D) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      if (mesh.geometry && mesh.geometry.attributes.uv && mesh.material) {
        const material = mesh.material as THREE.MeshStandardMaterial
        if (material) {
          material.map = texture
        }
      }
    }
  })

  // 토마토를 세우기 위해 회전 (누워있는 모델을 일으킴)
  tomatoObj.rotation.x = -Math.PI / 2

  // 회전이 적용된 후 bounding box를 계산하여 중심을 원점에 맞춤
  useEffect(() => {
    // rotation이 적용된 후의 bounding box 계산
    const box = new THREE.Box3().setFromObject(tomatoObj)
    const center = box.getCenter(new THREE.Vector3())

    // 회전된 모델의 중심을 원점으로 이동 (카메라가 원점을 볼 때 토마토가 중앙에 오도록)
    tomatoObj.position.sub(center)
  }, [tomatoObj])

  // 애니메이션
  useFrame(() => {
    if (groupRef.current && !paused) {
      groupRef.current.rotation.z += 0.01
    }
  })

  return <primitive ref={groupRef} object={tomatoObj} />
}
