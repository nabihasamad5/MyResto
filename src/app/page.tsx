import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import React from "react";
import { JSX } from "react";
import ReservationForm from "@/components/landing/ReservationForm";
import LandingNavbar from "@/components/landing/LandingNavbar";
import ReservationsPage from "./(admin)/(others-pages)/reservations/page";

export const metadata: Metadata = {
  title: "MyResto | Fine Dining & Reservations",
  description:
    "Experience fine dining at MyResto. View our menu, browse the gallery, and reserve a table.",
  keywords: ["restaurant", "dining", "menu", "reservations", "food", "MyResto"],
  openGraph: {
    title: "MyResto | Fine Dining & Reservations",
    description:
      "Experience fine dining at MyResto. View our menu, browse the gallery, and reserve a table.",
    type: "website",
    url: "/",
    images: [
      {
        url: "/images/landing-page/hero.jpg",
        width: 1200,
        height: 630,
        alt: "MyResto hero",
      },
    ],
  },
};

function Section({ id, children }: { id: string; children: React.ReactNode }): JSX.Element {
  return (
    <section id={id} className="py-12 md:py-20 px-4 md:px-6 max-w-(--breakpoint-2xl) mx-auto">
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03]">
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="mt-1 text-gray-600 dark:text-gray-300">{label}</div>
    </div>
  );
}

function MenuCard({
  title,
  desc,
  img,
}: {
  title: string;
  desc: string;
  img: string;
}): JSX.Element {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900">
      <div className="relative h-44 md:h-72">
        <Image src={img} alt={title} fill className="object-cover" sizes="(max-width:768px) 100vw, 33vw" />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="mt-1 text-gray-600 dark:text-gray-300">{desc}</p>
      </div>
    </div>
  );
}

function Testimonial({
  quote,
  name,
}: {
  quote: string;
  name: string;
}): JSX.Element {
  return (
    <div className="rounded-xl p-6 bg-gray-50 dark:bg-white/[0.03]">
      <p className="text-gray-700 dark:text-gray-200">“{quote}”</p>
      <div className="mt-3 font-semibold text-gray-900 dark:text-white">— {name}</div>
    </div>
  );
}


export default function LandingPage(): JSX.Element {
  return (
    <div className="scroll-smooth">
      <header className="relative">
        <div className="relative h-[100vh]">
          <Image
            src="/images/landing-page/hero.jpg"
            alt="Restaurant ambiance"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <h1 className="text-4xl md:text-6xl lg:text-8xl font-extrabold text-white">MyResto</h1>
              <p className="mt-3 text-lg md:text-2xl text-gray-200">Elevated dining with a modern touch</p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <a href="/dashboard" className="px-5 py-2 rounded-full bg-white text-gray-900 font-medium">
                  Dashboard
                </a>
                <a href="/reservations" className="px-5 py-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-medium">
                  Make Reservation
                </a>
              </div>
            </div>
          </div>
        </div>
        <LandingNavbar />
      </header>

      <Section id="about">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">About Us</h2>
            <p className="mt-3 text-gray-700 dark:text-gray-200">
              Founded on a passion for culinary excellence, MyResto blends seasonal ingredients with global flavors.
              Our team brings warmth and craft to every plate, creating memorable experiences in an intimate setting.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-4">
              <Stat label="Years Serving" value="12+" />
              <Stat label="Dishes" value="80+" />
              <Stat label="Seats" value="120" />
            </div>
          </div>
          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden">
            <Image src="/images/landing-page/about.jpg" alt="Chef plating dish" fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
          </div>
        </div>
      </Section>

      <Section id="menu">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Menu Highlights</h2>
        <p className="mt-2 text-gray-700 dark:text-gray-200">Signature dishes curated by our chefs.</p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <MenuCard
            title="Truffle Pasta"
            desc="Handmade tagliatelle, shaved truffles, parmesan."
            img="/images/landing-page/food1.jpg"
          />
          <MenuCard
            title="Seared Salmon"
            desc="Citrus glaze, charred asparagus, herb oil."
            img="/images/landing-page/food2.jpg"
          />
          <MenuCard
            title="Chocolate Fondant"
            desc="Warm center, vanilla ice cream, cocoa nibs."
            img="/images/landing-page/food3.jpg"
          />
        </div>
      </Section>

      <Section id="gallery">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Gallery</h2>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {["/images/landing-page/menu1.jpg", "/images/landing-page/menu2.jpg", "/images/landing-page/menu3.jpg", "/images/landing-page/menu4.jpg", "/images/landing-page/menu5.jpg", "/images/landing-page/menu6.jpg", "/images/landing-page/menu7.jpg", "/images/landing-page/menu8.jpg"].map((src) => (
            <div key={src} className="relative h-32 md:h-50 lg:h-64 rounded-xl overflow-hidden">
              <Image src={src} alt="Gallery image" fill className="object-cover" sizes="(max-width:768px) 50vw, 30vw" />
            </div>
          ))}
        </div>
      </Section>

      <Section id="location">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Location & Hours</h2>
            <p className="mt-2 text-gray-700 dark:text-gray-200">123 Culinary Ave, Food City</p>
            <ul className="mt-4 text-gray-700 dark:text-gray-200">
              <li>Mon–Thu: 11:00–22:00</li>
              <li>Fri–Sat: 11:00–23:00</li>
              <li>Sun: 12:00–21:00</li>
            </ul>
          </div>
          <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2585.9165675821655!2d74.33076418782746!3d31.570794482874017!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39191b48161dbc4d%3A0x954a16b77576ec59!2sAyesha%20Siddiqua%20Model%20Degree%20College!5e1!3m2!1sen!2s!4v1767441098779!5m2!1sen!2s"
              width="800"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </Section>

      <Section id="testimonials">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Testimonials</h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Testimonial quote="Unforgettable flavors and impeccable service." name="Ali" />
          <Testimonial quote="The ambiance is perfect for a special night." name="Sara" />
          <Testimonial quote="Best truffle pasta I've ever had." name="Ahmed" />
        </div>
      </Section>

      <footer className="px-4 md:px-6 py-8 bg-gray-100 dark:bg-white/[0.03]">
        <div className="max-w-(--breakpoint-2xl) mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gray-700 dark:text-gray-300">© {new Date().getFullYear()} MyResto</div>
          <div className="flex gap-4 text-gray-700 dark:text-gray-300">
            <Link href="/signin">Sign In</Link>
            <Link href="/signup">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
