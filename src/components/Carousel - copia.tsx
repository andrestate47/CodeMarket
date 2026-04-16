'use client';

import React, { useRef, useEffect, useState } from 'react';
import styles from './Carousel.module.css';
import { products } from '@/data/products';

export default function Carousel() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const isPaused = useRef(false);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const isRight = direction === 'right';
            const itemWidth = scrollRef.current.scrollWidth / products.length;
            const scrollAmount = isRight ? itemWidth : -itemWidth;

            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

            // Infinite Loop Logic (kind of, keeps it snapping)
            if (isRight && scrollLeft + clientWidth >= scrollWidth - 10) {
                scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            } else if (!isRight && scrollLeft <= 0) {
                scrollRef.current.scrollTo({ left: scrollWidth, behavior: 'smooth' });
            } else {
                scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    const handleScroll = () => {
        if (scrollRef.current) {
            const totalWidth = scrollRef.current.scrollWidth;
            const itemWidth = totalWidth / products.length;
            const currentScroll = scrollRef.current.scrollLeft;
            // Calculate index based on center of viewport approximately
            const nextIndex = Math.round(currentScroll / itemWidth);
            // Clamp index
            const clampedIndex = Math.min(Math.max(nextIndex, 0), products.length - 1);
            setActiveIndex(clampedIndex);
        }
    };

    const scrollToDot = (index: number) => {
        if (scrollRef.current) {
            const totalWidth = scrollRef.current.scrollWidth;
            const itemWidth = totalWidth / products.length;
            scrollRef.current.scrollTo({ left: itemWidth * index, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (!isPaused.current) {
                scroll('right');
            }
        }, 5000); // 5 Seconds Auto-Scroll

        return () => clearInterval(interval);
    }, []);

    return (
        <div className={styles.carouselContainer}>
            <button className={`${styles.navButton} ${styles.prev}`} onClick={() => scroll('left')}>&larr;</button>

            <div
                className={styles.viewport}
                ref={scrollRef}
                onScroll={handleScroll}
                onMouseEnter={() => isPaused.current = true}
                onMouseLeave={() => isPaused.current = false}
            >
                {products.map((product) => (
                    <div key={product.id} className={styles.slide}>
                        <div
                            className={styles.slideContent}
                            style={{ background: product.color }}
                        >
                            <div className={styles.textOverlay}>
                                <h3 className={styles.slideTitle}>{product.title}</h3>
                                <div className={styles.slidePrice}>{product.price}</div>
                                <p className={styles.slideDesc}>{product.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button className={`${styles.navButton} ${styles.next}`} onClick={() => scroll('right')}>&rarr;</button>

            {/* Pagination Dots */}
            <div className={styles.dotsContainer}>
                {products.map((_, index) => (
                    <div
                        key={index}
                        className={`${styles.dot} ${activeIndex === index ? styles.active : ''}`}
                        onClick={() => scrollToDot(index)}
                    />
                ))}
            </div>
        </div>
    );
}
