import ScrollProgress from "@/components/ScrollProgress";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Stats from "@/components/Stats";
import About from "@/components/About";
import Process from "@/components/Process";
import Quality from "@/components/Quality";
import CaseStudies from "@/components/CaseStudies";
import JoinTeam from "@/components/JoinTeam";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Stats />
        <About />
        <Process />
        <Quality />
        <CaseStudies />
        <JoinTeam />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
