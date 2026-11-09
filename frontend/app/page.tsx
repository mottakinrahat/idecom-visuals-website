import { Shapes } from "@/components/home/Shapes";
import Nav from "@/components/home/Nav";
import Hero from "@/components/home/Hero";
import { Clients, Services, Videos, Team, Cta, Footer } from "@/components/home/Sections";

export default function HomePage() {
  return (
    <>
      <Shapes />
      <Nav />
      <main>
        <Hero />
        <Clients />
        <Services />
        <Videos />
        <Team />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
