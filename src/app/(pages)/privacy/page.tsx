import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | OKNEPPO',
  description: 'Privacy policy for OKNEPPO services and website.'
};

export default function PrivacyPage() {
  return (
    <main className="container mx-auto py-12 px-4 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center dark:text-white">Privacy Policy</h1>
        
        <div className="prose dark:prose-invert max-w-none">
          <p className="mb-6">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
          <p>At OKNEPPO, we respect your privacy and are committed to protecting it through our compliance with this policy.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
          <p>We collect several types of information from and about users of our website, including information:</p>
          <ul className="list-disc ml-8 my-4">
            <li>By which you may be personally identified, such as name, postal address, e-mail address, telephone number, and payment information (&quot;personal information&quot;);</li>
            <li>That is about you but individually does not identify you, such as traffic data; and</li>
            <li>About your internet connection, the equipment you use to access our Website, and usage details.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
          <p>We use information that we collect about you or that you provide to us, including any personal information:</p>
          <ul className="list-disc ml-8 my-4">
            <li>To present our Website and its contents to you;</li>
            <li>To provide you with information, products, or services that you request from us;</li>
            <li>To fulfill any other purpose for which you provide it;</li>
            <li>To process and deliver your order, including to manage payment and communicate with you about your order;</li>
            <li>To notify you about changes to our Website or any products or services we offer;</li>
            <li>To improve our Website, products or services, marketing, or customer relationships.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Disclosure of Your Information</h2>
          <p>We may disclose personal information that we collect or you provide as described in this privacy policy:</p>
          <ul className="list-disc ml-8 my-4">
            <li>To contractors, service providers, and other third parties we use to support our business;</li>
            <li>To fulfill the purpose for which you provide it;</li>
            <li>For any other purpose disclosed by us when you provide the information;</li>
            <li>To comply with any court order, law, or legal process;</li>
            <li>To enforce or apply our terms of use and other agreements;</li>
            <li>If we believe disclosure is necessary to protect the rights, property, or safety of OKNEPPO, our customers, or others.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Security</h2>
          <p>We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Changes to Our Privacy Policy</h2>
          <p>We may update our privacy policy from time to time. If we make material changes to how we treat our users&apos; personal information, we will post the new privacy policy on this page.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Contact Information</h2>
          <p>To ask questions or comment about this privacy policy and our privacy practices, contact us via our Contact page.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Cookies</h2>
          <p>Our Website uses cookies to distinguish you from other users of our website. This helps us to provide you with a good experience when you browse our website and also allows us to improve our site.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Third-Party Links</h2>
          <p>Our Website may include links to third-party websites, plug-ins, and applications. Clicking on those links or enabling those connections may allow third parties to collect or share data about you. We do not control these third-party websites and are not responsible for their privacy statements.</p>
        </div>
      </div>
    </main>
  );
} 