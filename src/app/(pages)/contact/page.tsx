"use client";

import Image from "next/image";
import { useState } from "react";
import { WHATSAPP_NUMBER } from "@/constant";
import { Button, Input, Textarea, Container, Card } from "@/components/common";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    subject: "",
    message: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Format the message for WhatsApp
    const whatsappMessage = `
*New Inquiry from Ok Neppo Website*
------------------------------
*Name:* ${formData.name}
*Phone:* ${formData.phone}
*Subject:* ${formData.subject}
*Message:*
${formData.message}
------------------------------
    `;
    
    // Create WhatsApp URL with encoded message
    const waURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;
    
    // Open WhatsApp in a new tab
    window.open(waURL, '_blank');
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      {/* Contact Header */}
      <section className="bg-gray-100 dark:bg-gray-800 py-12">
        <Container>
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">Contact Us</h1>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-2xl mx-auto">
            We&apos;d love to hear from you. Get in touch for consultations, custom designs, or any inquiries.
          </p>
        </Container>
      </section>
      
      {/* Contact Form and Info */}
      <section className="py-16">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card variant="elevated" className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Send Us a Message</h2>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <Input
                  id="name"
                  data-testid="name-input"
                  label="Your Name*"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <Input
                  id="phone"
                  type="tel"
                  data-testid="phone-input"
                  label="Phone Number*"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
                <Input
                  id="subject"
                  data-testid="subject-input"
                  label="Subject*"
                  placeholder="Enter subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
                <Textarea
                  id="message"
                  data-testid="message-input"
                  label="Message*"
                  placeholder="Enter your message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                />
                <div>
                  <Button type="submit" fullWidth>
                    Send via WhatsApp
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    *This will open WhatsApp with your message details
                  </p>
                </div>
              </form>
            </Card>
            
            {/* Contact Information */}
            <div className="space-y-8">
              <Card variant="elevated" className="p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Contact Information</h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 text-[#E94FFF] mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Phone / WhatsApp</h3>
                      <p className="text-gray-600 dark:text-gray-400">+{WHATSAPP_NUMBER}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 text-[#E94FFF] mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Email</h3>
                      <p className="text-gray-600 dark:text-gray-400">okneppo@gmail.com</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 text-[#E94FFF] mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Location</h3>
                      <p className="text-gray-600 dark:text-gray-400">Rourkela, Odisha, India</p>
                    </div>
                  </div>
                </div>
              </Card>
              
              <div className="relative h-60 rounded-lg overflow-hidden shadow-md dark:shadow-gray-900/50">
                <Image 
                  src="/images/designer/IMG_4693.jpg" 
                  alt="Nishad Fatma - Ok Neppo Designer" 
                  fill
                  className="object-cover"
                />
              </div>
              
              <Card variant="elevated" className="p-6">
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Book a Consultation</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Interested in custom designs or want to discuss a collaboration? 
                  Book a personal consultation with Nishad Fatma to explore possibilities.
                </p>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">Chat on WhatsApp</Button>
                </a>
              </Card>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
} 