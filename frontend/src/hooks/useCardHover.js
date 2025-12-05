import { useEffect, useRef } from "react";

/** Gắn lên ref của card để tạo tilt 3D, shine, parallax */
export default function useCardHover(ref, { maxTilt = 8, damping = 0.14 } = {}) {
  const st = useRef({ rx: 0, ry: 0, tx: 0, ty: 0, raf: 0, hover: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onEnter = () => { st.current.hover = true; el.classList.add("is-hover"); };
    const onLeave = () => { st.current.hover = false; el.classList.remove("is-hover"); kick(); };
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const nx = (x / rect.width) * 2 - 1;   // -1..1
      const ny = (y / rect.height) * 2 - 1;  // -1..1

      // target rotation
      st.current.tx = -(ny * maxTilt); // rotateX
      st.current.ty =  (nx * maxTilt); // rotateY

      // cập nhật biến CSS cho shine vị trí
      el.style.setProperty("--mx", (nx * 50 + 50).toFixed(2) + "%");
      el.style.setProperty("--my", (ny * 50 + 50).toFixed(2) + "%");

      if (!st.current.raf) kick();
    };

    const kick = () => {
      const loop = () => {
        const s = st.current;
        // spring easing
        s.rx += (s.tx - s.rx) * damping;
        s.ry += (s.ty - s.ry) * damping;

        el.style.setProperty("--rx", s.rx.toFixed(3) + "deg");
        el.style.setProperty("--ry", s.ry.toFixed(3) + "deg");

        if (!s.hover) {
          // về 0 khi rời chuột
          s.tx = 0; s.ty = 0;
        }
        if (Math.abs(s.rx - s.tx) < 0.02 && Math.abs(s.ry - s.ty) < 0.02 && !s.hover) {
          s.raf = 0; return;
        }
        s.raf = requestAnimationFrame(loop);
      };
      st.current.raf = requestAnimationFrame(loop);
    };

    // pointer events
    el.addEventListener("pointerenter", onEnter, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });
    el.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointermove", onMove);
      if (st.current.raf) cancelAnimationFrame(st.current.raf);
      st.current.raf = 0;
    };
  }, [ref, maxTilt, damping]);
}
