import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

// A soft edge follows nearby mouse movement; only the button changes navigation state.
export function useSidebarEdge(isCollapsed) {
  const sidebarElement = ref(null)
  const edgeHeight = ref(800)
  const y = ref(48)
  const bulge = ref(26)
  let targetY = 48
  let targetBulge = 26
  let velocityY = 0
  let velocityBulge = 0
  let frame = 0
  let lastTime = 0
  let focused = false
  let pressed = false
  let reducedMotion
  let observer

  const edgePath = computed(() => {
    const span = 65
    return `M0 0 H1 V${y.value - span} C1 ${y.value - 40} ${bulge.value} ${y.value - 36} ${bulge.value} ${y.value} C${bulge.value} ${y.value + 36} 1 ${y.value + 40} 1 ${y.value + span} V${edgeHeight.value} H0 Z`
  })
  const edgeButtonStyle = computed(() => ({
    transform: `translate(${bulge.value * .4 - 18}px, ${y.value - 22}px)`,
  }))

  function animate(time) {
    const step = Math.min((time - (lastTime || time - 16.67)) / 16.67, 2)
    lastTime = time
    velocityY = (velocityY + (targetY - y.value) * .12 * step) * Math.pow(.65, step)
    velocityBulge = (velocityBulge + (targetBulge - bulge.value) * .16 * step) * Math.pow(.62, step)
    y.value += velocityY * step
    bulge.value += velocityBulge * step
    if (Math.abs(targetY - y.value) + Math.abs(targetBulge - bulge.value) + Math.abs(velocityY) + Math.abs(velocityBulge) > .1) {
      frame = requestAnimationFrame(animate)
    } else {
      y.value = targetY
      bulge.value = targetBulge
      frame = 0
      lastTime = 0
    }
  }
  function update() {
    if (reducedMotion?.matches) {
      cancelAnimationFrame(frame)
      frame = 0
      lastTime = 0
      velocityY = velocityBulge = 0
      y.value = targetY
      bulge.value = targetBulge = 26
    } else if (!frame) frame = requestAnimationFrame(animate)
  }
  function resetEdge() {
    if (focused || pressed) return
    targetBulge = 26
    update()
  }
  function onEdgePointerMove(event) {
    if (event.pointerType !== 'mouse' || focused || pressed || reducedMotion?.matches) return
    const rect = sidebarElement.value?.getBoundingClientRect()
    if (!rect) return
    const distance = event.clientX - rect.right
    if (distance < 0 || distance > 110) return resetEdge()
    targetY = Math.max(48, Math.min(edgeHeight.value - 48, event.clientY - rect.top))
    targetBulge = 26 + 10 * (1 - distance / 110)
    update()
  }
  function focusEdge(event) { focused = event.target.matches(':focus-visible') }
  function blurEdge() { focused = false; resetEdge() }
  function pressEdge(event) { event.stopPropagation(); pressed = true; targetBulge = 18; update() }
  function releaseEdge() { pressed = false; targetBulge = 26; update() }
  watch(isCollapsed, () => { velocityBulge = 5; releaseEdge() })
  onMounted(() => {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotion.addEventListener('change', update)
    observer = new ResizeObserver(([entry]) => {
      edgeHeight.value = entry.contentRect.height
      targetY = Math.max(48, Math.min(edgeHeight.value - 48, targetY))
      update()
    })
    observer.observe(sidebarElement.value)
    window.addEventListener('pointerup', releaseEdge)
    window.addEventListener('blur', releaseEdge)
  })
  onUnmounted(() => {
    observer?.disconnect()
    reducedMotion?.removeEventListener('change', update)
    window.removeEventListener('pointerup', releaseEdge)
    window.removeEventListener('blur', releaseEdge)
    cancelAnimationFrame(frame)
  })
  return { sidebarElement, edgeHeight, edgePath, edgeButtonStyle, onEdgePointerMove, resetEdge, focusEdge, blurEdge, pressEdge, releaseEdge }
}
