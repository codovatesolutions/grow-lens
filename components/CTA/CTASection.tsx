"use client";

import React, { useState, useEffect } from "react";
import { Phone, Calendar, X, ShieldCheck, Star, Sparkles, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [hasShownPopup, setHasShownPopup] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => {
    // Exit intent logic
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 50 && !hasShownPopup) {
        setShowExitPopup(true);
        setHasShownPopup(true);
      }
    };

    // Scroll visibility logic for sticky CTA
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setStickyVisible(true);
      } else {
        setStickyVisible(false);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("scroll", handleScroll);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [hasShownPopup]);

  return (
    <>
      {/* Standard CTA Section */}
      <section className="py-20 border-t border-border bg-gradient-to-b from-background to-card/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--primary-rgb),0.05),transparent)] pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Book a Free Strategy Session
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-black leading-tight tracking-tight mb-6">
            Ready to Build Real <span className="text-primary">Topical Authority</span> & Grow?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8 text-base sm:text-lg leading-relaxed">
            Get a comprehensive, zero-cost SEO Audit & Growth Blueprint customized for your business. No obligation, pure action plan.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto mb-10">
            <a href="https://wa.me/9180LENSGROW" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 border-none">
                <MessageCircle className="w-5 h-5 fill-current" /> Chat on WhatsApp
              </Button>
            </a>
            <a href="#consultation" className="w-full sm:w-auto">
              <Button size="lg" className="w-full gap-2">
                <Calendar className="w-5 h-5" /> Book Free Strategy Call
              </Button>
            </a>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10 text-xs sm:text-sm text-muted-foreground border-t border-border/50 pt-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>100% Confidential Audit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <span>4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>AI-Driven & Human Verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Bottom Bar CTA (Mobile & Desktop) */}
      <div
        className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[92%] max-w-3xl bg-background/80 backdrop-blur-md border border-border/80 shadow-2xl rounded-full p-2 transition-all duration-500 ease-in-out flex items-center justify-between ${
          stickyVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        }`}
      >
        <div className="hidden sm:flex items-center gap-3 pl-4">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-semibold text-foreground">Free Audits Available Today</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <a href="https://wa.me/9180LENSGROW" target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none">
            <Button size="sm" variant="ghost" className="w-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/10 gap-1.5">
              <MessageCircle className="w-4 h-4 fill-current" /> WhatsApp
            </Button>
          </a>
          <a href="#consultation" className="flex-1 sm:flex-none">
            <Button size="sm" className="w-full gap-1.5 rounded-full px-4">
              <Calendar className="w-4 h-4" /> Book Consultation
            </Button>
          </a>
        </div>
      </div>

      {/* Exit Intent Popup */}
      {showExitPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowExitPopup(false)} />
          <div className="bg-card border border-border w-full max-w-lg rounded-xl p-6 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowExitPopup(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center pt-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 grid place-items-center mx-auto mb-4 text-primary">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-display text-2xl font-black mb-2 leading-tight">
                Wait! Get Your Free SEO Scan Report
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Before you go, let our AI engine scan your URL. We will find technical SEO blocker issues and email you a full action plan.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Audit requested successfully!");
                  setShowExitPopup(false);
                }}
                className="space-y-3"
              >
                <input
                  type="url"
                  placeholder="Your Website URL"
                  required
                  className="w-full px-4 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:border-primary"
                />
                <input
                  type="email"
                  placeholder="Your Work Email"
                  required
                  className="w-full px-4 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:border-primary"
                />
                <Button type="submit" className="w-full">
                  Generate Free SEO Report
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
