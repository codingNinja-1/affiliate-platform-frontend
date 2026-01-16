'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ChevronLeft } from 'lucide-react';

const BUTTON_STYLES = [
  { id: 'yellow_large', label: 'Yellow Large', color: '#FFD700', text: 'BUY NOW' },
  { id: 'red_small', label: 'Red Small', color: '#DC143C', text: 'ORDER NOW' },
  { id: 'green_large', label: 'Green Large', color: '#28A745', text: 'BUY NOW' },
  { id: 'blue_small', label: 'Blue Small', color: '#007BFF', text: 'ORDER NOW' },
];

const CATEGORIES = ['Software', 'Course', 'E-book', 'Service', 'Physical Product', 'Other'];
const PRODUCT_TYPES = ['Digital', 'Physical', 'Subscription', 'Service'];
const CURRENCIES = ['USD', 'NGN', 'EUR', 'GBP'];
const APPROVAL_METHODS = ['Auto Approve', 'Manual Review Required', 'Whitelist Only'];
const API_BASE = '/api'; // Always use relative path for client-side requests

interface FormData {
  name: string;
  description: string;
  category: string;
  type: string;
  currency: string;
  price: string;
  commission_rate: string;
  approval_method: string;
  sales_page_url: string;
  thank_you_page_url: string;
  webinar_url: string;
  jv_page_url: string;
  image?: File;
}

interface IntegrationData {
  product_id: number;
  pixel_code: string;
  sales_page_url: string;
}

export default function CreateProductPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'integration'>('form');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    category: '',
    type: '',
    currency: 'USD',
    price: '',
    commission_rate: '',
    approval_method: '',
    sales_page_url: '',
    thank_you_page_url: '',
    webinar_url: '',
    jv_page_url: '',
  });
  const [integrationData, setIntegrationData] = useState<IntegrationData | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [selectedButton, setSelectedButton] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.type) newErrors.type = 'Product type is required';
    if (!formData.price) newErrors.price = 'Price is required';
    if (parseFloat(formData.price) < 1) newErrors.price = 'Price must be at least $1';
    if (!formData.commission_rate) newErrors.commission_rate = 'Commission is required';
    if (!formData.approval_method) newErrors.approval_method = 'Approval method is required';
    if (!formData.sales_page_url.trim()) newErrors.sales_page_url = 'Sales page URL is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const formDataToSend = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value && key !== 'image') {
          formDataToSend.append(key, value);
        }
      });

      // Backend expects commission_rate, but our state field already matches; ensure numeric string is passed
      if (formData.commission_rate) {
        formDataToSend.set('commission_rate', formData.commission_rate);
      }

      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const res = await fetch(`${API_BASE}/vendor/products`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: formDataToSend,
      });

      const contentType = res.headers.get('content-type') || '';
      const parseBody = async () => {
        if (contentType.includes('application/json')) {
          return res.json();
        }
        const text = await res.text();
        throw new Error(text || 'Server returned a non-JSON response');
      };

      if (!res.ok) {
        const errorBody = await parseBody().catch((err) => err);
        const message = errorBody instanceof Error ? errorBody.message : errorBody?.message;
        throw new Error(message || `Failed to create product (status ${res.status})`);
      }

      const data = await parseBody();
      const product = data.data || data;

      // Generate pixel code
      const pixelCode = `<script>
  (function () {
    // CONFIG: set your API + frontend base URLs and product ID
    var API_BASE = '/api';
    var FRONTEND_BASE = '${process.env.NEXT_PUBLIC_FRONTEND_URL ?? (typeof window !== 'undefined' ? window.location.origin : 'https://affiliatehub.tech')}';
    var PRODUCT_ID = '${product.id}'; // e.g. 123

    var params = new URLSearchParams(location.search);
    var affiliateId = params.get('a');       // preferred if present
    var referralCode = params.get('ref') || params.get('r'); // fallback

    // Track the page view/click for analytics (non-blocking)
    if (referralCode) {
      // Tracks a click against an affiliate referral code for this product
      fetch(API_BASE + '/track/' + encodeURIComponent(referralCode) + '/' + PRODUCT_ID)
        .catch(function(){ /* ignore */ });
    }

    // Expose a helper for your Buy Now button
    window.startCheckout = function () {
      var checkoutUrl = FRONTEND_BASE + '/checkout?p=' + PRODUCT_ID;
      if (affiliateId) {
        checkoutUrl += '&a=' + encodeURIComponent(affiliateId);
      } else if (referralCode) {
        // Our checkout now accepts 'r' (referral code) and passes it through to Paystack metadata
        checkoutUrl += '&r=' + encodeURIComponent(referralCode);
      }
      location.href = checkoutUrl;
      return false; // prevent default if used on <a href="#">
    };
  })();
</script>`;

      setIntegrationData({
        product_id: product.id,
        pixel_code: pixelCode,
        sales_page_url: formData.sales_page_url,
      });

      setStep('integration');
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'Failed to create product',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateButtonCode = (buttonId: string) => {
    if (!integrationData) return '';

    return `<!-- Image-style button -->
<a href="#" onclick="return startCheckout()">
  <img src="https://path-to-your-button-image.png" alt="Buy Now">
</a>

<!-- Or a styled button -->
<button style="background:#fbbf24;color:#1f2937;padding:10px 20px;border-radius:6px;font-weight:bold;border:none;cursor:pointer"
        onclick="return startCheckout()">
  Buy Now
</button>`;
  };

  if (step === 'form') {
    return (
      <main className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-6"
          >
            <ChevronLeft size={18} />
            Back
          </button>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Product</h1>
            <p className="text-gray-600 mt-2">Step 1: Product Setup</p>
          </div>

          {/* Error Alert */}
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {errors.submit}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmitForm} className="space-y-8">
            {/* Product Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Product Image</label>
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Product" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={48} className="text-gray-400" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 rounded-full opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">Click to upload product image</p>
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter Product Name"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter Product Description"
                rows={4}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description}</p>}
            </div>

            {/* Category & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select...</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="text-red-600 text-xs mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.type ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select...</option>
                  {PRODUCT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.type && <p className="text-red-600 text-xs mt-1">{errors.type}</p>}
              </div>
            </div>

            {/* Currency & Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CURRENCIES.map((curr) => (
                    <option key={curr} value={curr}>
                      {curr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Price ({formData.currency || 'USD'})
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="Enter Product Price"
                  min="1"
                  step="0.01"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.price && <p className="text-red-600 text-xs mt-1">{errors.price}</p>}
              </div>
            </div>

            {/* Commission & Approval */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commission Percentage</label>
                <input
                  type="number"
                  name="commission_rate"
                  value={formData.commission_rate}
                  onChange={handleInputChange}
                  placeholder="Enter Commission Percentage"
                  min="0"
                  max="100"
                  step="0.01"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.commission_rate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.commission_rate && <p className="text-red-600 text-xs mt-1">{errors.commission_rate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">How to Approve Affiliates</label>
                <select
                  name="approval_method"
                  value={formData.approval_method}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.approval_method ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select...</option>
                  {APPROVAL_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
                {errors.approval_method && (
                  <p className="text-red-600 text-xs mt-1">{errors.approval_method}</p>
                )}
              </div>
            </div>

            {/* URLs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">URL to Product Sales Page</label>
              <input
                type="url"
                name="sales_page_url"
                value={formData.sales_page_url}
                onChange={handleInputChange}
                placeholder="Enter URL for Product Sales Page"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.sales_page_url ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.sales_page_url && <p className="text-red-600 text-xs mt-1">{errors.sales_page_url}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL to Product Download or Thank you page
              </label>
              <input
                type="url"
                name="thank_you_page_url"
                value={formData.thank_you_page_url}
                onChange={handleInputChange}
                placeholder="Enter URL for Product Download or Thank you page"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Webinar URL</label>
              <input
                type="url"
                name="webinar_url"
                value={formData.webinar_url}
                onChange={handleInputChange}
                placeholder="Enter the URL of your marketing resources"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL to JV Page or Marketing Resources
              </label>
              <input
                type="url"
                name="jv_page_url"
                value={formData.jv_page_url}
                onChange={handleInputChange}
                placeholder="Enter URL of your JV Page or Marketing Resources"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Next'}
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  // Integration Step
  if (!integrationData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
        <div className="max-w-2xl mx-auto text-center">
          <p>Loading integration details...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => setStep('form')}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-6"
        >
          <ChevronLeft size={18} />
          Back to Product Setup
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Integration Setup</h1>
          <p className="text-gray-600 mt-2">Step 2: Add tracking and payment buttons to your sales page</p>
        </div>

        {/* Tracking Pixel Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Copy & Paste Pixel Code on your Sales Page</h2>
          <p className="text-sm text-gray-600 mb-4">
            Kindly copy this pixel code below and insert it in your sales page header as a custom script. Statsecut
            integration? <a href="#" className="text-blue-600 hover:text-blue-700">CLICK HERE TO SEE AN EXAMPLE</a>
          </p>
          <div className="relative bg-gray-50 border border-gray-200 rounded-lg p-4">
            <pre className="text-xs text-gray-700 overflow-x-auto">{integrationData.pixel_code}</pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(integrationData.pixel_code);
              }}
              className="absolute top-4 right-4 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Button Generator Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Generate your PAY BUTTON (CTA)</h2>
          <p className="text-sm text-gray-600 mb-6">
            Select from the button options below that best suits your Website/sales page and then copy the code generated
            and insert in your website
          </p>

          {/* Button Type Selector */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">Select Button Type</label>
            <select
              value={selectedButton || ''}
              onChange={(e) => setSelectedButton(e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select...</option>
              {BUTTON_STYLES.map((btn) => (
                <option key={btn.id} value={btn.id}>
                  {btn.label}
                </option>
              ))}
            </select>
          </div>

          {/* Button Preview */}
          <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-4 text-center">Button Preview</p>
            {selectedButton ? (
              <div className="flex justify-center">
                {BUTTON_STYLES.find((b) => b.id === selectedButton) && (
                  <button
                    style={{
                      backgroundColor: BUTTON_STYLES.find((b) => b.id === selectedButton)!.color,
                      padding: '12px 24px',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '16px',
                    }}
                  >
                    {BUTTON_STYLES.find((b) => b.id === selectedButton)!.text}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500">No Button Selected, Please Select a button</p>
            )}
          </div>

          {/* Code Output */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Your Button Code</label>
            <div className="relative bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-32">
              {selectedButton ? (
                <>
                  <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap break-words">
                    {generateButtonCode(selectedButton)}
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generateButtonCode(selectedButton));
                    }}
                    className="absolute top-4 right-4 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
                  >
                    Copy
                  </button>
                </>
              ) : (
                <p className="text-gray-500 flex items-center justify-center h-full">
                  No Button Selected, Please Select a button
                </p>
              )}
            </div>
          </div>

          {/* Completion Actions */}
          <div className="mt-8 flex gap-4 justify-end">
            <button
              onClick={() => router.push('/products')}
              className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
