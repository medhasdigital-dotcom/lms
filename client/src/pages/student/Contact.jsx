import React from "react";
import Footer from "../../components/student/Footer";

const Contact = () => {
    return (
        <>
            <div className="flex flex-col items-center justify-center w-full md:pt-12 pt-20 px-7 md:px0 space-y-7 bg-gradient-to-b from-cyan-100/70">      
            <div className="max-w-7xl mx-auto px-6 pt-20 pb-28">

                {/* HEADER */}
                <div className="text-center max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                        Contact Us
                    </h1>
                    <p className="mt-4 text-gray-600">
                        Have questions or need help? We’re here to support you.
                    </p>
                </div>

                {/* CONTENT */}
                <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-12">

                    {/* CONTACT INFO */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold text-gray-800">
                            Get in Touch
                        </h2>

                        <p className="text-gray-600 leading-relaxed">
                            Reach out to us for any queries related to courses, enrollment,
                            or technical support. Our team usually responds within 24 hours.
                        </p>

                        <div className="space-y-4 text-gray-600">
                            <p>📍 <span className="font-medium">Address:</span><br/>
                                KW Delhi-6, Raj Nagar Extension, Ghaziabad<br/>
                                Uttar Pradesh, 201003
                            </p>
                            <p>📞 <span className="font-medium">Phone:</span> +91 80062 62813</p>
                            <p>📧 <span className="font-medium">Email:</span> info@rkconsultant.org.in</p>
                            <p>⏰ <span className="font-medium">Support Hours:</span> Mon - Fri: 9:00 AM — 6:00 PM IST</p>
                        </div>
                    </div>

                    {/* FORM */}
                    <form className="bg-white rounded-2xl p-8 shadow-md space-y-5">
                        <div>
                            <label className="block text-gray-700 mb-1 font-medium">
                                Name
                            </label>
                            <input
                                type="text"
                                placeholder="Your name"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-1 font-medium">
                                Email
                            </label>
                            <input
                                type="email"
                                placeholder="Your email"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-1 font-medium">
                                Message
                            </label>
                            <textarea
                                rows="4"
                                placeholder="Write your message..."
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                            Send Message
                        </button>
                    </form>

                </div>
            </div>
            </div>
            <Footer/>
        </>
    );
};

export default Contact;
