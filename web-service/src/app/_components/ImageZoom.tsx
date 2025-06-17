"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, X } from "lucide-react";
import Image from "next/image";

interface ImageZoomProps {
  src: string;
  alt: string;
  children: React.ReactNode;
}

const ImageZoom = ({ src, alt, children }: ImageZoomProps) => {
  const [zoom, setZoom] = useState(1);
  const [isOpen, setIsOpen] = useState(false);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-7xl h-[90vh] flex items-center justify-center p-0 bg-transparent border-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{alt}</DialogTitle>
          <DialogDescription>
            An enlarged view of the image with zoom controls.
          </DialogDescription>
        </DialogHeader>
        <div
          className="relative w-full h-full"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <Button
              size="icon"
              onClick={handleZoomIn}
              className="bg-black/50 hover:bg-black/75 text-white"
            >
              <ZoomIn className="h-6 w-6" />
            </Button>
            <Button
              size="icon"
              onClick={handleZoomOut}
              className="bg-black/50 hover:bg-black/75 text-white"
            >
              <ZoomOut className="h-6 w-6" />
            </Button>
            <Button
              size="icon"
              onClick={() => setIsOpen(false)}
              className="bg-black/50 hover:bg-black/75 text-white"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <div className="w-full h-full overflow-auto">
            <Image
              src={src}
              alt={alt}
              layout="fill"
              objectFit="contain"
              style={{
                transform: `scale(${zoom})`,
                transition: "transform 0.2s",
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageZoom;
