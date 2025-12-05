import { useEffect, useRef } from "react";

/**
 * Auto-scroll theo mép trên/dưới của CONTAINER.
 * - onlyWhenHovering: chỉ chạy khi chuột đang ở trong list,
 *   hoặc sát mép trên/dưới (theo X của list) => không còn “nghe full page”.
 * - Dynamic target mỗi frame (container nếu scrollable, else window).
 */
export default function useHoverAutoscroll(
  ref,
  {
    edge = 100,          // dải kích hoạt mép (px)
    margin = 60,         // khoan dung theo Y
    xMargin = 24,        // khoan dung theo X
    maxSpeed = 900,
    easing = 0.22,
    onlyWhenHovering = true,
    forceEnable = true,
    onDebug,
  } = {}
) {
  const s = useRef({
    targetV: 0, v: 0, raf: 0, last: 0,
    enabled: true, targetEl: null, running: false,
    hovering: false, // gate
  });

  useEffect(() => {
    const canHover = window.matchMedia?.("(hover: hover)")?.matches ?? true;
    const reduced  = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    s.current.enabled = (forceEnable ?? (canHover && !reduced));
    onDebug?.({ type: "mount", enabled: s.current.enabled });
    if (!s.current.enabled) return;

    const el = ref?.current;
    if (!el) return;

    const winEl = () => document.scrollingElement || document.documentElement;
    const isScrollable = (node) => !!node && (node.scrollHeight - node.clientHeight) > 1;

    // Hover gate: chỉ cho chạy khi pointer trong container
    const onEnter = () => { s.current.hovering = true; };
    const onLeave = () => { s.current.hovering = false; s.current.targetV = 0; setRunning(false); };
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);

    const setRunning = (on) => {
      if (on === s.current.running) return;
      s.current.running = on;
      // tắt snap khi chạy để khỏi “bật ngược”
      if (on) el.dataset.asRunning = "1";
      else delete el.dataset.asRunning;
    };

    const updateTarget = () => {
      const next = isScrollable(el) ? el : winEl();
      if (s.current.targetEl !== next) {
        s.current.targetEl = next;
        onDebug?.({ type: "target", target: next === winEl() ? "window" : "container" });
      }
      return next;
    };

    const onMove = (e) => {
      const target = updateTarget();
      const rect = el.getBoundingClientRect();

      // Gate: chỉ kích nếu
      // - đang hover TRONG container, hoặc
      // - chuột nằm cùng trục X của container (±xMargin) VÀ ở trong dải edge trên/dưới (±margin)
      const inX = e.clientX >= rect.left - xMargin && e.clientX <= rect.right + xMargin;
      const inY = e.clientY >= rect.top - margin && e.clientY <= rect.bottom + margin;
      const inEdges = e.clientY < rect.top + edge || e.clientY > rect.bottom - edge;

      if (onlyWhenHovering) {
        if (!(s.current.hovering || (inX && inY && inEdges))) {
          s.current.targetV = 0;
          setRunning(false);
          return;
        }
      } else {
        if (!(inX && inY)) { s.current.targetV = 0; setRunning(false); return; }
      }

      let t = 0;
      if (e.clientY < rect.top + edge) t = -((rect.top + edge - e.clientY) / edge);
      else if (e.clientY > rect.bottom - edge) t =  ((e.clientY - (rect.bottom - edge)) / edge);

      s.current.targetV = t * maxSpeed;
      setRunning(t !== 0);

      if (!s.current.raf) {
        s.current.last = performance.now();
        s.current.raf = requestAnimationFrame(tick);
      }
    };

    const tick = (now) => {
      const st = s.current;
      const dt = Math.max(0, now - st.last) / 1000;
      st.last = now;

      // tiệm cận tốc độ
      st.v += (st.targetV - st.v) * easing;

      const win = winEl();
      const target = st.targetEl && st.targetEl.nodeType === 1 ? st.targetEl : win;

      if (Math.abs(st.v) >= 0.3) {
        if (target === win) {
          const cur = win.scrollTop;
          const max = win.scrollHeight - window.innerHeight;
          const next = Math.min(Math.max(cur + st.v * dt, 0), max);
          if (next !== cur) win.scrollTop = next;
          onDebug?.({ type: "tick", target: "window", v: st.v, tv: st.targetV, top: next });
        } else {
          const cur = target.scrollTop;
          const next = cur + st.v * dt;
          target.scrollTop = next;
          onDebug?.({ type: "tick", target: "container", v: st.v, tv: st.targetV, top: target.scrollTop });
        }
      }

      if (Math.abs(st.v) < 0.3 && Math.abs(st.targetV) < 0.3) {
        cancelAnimationFrame(st.raf);
        st.raf = 0;
        setRunning(false);
        onDebug?.({ type: "stop" });
        return;
      }
      st.raf = requestAnimationFrame(tick);
    };

    // Nghe cả mouse + pointer ở capture phase để không bị chặn
    const opts = { capture: true, passive: true };
    document.addEventListener("mousemove", onMove, opts);
    document.addEventListener("pointermove", onMove, opts);

    return () => {
      document.removeEventListener("mousemove", onMove, opts);
      document.removeEventListener("pointermove", onMove, opts);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      if (s.current.raf) cancelAnimationFrame(s.current.raf);
      s.current.raf = 0;
    };
  }, [ref, edge, margin, xMargin, maxSpeed, easing, onlyWhenHovering, forceEnable, onDebug]);
}
