import React from "react";
import "./Services.css";


const data = [
    {
        id: 1,
        title: "Effortless Group Dining Decisions",
        description:
            "Say goodbye to endless debates! Dinder makes it easy for groups to choose a restaurant by allowing each member to swipe on options that match everyone's preferences, finding the best fit for all in no time.",
    },
    {
        id: 2,
        title: "Personalized Recommendations and Local Discovery",
        description:
            "Dinder takes your preferences into account, providing tailored restaurant suggestions based on cuisine, distance, price, and rating, ensuring that every dining experience feels uniquely curated.",
    },
    {
        id: 3,
        title: "Real-Time Group Voting",
        description:
            "No more back-and-forth messaging! Dinder's real-time voting system lets all members see which restaurants get the most approvals, with instant notifications when a match is found, making the decision process interactive and fun.",
    }
];

const Services = () => {
    return (
        <section className="services container section" id="services">
            <span>{<br/>}</span>
            <h1 className="section__title">What We Offer</h1>
            <div className="services__container grid">
                {data.map(({id, title, description}) => {
                    return (
                         <div className="services__card" key={id}>
                            
                            <h2 className="services__title">{title}</h2>
                            <h3 className="services__description">{description}</h3>
                         </div>
                    );
                })}
                <span>{<br/>}</span>
            </div>
            <span>{<br/>}</span>
        </section>
    )
}

export default Services