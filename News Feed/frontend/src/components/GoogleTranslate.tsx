"use client";

import { useEffect } from "react";
import Script from "next/script";

export default function GoogleTranslate() {
  useEffect(() => {
    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: "auto",
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };
    const intervalId = setInterval(() => {
      const hideElements = document.querySelectorAll('.goog-te-banner-frame, .skiptranslate > iframe, #goog-gt-tt');
      hideElements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
        (el as HTMLElement).style.visibility = 'hidden';
      });
      if (document.body.style.top) {
        document.body.style.top = '0px';
        document.documentElement.style.top = '0px';
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .goog-te-banner-frame { display: none !important; }
        .skiptranslate > iframe { display: none !important; }
        body, html { top: 0px !important; margin-top: 0px !important; position: static !important; }
        #goog-gt-tt { display: none !important; }
        .goog-text-highlight { background: transparent !important; box-shadow: none !important; }
      `}} />
      <div id="google_translate_element" className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden"></div>
      <Script
        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}
