import React from "react";
import { assets } from "../../assets/assets";
import SearchBar from "./SearchBar";
import HeroSlider from "./HeroSlider";

const Hero = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full md:pt-12 pt-20 px-7 md:px0 space-y-7 text-center bg-gradient-to-b from-cyan-100/70">
      <HeroSlider/>
      <SearchBar />
    </div>
  );
};

export default Hero;
