let sharedAudioCtx: AudioContext | null = null;
let unlockRegistered = false;

function getOrCreateAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!sharedAudioCtx) {
        sharedAudioCtx = new AudioContextClass();
    }
    return sharedAudioCtx;
}

/**
 * Desbloquea el AudioContext del navegador en la primera interacción del usuario
 * para que las notificaciones en segundo plano suenen siempre sin bloqueo de autoplay.
 */
export function initNotificationAudioUnlock() {
    if (typeof window === 'undefined' || unlockRegistered) return;
    unlockRegistered = true;

    const unlock = () => {
        try {
            const ctx = getOrCreateAudioContext();
            if (ctx && ctx.state === 'suspended') {
                ctx.resume();
            }
        } catch {
            // ignore
        }
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });
}

/**
 * Reproduce un sonido de notificación nítido y agradable tipo 'chime' / caja registradora
 * usando la Web Audio API (no requiere archivos de audio externos ni descargas).
 */
export function playOrderNotificationSound() {
    if (typeof window === 'undefined') return;
    try {
        const ctx = getOrCreateAudioContext();
        if (!ctx) return;

        const playNotes = () => {
            const now = ctx.currentTime;

            // Tono 1 (E5 / 659 Hz)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(659.25, now);
            gain1.gain.setValueAtTime(0.35, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.35);

            // Tono 2 (G#5 / 830.6 Hz)
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(830.61, now + 0.12);
            gain2.gain.setValueAtTime(0.38, now + 0.12);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.12);
            osc2.stop(now + 0.55);

            // Tono 3 (B5 / 987.77 Hz)
            const osc3 = ctx.createOscillator();
            const gain3 = ctx.createGain();
            osc3.type = 'sine';
            osc3.frequency.setValueAtTime(987.77, now + 0.24);
            gain3.gain.setValueAtTime(0.45, now + 0.24);
            gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
            osc3.connect(gain3);
            gain3.connect(ctx.destination);
            osc3.start(now + 0.24);
            osc3.stop(now + 0.95);

            // Tono 4 (E6 / 1318.5 Hz - campana brillante de venta)
            const osc4 = ctx.createOscillator();
            const gain4 = ctx.createGain();
            osc4.type = 'triangle';
            osc4.frequency.setValueAtTime(1318.51, now + 0.36);
            gain4.gain.setValueAtTime(0.4, now + 0.36);
            gain4.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);
            osc4.connect(gain4);
            gain4.connect(ctx.destination);
            osc4.start(now + 0.36);
            osc4.stop(now + 1.15);
        };

        if (ctx.state === 'suspended') {
            ctx.resume().then(playNotes).catch(playNotes);
        } else {
            playNotes();
        }
    } catch (e) {
        console.warn('AudioContext notification sound failed:', e);
    }
}
