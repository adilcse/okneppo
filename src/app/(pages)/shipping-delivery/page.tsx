import type { Metadata } from 'next';
import { Container, Card } from '@/components/common';

export const metadata: Metadata = {
  title: 'Shipping and Delivery Policy | OKNEPPO',
  description: 'Shipping and delivery information for OKNEPPO luxury fashion products and course materials.'
};

export default function ShippingDeliveryPage() {
  return (
    <main className="py-12 min-h-screen">
      <Container>
        <Card variant="elevated" className="p-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center dark:text-white">Shipping and Delivery Policy</h1>
        
        <div className="prose dark:prose-invert max-w-none">
          <p className="mb-6">Last updated: August 15, 2025</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Overview</h2>
          <p>At OKNEPPO, we are committed to delivering your handcrafted luxury textiles safely and promptly. Each piece is carefully packaged to ensure it reaches you in perfect condition, reflecting the artisanal care that went into its creation.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Processing Time</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Ready-to-Ship Products</h3>
          <ul className="list-disc ml-8 my-4">
            <li><strong>In-stock items:</strong> 1-2 business days processing</li>
            <li><strong>Final quality check:</strong> Each item undergoes inspection before shipping</li>
            <li><strong>Packaging:</strong> Careful wrapping with tissue paper and protective materials</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Made-to-Order Products</h3>
          <ul className="list-disc ml-8 my-4">
            <li><strong>Handcrafted items:</strong> 10-15 business days (production + processing)</li>
            <li><strong>Custom embroidery:</strong> Additional 3-5 business days</li>
            <li><strong>Complex designs:</strong> Up to 20 business days</li>
            <li><strong>Festival/Wedding rush:</strong> May require additional time during peak seasons</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Shipping Options and Delivery Times</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Domestic Shipping (India)</h3>
          
          <h4 className="text-lg font-semibold mt-4 mb-2">Standard Delivery</h4>
          <ul className="list-disc ml-8 my-4">
            <li><strong>Major cities:</strong> 3-5 business days</li>
            <li><strong>Other locations:</strong> 5-7 business days</li>
            <li><strong>Remote areas:</strong> 7-10 business days</li>
            <li><strong>Cost:</strong> ₹200 (Free for orders above ₹15,000)</li>
          </ul>
          
          <h4 className="text-lg font-semibold mt-4 mb-2">Express Delivery</h4>
          <ul className="list-disc ml-8 my-4">
            <li><strong>Major cities:</strong> 1-2 business days</li>
            <li><strong>Other locations:</strong> 2-3 business days</li>
            <li><strong>Cost:</strong> ₹500</li>
            <li><strong>Cut-off time:</strong> 2 PM for same-day dispatch</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">3.2 International Shipping</h3>
          
          <h4 className="text-lg font-semibold mt-4 mb-2">Available Countries</h4>
          <ul className="list-disc ml-8 my-4">
            <li><strong>USA, Canada, UK, Australia:</strong> 7-14 business days</li>
            <li><strong>Europe:</strong> 8-15 business days</li>
            <li><strong>Middle East:</strong> 5-10 business days</li>
            <li><strong>Southeast Asia:</strong> 4-8 business days</li>
          </ul>
          
          <h4 className="text-lg font-semibold mt-4 mb-2">International Shipping Costs</h4>
          <ul className="list-disc ml-8 my-4">
            <li><strong>Standard International:</strong> Starting from ₹1,500</li>
            <li><strong>Express International:</strong> Starting from ₹3,000</li>
            <li><strong>Duties & Taxes:</strong> Customer&apos;s responsibility</li>
            <li><strong>Free shipping:</strong> For orders above ₹50,000</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Packaging and Care</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Premium Packaging</h3>
          <ul className="list-disc ml-8 my-4">
            <li><strong>Eco-friendly materials:</strong> Sustainable packaging aligned with our values</li>
            <li><strong>Protective wrapping:</strong> Acid-free tissue paper and cotton bags</li>
            <li><strong>Moisture protection:</strong> Sealed packets to prevent humidity damage</li>
            <li><strong>Brand presentation:</strong> OKNEPPO branded boxes and care cards</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Special Handling</h3>
          <ul className="list-disc ml-8 my-4">
            <li><strong>Silk products:</strong> Extra padding and climate-controlled shipping when possible</li>
            <li><strong>Zari work items:</strong> Flat packaging to prevent metallic thread damage</li>
            <li><strong>Embroidered pieces:</strong> Careful folding techniques to preserve embroidery</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Order Tracking</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Tracking Information</h3>
          <ul className="list-disc ml-8 my-4">
            <li><strong>Tracking number:</strong> Provided within 24 hours of dispatch</li>
            <li><strong>SMS/Email updates:</strong> Real-time shipping notifications</li>
            <li><strong>Live tracking:</strong> Available on courier partner websites</li>
            <li><strong>Customer support:</strong> Available for tracking assistance</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Delivery Process</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Standard Delivery</h3>
          <ul className="list-disc ml-8 my-4">
            <li><strong>Signature required:</strong> For all orders above ₹5,000</li>
            <li><strong>Safe drop:</strong> Available for trusted addresses (customer request)</li>
            <li><strong>Redelivery:</strong> Up to 3 attempts for successful delivery</li>
            <li><strong>Pickup points:</strong> Available in major cities if delivery fails</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Address Requirements</h3>
          <ul className="list-disc ml-8 my-4">
            <li><strong>Complete address:</strong> Include landmark and pincode</li>
            <li><strong>Contact number:</strong> Working mobile number mandatory</li>
            <li><strong>Address verification:</strong> May call to confirm for high-value orders</li>
            <li><strong>Office delivery:</strong> Specify business hours and contact person</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Course Materials Delivery</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">7.1 Physical Materials</h3>
          <ul className="list-disc ml-8 my-4">
            <li><strong>Course kits:</strong> Shipped 1 week before course start date</li>
            <li><strong>Contents:</strong> Fabric samples, tools, and printed materials</li>
            <li><strong>Express shipping:</strong> Included in course fee</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">7.2 Digital Access</h3>
          <ul className="list-disc ml-8 my-4">
            <li><strong>Login credentials:</strong> Emailed 24-48 hours before course</li>
            <li><strong>Course platform:</strong> Access instructions and system requirements</li>
            <li><strong>Technical support:</strong> Available during course period</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Failed Delivery</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">8.1 Reasons for Failed Delivery</h3>
          <ul className="list-disc ml-8 my-4">
            <li>Incorrect or incomplete address</li>
            <li>Recipient unavailable during delivery attempts</li>
            <li>Premises locked/inaccessible</li>
            <li>Contact number not reachable</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">8.2 Resolution Process</h3>
          <ul className="list-disc ml-8 my-4">
            <li><strong>Immediate contact:</strong> We&apos;ll reach out to reschedule delivery</li>
            <li><strong>Warehouse hold:</strong> Packages held for 7 days maximum</li>
            <li><strong>Return to sender:</strong> After 7 days, package returns to OKNEPPO</li>
            <li><strong>Reshipment:</strong> Additional shipping charges apply for reshipment</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Special Occasions and Rush Orders</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">9.1 Festival Season</h3>
          <ul className="list-disc ml-8 my-4">
            <li><strong>Extended timelines:</strong> 2-3 additional days during festivals</li>
            <li><strong>Early ordering:</strong> Recommended 2 weeks before festivals</li>
            <li><strong>Rush orders:</strong> Available with 50% surcharge (subject to capacity)</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">9.2 Wedding Season</h3>
          <ul className="list-disc ml-8 my-4">
            <li><strong>Priority service:</strong> Available for wedding orders</li>
            <li><strong>Guaranteed delivery:</strong> For orders placed 3+ weeks in advance</li>
            <li><strong>Express wedding package:</strong> Premium service with dedicated support</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Shipping Restrictions</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">10.1 Items We Cannot Ship</h3>
          <ul className="list-disc ml-8 my-4">
            <li>Loose gemstones or precious metals</li>
            <li>Items exceeding customs value limits</li>
            <li>Restricted textiles to certain countries</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">10.2 Geographic Restrictions</h3>
          <p>We currently do not ship to areas experiencing political instability or postal service disruptions. Please contact us to confirm delivery to your location.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Damaged or Lost Packages</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">11.1 Insurance Coverage</h3>
          <ul className="list-disc ml-8 my-4">
            <li><strong>Automatic insurance:</strong> All orders above ₹10,000</li>
            <li><strong>Damage claims:</strong> Report within 24 hours of receipt</li>
            <li><strong>Lost packages:</strong> Full investigation and replacement/refund</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">12. Contact and Support</h2>
          <p>For any shipping-related queries, tracking issues, or delivery concerns, please contact us via our Contact page. Our shipping support team is available Monday to Saturday, 10 AM to 6 PM IST.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">13. Policy Updates</h2>
          <p>OKNEPPO reserves the right to update shipping policies based on carrier changes, seasonal demands, or service improvements. Updated policies will be posted here with revision dates.</p>
        </div>
        </Card>
      </Container>
    </main>
  );
} 