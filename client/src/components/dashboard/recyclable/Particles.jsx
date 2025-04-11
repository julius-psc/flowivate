"use client";

import React, { useEffect, useRef, useState } from "react";

const Particles = ({ count = 30, speed = 0.3 }) => {
  const canvasRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Check for dark mode using CSS media query and document class
  useEffect(() => {
    const checkDarkMode = () => {
      // Check for dark mode preference
      const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
      
      // Check if there's a .dark class on html or body (common in Tailwind setups)
      const hasDarkClass = 
        document.documentElement.classList.contains("dark") || 
        document.body.classList.contains("dark");
      
      // Set dark mode if either condition is true
      setIsDarkMode(prefersDarkMode || hasDarkClass);
    };
    
    // Check initially
    checkDarkMode();
    
    // Set up a MutationObserver to detect class changes on document element
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    // Set up media query listener
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", checkDarkMode);
    
    return () => {
      mediaQuery.removeEventListener("change", checkDarkMode);
      observer.disconnect();
    };
  }, []);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    const particles = [];
    
    // Set canvas to fullscreen
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    
    // Create particles
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * speed;
        this.speedY = (Math.random() - 0.5) * speed;
        this.opacity = Math.random() * 0.5 + 0.1;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Loop particles back when they go offscreen
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }
      
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        // Change color based on detected theme
        const color = isDarkMode ? "255, 255, 255" : "59, 130, 246"; // white in dark mode, blue in light mode
        ctx.fillStyle = `rgba(${color}, ${this.opacity})`;
        ctx.fill();
      }
    }
    
    // Initialize particles
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
    
    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [count, speed, isDarkMode]);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      aria-hidden="true"
    />
  );
};

export default Particles;