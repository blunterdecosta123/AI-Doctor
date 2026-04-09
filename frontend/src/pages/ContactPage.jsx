import { useState, useRef, Suspense } from 'react';
import emailjs from '@emailjs/browser';
import { Canvas } from '@react-three/fiber';
import Fox from '../models/Fox';
import CanvasLoader from '../components/CanvasLoader';
import './ContactPage.css';

const Contact = () => {
  const formRef = useRef(null);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState('idle');
  const [alert, setAlert] = useState({ show: false, text: '', type: 'success' });

  const showAlert = ({ text, type }) => setAlert({ show: true, text, type });
  const hideAlert = () => setAlert({ show: false, text: '', type: 'success' });
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFocus = () => setCurrentAnimation('walk');
  const handleBlur = () => setCurrentAnimation('idle');

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setCurrentAnimation('hit');

    emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      {
        from_name: form.name,
        to_name: 'Pranjay',
        from_email: form.email,
        to_email: 'singhpran15@gmail.com',
        message: form.message,
      },
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    ).then(() => {
      setIsLoading(false);
      showAlert({ text: 'Message sent successfully!', type: 'success' });
      setTimeout(() => {
        hideAlert();
        setCurrentAnimation('idle');
        setForm({ name: '', email: '', message: '' });
      }, 3000);
    }).catch((error) => {
      setIsLoading(false);
      setCurrentAnimation('idle');
      console.error('Error sending email:', error);
      showAlert({ text: "I didn't receive your message. Please try again later.", type: 'danger' });
    });
  };

  return (
    <section className="contact-page">

      {/* Alert Banner */}
      {alert.show && (
        <div className={`contact-alert ${alert.type === 'danger' ? 'contact-alert-danger' : 'contact-alert-success'}`}>
          {alert.text}
        </div>
      )}

      {/* Left: Form */}
      <div className="contact-form-column">
        <p className="contact-eyebrow">
          Contact Us
        </p>
        <h1 className="contact-title">
          Get in Touch
        </h1>

        <form ref={formRef} onSubmit={handleSubmit} className="contact-form">
          {/* Name */}
          <div className="contact-field">
            <label className="contact-label">Name</label>
            <input
              type="text" name="name" placeholder="Dave" required
              value={form.name} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur}
              className="contact-input"
            />
          </div>

          {/* Email */}
          <div className="contact-field">
            <label className="contact-label">Email</label>
            <input
              type="email" name="email" placeholder="dave@example.com" required
              value={form.email} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur}
              className="contact-input"
            />
          </div>

          {/* Message */}
          <div className="contact-field">
            <label className="contact-label">Your Message</label>
            <textarea
              name="message" rows={4} placeholder="Let me know how I can help you..." required
              value={form.message} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur}
              className="contact-textarea"
            />
          </div>

          <button
            type="submit" disabled={isLoading} onFocus={handleFocus} onBlur={handleBlur}
            className="contact-submit"
          >
            {isLoading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>

      {/* Right: Fox Canvas */}
      <div className="contact-canvas-column">
        <Canvas
          camera={{ position: [0, 0, 2.5], fov: 50, near: 0.1, far: 1000 }}
        >
          <ambientLight intensity={0.9} />
          <directionalLight intensity={2.5} position={[2, 2, 2]} />
          <directionalLight intensity={1.2} position={[-2, 1, 1]} />
          <Suspense fallback={<CanvasLoader />}>
            <Fox
              position={[0.15, 0.0, 0]}
              rotation={[0, -0.6, 0]}
              scale={[0.2, 0.2, 0.2]}
              currentAnimation={currentAnimation}
            />
          </Suspense>
        </Canvas>
      </div>

    </section>
  );
};

export default Contact;
