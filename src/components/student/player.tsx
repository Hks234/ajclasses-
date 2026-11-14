"use client";

import Hls from "hls.js";
import { useEffect, useRef } from "react";

export function LessonPlayer({ src, hls }: { src: string; hls: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (hls && Hls.isSupported()) {
      const player = new Hls({ enableWorker: true });
      player.loadSource(src);
      player.attachMedia(video);
      return () => player.destroy();
    }
    video.src = src;
  }, [src, hls]);
  return <video ref={ref} className="w-full rounded-3xl bg-black" controls playsInline />;
}
