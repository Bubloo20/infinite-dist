import Hero from "@/components/home/Hero";
import Stats from "@/components/home/Stats";
import ServiceChooser from "@/components/home/ServiceChooser";
import DistributionBand from "@/components/home/DistributionBand";
import ServiceBlurb from "@/components/home/ServiceBlurb";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import AlwaysConnected from "@/components/home/AlwaysConnected";
import CtaBand from "@/components/CtaBand";

export default function Home() {
  return (
    <main>
      <Hero />
      <Stats />
      <ServiceChooser />
      <DistributionBand />
      <ServiceBlurb />
      <WhyChooseUs />
      <AlwaysConnected />
      <CtaBand />
    </main>
  );
}
