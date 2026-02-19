import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";

export function Navbar() {
    return (
        <header className="fixed top-0 w-full z-50 border-b border-transparent bg-transparent backdrop-blur-none">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/">
                    <Logo />
                </Link>

                <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-muted-foreground">
                    {/* Links removed as per user request */}
                </nav>

                <div className="flex items-center space-x-4">
                    <Link href="/login">
                        <Button variant="ghost" size="sm">Sign In</Button>
                    </Link>
                    <Link href="/signup">
                        <Button size="sm" className="bg-primary hover:bg-primary/90">Get Started</Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}
