import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Skills } from "@/components/sections/skills";
import { FeaturedWork } from "@/components/sections/featured-work";
import { Experience } from "@/components/sections/experience";
import { Contact } from "@/components/sections/contact";

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Skills />
      <FeaturedWork />
      <Experience />
      <Contact />
    </>
  );
}
