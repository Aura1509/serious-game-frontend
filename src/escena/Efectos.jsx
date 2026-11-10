import {
  Bloom,
  EffectComposer,
  HueSaturation,
  N8AO,
  SMAA,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

export default function Efectos() {
  return (
    <EffectComposer multisampling={0}>
      <N8AO
        aoRadius={1.6}
        distanceFalloff={0.5}
        intensity={2.2}
        aoSamples={8}
        denoiseSamples={4}
        denoiseRadius={12}
      />
      <Bloom mipmapBlur luminanceThreshold={1.05} luminanceSmoothing={0.25} intensity={0.5} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <HueSaturation saturation={0.12} />
      <Vignette offset={0.32} darkness={0.42} />
      <SMAA />
    </EffectComposer>
  );
}
