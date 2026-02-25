import { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Users, Star, ArrowRight, Globe, Video } from "lucide-react";

export const metadata: Metadata = {
  title: "Community — Life Meeting",
  description: "Join the Life Meeting community. Discuss features, get tips, share best practices, and connect with 50M users worldwide.",
};

const CHANNELS = [
  { icon: MessageSquare, name: "General Discussion", members: "142K", desc: "Chat about all things Life Meeting", posts: "1.2K posts this week" },
  { icon: Video, name: "Meeting Tips & Tricks", members: "89K", desc: "Power-user tips, shortcuts, and workflows", posts: "890 posts this week" },
  { icon: Globe, name: "Enterprise Corner", members: "23K", desc: "Admin guides, SSO, compliance, SCIM", posts: "320 posts this week" },
  { icon: Star, name: "Feature Requests", members: "67K", desc: "Upvote and discuss future features", posts: "540 posts this week" },
  { icon: Users, name: "Events & Webinars", members: "34K", desc: "Community events, office hours, and AMAs", posts: "210 posts this week" },
];

const TOP_POSTS = [
  { title: "How I run async standups with Life Meeting + AI transcripts", votes: 2847, author: "techleader_io" },
  { title: "Complete SSO setup guide: Okta + Life Meeting Enterprise", votes: 1923, author: "devops.ninja" },
  { title: "My team reduced meeting time by 40% — here's how", votes: 1756, author: "productivity_pro" },
  { title: "Feature request: Persistent whiteboard between meetings", votes: 1102, author: "designerfirst" },
];

export default function CommunityPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white py-20 px-6 text-center">
        <h1 className="text-5xl font-black">Life Meeting Community</h1>
        <p className="mt-4 text-indigo-200 text-xl max-w-2xl mx-auto">
          Connect, share, and learn with 50 million users worldwide.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <a href="#channels" className="px-6 py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-colors flex items-center gap-2">
            Browse Channels <ArrowRight className="w-4 h-4" />
          </a>
        </div>
        <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm">
          {[["50M+","Members"],["3.2M","Posts"],["98%","Questions answered"],["< 2h","Avg response"]].map(([v,l])=>(
            <div key={l} className="text-center"><p className="text-2xl font-black">{v}</p><p className="text-indigo-300 text-xs mt-0.5">{l}</p></div>
          ))}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Channels */}
          <div className="lg:col-span-2" id="channels">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Channels</h2>
            <div className="space-y-4">
              {CHANNELS.map(({ icon: Icon, name, members, desc, posts }) => (
                <div key={name} className="group flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer">
                  <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{name}</h3>
                      <span className="text-xs text-slate-400 shrink-0">{members} members</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
                    <p className="text-xs text-indigo-500 font-medium mt-1">{posts}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 mb-4">Trending Posts</h2>
              <div className="space-y-3">
                {TOP_POSTS.map((p) => (
                  <div key={p.title} className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-sm cursor-pointer">
                    <p className="text-sm font-bold text-slate-900 mb-1 leading-tight hover:text-indigo-600 transition-colors">{p.title}</p>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>@{p.author}</span>
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" />{p.votes.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <h3 className="font-black text-slate-900 mb-2">Join the community</h3>
              <p className="text-sm text-slate-500 mb-4">Free with any Life Meeting account.</p>
              <Link href="/register" className="block w-full py-2.5 text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-colors">
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
