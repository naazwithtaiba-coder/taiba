import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import LoadingScreen from './components/LoadingScreen';
import CanvasSequence from './components/CanvasSequence';
import AnimatedText from './components/AnimatedText';
import { useImageSequence } from './hooks/useImageSequence';
import { useLenis } from './hooks/useLenis';
import { getTotalScrollDistance } from './config/sequenceConfig';

export default function App() {
  const { progress, isLoaded, totalFrames, getFrame } = useImageSequence();
  const [experienceReady, setExperienceReady] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  const pinWrapperRef = useRef(null);

  // Lenis only starts once the preload/fade-out sequence is finished, per
  // the "only initialize GSAP after loading is complete" requirement.
  useLenis(experienceReady);

  // Lock page scroll entirely until every frame has loaded.
  useEffect(() => {
    document.body.style.overflow = experienceReady ? '' : 'hidden';
  }, [experienceReady]);

  const handleLoaderComplete = useCallback(() => {
    // Give the browser a frame to settle before enabling ScrollTrigger.
    requestAnimationFrame(() => setExperienceReady(true));
  }, []);

  // Fade the "Scroll" hint away the instant the user starts scrolling.
  useEffect(() => {
    if (!experienceReady) return undefined;

    function onScroll() {
      setHasScrolled(true);
      window.removeEventListener('scroll', onScroll);
    }
    window.addEventListener('scroll', onScroll, { passive: true, once: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [experienceReady]);

  const scrollHintRef = useRef(null);
  useEffect(() => {
    if (hasScrolled && scrollHintRef.current) {
      gsap.to(scrollHintRef.current, { opacity: 0, duration: 0.5, ease: 'power2.out' });
    }
  }, [hasScrolled]);

  const scrollSpacerHeight = totalFrames
    ? getTotalScrollDistance(totalFrames) + window.innerHeight
    : '100vh';

  return (
    <>
      {!experienceReady && (
        <LoadingScreen progress={progress} isLoaded={isLoaded} onComplete={handleLoaderComplete} />
      )}

      <div
        ref={pinWrapperRef}
        className="pin-wrapper"
        style={{ height: scrollSpacerHeight }}
      >
        <CanvasSequence
          getFrame={getFrame}
          totalFrames={totalFrames}
          active={experienceReady}
          pinWrapperRef={pinWrapperRef}
        />

        <AnimatedText
          totalFrames={totalFrames}
          active={experienceReady}
          pinWrapperRef={pinWrapperRef}
        />

        {experienceReady && (
          <div ref={scrollHintRef} className="scroll-hint">
            <span>Scroll</span>
            <div className="scroll-hint-line" />
          </div>
        )}
      </div>
    </>
  );
}

