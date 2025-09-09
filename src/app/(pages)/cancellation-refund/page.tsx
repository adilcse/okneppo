import type { Metadata } from 'next';
import { Container, Card } from '@/components/common';

export const metadata: Metadata = {
  title: 'Cancellation and Refund Policy | OKNEPPO',
  description: 'Cancellation and refund policy for OKNEPPO luxury fashion products and courses.'
};

export default function CancellationRefundPage() {
  return (
    <main className="py-12 min-h-screen">
      <Container>
        <Card variant="elevated" className="p-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center dark:text-white">Cancellation and Refund Policy</h1>
        
        <div className="prose dark:prose-invert max-w-none">
          <p className="mb-6">Last updated: August 15, 2025</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Overview</h2>
          <p>At OKNEPPO, we understand that sometimes you may need to cancel or return a product. Given the handcrafted nature of our luxury textiles and the artisanal effort that goes into each piece, we have established this policy to ensure fairness for both our customers and artisans.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Product Cancellations</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Before Shipment</h3>
          <ul className="list-disc ml-8 my-4">
            <li><strong>Within 24 hours:</strong> Full cancellation with 50% refund</li>
            <li><strong>After 24 hours:</strong> Cancellation not possible if production has begun</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Custom/Made-to-Order Items</h3>
          <p>Due to the personalized nature of custom pieces:</p>
          <ul className="list-disc ml-8 my-4">
            <li>Cancellation is only possible within 12 hours of order confirmation</li>
            <li>Once production begins, custom items cannot be cancelled</li>
            <li>Custom orders require 50% advance payment which is non-refundable after 12 hours</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Returns and Refunds</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Eligible Returns</h3>
          <p>We accept returns under the following conditions:</p>
          <ul className="list-disc ml-8 my-4">
            <li><strong>Manufacturing defects:</strong> Items with genuine manufacturing flaws</li>
            <li><strong>Damage during shipping:</strong> Items damaged during transit</li>
            <li><strong>Wrong item sent:</strong> If we send a different product than ordered</li>
            <li><strong>Significantly different from description:</strong> Major discrepancies from product listing</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Return Conditions</h3>
          <ul className="list-disc ml-8 my-4">
            <li>Items must be returned within <strong>7 days</strong> of delivery</li>
            <li>Products must be in original condition with all tags attached</li>
            <li>Items must not have been worn, washed, or altered</li>
            <li>Original packaging and any accessories must be included</li>
            <li>Clear photographs of defects must be provided for quality issues</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Non-Returnable Items</h3>
          <p>The following items cannot be returned:</p>
          <ul className="list-disc ml-8 my-4">
            <li>Custom or personalized items</li>
            <li>Items used, worn, or washed</li>
            <li>Products damaged by customer negligence</li>
            <li>Items returned after 7 days of delivery</li>
            <li>Sale or clearance items (unless defective)</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Course Cancellations</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Course Refund Policy</h3>
          <ul className="list-disc ml-8 my-4">
            <li><strong>Before course starts:</strong> 100% refund if cancelled 7+ days before start date</li>
            <li><strong>3-7 days before start:</strong> 75% refund</li>
            <li><strong>Within 3 days:</strong> 50% refund</li>
            <li><strong>After course begins:</strong> No refund, but credit towards future courses</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Course Transfers</h3>
          <p>Students may transfer to a future batch with 48 hours notice and a ₹500 administrative fee.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Refund Process</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">5.1 How to Request a Refund</h3>
          <ol className="list-decimal ml-8 my-4">
            <li>Contact us via our Contact page within the eligible timeframe</li>
            <li>Provide order number and reason for return/refund</li>
            <li>Include clear photographs if claiming defects</li>
            <li>Await our response with return instructions or approval</li>
          </ol>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Refund Timeline</h3>
          <ul className="list-disc ml-8 my-4">
            <li><strong>Processing time:</strong> 3-5 business days after receiving returned item</li>
            <li><strong>Refund method:</strong> Original payment method</li>
            <li><strong>Bank processing:</strong> Additional 5-7 business days depending on your bank</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">5.3 Return Shipping</h3>
          <ul className="list-disc ml-8 my-4">
            <li>OKNEPPO covers return shipping for defective or wrong items</li>
            <li>Customer bears return shipping cost for other eligible returns</li>
            <li>We recommend using tracked shipping for returns</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Quality Assurance</h2>
          <p>Each OKNEPPO piece undergoes rigorous quality checks before shipping. However, due to the handcrafted nature of our products, minor variations in color, texture, or embroidery are natural and not considered defects. These variations make each piece unique and are part of the artisanal charm.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Exchanges</h2>
          <p>We currently do not offer direct exchanges. For size or color changes, please follow the return process and place a new order for your preferred item.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Store Credit</h2>
          <p>In certain cases, we may offer store credit as an alternative to refunds. Store credits are valid for 1 year from the date of issue and can be used for any OKNEPPO products or courses.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Contact Information</h2>
          <p>For any questions regarding cancellations, returns, or refunds, please contact us via our Contact page. Our customer service team will respond within 24-48 hours.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Policy Updates</h2>
          <p>OKNEPPO reserves the right to update this cancellation and refund policy at any time. Changes will be posted on this page with an updated revision date. Continued use of our services constitutes acceptance of any policy changes.</p>
        </div>
        </Card>
      </Container>
    </main>
  );
} 