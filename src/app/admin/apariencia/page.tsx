'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { getFullStoreSettingsAction, updateStoreSettingsAction } from '@/modules/config/storeSettingsActions';
import { StorageService } from '@/lib/services/storageService';

export default function AdminAppearancePage() {
    const [logoShape, setLogoShape] = useState<'cuadrada' | 'rectangular' | 'circular'>('circular');
    const [coverEnabled, setCoverEnabled] = useState(true);
    const [descEnabled, setDescEnabled] = useState(true);
    const [storeDescription, setStoreDescription] = useState('Somos una tienda online dedicada a la elaboración de objetos de diseño...');
    const [bgType, setBgType] = useState<'sin-fondo' | 'color' | 'trama' | 'imagen'>('sin-fondo');
    const [cartEnabled, setCartEnabled] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState('1');

    const [logoUrl, setLogoUrl] = useState('');
    const [faviconUrl, setFaviconUrl] = useState('');
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingFavicon, setUploadingFavicon] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    // New states for Colors
    const [colorType, setColorType] = useState<'predeterminados' | 'personalizado'>('personalizado');
    const [primaryBg, setPrimaryBg] = useState('#f7ce46');
    const [primaryText, setPrimaryText] = useState('Negro');
    const [secondaryBg, setSecondaryBg] = useState('#f7ce46');
    const [secondaryText, setSecondaryText] = useState('Negro');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const { success, settings } = await getFullStoreSettingsAction();
            if (success && settings) {
                setLogoUrl(settings.logoUrl || '');
                setFaviconUrl(settings.faviconUrl || '');
                setLogoShape(settings.logoShape || 'circular');
                setCoverEnabled(settings.coverEnabled ?? true);
                setDescEnabled(settings.descEnabled ?? true);
                setStoreDescription(settings.storeDescription || 'Somos una tienda online dedicada a la elaboración de objetos de diseño...');
                setBgType(settings.bgType || 'sin-fondo');
                setCartEnabled(settings.cartEnabled ?? true);
                setSelectedTemplate(settings.selectedTemplate || '1');
                setColorType(settings.colorType || 'personalizado');
                setPrimaryBg(settings.primaryBg || '#f7ce46');
                setPrimaryText(settings.primaryText || 'Negro');
                setSecondaryBg(settings.secondaryBg || '#f7ce46');
                setSecondaryText(settings.secondaryText || 'Negro');
            }
            setLoading(false);
        }
        loadData();
    }, []);

    // Sections toggle state
    const [expanded, setExpanded] = useState({
        logo: true,
        favicon: false,
        fondo: false,
        carrito: false,
        plantilla: false,
        colores: false,
        tipografia: false,
        formaFotos: false,
        conocenos: false,
        contacto: false
    });

    const toggleSection = (section: keyof typeof expanded) => {
        setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleSave = async () => {
        setSaving(true);
        const { success, error } = await updateStoreSettingsAction({
            logoUrl,
            faviconUrl,
            logoShape,
            coverEnabled,
            descEnabled,
            storeDescription,
            bgType,
            cartEnabled,
            selectedTemplate,
            colorType,
            primaryBg,
            primaryText,
            secondaryBg,
            secondaryText
        });
        setSaving(false);
        if (success) {
            toast.success('¡Cambios de diseño guardados exitosamente!');
        } else {
            toast.error(error || 'Hubo un error al guardar los cambios.');
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingLogo(true);
        const res = await StorageService.uploadProductImage(file);
        if (res.success && res.url) {
            setLogoUrl(res.url);
        } else {
            toast.error(res.error || 'Error al subir el logo');
        }
        setUploadingLogo(false);
    };

    const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingFavicon(true);
        const res = await StorageService.uploadProductImage(file);
        if (res.success && res.url) {
            setFaviconUrl(res.url);
        } else {
            toast.error(res.error || 'Error al subir el favicon');
        }
        setUploadingFavicon(false);
    };

    const SectionHeader = ({ id, icon, title, badge }: { id: keyof typeof expanded, icon?: React.ReactNode, title: string, badge?: React.ReactNode }) => (
        <div 
            onClick={() => toggleSection(id)}
            style={{ 
                padding: '16px 20px', 
                borderBottom: expanded[id] ? '1px solid var(--glass-border)' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.02)',
                cursor: 'pointer'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {icon && <span style={{ fontSize: '1.1rem' }}>{icon}</span>}
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {title}
                    {badge}
                </h3>
            </div>
            <span style={{ fontSize: '0.9rem', color: 'var(--foreground)', transform: expanded[id] ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }}>▲</span>
        </div>
    );

    return (
        <div style={{ paddingBottom: '80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Configuración</h1>
                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                    <button style={{ padding: '6px 12px', borderRadius: '16px', border: '1px solid var(--glass-border)', background: 'var(--card-bg)', fontSize: '0.8rem', fontWeight: 600, color: '#6366f1', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <span>❓</span> Ayuda
                    </button>
                    <button style={{ padding: '6px 12px', borderRadius: '16px', border: '1px solid var(--glass-border)', background: 'var(--card-bg)', fontSize: '0.8rem', fontWeight: 600, color: '#6366f1', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                        <span>▶️</span> Tutoriales
                    </button>
                </div>
            </div>

            <div style={{
                background: 'var(--card-bg)',
                border: '1.5px solid var(--glass-border)',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Main Header inside Card */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.04)' }}>
                    <span style={{ fontSize: '1.2rem' }}>🎨</span>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--foreground)' }}>Diseño</h2>
                </div>

                {/* 1. Agrega tu logo e imagen de portada */}
                <div style={{ borderBottom: '1.5px solid var(--glass-border)' }}>
                    <SectionHeader id="logo" title="Agrega tu logo e imagen de portada" />
                    {expanded.logo && (
                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                                {/* Left column */}
                                <div style={{ flex: '1', minWidth: '260px' }}>
                                    <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: 700, color: 'var(--foreground)' }}>Seleccionar la forma de tu logo</h4>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                            <input type="radio" checked={logoShape === 'cuadrada'} onChange={() => setLogoShape('cuadrada')} style={{ width: '18px', height: '18px', accentColor: '#6366f1' }} />
                                            <span>Cuadrada</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                            <input type="radio" checked={logoShape === 'rectangular'} onChange={() => setLogoShape('rectangular')} style={{ width: '18px', height: '18px', accentColor: '#6366f1' }} />
                                            <span>Rectangular</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                            <input type="radio" checked={logoShape === 'circular'} onChange={() => setLogoShape('circular')} style={{ width: '18px', height: '18px', accentColor: '#6366f1' }} />
                                            <span>Circular</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Right column */}
                                <div style={{ flex: '1', minWidth: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '24px', background: 'var(--background)', position: 'relative' }}>
                                    {logoUrl && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setLogoUrl(''); }}
                                            style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)', zIndex: 10 }}>
                                            ⊗
                                        </button>
                                    )}
                                    <input 
                                        type="file" 
                                        ref={logoInputRef} 
                                        style={{ display: 'none' }} 
                                        accept="image/*" 
                                        onChange={handleLogoUpload} 
                                    />
                                    <div 
                                        onClick={() => !uploadingLogo && logoInputRef.current?.click()}
                                        style={{ 
                                        width: '200px', 
                                        height: logoShape === 'rectangular' ? '100px' : '200px', 
                                        borderRadius: logoShape === 'circular' ? '50%' : '8px',
                                        background: logoUrl ? 'transparent' : '#fbbf24', // mock logo color
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        color: '#fff',
                                        fontWeight: 800,
                                        fontSize: '1.2rem',
                                        textAlign: 'center',
                                        border: logoUrl ? 'none' : '4px dashed #f59e0b',
                                        transition: 'all 0.3s ease',
                                        cursor: uploadingLogo ? 'wait' : 'pointer',
                                        overflow: 'hidden',
                                        backgroundImage: logoUrl ? `url(${logoUrl})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        boxShadow: logoUrl ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                                    }}>
                                        {!logoUrl && (uploadingLogo ? 'Subiendo...' : 'Logo Aquí')}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid var(--glass-border)' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Foto de portada:</span>
                                    <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                                        <input type="checkbox" checked={coverEnabled} onChange={(e) => setCoverEnabled(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                                        <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: coverEnabled ? '#10b981' : '#cbd5e1', transition: '.4s', borderRadius: '34px' }}>
                                            <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: coverEnabled ? '20px' : '2px', bottom: '2px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                                        </span>
                                    </label>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid var(--glass-border)' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Descripción de tienda:</span>
                                    <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                                        <input type="checkbox" checked={descEnabled} onChange={(e) => setDescEnabled(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                                        <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: descEnabled ? '#10b981' : '#cbd5e1', transition: '.4s', borderRadius: '34px' }}>
                                            <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: descEnabled ? '20px' : '2px', bottom: '2px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                                        </span>
                                    </label>
                                </div>
                                {descEnabled && (
                                    <textarea 
                                        value={storeDescription}
                                        onChange={(e) => setStoreDescription(e.target.value)}
                                        style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Agrega tu favicon */}
                <div style={{ borderBottom: '1.5px solid var(--glass-border)' }}>
                    <SectionHeader id="favicon" title="Agrega tu favicon" />
                    {expanded.favicon && (
                        <div style={{ padding: '24px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1', minWidth: '300px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--background)', border: '1px solid var(--glass-border)', borderRadius: '12px 12px 0 0', padding: '12px 16px', gap: '12px' }}>
                                    {faviconUrl ? (
                                        <img src={faviconUrl} alt="Favicon" style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '20px', height: '20px', background: '#94a3b8', borderRadius: '4px' }}></div>
                                    )}
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Una argentina en Peru</span>
                                    <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>✕</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '12px 16px', gap: '12px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>← → ↻</span>
                                    <div style={{ background: 'var(--background)', padding: '6px 12px', borderRadius: '24px', flex: 1, fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>🔒</span> https://tiendavir.com
                                    </div>
                                </div>
                            </div>
                            <div 
                                onClick={() => !uploadingFavicon && faviconInputRef.current?.click()}
                                style={{ width: '160px', height: '120px', background: faviconUrl ? 'transparent' : '#e2e8f0', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: uploadingFavicon ? 'wait' : 'pointer', border: faviconUrl ? '1px solid var(--glass-border)' : '2px dashed #cbd5e1', overflow: 'hidden', position: 'relative' }}>
                                <input 
                                    type="file" 
                                    ref={faviconInputRef} 
                                    style={{ display: 'none' }} 
                                    accept="image/*" 
                                    onChange={handleFaviconUpload} 
                                />
                                {faviconUrl ? (
                                    <>
                                        <img src={faviconUrl} alt="Favicon preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setFaviconUrl(''); }}
                                            style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-muted)', zIndex: 10 }}>
                                            ✕
                                        </button>
                                    </>
                                ) : (
                                    <span style={{ fontSize: '2rem', color: '#94a3b8' }}>{uploadingFavicon ? '⏳' : '🖼️'}</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Fondo de la tienda */}
                <div style={{ borderBottom: '1.5px solid var(--glass-border)' }}>
                    <SectionHeader id="fondo" title="Fondo de la tienda" />
                    {expanded.fondo && (
                        <div style={{ padding: '24px', position: 'relative' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    <input type="radio" checked={bgType === 'sin-fondo'} onChange={() => setBgType('sin-fondo')} style={{ width: '18px', height: '18px', accentColor: '#6366f1' }} />
                                    <span>Sin fondo</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    <input type="radio" checked={bgType === 'color'} onChange={() => setBgType('color')} style={{ width: '18px', height: '18px', accentColor: '#6366f1' }} />
                                    <span>Color</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    <input type="radio" checked={bgType === 'trama'} onChange={() => setBgType('trama')} style={{ width: '18px', height: '18px', accentColor: '#6366f1' }} />
                                    <span>Trama</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    <input type="radio" checked={bgType === 'imagen'} onChange={() => setBgType('imagen')} style={{ width: '18px', height: '18px', accentColor: '#6366f1' }} />
                                    <span>Imagen</span>
                                </label>
                            </div>
                            <button style={{ position: 'absolute', bottom: '24px', right: '24px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '24px', padding: '8px 20px', fontWeight: 600, cursor: 'pointer' }}>
                                Guardar Fondo
                            </button>
                        </div>
                    )}
                </div>

                {/* 4. Carrito de compras */}
                <div style={{ borderBottom: '1.5px solid var(--glass-border)' }}>
                    <SectionHeader 
                        id="carrito" 
                        title="Carrito de compras" 
                        badge={<span style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '16px', fontSize: '0.75rem' }}>Activado</span>}
                    />
                    {expanded.carrito && (
                        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Desactivar el carrito de compras</span>
                            <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                                <input type="checkbox" checked={!cartEnabled} onChange={(e) => setCartEnabled(!e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                                <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: !cartEnabled ? '#10b981' : '#cbd5e1', transition: '.4s', borderRadius: '34px' }}>
                                    <span style={{ position: 'absolute', content: '""', height: '20px', width: '20px', left: !cartEnabled ? '22px' : '2px', bottom: '2px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                                </span>
                            </label>
                        </div>
                    )}
                </div>

                {/* 5. Elige la plantilla */}
                <div style={{ borderBottom: '1.5px solid var(--glass-border)' }}>
                    <SectionHeader id="plantilla" title="Elige la plantilla de tu preferencia:" />
                    {expanded.plantilla && (
                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                                {[1, 2, 3].map((num) => (
                                    <div key={num} style={{ background: '#f8fafc', border: selectedTemplate === String(num) ? '2px solid #6366f1' : '1px solid var(--glass-border)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10 }}>
                                            <label style={{ display: 'flex', cursor: 'pointer' }}>
                                                <input type="radio" checked={selectedTemplate === String(num)} onChange={() => setSelectedTemplate(String(num))} style={{ width: '20px', height: '20px', accentColor: '#6366f1' }} />
                                            </label>
                                        </div>
                                        
                                        <div style={{ width: '100%', height: '320px', background: 'white', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Plantilla {num} Mockup</div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <button style={{ background: 'white', border: '1px solid var(--glass-border)', padding: '8px 24px', borderRadius: '24px', fontWeight: 600, color: 'var(--foreground)', cursor: 'pointer' }}>
                                                Previsualizar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 6. Colores de tienda */}
                <div style={{ borderBottom: '1.5px solid var(--glass-border)' }}>
                    <SectionHeader id="colores" title="Colores de tienda" />
                    {expanded.colores && (
                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.95rem' }}>
                                    <input type="radio" checked={colorType === 'predeterminados'} onChange={() => setColorType('predeterminados')} style={{ width: '18px', height: '18px', accentColor: '#6366f1' }} />
                                    <span>Temas predeterminados</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.95rem' }}>
                                    <input type="radio" checked={colorType === 'personalizado'} onChange={() => setColorType('personalizado')} style={{ width: '18px', height: '18px', accentColor: '#6366f1' }} />
                                    <span>Personalizar colores</span>
                                </label>
                            </div>

                            {/* Color Principal */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 700 }}>Color Principal</h4>
                                <div style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
                                    
                                    <div style={{ flex: '1', minWidth: '180px' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Color de fondo</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: primaryBg, border: '2px solid #fff', boxShadow: '0 0 0 1px var(--glass-border)' }}></div>
                                            <div style={{ background: 'white', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '8px 12px', position: 'relative' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', position: 'absolute', top: '4px', left: '12px' }}>Código Hex</span>
                                                <input type="text" value={primaryBg} onChange={(e) => setPrimaryBg(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', width: '80px', marginTop: '12px', fontSize: '0.9rem', fontWeight: 600 }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ flex: '1', minWidth: '180px' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Color de texto</label>
                                        <div style={{ background: 'white', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '12px', position: 'relative' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', position: 'absolute', top: '4px', left: '12px' }}>Selecciona un color</span>
                                            <select value={primaryText} onChange={(e) => setPrimaryText(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', marginTop: '12px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', appearance: 'none' }}>
                                                <option value="Negro">Negro</option>
                                                <option value="Blanco">Blanco</option>
                                            </select>
                                            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.8rem' }}>▼</span>
                                        </div>
                                    </div>

                                    <div style={{ flex: '1', minWidth: '200px' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Previsualización</label>
                                        <div style={{ background: primaryBg, color: primaryText === 'Negro' ? '#000' : '#fff', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px' }}>Aa</div>
                                            <div style={{ fontSize: '0.9rem' }}>Color de texto</div>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Color Secundario */}
                            <div>
                                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 700 }}>Color Secundario</h4>
                                <div style={{ background: '#f8fafc', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
                                    
                                    <div style={{ flex: '1', minWidth: '180px' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Color de fondo</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: secondaryBg, border: '2px solid #fff', boxShadow: '0 0 0 1px var(--glass-border)' }}></div>
                                            <div style={{ background: 'white', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '8px 12px', position: 'relative' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', position: 'absolute', top: '4px', left: '12px' }}>Código Hex</span>
                                                <input type="text" value={secondaryBg} onChange={(e) => setSecondaryBg(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', width: '80px', marginTop: '12px', fontSize: '0.9rem', fontWeight: 600 }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ flex: '1', minWidth: '180px' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Color de texto</label>
                                        <div style={{ background: 'white', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '12px', position: 'relative' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', position: 'absolute', top: '4px', left: '12px' }}>Selecciona un color</span>
                                            <select value={secondaryText} onChange={(e) => setSecondaryText(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', marginTop: '12px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', appearance: 'none' }}>
                                                <option value="Negro">Negro</option>
                                                <option value="Blanco">Blanco</option>
                                            </select>
                                            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.8rem' }}>▼</span>
                                        </div>
                                    </div>

                                    <div style={{ flex: '1', minWidth: '200px' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Previsualización</label>
                                        <div style={{ background: secondaryBg, color: secondaryText === 'Negro' ? '#000' : '#fff', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px' }}>Aa</div>
                                            <div style={{ fontSize: '0.9rem' }}>Color de texto</div>
                                        </div>
                                    </div>

                                </div>
                            </div>

                        </div>
                    )}
                </div>

                {/* 7. Tipografía */}
                <div style={{ borderBottom: '1.5px solid var(--glass-border)' }}>
                    <SectionHeader id="tipografia" title="Tipografía" />
                    {expanded.tipografia && (
                        <div style={{ padding: '16px 24px 24px 24px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Elegir combinación tipográfica de títulos y texto de párrafos.
                        </div>
                    )}
                </div>

                {/* 8. Forma de fotos de producto */}
                <div style={{ borderBottom: '1.5px solid var(--glass-border)' }}>
                    <SectionHeader id="formaFotos" title="Forma de fotos de producto" />
                    {expanded.formaFotos && (
                        <div style={{ padding: '16px 24px 24px 24px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Elegir la forma de las fotos de los productos que aparecerán en tu web.
                        </div>
                    )}
                </div>

                {/* 9. Agrega sección de Conócenos */}
                <div style={{ borderBottom: '1.5px solid var(--glass-border)' }}>
                    <SectionHeader id="conocenos" title="Agrega sección de Conócenos" />
                    {expanded.conocenos && (
                        <div style={{ padding: '16px 24px 24px 24px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Configuración de la sección conócenos...
                        </div>
                    )}
                </div>

                {/* 10. Mostrar Información de contacto */}
                <div>
                    <SectionHeader id="contacto" title="Mostrar Información de contacto" />
                    {expanded.contacto && (
                        <div style={{ padding: '16px 24px 24px 24px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Opciones para mostrar u ocultar la información de contacto...
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Action Button */}
            <div style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 100 }}>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    style={{ 
                        background: saving ? '#9ca3af' : '#6366f1', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '32px', 
                        padding: '14px 28px', 
                        fontSize: '1rem', 
                        fontWeight: 700, 
                        cursor: saving ? 'not-allowed' : 'pointer',
                        boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background 0.3s'
                    }}>
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
            </div>
        </div>
    );
}
