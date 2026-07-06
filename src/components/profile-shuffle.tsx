"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Cross-fades between a set of profile photos, swapping to a random one
 * every `intervalMs`. All images are stacked and pre-rendered so the
 * transition is a pure opacity fade with no flash/reflow.
 *
 * Respects prefers-reduced-motion (freezes on the first photo, no timer).
 */
export function ProfileShuffle({
  images,
  alt,
  intervalMs = 5000,
}: {
  images: string[];
  alt: string;
  intervalMs?: number;
}) {
  const [active, setActive] = useState(0);
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    reduceMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotionRef.current || images.length <= 1) return;

    const id = setInterval(() => {
      setActive(Math.floor(Math.random() * images.length));
    }, intervalMs);

    return () => clearInterval(id);
  }, [images.length, intervalMs]);

  return (
    <>
      {images.map((src, i) => {
        const isActive = i === active;
        return (
          <div
            key={src}
            aria-hidden={!isActive}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out ${
              isActive ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <Image
              src={src}
              alt={isActive ? alt : ""}
              fill
              priority={i === 0}
              sizes="(max-width: 1024px) 100vw, 340px"
              className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
            />
          </div>
        );
      })}
    </>
  );
}
