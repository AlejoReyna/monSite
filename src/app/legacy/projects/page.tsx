"use client"

import { useCopy } from "@/components/use-copy";
import { useRouter } from 'next/navigation';
import HeaderComponent from "@/components/legacy/pokefolio/Header/Header";
import ProjectCarousel from "@/components/legacy/pokefolio/ProjectList/ProjectCarousel";

export default function ListComponent() {
  const copyText = useCopy();
    const router = useRouter();

    const handleGoBack = () => {
        router.push('/legacy');
    };

    return(
        <>
            <HeaderComponent/>
            <div className="flex text-black flex-col background min-h-screen">
                <p className='pt-2 mx-6 text-sm'> {copyText(" Which project would you like to see first? ")}</p>
                <p className='pt-2 mx-6 text-sm hover-effect' onClick={handleGoBack}> {copyText(" Back to homepage ")}</p>
                <ProjectCarousel/>
            </div>
        </>
    );
}
