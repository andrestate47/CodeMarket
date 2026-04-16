'use client';

import React from 'react';
import styles from './TechBanner.module.css';

const TECHNOLOGIES = [
    { name: 'React', logo: 'https://api.iconify.design/logos:react.svg' },
    { name: 'Next.js', logo: 'https://api.iconify.design/logos:nextjs-icon.svg', invert: true },
    { name: 'Shadcn/ui', logo: 'https://api.iconify.design/simple-icons:shadcnui.svg', invert: true },
    { name: 'Docker', logo: 'https://api.iconify.design/logos:docker-icon.svg' },
    { name: 'SQL', logo: 'https://api.iconify.design/logos:mysql.svg' },
    { name: 'Node.js', logo: 'https://api.iconify.design/logos:nodejs-icon.svg' },
    { name: 'Prisma', logo: 'https://api.iconify.design/logos:prisma.svg', invert: true },
    { name: 'AI / IA', logo: 'https://api.iconify.design/fluent-emoji-flat:brain.svg' },
];

export default function TechBanner() {
    // Duplicate the list to create a seamless loop
    const displayTechs = [...TECHNOLOGIES, ...TECHNOLOGIES, ...TECHNOLOGIES];

    return (
        <section className={styles.techBanner}>
            <h2 className={styles.title}>Tecnologías que uso</h2>
            <div className={styles.marquee}>
                {displayTechs.map((tech, index) => (
                    <div key={`${tech.name}-${index}`} className={styles.techItem}>
                        <img 
                            src={tech.logo} 
                            alt={tech.name} 
                            className={styles.logo} 
                            style={tech.invert ? { filter: 'invert(1)' } : {}}
                        />
                        <span className={styles.name}>{tech.name}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
