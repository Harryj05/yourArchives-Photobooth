import { motion } from "framer-motion";
import Image from "next/image";
import SectionHeader from "@/components/SectionHeader";

const archives = [
  { 
    title: "Summer in Positano", 
    date: "Studio Session No. 12", 
    preview: "A sun-drenched collection of polaroids and vintage postcards from the Amalfi Coast.",
    img: "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=800"
  },
  { 
    title: "Heritage Letters", 
    date: "Studio Session No. 04", 
    preview: "Scanned handwritten correspondence preserved across generations of family history.",
    img: "https://images.unsplash.com/photo-1544396821-4dd40b938ad3?q=80&w=800"
  },
  { 
    title: "Midnight Marseille", 
    date: "Studio Session No. 89", 
    preview: "Cinematic black and white captures of the port city's nocturnal pulse.",
    img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800"
  }
];

export default function ExploreSection() {
  return (
    <div className="w-full flex flex-col items-center justify-center py-24 px-6 md:px-12 bg-transparent">
      <div className="max-w-6xl w-full">
        {/* Refined Section Header (Manual) */}
        <div className="text-center mb-24">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[10px] font-sans font-black uppercase tracking-[0.4em] text-[#8C1D24] mb-4 block"
          >
            The Memory Vault
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-display text-4xl md:text-5xl font-bold text-zinc-900 tracking-tighter"
          >
            Explore <span className="text-[#8C1D24] italic font-normal">Global Fragments</span>
          </motion.h2>
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
            className="w-12 h-px bg-zinc-300 mx-auto mt-8 mb-8" 
          />
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-sans text-sm md:text-base text-zinc-500 max-w-xl mx-auto leading-relaxed"
          >
            Browse through curated fragments of time, preserved with the dignity and elegance they deserve.
          </motion.p>
        </div>

        {/* Minimalist Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 items-stretch">
          {archives.map((archive, i) => (
            <motion.div
              key={archive.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.8 }}
              className="group relative flex flex-col cursor-pointer"
            >
              {/* Image Container with Refined Frame */}
              <div className="aspect-[3/4] overflow-hidden relative border border-zinc-200/60 bg-zinc-50 p-2 shadow-[0_4px_24px_rgba(0,0,0,0.03)] transition-all duration-700 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] group-hover:-translate-y-1">
                <div className="w-full h-full relative overflow-hidden">
                  <Image 
                    src={archive.img} 
                    alt={archive.title}
                    fill
                    className="object-cover scale-100 group-hover:scale-110 transition-transform duration-1000 grayscale-[0.3] group-hover:grayscale-0 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-[#8C1D24]/3 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {/* Vintage Label Overlay (Silver/White) */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-zinc-900 text-[8px] font-sans font-black px-2.5 py-1 uppercase tracking-widest border border-zinc-200/50 shadow-sm">
                  {archive.date}
                </div>
              </div>

              {/* Content */}
              <div className="mt-10 text-center">
                <h3 className="font-display text-xl font-bold text-zinc-800 mb-4 group-hover:text-[#8C1D24] transition-colors tracking-tight">
                  {archive.title}
                </h3>
                <p className="font-sans text-[13px] text-zinc-500 leading-relaxed line-clamp-2 px-4">
                  {archive.preview}
                </p>
                <div className="mt-8 flex justify-center">
                   <div className="w-6 h-[1.5px] bg-zinc-200 group-hover:w-12 group-hover:bg-[#8C1D24] transition-all duration-700" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
