import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FAQ.css';

const FAQ = () => {
  const navigate = useNavigate();
  const [openQuestion, setOpenQuestion] = useState(null);

  const toggleQuestion = (index) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  const faqData = [
    {
      category: "Getting Started",
      questions: [
        {
          question: "How does Hairalyze work?",
          answer: "Hairalyze uses advanced AI technology to analyze your hair photos and questionnaire responses. Our system examines your hair texture, condition, length, and styling patterns to provide personalized recommendations for products, routines, and care tips."
        },
        {
          question: "What do I need to get started?",
          answer: "You'll need to create an account, complete a detailed questionnaire about your hair concerns and current routine, and upload 3 clear photos of your hair (front, back, and close-up of ends). The entire process takes about 5-10 minutes."
        },
        {
          question: "How much does it cost?",
          answer: "Each hair analysis costs $5. This one-time payment gives you access to comprehensive personalized recommendations, product suggestions, styling tips, and ongoing AI chat support for your specific analysis."
        }
      ]
    },
    {
      category: "Hair Analysis",
      questions: [
        {
          question: "What photos should I upload?",
          answer: "Upload 3 clear, well-lit photos: 1) Front view of your hair down, 2) Back view showing length and texture, 3) Close-up of your hair ends. Avoid filters, and ensure good lighting for the most accurate analysis."
        },
        {
          question: "How accurate is the AI analysis?",
          answer: "Our AI has been trained on thousands of hair images and professional hair care knowledge. While highly accurate, results work best when combined with your detailed questionnaire responses. The AI considers multiple factors including texture, porosity, damage level, and styling habits."
        },
        {
          question: "Can I get analysis for different hair types?",
          answer: "Yes! Hairalyze works for all hair types - straight, wavy, curly, coily, fine, thick, color-treated, natural, and everything in between. Our AI is trained to recognize and provide recommendations for diverse hair textures and conditions."
        }
      ]
    },
    {
      category: "Results & Recommendations",
      questions: [
        {
          question: "What will I receive in my analysis?",
          answer: "You'll get a comprehensive report including: detailed hair condition assessment, personalized product recommendations, step-by-step care routine, styling tips, ingredient recommendations to look for/avoid, and access to AI chat for follow-up questions."
        },
        {
          question: "How long are my results valid?",
          answer: "Your analysis results remain accessible in your account indefinitely. However, as your hair changes (growth, treatments, seasonal changes), you may want to get a new analysis every 3-6 months for updated recommendations."
        },
        {
          question: "Can I ask follow-up questions about my results?",
          answer: "Absolutely! Each analysis includes access to our AI Hair Analyst chat feature. You can ask specific questions about products, techniques, or clarifications about your recommendations anytime."
        }
      ]
    },
    {
      category: "Products & Recommendations",
      questions: [
        {
          question: "Do you recommend specific product brands?",
          answer: "Our suggestions are based on your hair's specific needs and are not sponsored recommendations."
        },
        {
          question: "What if I can't find the recommended products?",
          answer: "You can use our AI chat to ask about substitutes or products available in your area. We focus on ingredient types and formulations, so you can find suitable alternatives."
        },
        {
          question: "Are the product recommendations personalized?",
          answer: "Yes, every recommendation is tailored to your specific hair type, concerns, lifestyle, and budget preferences indicated in your questionnaire. We don't provide generic advice - everything is customized for you."
        }
      ]
    },
    {
      category: "Account & Technical",
      questions: [
        {
          question: "Is my data secure and private?",
          answer: "Yes, we take privacy seriously. Your photos and personal information are securely stored and encrypted. We never share your data with third parties, and you can delete your account and data at any time."
        },
        {
          question: "Can I access my results on mobile?",
          answer: "Yes! Hairalyze is fully responsive and works perfectly on mobile devices, tablets, and desktops. Your results are accessible from any device once you log into your account."
        },
        {
          question: "What if I'm not satisfied with my analysis?",
          answer: "We stand behind our analysis quality. If you're not satisfied, contact our support team within 7 days of your analysis, and we'll work with you to address any concerns or provide additional guidance."
        }
      ]
    }
  ];

  const containerStyle = {
    backgroundImage: `url(${process.env.PUBLIC_URL}/images/image_13.png)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed'
  };

  return (
    <div className="faq-container" style={containerStyle}>
      {/* Header */}
      <div className="faq-header">
        <h1>❓ Frequently Asked Questions</h1>
        <p>Everything you need to know about Hairalyzer and hair care</p>
        <button 
          onClick={() => navigate('/')}
          className="back-home-button"
        >
          ← Back to Home
        </button>
      </div>

      {/* FAQ Content */}
      <div className="faq-content">
        {faqData.map((category, categoryIndex) => (
          <div key={categoryIndex} className="faq-category">
            <h2 className="category-title">{category.category}</h2>
            <div className="questions-container">
              {category.questions.map((item, questionIndex) => {
                const globalIndex = categoryIndex * 10 + questionIndex;
                return (
                  <div key={questionIndex} className="faq-item">
                    <button
                      className={`faq-question ${openQuestion === globalIndex ? 'active' : ''}`}
                      onClick={() => toggleQuestion(globalIndex)}
                    >
                      <span>{item.question}</span>
                      <svg 
                        className={`chevron ${openQuestion === globalIndex ? 'rotated' : ''}`}
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <div className={`faq-answer ${openQuestion === globalIndex ? 'open' : ''}`}>
                      <p>{item.answer}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Call to Action */}
      <div className="faq-cta">
        <h3>Ready to Check your Hair?</h3>
        <p>Get personalized answers with your hair analysis</p>
        <button 
          onClick={() => navigate('/questionnaire')}
          className="start-analysis-button"
        >
          Start Your Hair Analysis
        </button>
      </div>
    </div>
  );
};

export default FAQ;
