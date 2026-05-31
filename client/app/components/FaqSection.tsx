"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What file types can sellers upload?",
    answer: "You can upload a wide variety of digital files including PDFs, ZIP archives, templates (Notion, Figma, Excel), videos (MP4), audio, and image assets. Files up to 5GB are supported."
  },
  {
    question: "How do I get paid as a seller?",
    answer: "We support instant payouts via Stripe and PayPal. Once a buyer purchases your product, the funds are automatically routed to your connected account minus our small platform fee."
  },
  {
    question: "Are there any upfront fees to start selling?",
    answer: "No! Creating a store and listing your products is 100% free. We only charge a small percentage fee when you make a successful sale."
  },
  {
    question: "Do buyers need an account to make a purchase?",
    answer: "No, buyers can easily checkout as guests. They will receive a secure download link directly via email instantly after payment."
  },
  {
    question: "Is my digital content protected?",
    answer: "Yes, we use secure, encrypted delivery links that expire to prevent unauthorized sharing, ensuring your digital products remain secure."
  },
  {
    question: "Can I offer discounts or coupons?",
    answer: "Yes! You can create custom promotional codes, percentage discounts, and fixed-amount coupons directly from your seller dashboard."
  }
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleOpen = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative z-10 pt-4 pb-16">
      <div className="max-w-5xl mx-auto px-5 md:px-6">
        <h2 className="text-center text-3xl md:text-4xl font-black mb-10">
          Frequently Asked Questions
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 items-start">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            
            return (
              <div 
                key={index} 
                className="border border-slate-200 dark:border-white/10 rounded-2xl bg-white/50 dark:bg-[#12121a]/80 backdrop-blur-xl overflow-hidden transition-colors hover:border-slate-300 dark:hover:border-white/20"
              >
                <button
                  onClick={() => toggleOpen(index)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {faq.question}
                  </span>
                  <ChevronDown 
                    className={`w-4 h-4 text-slate-500 shrink-0 ml-3 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} 
                  />
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 text-slate-600 dark:text-white/70">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
