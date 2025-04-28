import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions | OKNEPPO',
  description: 'Terms and conditions for using OKNEPPO services and website.'
};

export default function TermsPage() {
  return (
    <main className="container mx-auto py-12 px-4 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center dark:text-white">Terms and Conditions</h1>
        
        <div className="prose dark:prose-invert max-w-none">
          <p className="mb-6">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
          <p>Welcome to OKNEPPO. These terms and conditions outline the rules and regulations for the use of our website and services.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Acceptance of Terms</h2>
          <p>By accessing this website, we assume you accept these terms and conditions in full. Do not continue to use OKNEPPO&apos;s website if you do not accept all of the terms and conditions stated on this page.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Intellectual Property Rights</h2>
          <p>Other than the content you own, under these terms, OKNEPPO and/or its licensors own all the intellectual property rights and materials contained in this website. You are granted limited license only for purposes of viewing the material contained on this website.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Restrictions</h2>
          <p>You are specifically restricted from:</p>
          <ul className="list-disc ml-8 my-4">
            <li>Publishing any website material in any other media</li>
            <li>Selling, sublicensing and/or otherwise commercializing any website material</li>
            <li>Using this website in any way that is or may be damaging to this website</li>
            <li>Using this website in any way that impacts user access to this website</li>
            <li>Using this website contrary to applicable laws and regulations, or in any way may cause harm to the website, or to any person or business entity</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Products</h2>
          <p>All products displayed on our website are subject to availability. We reserve the right to discontinue any product at any time.</p>
          <p>Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue the service (or any part or content thereof) without notice at any time.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Orders</h2>
          <p>We reserve the right to refuse any order you place with us. We may, in our sole discretion, limit or cancel quantities purchased per person, per household or per order.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Changes to Terms</h2>
          <p>OKNEPPO is permitted to revise these terms at any time as it sees fit, and by using this website you are expected to review these terms on a regular basis.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Governing Law</h2>
          <p>These terms and conditions are governed by and construed in accordance with the laws of India and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Contact Information</h2>
          <p>If you have any questions about these Terms and Conditions, please contact us via our Contact page.</p>
        </div>
      </div>
    </main>
  );
} 