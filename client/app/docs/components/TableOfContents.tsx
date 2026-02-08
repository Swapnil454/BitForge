"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const pathname = usePathname(); // Track page changes

  useEffect(() => {
    // Find the scrollable main content container
    const mainContent = document.querySelector("main");
    if (!mainContent) return;

    const headingElements = Array.from(
      mainContent.querySelectorAll("h2, h3")
    );

    // Generate IDs for headings that don't have them
    const usedIds = new Set<string>();
    headingElements.forEach((heading, index) => {
      if (!heading.id) {
        const text = heading.textContent || "";
        let baseId = text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        
        if (!baseId) {
          baseId = `heading-${index}`;
        }
        
        // Ensure unique ID by adding suffix if duplicate
        let uniqueId = baseId;
        let counter = 1;
        while (usedIds.has(uniqueId)) {
          uniqueId = `${baseId}-${counter}`;
          counter++;
        }
        
        heading.id = uniqueId;
        usedIds.add(uniqueId);
      } else {
        // Track existing IDs
        usedIds.add(heading.id);
      }
    });

    const items: TocItem[] = headingElements
      .filter((elem) => elem.id)
      .map((elem) => ({
        id: elem.id,
        text: elem.textContent || "",
        level: parseInt(elem.tagName.replace("H", "")),
      }));

    setHeadings(items);

    if (items.length > 0 && !activeId) {
      setActiveId(items[0].id);
    }

    // Check for hash in URL on page load and scroll to it
    const hash = window.location.hash.slice(1);
    if (hash) {
      const element = document.getElementById(hash);
      if (element && mainContent) {
        // Small delay to ensure content is rendered
        setTimeout(() => {
          const elementTop = element.offsetTop;
          const offset = 100;
          mainContent.scrollTo({
            top: elementTop - offset,
            behavior: "smooth",
          });
          setActiveId(hash);
        }, 100);
      }
    }

    // Set up intersection observer to track visible headings
    const observerOptions = {
      root: mainContent, // Use the scrollable container as root
      rootMargin: "-20% 0px -70% 0px", // When heading is in top 20-30% of viewport
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    }, observerOptions);

    // Observe all heading elements
    headingElements.forEach((elem) => {
      if (elem.id) {
        observer.observe(elem);
      }
    });

    // Handle browser back/forward navigation
    const handlePopState = () => {
      const hash = window.location.hash.slice(1); // Remove the # symbol
      if (hash) {
        const element = document.getElementById(hash);
        const mainContent = document.querySelector("main");
        
        if (element && mainContent) {
          const elementTop = element.offsetTop;
          const offset = 100;
          
          mainContent.scrollTo({
            top: elementTop - offset,
            behavior: "smooth",
          });
          
          setActiveId(hash);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      headingElements.forEach((elem) => {
        if (elem.id) {
          observer.unobserve(elem);
        }
      });
      window.removeEventListener("popstate", handlePopState);
    };
  }, [pathname]); // Re-run when page changes

  const handleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    
    // Find the scrollable main container
    const mainContent = document.querySelector("main");
    const element = document.getElementById(id);
    
    if (element && mainContent) {
      // Get the position of the element relative to the scrollable container
      const elementTop = element.offsetTop;
      const offset = 100; // Offset for better visibility
      
      // Scroll the main container, not the window
      mainContent.scrollTo({
        top: elementTop - offset,
        behavior: "smooth",
      });
      
      setActiveId(id);
      
      // Update URL hash without triggering scroll
      window.history.pushState(null, "", `#${id}`);
    }
  };

  if (headings.length === 0) {
    return (
      <div className="text-xs text-white/40 italic">
        No sections on this page
      </div>
    );
  }

  return (
    <nav className="space-y-1">
      {headings.map((heading) => (
        <button
          key={heading.id}
          onClick={(e) => handleClick(e, heading.id)}
          className={`
            w-full text-left text-xs py-2 px-3 rounded-md transition-all duration-200 border-l-2
            ${heading.level === 3 ? "pl-5 text-[11px]" : "pl-3"}
            ${
              activeId === heading.id
                ? "text-cyan-400 font-semibold border-cyan-400 bg-cyan-500/10"
                : "text-white/60 hover:text-white hover:bg-white/5 border-transparent hover:border-white/20"
            }
          `}
        >
          {heading.text}
        </button>
      ))}
    </nav>
  );
}
