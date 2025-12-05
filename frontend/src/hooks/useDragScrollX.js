import { useEffect } from "react";

export default function useDragScrollX(ref){
  useEffect(() => {
    const el = ref.current;
    if(!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const pageX = (e) => (e.touches ? e.touches[0].pageX : e.pageX);

    const onDown = (e) => {
      isDown = true;
      el.classList.add("is-dragging");
      startX = pageX(e) - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };
    const onMove = (e) => {
      if(!isDown) return;
      e.preventDefault();
      const x = pageX(e) - el.offsetLeft;
      const walk = (startX - x);
      el.scrollLeft = scrollLeft + walk;
    };
    const onUp = () => {
      isDown = false;
      el.classList.remove("is-dragging");
    };

    el.addEventListener("mousedown", onDown);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onUp);
    el.addEventListener("mouseup", onUp);

    el.addEventListener("touchstart", onDown, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onUp);

    return () => {
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onUp);
      el.removeEventListener("mouseup", onUp);
      el.removeEventListener("touchstart", onDown);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onUp);
    };
  }, [ref]);
}
