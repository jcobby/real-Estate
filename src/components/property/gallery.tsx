"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const openAt = (i: number) => {
    setIndex(i);
    setOpen(true);
  };
  const step = (dir: 1 | -1) => setIndex((i) => (i + dir + images.length) % images.length);

  return (
    <>
      {/* explicit height on sm+ — the fill images need sized grid tracks */}
      <div className="grid grid-cols-4 gap-2 overflow-hidden rounded-2xl sm:h-105 sm:grid-rows-2">
        <button
          type="button"
          onClick={() => openAt(0)}
          className="group relative col-span-4 aspect-[16/9] outline-none focus-visible:ring-3 focus-visible:ring-ring sm:col-span-3 sm:row-span-2 sm:aspect-auto"
          aria-label="Open photo gallery"
        >
          <Image
            src={images[0]}
            alt={`${title} — main photo`}
            fill
            priority
            sizes="(max-width: 640px) 100vw, 66vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold shadow backdrop-blur-sm">
            <Expand className="size-3.5" aria-hidden /> {images.length} photos
          </span>
        </button>
        <div className="col-span-4 grid grid-cols-3 gap-2 sm:col-span-1 sm:row-span-2 sm:grid-cols-1 sm:grid-rows-3">
          {images.slice(1, 4).map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => openAt(i + 1)}
              className="relative aspect-[4/3] overflow-hidden outline-none focus-visible:ring-3 focus-visible:ring-ring sm:aspect-auto"
              aria-label={`Open photo ${i + 2}`}
            >
              <Image src={src} alt="" fill loading="eager" sizes="(max-width: 640px) 33vw, 20vw" className="object-cover" />
            </button>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none" showCloseButton>
          <DialogTitle className="sr-only">{title} — photo gallery</DialogTitle>
          <DialogDescription className="sr-only">
            Photo {index + 1} of {images.length}. Use the arrow buttons to navigate.
          </DialogDescription>
          <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-black">
            <Image src={images[index]} alt={`${title} — photo ${index + 1}`} fill sizes="90vw" className="object-contain" />
            <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-3">
              <Button variant="secondary" size="icon" aria-label="Previous photo" onClick={() => step(-1)}>
                <ChevronLeft />
              </Button>
              <span className="rounded-full bg-background/80 px-3 py-1 text-xs font-semibold backdrop-blur">
                {index + 1} / {images.length}
              </span>
              <Button variant="secondary" size="icon" aria-label="Next photo" onClick={() => step(1)}>
                <ChevronRight />
              </Button>
            </div>
          </div>
          <div className="mt-2 flex justify-center gap-2">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to photo ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "relative size-14 overflow-hidden rounded-lg border-2 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  i === index ? "border-primary" : "border-transparent opacity-60 hover:opacity-100",
                )}
              >
                <Image src={src} alt="" fill sizes="56px" className="object-cover" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
