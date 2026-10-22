/** Dos tonos cortos para NUEVO_PEDIDO (sin archivo externo). */
export function playNewOrderNotification(): void {
    try {
        const ctx = new AudioContext();
        const playTone = (freq: number, start: number, duration: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = freq;
            gain.gain.value = 0.08;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + duration);
        };
        playTone(880, ctx.currentTime, 0.12);
        playTone(1175, ctx.currentTime + 0.14, 0.12);
        window.setTimeout(() => ctx.close(), 500);
    } catch {
        // Autoplay bloqueado o AudioContext no disponible
    }
}
