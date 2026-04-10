"use client";

import { useState, useEffect } from "react";

export default function ImageCarousel({ images = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState("next");
  const [isAutoTransitioning, setIsAutoTransitioning] = useState(true);

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    if (!isAutoTransitioning || images.length <= 1) return;

    const interval = setInterval(() => {
      setDirection("next");
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoTransitioning, images.length]);

  if (!images || images.length === 0) {
    return (
      <div
        className="flex h-40 w-full items-center justify-center rounded-xl"
        style={{ background: "var(--bg-surface)" }}
      >
        <span className="text-4xl" style={{ opacity: 0.5 }}>
          📷
        </span>
      </div>
    );
  }

  const goToPrevious = () => {
    setDirection("prev");
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsAutoTransitioning(false);
  };

  const goToNext = () => {
    setDirection("next");
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setIsAutoTransitioning(false);
  };

  const goToSlide = (index) => {
    setDirection(index > currentIndex ? "next" : "prev");
    setCurrentIndex(index);
    setIsAutoTransitioning(false);
  };

  return (
    <div className="group relative w-full overflow-hidden rounded-xl">
      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .carousel-image {
          animation: fadeInScale 0.6s ease-out;
        }

        .carousel-image.slide-right {
          animation: slideInRight 0.5s ease-out;
        }

        .carousel-image.slide-left {
          animation: slideInLeft 0.5s ease-out;
        }

        .carousel-nav-btn {
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .carousel-nav-btn:hover {
          background: rgba(232, 160, 69, 0.3) !important;
        }

        .group:hover .carousel-nav-btn {
          opacity: 1;
        }

        .dot-indicator {
          cursor: pointer;
          transition: all 0.3s ease;
          background: var(--text-muted);
        }

        .dot-indicator.active {
          background: var(--gold);
          transform: scale(1.1);
        }
      `}</style>

      {/* Main Image Container */}
      <div
        className="relative flex h-40 w-full items-center justify-center"
        style={{ background: "var(--bg-surface)" }}
      >
        {images.map((image, index) => (
          <div
            key={`${image}-${index}`}
            className={`carousel-image absolute inset-0 ${
              index === currentIndex ? "block" : "hidden"
            } ${direction === "next" ? "slide-right" : "slide-left"}`}
          >
            <img
              src={image}
              alt={`Product image ${index + 1}`}
              className="h-full w-full object-cover"
            />
          </div>
        ))}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="carousel-nav-btn absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-lg border px-2.5 py-1.5 text-sm transition-all"
              style={{
                borderColor: "rgba(232, 160, 69, 0.5)",
                background: "rgba(0,0,0,0.4)",
                color: "var(--gold-bright)",
              }}
              aria-label="Previous image"
            >
              ←
            </button>

            <button
              onClick={goToNext}
              className="carousel-nav-btn absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-lg border px-2.5 py-1.5 text-sm transition-all"
              style={{
                borderColor: "rgba(232, 160, 69, 0.5)",
                background: "rgba(0,0,0,0.4)",
                color: "var(--gold-bright)",
              }}
              aria-label="Next image"
            >
              →
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div
            className="absolute bottom-2 right-2 z-10 rounded-lg px-2.5 py-1 text-xs font-medium backdrop-blur-sm"
            style={{
              background: "rgba(0,0,0,0.5)",
              color: "var(--gold-bright)",
            }}
          >
            {currentIndex + 1}/{images.length}
          </div>
        )}
      </div>

      {/* Dot Indicators */}
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-2">
          {images.map((_, index) => (
            <button
              key={`dot-${index}`}
              className="dot-indicator h-1.5 w-1.5 rounded-full transition-all"
              onClick={() => goToSlide(index)}
              aria-label={`Go to image ${index + 1}`}
              style={{
                background:
                  index === currentIndex ? "var(--gold)" : "var(--text-muted)",
                transform: index === currentIndex ? "scale(1.15)" : "scale(1)",
              }}
            />
          ))}
        </div>
      )}

      {/* Resume Auto-Transition on Hover Out */}
      <div
        onMouseEnter={() => setIsAutoTransitioning(false)}
        onMouseLeave={() => setIsAutoTransitioning(true)}
        className="absolute inset-0"
      />
    </div>
  );
}
