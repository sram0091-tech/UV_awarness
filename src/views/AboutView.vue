<script setup>
</script>

<template>
  <div class="page-content">
    <div class="about-wrap">
      <div class="about-title">About Us</div>

      <div class="about-grid">
        <div class="about-photo-card">
          <div class="about-photo">
            <img src="/TeamPhoto.JPG" alt="Our Team" />
          </div>
          <p class="photo-caption">
            Our multidisciplinary team from Monash University’s Industry Experience Program.
          </p>
        </div>

        <div class="about-copy">
          <p>
            Australia’s Sun Risk in Plain Sight is a data-driven dashboard created by a multidisciplinary team of postgraduate students from Monash University's Industry Experience Program.
            The project brings together expertise from Information Technology, Data Science, and Business Information Systems to explore how UV exposure and environmental factors influence skin cancer risk in Australia.
          </p>

          <p>
            Our goal is to transform complex public health data into clear, interactive, and engaging insights that help people better understand the risks of sun exposure and make informed decisions about sun safety.
          </p>

          <p class="about-subheading">Through this platform, we aim to:</p>

          <ul class="about-list">
            <li>Visualise skin cancer trends across Australia using accessible and interactive dashboards.</li>
            <li>Explore UV exposure patterns to understand how UV levels vary by time and location.</li>
            <li>Debunk common myths about sun exposure using data and evidence.</li>
            <li>Promote awareness of sun safety, especially among young Australians.</li>
          </ul>

          <p>
            By combining data, storytelling, and visual analytics, the dashboard encourages users to explore the relationship between UV exposure, behaviour, and long-term health outcomes.
          </p>
        </div>
      </div>

      <div class="feedback-card">
        <h3 class="feedback-title">Feedback and Contributions</h3>

        <p class="feedback-text">
          We strive to present accurate and accessible information about sun safety
          and skin cancer risk in Australia.
        </p>

        <p class="feedback-text">
          If you spot an error, have suggestions for improvement, or would like to
          contribute additional insights or data sources, please feel free to contact us.
        </p>

        <div class="feedback-contact">
          <span>Email:</span>
          <a href="mailto:ywan1154@student.monash.edu">
            ywan1154@student.monash.edu
          </a>
        </div>

        <a
          class="feedback-button"
          href="mailto:ywan1154@student.monash.edu"
        >
          Contact Us
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-wrap {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 32px 60px;
}

.about-title {
  font-size: 64px;
  line-height: 1.1;
  color: #f5f5f5;
  margin-bottom: 28px;
  font-family: "Source Serif 4", serif;
}

.about-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 24px;
  align-items: stretch;
}

.about-photo-card,
.about-copy,
.about-contact {
  background: #232323;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 22px;
}

.about-photo-card {
  padding: 18px;
  height: fit-content;
}

.about-photo {
  width: 100%;
  height: 360px;
  border-radius: 16px;
  overflow: hidden;
}

.about-photo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
  background: #3a3a3a;
}

.photo-caption {
  margin-top: 14px;
  font-size: 14px;
  line-height: 1.55;
  color: #d3d3d3;
}

.about-copy {
  padding: 26px 30px;
  color: #f1f1f1;
}

.about-copy p {
  margin: 0 0 16px;
  font-size: 16px;
  line-height: 1.75;
}

.about-subheading {
  font-weight: 700;
  font-size: 18px;
  margin-top: 8px;
  margin-bottom: 10px;
}

.about-list {
  margin: 0 0 18px;
  padding-left: 22px;
}

.about-list li {
  margin-bottom: 10px;
  font-size: 16px;
  line-height: 1.7;
  color: #f1f1f1;
}

.about-contact {
  margin-top: 22px;
  padding: 22px 26px;
  max-width: 760px;
}

.about-contact p {
  margin: 0 0 8px;
  font-size: 16px;
  line-height: 1.65;
  color: #f1f1f1;
}

.contact-title {
  font-weight: 700;
}

.about-contact a {
  color: #f7c948;
  text-decoration: none;
}

.about-contact a:hover {
  text-decoration: underline;
}

@media (max-width: 900px) {
  .about-wrap {
    padding: 28px 20px 48px;
  }

  .about-grid {
    grid-template-columns: 1fr;
  }

  .about-title {
    font-size: 48px;
  }

  .about-photo {
    height: 300px;
  }

  .about-contact {
    max-width: 100%;
  }
}
.feedback-card{
  max-width: 900px;
  margin: 80px auto;
  padding: 40px;
  background: linear-gradient(145deg,#2a2a2a,#1f1f1f);
  border-radius: 24px;
  border: 1px solid rgba(255,255,255,0.08);
}

.feedback-title{
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 16px;
}

.feedback-text{
  color: #bdbdbd;
  line-height: 1.6;
  margin-bottom: 14px;
}

.feedback-contact{
  font-size: 18px;
  margin-top: 20px;
}

.feedback-contact span{
  font-weight: 600;
}

.feedback-contact a{
  color: #f7c948;
  margin-left: 8px;
  text-decoration: none;
}

.feedback-contact a:hover{
  text-decoration: underline;
}

.feedback-button{
  display: inline-block;
  margin-top: 20px;
  padding: 12px 22px;
  border-radius: 999px;
  background: #f7c948;
  color: #000;
  font-weight: 600;
  text-decoration: none;
  transition: 0.2s;
}

.feedback-button:hover{
  transform: translateY(-2px);
}
</style>