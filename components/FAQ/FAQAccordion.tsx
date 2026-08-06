"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SchemaMarkup } from "@/components/SEO/Metadata";

interface FAQItem {
  q: string;
  a: string;
}

interface FAQAccordionProps {
  faqs: FAQItem[];
  title?: string;
}

export function FAQAccordion({ faqs, title = "Frequently Asked Questions" }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4">
      {/* Schema injection */}
      <SchemaMarkup type="FAQ" data={{ faqs }} />

      <h2 className="font-display text-2xl sm:text-3xl font-black text-center mb-8 tracking-tight">
        {title}
      </h2>

      <div className="space-y-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="border border-border rounded-lg bg-card/50 backdrop-blur transition-all duration-300 hover:border-primary/50 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-5 text-left font-semibold text-foreground hover:text-primary transition-colors focus:outline-none"
                aria-expanded={isOpen}
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
                    isOpen ? "transform rotate-180 text-primary" : ""
                  }`}
                />
              </button>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  isOpen ? "max-h-96 opacity-100 border-t border-border/50" : "max-h-0 opacity-0"
                }`}
              >
                <div className="p-5 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {faq.a}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
