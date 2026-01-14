import heroImage from "@/assets/hero-campus.jpg";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative">
      <div className="absolute inset-0">
        <img
          src="/lovable-uploads/7bec4418-0445-4640-9a48-50a84a391f70.png"
          alt="SSMIET campus building hero background"
          className="h-[60vh] w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/70 to-background/70" />
      </div>

      <div className="container relative z-10 flex h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary-foreground">
          SSM Institute of Engineering and Technology
        </h1>
        <p className="mt-3 max-w-2xl text-primary-foreground/90">
          An Autonomous Institution. Approved by AICTE, Affiliated to Anna University,
          Chennai. Accredited by NAAC & NBA.
        </p>
        <div className="mt-8 flex items-center gap-4">
          <Link to="/admissions">
            <Button size="lg">Apply Now</Button>
          </Link>
          <a href="https://ssmiet.ac.in/course-details.html" target="_blank" rel="noreferrer">
            <Button size="lg" variant="secondary">Courses</Button>
          </a>
        </div>
      </div>
    </section>
  );
}
