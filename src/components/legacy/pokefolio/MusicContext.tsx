"use client"
import React, { createContext, useState, useContext, useRef, ReactNode, useEffect } from 'react';

interface AudioFile {
    name: string;
    url: string;
}

interface MusicContextType {
    audioFiles: AudioFile[];
    currentTrack: number;
    isPlaying: boolean;
    audioRef: React.RefObject<HTMLAudioElement | null>;
    setCurrentTrack: (track: number) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    playPause: () => void;
    nextTrack: () => void;
    prevTrack: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

const audioFiles: AudioFile[] = [
    { name: 'Ecruteak City', url: '/legacy/tracks/Ecruteak-City.mp3' },
    { name: 'National Park', url: '/legacy/tracks/National-Park.mp3' },
    { name: 'PokeViolet City', url: '/legacy/tracks/PokeViolet-City.mp3' },
];

export const MusicProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    // Posición pendiente de restaurar (solo al montar); se aplica una única
    // vez en loadedmetadata en lugar de mantener currentTime en estado React,
    // que provocaba un bucle seek → timeupdate → setState → seek.
    const pendingSeekRef = useRef<number | null>(null);

    useEffect(() => {
        const savedState = localStorage.getItem('musicState');
        if (savedState) {
            const { currentTrack: savedTrack, isPlaying: savedIsPlaying, currentTime: savedTime } = JSON.parse(savedState);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            if (typeof savedTrack === 'number' && audioFiles[savedTrack]) setCurrentTrack(savedTrack);
            if (typeof savedTime === 'number') pendingSeekRef.current = savedTime;
            // Si el navegador bloquea el autoplay, el .catch() de abajo
            // devuelve el botón a "play" en vez de fingir que suena.
            if (savedIsPlaying === true) setIsPlaying(true);
        }
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.play().catch(() => setIsPlaying(false));
        } else {
            audio.pause();
        }
    }, [currentTrack, isPlaying]);

    // Persistencia: al cambiar pista/estado y al ocultar/cerrar la pestaña
    // (nunca en cada timeupdate: eso escribía localStorage varias veces por segundo).
    useEffect(() => {
        const save = () => {
            localStorage.setItem('musicState', JSON.stringify({
                currentTrack,
                isPlaying,
                currentTime: audioRef.current?.currentTime ?? 0,
            }));
        };
        save();
        document.addEventListener('visibilitychange', save);
        window.addEventListener('pagehide', save);
        return () => {
            document.removeEventListener('visibilitychange', save);
            window.removeEventListener('pagehide', save);
        };
    }, [currentTrack, isPlaying]);

    const playPause = () => {
        setIsPlaying(!isPlaying);
    };

    const nextTrack = () => {
        pendingSeekRef.current = null;
        setCurrentTrack((prev) => (prev + 1) % audioFiles.length);
        setIsPlaying(true);
    };

    const prevTrack = () => {
        pendingSeekRef.current = null;
        setCurrentTrack((prev) => (prev - 1 + audioFiles.length) % audioFiles.length);
        setIsPlaying(true);
    };

    const restoreSavedTime = () => {
        const audio = audioRef.current;
        if (audio && pendingSeekRef.current !== null) {
            audio.currentTime = pendingSeekRef.current;
            pendingSeekRef.current = null;
        }
    };

    return (
        <MusicContext.Provider value={{
            audioFiles,
            currentTrack,
            isPlaying,
            audioRef,
            setCurrentTrack,
            setIsPlaying,
            playPause,
            nextTrack,
            prevTrack
        }}>
            {children}
            {/* Único <audio> de la app: src solo cambia cuando cambia la pista.
                Los componentes de UI (Music, ProjectList) no deben montar el
                suyo propio ni tocar audio.src — eso robaba este ref y abortaba
                la reproducción en curso. */}
            <audio
                ref={audioRef}
                src={audioFiles[currentTrack].url}
                onEnded={nextTrack}
                onLoadedMetadata={restoreSavedTime}
            />
        </MusicContext.Provider>
    );
};

export const useMusic = () => {
    const context = useContext(MusicContext);
    if (context === undefined) {
        throw new Error('useMusic must be used within a MusicProvider');
    }
    return context;
};
