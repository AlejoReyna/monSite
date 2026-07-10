"use client"

import React from 'react';
import Image from 'next/image';
import { useMusic } from '../../MusicContext';
import { IoPlaySkipBack } from "react-icons/io5";
import { FaPlay } from "react-icons/fa";
import { IoPlaySkipForward } from "react-icons/io5";
import { FaPause } from "react-icons/fa";

export const MusicComponent: React.FC = () => {
    const { isPlaying, playPause, nextTrack, prevTrack } = useMusic();

    return (
        <div id="first-textbox-line" className="audio-container flex">
            <Image src="/legacy/images/music-icon.png" width={48} height={48} alt="A pixelated music icon"/>
            <button onClick={prevTrack} className='m-2'> <IoPlaySkipBack /> </button>
            <button onClick={playPause} className='m-2'>
            {isPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <button onClick={nextTrack} className='m-2'> <IoPlaySkipForward /> </button>
        </div>
    )
}
