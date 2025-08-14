import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Users,
  Briefcase,
  Award,
  MessageSquare,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  Star,
  Clock,
  DollarSign,
} from "lucide-react";

const Home = () => {
  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Connect Students & Startups",
      description:
        "Bridge the gap between academic talent and real-world opportunities.",
    },
    // {
    //   icon: <Briefcase className="w-8 h-8" />,
    //   title: "Verified Skills & Badges",
    //   description:
    //     "Students earn verified badges through practical task completion.",
    // },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Professional Certificates",
      description: "Generate downloadable certificates for completed projects.",
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "In-App Communication",
      description: "Seamless messaging between students and startup teams.",
    },
  ];

  // const testimonials = [
  //   {
  //     name: "Sarah Chen",
  //     role: "Computer Science Student",
  //     content:
  //       "Hubinity helped me gain real-world experience and build my portfolio. The verification system gave me credibility with employers.",
  //     rating: 5,
  //   },
  //   {
  //     name: "Mike Rodriguez",
  //     role: "Startup Founder",
  //     content:
  //       "We found amazing talent through Hubinity. The skill verification process ensures we get qualified students for our projects.",
  //     rating: 5,
  //   },
  // ];

  return (
    <>
      <Helmet>
        <title>Hubinity - Connecting Students and Startups</title>
        <meta
          name="description"
          content="Hubinity connects talented students with innovative startups. Build your future, one project at a time."
        />
      </Helmet>

      {/* Hero Section */}
      <section className="gradient-bg-elegant text-primary-cta section-padding">
        <div className="container-responsive">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-garamond font-bold mb-6 animate-fade-in">
              Connect. Learn. <span className="text-gradient">Grow.</span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl mb-8 max-w-3xl mx-auto text-gray-200 animate-slide-up">
              Hubinity bridges the gap between talented students and innovative
              startups. Build your future, one project at a time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in">
              <Link to="/register" className="btn-cta text-lg px-8 py-4">
                Get Started
                {/* <ArrowRight className="w-5 h-5 ml-2" /> */}
              </Link>
              <Link to="/tasks" className="btn-primary text-lg px-8 py-4">
                Browse Tasks
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding bg-primary-white">
        <div className="container-responsive">
          <div className="text-center mb-16">
            <h2 className="section-title">Why Choose Hubinity?</h2>
            <div className="flex justify-center">
              <p className="section-subtitle max-w-xl">
                Our platform offers unique features that make learning and
                collaboration seamless
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-responsive justify-items-center max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card-elegant text-center hover:shadow-large transition-all duration-300 max-w-sm animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-primary-button mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-primary-dark mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="section-padding bg-primary-card">
        <div className="container-responsive">
          <div className="text-center mb-16">
            <div className="flex justify-center">
              <h2 className="section-title max-w-xl">How It Works</h2>
            </div>
            <div className="flex justify-center">
              <p className="section-subtitle max-w-xl">
                Simple steps to get started with Hubinity
              </p>
            </div>
          </div>

          <div className="grid-responsive-3 gap-responsive">
            <div className="text-center animate-slide-up">
              <div className="w-16 h-16 bg-primary-button rounded-full flex items-center justify-center mx-auto mb-4 shadow-soft">
                <span className="text-primary-dark font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-semibold text-primary-dark mb-3">
                Create Your Profile
              </h3>
              <p className="text-gray-600">
                Sign up as a student or startup and build your profile with
                skills, experience, and goals.
              </p>
            </div>

            <div className="text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="w-16 h-16 bg-primary-button rounded-full flex items-center justify-center mx-auto mb-4 shadow-soft">
                <span className="text-primary-dark font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-semibold text-primary-dark mb-3">
                Connect & Collaborate
              </h3>
              <p className="text-gray-600">
                Browse tasks, apply for projects, and work together through our
                integrated platform.
              </p>
            </div>

            <div className="text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 bg-primary-button rounded-full flex items-center justify-center mx-auto mb-4 shadow-soft">
                <span className="text-primary-dark font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-semibold text-primary-dark mb-3">
                Earn & Grow
              </h3>
              <p className="text-gray-600">
                Complete tasks, earn verified badges, and download professional
                certificates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section
      <section className="section-padding bg-primary-white">
        <div className="container-responsive">
          <div className="text-center mb-16">
            <h2 className="section-title">What Our Users Say</h2>
            <div className="flex justify-center">
              <p className="section-subtitle max-w-xl">
                Hear from students and startups who have transformed their
                careers and businesses
              </p>
            </div>
          </div>

          <div className="grid-responsive-3 gap-responsive place-items-center">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card-elegant max-w-sm">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-primary-dark">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="section-padding gradient-bg-elegant text-primary-cta">
        <div className="container-responsive max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-garamond font-bold mb-6 animate-fade-in">
            Ready to Start Your Journey?
          </h2>
          <p className="text-lg md:text-xl mb-8 text-gray-200 animate-slide-up">
            Join thousands of students and startups already building the future
            together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in">
            <Link to="/register" className="btn-cta text-lg px-8 py-4">
              Join as Student
            </Link>
            <Link to="/register" className="btn-primary text-lg px-8 py-4">
              Join as Startup
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
