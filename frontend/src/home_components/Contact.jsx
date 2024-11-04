import React from "react";
import "./Contact.css";

const Contact = () => {
    return (
        <section className="contact container section" id="contact">
            <span>{<br/>}</span>
            <h1 className="about_Us">Get in Touch</h1>

            <div className="contact__data grid">
                <div className="contact__info">
                    <h3 className="contact__details">
                        Please contact us if you have any questions/concerns by filling out the form below:
                    </h3>
                    <span>{<br/>}</span>
                </div>
                <form action="" className="contact__form">
                    <div className="contact__form-group">
                        <div className="contact__form-div">
                            <input type="text" className="contact__form-input" placeholder="Insert your name" />
                        </div>
                        <div className="contact__form-div">
                            <input type="email" className="contact__form-input" placeholder="Insert your email" />
                        </div>
                    </div>

                    <div className="contact__form-div">
                        <input type="text" className="contact__form-input" placeholder="Insert your subject" />
                    </div>

                    <div className="contact__form-div contact__form-area">
                        <textarea name="" id="" cols="30" rows="10" className="contact__form-input" placeholder="Write your message here"></textarea>
                    </div>
                </form>
                <button className="btn">Send message</button>
            </div>
        </section>
    )
}

export default Contact