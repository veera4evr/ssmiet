import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/ssm-logo.png";

const navItems = [
  { label: "Main Website", href: "https://ssmiet.ac.in/", isMain: true },
  { label: "About Us", href: "https://ssmiet.ac.in/admin.html" },
  { label: "Courses", href: "https://ssmiet.ac.in/course-details.html" },
  { label: "Placements", href: "https://ssmiet.ac.in/placements.html" },
  { label: "Contact", href: "https://ssmiet.ac.in/contact.html" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src={logo} alt="SSMIET logo" className="h-10 w-auto" loading="lazy" />
            <div className="hidden sm:block">
              <div className="text-sm font-bold text-foreground">SSMIET</div>
              <div className="text-xs text-muted-foreground">Admissions Portal</div>
            </div>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-foreground/80 hover:text-foreground transition-colors inline-flex items-center gap-1"
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
            >
              {item.isMain && <ArrowLeft className="h-4 w-4" />}
              {item.label}
            </a>
          ))}
          <NavLink to="/admissions">
            <Button>Apply Now</Button>
          </NavLink>
        </nav>

        <div className="md:hidden flex items-center gap-2">
          <NavLink to="/admissions">
            <Button size="sm">Apply Now</Button>
          </NavLink>
          <Button variant="secondary" size="icon" aria-label="Open menu" onClick={() => setOpen((v) => !v)}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M4 6.75A.75.75 0 0 1 4.75 6h14.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 6.75Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H4.75a.75.75 0 0 1-.75-.75Zm.75 4.5a.75.75 0 0 0 0 1.5h14.5a.75.75 0 0 0 0-1.5H4.75Z" clipRule="evenodd" />
            </svg>
          </Button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t bg-background">
          <div className="container py-3 grid gap-3">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-foreground/90 hover:text-foreground inline-flex items-center gap-1"
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                onClick={() => setOpen(false)}
              >
                {item.isMain && <ArrowLeft className="h-4 w-4" />}
                {item.label}
              </a>
            ))}
            <NavLink to="/admissions" onClick={() => setOpen(false)}>
              <Button className="w-full">Apply Now</Button>
            </NavLink>
          </div>
        </div>
      )}
    </header>
  );
}
