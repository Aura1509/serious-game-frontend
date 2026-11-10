export function animarObjetos(lista, tiempo) {
  for (const animado of lista) {
    const t = tiempo + animado.fase;
    if (animado.tipo === 'FLOAT') {
      animado.objeto.position.y = animado.posicion.y + Math.sin(t * 1.5) * 0.15;
    } else if (animado.tipo === 'SPIN') {
      animado.objeto.rotation.y = animado.rotacion + t * 0.6;
    } else if (animado.tipo === 'PULSE') {
      animado.objeto.scale.copy(animado.escala).multiplyScalar(1 + Math.sin(t * 2.5) * 0.05);
    }
  }
}

export function pulsoDeBaliza(material, tiempo) {
  material.opacity = 0.35 + Math.sin(tiempo * 3) * 0.12;
}
