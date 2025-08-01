import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { trackPageView, trackCTAClick, trackUserEngagement } from '../utils/analytics';
import './HairTypesGuide.css';

const HairTypesGuide = () => {
  useEffect(() => {
    // SEO: Update page title and meta description
    document.title = 'Complete Hair Type Analysis Guide - Straight, Wavy, Curly, Coily | Hairalyzer';

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Complete guide to hair types, texture analysis, and porosity. Learn about straight, wavy, curly, and coily hair with personalized care recommendations. Free hair type guide.');
    }

    // Track page view for SEO analytics
    trackPageView('Hair Types Guide - Complete Hair Type Analysis Guide', window.location.href);
    trackUserEngagement('page_view', 'hair_types_guide');
  }, []);

  const handleCTAClick = (ctaName) => {
    trackCTAClick(ctaName, 'hair_types_guide');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* SEO-Optimized Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16 hair-guide-force-white">
        <div className="max-w-4xl mx-auto px-6 text-center hair-guide-force-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 hair-guide-force-white" style={{ color: '#ffffff' }}>
            Complete Hair Type Analysis Guide
          </h1>
          <p className="text-xl md:text-2xl mb-8 hair-guide-force-white" style={{ color: '#ffffff' }}>   
            Discover your hair type, texture, and porosity with our comprehensive guide.
            Get personalized hair care recommendations based on your unique hair characteristics.        
          </p>
          <Link
            to="/signup"
            onClick={() => handleCTAClick('header_get_analysis')}
            className="inline-block bg-white text-purple-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
          >
            Get AI Hair Type Analysis - $9.99
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* Table of Contents */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">What You'll Learn</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="space-y-3">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                <a href="#hair-texture-types" className="text-purple-600 hover:underline">Hair Texture Types</a>
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                <a href="#hair-thickness" className="text-purple-600 hover:underline">Hair Thickness & Density</a>
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                <a href="#hair-porosity" className="text-purple-600 hover:underline">Hair Porosity Levels</a>
              </li>
            </ul>
            <ul className="space-y-3">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                <a href="#determine-hair-type" className="text-purple-600 hover:underline">How to Determine Your Hair Type</a>
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                <a href="#care-recommendations" className="text-purple-600 hover:underline">Care Recommendations by Type</a>
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                <a href="#ai-analysis" className="text-purple-600 hover:underline">AI Hair Type Analysis</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Hair Texture Types Section */}
        <section id="hair-texture-types" className="mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Hair Texture Types: Complete Classification System</h2>

            <div className="space-y-8">
              {/* Type 1: Straight Hair */}
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Straight Hair</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">Fine & Straight</h4>
                    <p className="text-gray-700 text-sm">Very fine, soft, and shiny. Difficult to curl and holds very little volume. Often appears flat against the scalp.</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">Medium Straight</h4>
                    <p className="text-gray-700 text-sm">Medium thickness with some body. Has more volume and can hold curls for short periods.</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">Coarse Straight</h4>
                    <p className="text-gray-700 text-sm">Thick, coarse, and resistant to curling. May have slight waves and can appear frizzy in humid conditions.</p>
                  </div>
                </div>
              </div>

              {/* Type 2: Wavy Hair */}
              <div className="border-l-4 border-pink-500 pl-6">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Wavy Hair</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-pink-800 mb-2">Loose Waves</h4>
                    <p className="text-gray-700 text-sm">Fine, thin hair with loose, barely-there waves. 
Easy to straighten and style but prone to becoming flat.</p>
                  </div>
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-pink-800 mb-2">Moderate Waves</h4>
                    <p className="text-gray-700 text-sm">Medium thickness with more defined waves. Can be prone to frizz and benefits from anti-humidity products.</p>
                  </div>
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-pink-800 mb-2">Strong Waves</h4>
                    <p className="text-gray-700 text-sm">Thick, coarse hair with strong waves and some curls. Highly prone to frizz and requires moisture-rich products.</p>
                  </div>
                </div>
              </div>

              {/* Type 3: Curly Hair */}
              <div className="border-l-4 border-blue-500 pl-6">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Curly Hair</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Large Curls</h4>
                    <p className="text-gray-700 text-sm">Large, loose curls with a wide circumference. Shiny and can be prone to humidity-induced frizz.</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Springy Curls</h4>
                    <p className="text-gray-700 text-sm">Well-defined curls with medium circumference. Voluminous and can range from bouncy to tight.</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Tight Curls</h4>
                    <p className="text-gray-700 text-sm">Tight curls with small circumference. Dense, full, and requires intensive moisture and gentle handling.</p>
                  </div>
                </div>
              </div>

              {/* Type 4: Coily Hair */}
              <div className="border-l-4 border-green-500 pl-6">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">Coily Hair</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Soft Coils</h4>
                    <p className="text-gray-700 text-sm">Soft, fine coils with visible curl pattern. Retains moisture well but can be fragile and prone to breakage.</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Z-Pattern Coils</h4>
                    <p className="text-gray-700 text-sm">Less defined curl pattern with sharp angles and 
Z-shaped bends. Requires heavy moisturizing and protective styling.</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Tight Coils</h4>
                    <p className="text-gray-700 text-sm">Tightest curl pattern with minimal visible curl 
definition. Extremely fragile and requires gentle, moisture-intensive care.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Hair Thickness Section */}
        <section id="hair-thickness" className="mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Hair Thickness & Density Analysis</h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Hair Strand Thickness</h3>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-600 mb-2">Fine Hair</h4>
                    <p className="text-gray-700 text-sm">Individual strands are thin and delicate. Often
feels silky but can appear limp and lack volume.</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-600 mb-2">Medium Hair</h4>
                    <p className="text-gray-700 text-sm">Most common thickness. Strands are neither too fine nor too thick, offering good styling versatility.</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-600 mb-2">Thick/Coarse Hair</h4>
                    <p className="text-gray-700 text-sm">Individual strands are wide and strong. Can be resistant to styling but holds styles well once set.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Hair Density</h3>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-pink-600 mb-2">Low Density</h4>
                    <p className="text-gray-700 text-sm">Fewer hair follicles per square inch. Scalp may
be visible, especially when hair is wet.</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-pink-600 mb-2">Medium Density</h4>
                    <p className="text-gray-700 text-sm">Average number of hair follicles. Scalp is not easily visible when hair is styled normally.</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-pink-600 mb-2">High Density</h4>
                    <p className="text-gray-700 text-sm">Many hair follicles per square inch. Hair appears very full and thick, scalp rarely visible.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Hair Porosity Section */}
        <section id="hair-porosity" className="mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Understanding Hair Porosity</h2>
            <p className="text-gray-600 mb-8">Hair porosity refers to your hair's ability to absorb and retain moisture. Understanding your porosity level is crucial for choosing the right products and treatments.</p>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-blue-600 mb-4">Low Porosity</h3>
                <ul className="text-gray-700 text-sm space-y-2 mb-4">
                  <li>• Cuticles are tightly closed</li>
                  <li>• Resistant to moisture absorption</li>
                  <li>• Products sit on hair surface</li>
                  <li>• Takes long to get wet and dry</li>
                  <li>• Prone to product buildup</li>
                </ul>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-blue-800 text-sm font-medium">Best for: Lightweight, water-based products</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-green-600 mb-4">Normal Porosity</h3>
                <ul className="text-gray-700 text-sm space-y-2 mb-4">
                  <li>• Balanced moisture absorption</li>
                  <li>• Cuticles allow proper moisture flow</li>
                  <li>• Holds styles well</li>
                  <li>• Accepts color treatments easily</li>
                  <li>• Generally healthy appearance</li>
                </ul>
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-green-800 text-sm font-medium">Best for: Most hair products work well</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-red-600 mb-4">High Porosity</h3>
                <ul className="text-gray-700 text-sm space-y-2 mb-4">
                  <li>• Cuticles are raised or damaged</li>
                  <li>• Absorbs moisture quickly</li>
                  <li>• Loses moisture just as fast</li>
                  <li>• Often feels dry and brittle</li>
                  <li>• Prone to frizz and tangles</li>
                </ul>
                <div className="bg-red-50 p-3 rounded">
                  <p className="text-red-800 text-sm font-medium">Best for: Heavy, protein-rich treatments</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How to Determine Hair Type Section */}
        <section id="determine-hair-type" className="mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">How to Determine Your Hair Type</h2>

            <div className="space-y-8">
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Step 1: Analyze Your Natural Texture</h3>
                <p className="text-gray-700 mb-4">Wash your hair with a clarifying shampoo and let it air dry without any products. Observe the natural pattern that emerges.</p>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-purple-800 text-sm"><strong>Pro Tip:</strong> Take photos of your hair from different angles when it's completely natural - this is exactly what our AI analysis does!</p>
                </div>
              </div>

              <div className="border-l-4 border-pink-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Step 2: Test Hair Thickness</h3>
                <p className="text-gray-700 mb-4">Take a single strand of hair and compare it to a piece of thread:</p>
                <ul className="text-gray-700 text-sm space-y-1 ml-4">
                  <li>• Thinner than thread = Fine hair</li>
                  <li>• Same thickness as thread = Medium hair</li>
                  <li>• Thicker than thread = Coarse hair</li>
                </ul>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Step 3: Porosity Test</h3>
                <p className="text-gray-700 mb-4">Drop a clean strand of hair in a glass of water:</p>
                <ul className="text-gray-700 text-sm space-y-1 ml-4">
                  <li>• Floats = Low porosity</li>
                  <li>• Sinks slowly = Normal porosity</li>
                  <li>• Sinks quickly = High porosity</li>
                </ul>
              </div>

              <div className="border-l-4 border-green-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Step 4: Density Check</h3>
                <p className="text-gray-700 mb-4">Part your hair and look at your scalp:</p>
                <ul className="text-gray-700 text-sm space-y-1 ml-4">
                  <li>• Scalp easily visible = Low density</li>
                  <li>• Scalp somewhat visible = Medium density</li>
                  <li>• Scalp barely visible = High density</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Care Recommendations Section */}
        <section id="care-recommendations" className="mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Hair Care Recommendations by Type</h2>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-purple-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-purple-600 mb-4">Straight Hair</h3>
                  <ul className="text-gray-700 text-sm space-y-2">
                    <li>• Use volumizing shampoos and conditioners</li>
                    <li>• Avoid heavy oils and creams</li>
                    <li>• Dry shampoo for oil control</li>
                    <li>• Heat protectant for styling</li>
                    <li>• Regular trims to prevent split ends</li>
                  </ul>
                </div>

                <div className="border border-pink-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-pink-600 mb-4">Wavy Hair</h3>
                  <ul className="text-gray-700 text-sm space-y-2">
                    <li>• Sulfate-free shampoos</li>
                    <li>• Leave-in conditioners</li>
                    <li>• Scrunching technique for definition</li>
                    <li>• Anti-humidity products</li>
                    <li>• Microfiber towels for drying</li>
                  </ul>
                </div>

                <div className="border border-blue-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-blue-600 mb-4">Curly Hair</h3>
                  <ul className="text-gray-700 text-sm space-y-2">
                    <li>• Co-washing (conditioner-only washing)</li>
                    <li>• Deep conditioning treatments</li>
                    <li>• Curl-defining creams and gels</li>
                    <li>• Plopping technique for drying</li>
                    <li>• Satin pillowcases for sleep</li>
                  </ul>
                </div>

                <div className="border border-green-200 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-green-600 mb-4">Coily Hair</h3>
                  <ul className="text-gray-700 text-sm space-y-2">
                    <li>• Gentle, sulfate-free cleansers</li>
                    <li>• Heavy moisturizers and butters</li>
                    <li>• Protective styling methods</li>
                    <li>• Pre-poo treatments</li>
                    <li>• Silk or satin hair accessories</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Analysis Section */}
        <section id="ai-analysis" className="mb-16">
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Why Choose AI Hair Type Analysis?</h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-purple-600 mb-4">Professional Accuracy</h3>
                <p className="text-gray-700 mb-4">Our AI analyzes thousands of hair characteristics that
the human eye might miss, providing more accurate results than self-assessment.</p>

                <h3 className="text-xl font-semibold text-purple-600 mb-4">Personalized Recommendations</h3>
                <p className="text-gray-700 mb-4">Get specific product recommendations, styling techniques, and care routines tailored to your exact hair type and concerns.</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-pink-600 mb-4">Comprehensive Analysis</h3>
                <p className="text-gray-700 mb-4">Beyond just texture, our AI evaluates porosity, density, damage levels, and scalp health for a complete hair profile.</p>

                <h3 className="text-xl font-semibold text-pink-600 mb-4">Expert-Level Insights</h3>
                <p className="text-gray-700 mb-4">Receive professional-grade analysis typically only available from expensive salon consultations.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white p-8 text-center mb-16 hair-guide-force-white">
          <h2 className="text-3xl font-bold mb-4 hair-guide-force-white" style={{ color: '#ffffff' }}>Ready to Discover Your Hair Type?</h2>
          <p className="text-xl mb-6 hair-guide-force-white" style={{ color: '#ffffff' }}>
            Stop guessing and get professional AI analysis of your hair type, texture, porosity, and personalized care recommendations.
          </p>
          <div className="space-y-4">
            <Link
              to="/signup"
              onClick={() => handleCTAClick('final_get_analysis')}
              className="inline-block bg-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 mr-4"
              style={{ color: '#7C3AED' }}
            >
              Get Your Hair Analysis - $9.99
            </Link>
            <Link
              to="/what-you-get"
              onClick={() => handleCTAClick('what_you_get')}
              className="inline-block border-2 border-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white transition-all duration-300"
              style={{ color: '#ffffff' }}
              onMouseEnter={(e) => e.target.style.color = '#7C3AED'}
              onMouseLeave={(e) => e.target.style.color = '#ffffff'}
            >
              See What You Get
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-semibold text-gray-800 mb-2">How accurate is AI hair type analysis compared to professional assessment?</h3>
              <p className="text-gray-700 text-sm">Our AI analyzes over 50 hair characteristics with 95%
accuracy, often detecting subtle details that even professionals might miss during a quick consultation.</p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-semibold text-gray-800 mb-2">Can my hair type change over time?</h3>
              <p className="text-gray-700 text-sm">Yes! Hair type can change due to hormones, age, chemical treatments, heat damage, and environmental factors. We recommend re-analyzing every 6-12 months.</p>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-semibold text-gray-800 mb-2">What if I have multiple hair types on my head?</h3>
              <p className="text-gray-700 text-sm">Many people have varying textures throughout their hair. Our AI identifies these variations and provides care recommendations for each section.</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Do you provide product recommendations for specific brands?</h3>
              <p className="text-gray-700 text-sm">Yes! Our AI Hair Analyst chat feature provides specific product recommendations when you ask for them. Simply request product suggestions during your chat session and get personalized brand recommendations tailored to your hair type and concerns.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HairTypesGuide;
