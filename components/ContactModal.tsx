import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { XMarkIcon, PhoneIcon } from './IconComponents';
import Loader from './Loader';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
        const { error: submissionError } = await supabase.from('contact_submissions').insert({
        name,
        email,
        whatsapp_number: whatsapp,
        message,
        });

        if (submissionError) throw submissionError;

        setSuccess(true);
        setName('');
        setEmail('');
        setWhatsapp('');
        setMessage('');
        setTimeout(() => {
            setSuccess(false);
            onClose();
        }, 3000);

    } catch (err: any) {
        // Log the full error object to the console for better debugging.
        console.error('A detailed error occurred during contact form submission:', err);

        let displayError = 'Failed to send message. Please try again later.';
        
        // Create a more user-friendly error message for the UI.
        if (err && typeof err.message === 'string') {
            displayError = `Submission Failed: ${err.message}`;
        }
        
        setError(displayError);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative p-1 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 w-full">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h3 id="contact-modal-title" className="text-2xl font-bold text-slate-900 dark:text-white">
              Get in Touch
            </h3>
            <p className="mt-2 text-slate-500 dark:text-slate-400">We'd love to hear from you. Reach out to us directly or fill out the form below.</p>
          </div>
          
          <div className="mt-6 flex items-center justify-center gap-3 bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg">
            <PhoneIcon className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
            <a href="tel:+2348100253988" className="text-lg font-semibold text-slate-800 dark:text-white hover:underline">+234 810 025 3988</a>
          </div>

          {success ? (
            <div className="mt-6 text-center bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-300 px-4 py-3 rounded-lg">
              <p className="font-bold">Message Sent!</p>
              <p className="text-sm">Thank you for contacting us. We will get back to you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Full Name</label>
                <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 bg-white dark:bg-slate-900 rounded-md placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none border border-slate-300 dark:border-slate-600" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Email Address</label>
                  <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 bg-white dark:bg-slate-900 rounded-md placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none border border-slate-300 dark:border-slate-600" />
                </div>
                <div>
                  <label htmlFor="whatsapp" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">WhatsApp Number</label>
                  <input id="whatsapp" type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required className="w-full p-2 bg-white dark:bg-slate-900 rounded-md placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none border border-slate-300 dark:border-slate-600" />
                </div>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Message</label>
                <textarea id="message" value={message} onChange={e => setMessage(e.target.value)} required rows={4} className="w-full p-2 bg-white dark:bg-slate-900 rounded-md placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none border border-slate-300 dark:border-slate-600"></textarea>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-600"
                >
                  {loading ? <Loader /> : 'Send Message'}
                </button>
              </div>
              {error && <p className="text-sm text-center text-red-500 dark:text-red-400 mt-2">{error}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
export default ContactModal;