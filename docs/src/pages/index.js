
import React, { useState } from 'react';
import './index.css'

const Index = () => {

  // Card components
  const Card = ({ className = "", children }) => {
    return (
      <div className={`card ${className}`}>
        {children}
      </div>
    );
  };

  const CardHeader = ({ className = "", children }) => {
    return (
      <div className={`card-header ${className}`}>
        {children}
      </div>
    );
  };

  const CardTitle = ({ className = "", children }) => {
    return (
      <h3 className={`card-title ${className}`}>
        {children}
      </h3>
    );
  };

  const CardDescription = ({ className = "", children }) => {
    return (
      <p className={`card-description ${className}`}>
        {children}
      </p>
    );
  };

  const CardContent = ({ className = "", children }) => {
    return (
      <div className={`card-content ${className}`}>
        {children}
      </div>
    );
  };

  const CardFooter = ({ className = "", children }) => {
    return (
      <div className={`card-footer ${className}`}>
        {children}
      </div>
    );
  };

  // Button component
  const Button = ({ className = "", variant = "default", children, onClick }) => {
    return (
      <button
        className={`button button-${variant} ${className}`}
        onClick={onClick}
      >
        {children}
      </button>
    );
  };

  // Tabs components
  const Tabs = ({ defaultValue, className = "", children }) => {
    const [activeTab, setActiveTab] = useState(defaultValue);
    
    return (
      <div className={`tabs ${className}`} data-active-tab={activeTab}>
        {React.Children.map(children, child => {
          if (!React.isValidElement(child)) return null;
          
          if (child.type === TabsList || child.type === TabsContent) {
            return React.cloneElement(child, {
              activeTab,
              setActiveTab,
              ...child.props
            });
          }
          
          return child;
        })}
      </div>
    );
  };

  const TabsList = ({ className = "", activeTab, setActiveTab, children }) => {
    return (
      <div className={`tabs-list ${className}`}>
        {React.Children.map(children, child => {
          if (!React.isValidElement(child)) return null;
          
          if (child.type === TabsTrigger) {
            return React.cloneElement(child, {
              activeTab,
              setActiveTab,
              ...child.props
            });
          }
          
          return child;
        })}
      </div>
    );
  };

  const TabsTrigger = ({ value, activeTab, setActiveTab, className = "", children }) => {
    const isActive = activeTab === value;
    
    return (
      <button
        className={`tabs-trigger ${isActive ? 'active' : ''} ${className}`}
        onClick={() => setActiveTab && setActiveTab(value)}
      >
        {children}
      </button>
    );
  };

  const TabsContent = ({ value, activeTab, className = "", children }) => {
    const isActive = activeTab === value;
    
    if (!isActive) return null;
    
    return (
      <div className={`tabs-content ${className}`}>
        {children}
      </div>
    );
  };

  // Code block component
  const CodeBlock = ({ code, language }) => {
    return (
      <div className="code-block">
        <pre className="code-pre">
          <code>{code}</code>
        </pre>
        <div className="code-language">
          {language}
        </div>
      </div>
    );
  };
  
  // Feature card component
  const FeatureCard = ({ title, description, icon }) => {
    return (
      <div className="feature-card">
        <div className="feature-icon">
          {icon === "download" && (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download h-8 w-8 text-violet-600" data-lov-id="src/components/FeatureCard.tsx:20:15" data-lov-name="Download" data-component-path="src/components/FeatureCard.tsx" data-component-line="20" data-component-file="FeatureCard.tsx" data-component-name="Download" data-component-content="%7B%22className%22%3A%22h-8%20w-8%20text-violet-600%22%7D"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>
          )}
          {icon === "list" && (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list h-8 w-8 text-violet-600" data-lov-id="src/components/FeatureCard.tsx:28:15" data-lov-name="List" data-component-path="src/components/FeatureCard.tsx" data-component-line="28" data-component-file="FeatureCard.tsx" data-component-name="List" data-component-content="%7B%22className%22%3A%22h-8%20w-8%20text-violet-600%22%7D"><path d="M3 12h.01"></path><path d="M3 18h.01"></path><path d="M3 6h.01"></path><path d="M8 12h13"></path><path d="M8 18h13"></path><path d="M8 6h13"></path></svg> 
          )}
          {icon === "play" && (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play h-8 w-8 text-violet-600" data-lov-id="src/components/FeatureCard.tsx:24:15" data-lov-name="Play" data-component-path="src/components/FeatureCard.tsx" data-component-line="24" data-component-file="FeatureCard.tsx" data-component-name="Play" data-component-content="%7B%22className%22%3A%22h-8%20w-8%20text-violet-600%22%7D"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>
          )}
          {icon === "arrow-down" && (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down h-8 w-8 text-violet-600" data-lov-id="src/components/FeatureCard.tsx:16:15" data-lov-name="ArrowDown" data-component-path="src/components/FeatureCard.tsx" data-component-line="16" data-component-file="FeatureCard.tsx" data-component-name="ArrowDown" data-component-content="%7B%22className%22%3A%22h-8%20w-8%20text-violet-600%22%7D"><path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path></svg>
          )}
          {icon === "list-check" && (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-check h-8 w-8 text-violet-600" data-lov-id="src/components/FeatureCard.tsx:30:15" data-lov-name="ListCheck" data-component-path="src/components/FeatureCard.tsx" data-component-line="30" data-component-file="FeatureCard.tsx" data-component-name="ListCheck" data-component-content="%7B%22className%22%3A%22h-8%20w-8%20text-violet-600%22%7D"><path d="M11 18H3"></path><path d="m15 18 2 2 4-4"></path><path d="M16 12H3"></path><path d="M16 6H3"></path></svg>
          )}
          {icon === "list-video" && (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-video h-8 w-8 text-violet-600" data-lov-id="src/components/FeatureCard.tsx:32:15" data-lov-name="ListVideo" data-component-path="src/components/FeatureCard.tsx" data-component-line="32" data-component-file="FeatureCard.tsx" data-component-name="ListVideo" data-component-content="%7B%22className%22%3A%22h-8%20w-8%20text-violet-600%22%7D"><path d="M12 12H3"></path><path d="M16 6H3"></path><path d="M12 18H3"></path><path d="m16 12 5 3-5 3v-6Z"></path></svg>
          )}
        </div>
        <h3 className="feature-title">{title}</h3>
        <p className="feature-description">{description}</p>
      </div>
    );
  };
  
  // Navigation bar component
  const NavBar = () => {
    return (
      <header className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <span className="navbar-title">Expo LLM Mediapipe</span>
          </div>
          
          <div className="navbar-actions">
            <Button variant="outline" className="navbar-button mr-2" onClick={() => window.location.href = "https://github.com/tirthajyoti-ghosh/expo-llm-mediapipe/"}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-github" data-lov-id="src/components/NavBar.tsx:24:12" data-lov-name="GithubIcon" data-component-path="src/components/NavBar.tsx" data-component-line="24" data-component-file="NavBar.tsx" data-component-name="GithubIcon" data-component-content="%7B%7D"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
              GitHub
            </Button>
          </div>
        </div>
      </header>
    );
  };
  
  // Footer component
  const Footer = () => {
    return (
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-section">
            <h3 className="footer-heading">expo-llm-mediapipe</h3>
            <p className="footer-text">
              Run powerful language models directly on mobile devices.
            </p>
          </div>
          
          <div className="footer-section">
            <h3 className="footer-heading">Resources</h3>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">Documentation</a></li>
              <li><a href="#" className="footer-link">API Reference</a></li>
              <li><a href="#" className="footer-link">Examples</a></li>
              <li><a href="#" className="footer-link">GitHub</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3 className="footer-heading">Community</h3>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">Discord</a></li>
              <li><a href="#" className="footer-link">Twitter</a></li>
              <li><a href="#" className="footer-link">Stack Overflow</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3 className="footer-heading">More</h3>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">Blog</a></li>
              <li><a href="#" className="footer-link">Showcase</a></li>
              <li><a href="#" className="footer-link">Privacy</a></li>
              <li><a href="#" className="footer-link">Terms</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Expo. All rights reserved.</p>
        </div>
      </footer>
    );
  };
  
  // Hero section component
  const HeroSection = () => {
    return (
      <section className="hero">
        <div className="hero-container">
          <div className="hero-grid">
            <div className="hero-content">
              <h1 className="hero-title">
                On-Device LLMs for React Native
              </h1>
              <p className="hero-description">
                Run powerful language models directly on mobile devices with Google's MediaPipe Inference Task API.
                Fast, private, and works offline.
              </p>
              <div className="hero-actions">
                <Button className="hero-button-primary" onClick={() => window.location.href = "/expo-llm-mediapipe/docs/getting-started"}>
                  Get Started
                </Button>
              </div>
            </div>
            <div className="hero-showcase">
              <div className="hero-code">
                <pre className="hero-code-pre">
                  <code>
                      {`import { useLLM } from 'expo-llm-mediapipe';
                  
function LlmInference() {
  const { generateResponse, isLoaded } = useLLM({
    modelUrl: 'https://huggingface.co/google/gemma-1.1-2b...',
    modelName: 'gemma-1.1-2b-it-cpu-int4.bin',
  });

  if (isLoaded) {
    const response = await generateResponse(
      'Tell me about React Native'
    );
    console.log(response);
  }
}`}
                  </code>
                </pre>
                <div className="hero-code-tag">
                  Simple API
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-gradient"></div>
      </section>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 landing-page">
        <NavBar />
        <HeroSection />
        
        <section id="features" className="max-w-7xl mx-auto">
          <h2>Key Features</h2>
          <div className="grid">
            <FeatureCard 
              title="On-Device Intelligence" 
              description="Run LLM inference directly on the device without relying on external servers."
              icon="download"
            />
            <FeatureCard 
              title="Cross-Platform Support" 
              description="Works seamlessly on both Android and iOS devices."
              icon="list"
            />
            <FeatureCard 
              title="Streaming Generation" 
              description="Generate token-by-token responses for responsive UIs."
              icon="play"
            />
            <FeatureCard 
              title="Download Management" 
              description="Download, cancel, or delete models on-device with ease."
              icon="arrow-down"
            />
            <FeatureCard 
              title="React Hooks" 
              description="Simplified APIs for declarative usage within your React Native application."
              icon="list-check"
            />
            <FeatureCard 
              title="Manual APIs" 
              description="Advanced APIs for developers who need more control over the inference process."
              icon="list-video"
            />
          </div>
        </section>

        <section className="bg-white">
          <div className="max-w-7xl mx-auto">
            <h2>Getting Started</h2>
            
            <Tabs defaultValue="expo" className="max-w-3xl mx-auto">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="expo">expo</TabsTrigger>
                <TabsTrigger value="npm">npm</TabsTrigger>
                <TabsTrigger value="yarn">yarn</TabsTrigger>
              </TabsList>
              <TabsContent value="expo" className="mt-4">
                <CodeBlock code="expo install @expo/mediapipe-llm" language="bash" />
              </TabsContent>
              <TabsContent value="npm" className="mt-4">
                <CodeBlock code="npm install @expo/mediapipe-llm" language="bash" />
              </TabsContent>
              <TabsContent value="yarn" className="mt-4">
                <CodeBlock code="yarn add @expo/mediapipe-llm" language="bash" />
              </TabsContent>
            </Tabs>

            <div className="mt-12 max-w-3xl mx-auto">
              <h3>Basic Usage</h3>
              <CodeBlock 
                code={`import { useState } from 'react';
import { View, Text, Button } from 'react-native';
import { useLLM } from 'expo-llm-mediapipe';

export default function App() {
  const [response, setResponse] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { 
    generateResponse, 
    isLoaded,
  } = useLLM({
    storageType: 'asset',
    modelName: 'gemma-1.1-2b-it-cpu-int4.bin',
    maxTokens: 1024,
    temperature: 0.5,
    topK: 1,
  });

  return !isLoaded && (
    <Text>Loading...</Text>
  );

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button 
        onPress={() => {
          setIsGenerating(true);
          const res = generateResponse("Tell me about React Native");
          setResponse(res);
          setIsGenerating(false);
        }}
        disabled={isGenerating}
        title={isGenerating ? "Generating..." : "Generate Text"}
      />
      
      {result && <Text>{result}</Text>}
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
    </View>
  );
}
`} 
                language="jsx" 
              />
            </div>
          </div>
        </section>

        <section className="bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <h2>What is MediaPipe LLM Inference Task?</h2>
            <Card className="max-w-3xl mx-auto">
              <CardContent className="pt-6">
                <p className="text-gray-700 mb-4">
                  The MediaPipe LLM Inference API lets you run large language models (LLMs) completely on-device, which you can use to perform a wide range of tasks:
                </p>
                
                <ul className="list-disc space-y-2 text-gray-700">
                  <li>Text generation based on prompts</li>
                  <li>Retrieving information in natural language form</li>
                  <li>Summarizing documents and other content</li>
                  <li>Running models like Gemma, Phi-2, and others efficiently on mobile hardware</li>
                  <li>Processing inputs offline with complete privacy</li>
                </ul>
                
                <p className="mt-4 text-gray-700">
                  This package provides a React Native wrapper around MediaPipe's LLM inference capabilities, making it easy to integrate powerful on-device language models into your mobile applications with no server dependencies.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
        
        <section className="bg-white">
          <div className="max-w-7xl mx-auto">
            <h2>Documentation</h2>
            
            <div className="grid md:grid-cols-1 grid-cols-2 max-w-3xl mx-auto">
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>API Reference</CardTitle>
                  <CardDescription>Complete documentation of all available APIs and options</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">View API Reference</Button>
                </CardContent>
              </Card>
              
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Examples</CardTitle>
                  <CardDescription>Code examples and demos to help you get started</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">View Examples</Button>
                </CardContent>
              </Card>
              
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Guides</CardTitle>
                  <CardDescription>Step-by-step guides for common use cases</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">View Guides</Button>
                </CardContent>
              </Card>
              
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Supported Models</CardTitle>
                  <CardDescription>List of LLM models compatible with this package</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">View Models</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Index;
