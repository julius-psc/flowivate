import React, { useEffect, useState, useRef } from "react";
import "./Floaty.css";

const Circle = ({ x, y, dx, dy, radius, containerWidth, containerHeight }) => {
  const [transform, setTransform] = useState({ x, y });
  const dxRef = useRef(dx);
  const dyRef = useRef(dy);

  useEffect(() => {
    const animateCircle = () => {
      const newX = transform.x + dxRef.current;
      const newY = transform.y + dyRef.current;

      // Check for collisions with container edges
      if (newX + radius >= containerWidth || newX - radius <= 0) {
        dxRef.current = -dxRef.current;
      }

      if (newY + radius >= containerHeight || newY - radius <= 0) {
        dyRef.current = -dyRef.current;
      }

      // Update the circle's position
      const clampedX = Math.min(
        containerWidth - radius,
        Math.max(radius, newX)
      );
      const clampedY = Math.min(
        containerHeight - radius,
        Math.max(radius, newY)
      );

      // Batch the state updates for smoother rendering
      setTransform({ x: clampedX, y: clampedY });
    };

    const animationId = requestAnimationFrame(animateCircle);

    return () => cancelAnimationFrame(animationId);
  }, [radius, transform, containerWidth, containerHeight]);

  return (
    <div
      className="circle"
      style={{
        transform: `translate(${transform.x - radius}px, ${transform.y - radius}px)`,
        width: `${2 * radius}px`,
        height: `${2 * radius}px`,
        transition: "transform 0.4s ease", // Add a CSS transition
      }}
    />
  );
};


const Floaty = () => {
    const [containerDimensions, setContainerDimensions] = useState(null);

    useEffect(() => {
        const div5 = document.querySelector('.div5');
        if (div5) {
            const rect = div5.getBoundingClientRect();
            setContainerDimensions({ width: rect.width, height: rect.height });
        }
    }, []);

    if (!containerDimensions) {
        return null; // Return nothing until container dimensions are obtained
    }

    const circleCount = 12;
    const circleArray = [];

    for (let i = 0; i < circleCount; i++) {
        // Generate random radii for circles between 10 and 50
        const radius = Math.random() * (20) + 10;
        const x = Math.random() * (containerDimensions.width - radius * 2) + radius;
        const y = Math.random() * (containerDimensions.height - radius * 2) + radius;
        const dx = (Math.random() - 0.5);
        const dy = (Math.random() - 0.5);
        circleArray.push(
            <Circle
                key={i}
                x={x}
                y={y}
                dx={dx}
                dy={dy}
                radius={radius}
                containerWidth={containerDimensions.width}
                containerHeight={containerDimensions.height}
            />
        );
    }

    return (
        <div className="floaty">
            {circleArray}
        </div>
    );
};

export default Floaty;
