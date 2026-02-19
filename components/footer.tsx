import { Twitter, Github, Linkedin, Instagram } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export function Footer() {
    return (
        <footer className="border-t border-slate-200 bg-white/50 backdrop-blur-xl relative overflow-hidden">
            <div className="container mx-auto px-4 py-16 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">

                    {/* Brand Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <Link href="/" className="flex items-center space-x-2">
                            <Logo showText={true} textClassName="text-slate-900" />
                        </Link>
                        <p className="text-slate-600 text-sm leading-relaxed max-w-xs">
                            The world&apos;s most advanced video conferencing platform.
                            Crystal clear, secure, and powered by AI.
                        </p>
                        <div className="flex gap-4">
                            <SocialLink href="#" icon={Twitter} />
                            <SocialLink href="#" icon={Github} />
                            <SocialLink href="#" icon={Linkedin} />
                            <SocialLink href="#" icon={Instagram} />
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-slate-900">Product</h4>
                        <ul className="space-y-3 text-sm text-slate-600">
                            <li><Link href="#" className="hover:text-primary transition-colors">Features</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Enterprise</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Security</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Changelog</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-semibold text-slate-900">Company</h4>
                        <ul className="space-y-3 text-sm text-slate-600">
                            <li><Link href="#" className="hover:text-primary transition-colors">About Us</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Careers</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Blog</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter Column */}
                    <div className="lg:col-span-2 space-y-4">
                        <h4 className="font-semibold text-slate-900">Stay Updated</h4>
                        <p className="text-sm text-slate-600">
                            Subscribe to our newsletter for the latest updates and features.
                        </p>
                        <form className="flex gap-2">
                            <Input placeholder="Enter your email" className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400" />
                            <Button type="button">Subscribe</Button>
                        </form>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                    <p>© 2026 Life Meeting Inc. All rights reserved.</p>
                    <div className="flex gap-8">
                        <Link href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
                        <Link href="#" className="hover:text-slate-900 transition-colors">Cookie Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

interface SocialLinkProps {
    href: string;
    icon: React.ElementType;
}

function SocialLink({ href, icon: Icon }: SocialLinkProps) {
    return (
        <Link href={href} className="p-2 rounded-full bg-slate-200/50 hover:bg-primary/10 hover:text-primary text-slate-600 transition-all">
            <Icon className="w-4 h-4" />
        </Link>
    )
}
