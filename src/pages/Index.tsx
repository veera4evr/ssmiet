import Header from "@/components/site/Header";
import Hero from "@/components/site/Hero";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <main className="container py-12 grid gap-10">
        <section className="grid md:grid-cols-3 gap-6">
          {["Autonomous Institution", "NBA Accredited", "Vibrant Campus"].map((title) => (
            <Card key={title}>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Explore excellence at SSMIET with quality programs, experienced faculty, and a student-first campus culture.
                </p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
      <footer className="border-t">
        <div className="container py-8">
          <div className="grid md:grid-cols-3 gap-8 mb-6">
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <a href="https://ssmiet.ac.in/" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Main Website</a>
                <a href="https://ssmiet.ac.in/about.html" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">About SSMIET</a>
                <a href="https://ssmiet.ac.in/course-details.html" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Courses</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Admissions</h4>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <Link to="/admissions" className="hover:text-foreground transition-colors">Apply Online</Link>
                <a href="https://ssmiet.ac.in/contact.html" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Contact Admissions</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <div className="text-sm text-muted-foreground">
                <p>SSM Institute of Engineering and Technology</p>
                <p className="mt-2">Email: ssmietadmissionportal@gmail.com</p>
              </div>
            </div>
          </div>
          <div className="border-t pt-6 text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} SSM Institute of Engineering and Technology. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
