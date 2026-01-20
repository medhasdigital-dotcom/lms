import React from "react";
import Footer from "../../components/student/Footer";

const About = () => {
    return (
        <>
            <div className="flex flex-col items-center justify-center w-full md:pt-12 pt-20 px-7 md:px0 space-y-7 bg-gradient-to-b from-cyan-100/70">
                <div className="max-w-7xl mx-auto px-6 py-20">

                    {/* HERO */}
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
                            About Our Learning Platform
                        </h1>
                        <p className="mt-4 text-gray-600">
                            We are committed to helping learners build real-world skills and
                            grow their careers through practical, high-quality education.
                        </p>
                    </div>

                    {/* CONTENT */}
                    <div className="mt-20 grid md:grid-cols-2 gap-12 items-center">

                        {/* LEFT */}
                        <div className="space-y-6">
                            <h2 className="text-2xl font-semibold text-gray-800">
                                Our Mission
                            </h2>
                            <p className="text-gray-600 leading-relaxed">
                                Our mission is to make quality education accessible to everyone.
                                We focus on job-ready skills, hands-on projects, and learning
                                experiences designed for real industry needs.
                            </p>

                            <h2 className="text-2xl font-semibold text-gray-800">
                                Why Choose Us
                            </h2>

                            <ul className="space-y-3 text-gray-600">
                                <li>✔ Industry-relevant courses</li>
                                <li>✔ Experienced instructors</li>
                                <li>✔ Practical, project-based learning</li>
                                <li>✔ Learn anytime, anywhere</li>
                            </ul>
                        </div>

                        {/* RIGHT */}
                        <div className="bg-white rounded-2xl p-10 shadow-sm">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">
                                Our Values
                            </h3>

                            <div className="space-y-4 text-gray-600">
                                <p>
                                    🎓 <strong>Student-first:</strong> Every feature is built for
                                    learners.
                                </p>
                                <p>
                                    💡 <strong>Practical learning:</strong> Skills that matter in
                                    real jobs.
                                </p>
                                <p>
                                    🌍 <strong>Accessible:</strong> Education without barriers.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default About;
