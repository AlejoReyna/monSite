"use client"

import { useCopy } from "@/components/use-copy";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TypingText } from './Script/TypingText';
import { MusicComponent } from './Script/Music';
import { PokemonDialogBox } from './PokemonDialogBox';
import './Homepage.css';


export default function HomepageComponent() {
  const copyText = useCopy();
    const [isTypingFinished, setIsTypingFinished] = useState(false);
    const router = useRouter();



    const goToProjects: () => void = (): void => {
        router.push('/legacy/projects');
      };

    return (
        <div className="background min-h-screen flex flex-col justify-between">
            <div className="typing-text justify-center text-black w-full max-w-4xl mx-auto px-4">

                <TypingText onFinished={(): void => setIsTypingFinished(true)}/>
            </div>

            <div className={`w-full max-w-[700px] mx-auto px-4 mb-4 transition-opacity duration-1000 ${isTypingFinished ? 'opacity-100' : 'opacity-0'}`}>
                <div className="relative">
                    <PokemonDialogBox className="w-full h-auto"/>
                    <div className="text-black absolute inset-0 flex flex-col justify-center items-center p-6">
                        <div className="audio-container">
                        <MusicComponent />
                        </div>
                        <p id="second-textbox-line" className="text-sm sm:text-base md:text-lg text-center w-full mb-4">
                        {copyText("What would you like to do next? ")}</p>
                        <div className="flex justify-center items-center w-full space-x-4">
                            <div className="goToProjects cursor-pointer" onClick={goToProjects}>
                                <p className="hover-effect option text-center">{copyText("Go to my projects")}</p>
                            </div>
                            <div className="cursor-pointer" >
                               <p className="hover-effect option text-center"> {copyText(" Under construction")}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
