---
# title: "About"
permalink: /   # This makes the page accessible as the root page
layouts_gallery:
  - url: /assets/images/mm-layout-splash.png
    image_path: /assets/images/mm-layout-splash.png
    alt: "splash layout example"
  - url: /assets/images/mm-layout-single-meta.png
    image_path: /assets/images/mm-layout-single-meta.png
    alt: "single layout with comments and related posts"
  - url: /assets/images/mm-layout-archive.png
    image_path: /assets/images/mm-layout-archive.png
    alt: "archive layout example"
---

<style>

/* Hide follow buttons */
.follow-button,
[class*="follow"],
[id*="follow"],
.follow,
#follow,
button[class*="follow"],
a[class*="follow"],
div[class*="follow"] {
    display: none !important;
    visibility: hidden !important;
}

/* More specific selectors for common platforms */
.wp-block-social-links,
.social-follow,
.follow-me,
.follow-btn,
.followButton,
.follow-widget {
    display: none !important;
}

.profile-header {
  display: flex;
  align-items: center;
  margin-bottom: 3rem;
  gap: 2rem;
  padding: 2rem 0;
  border-bottom: 2px solid #e0e0e0;
}

.profile-photo {
  flex-shrink: 0;
}

.profile-photo img {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.profile-info {
  flex: 1;
}

.profile-info h1 {
  font-size: 2.2rem;
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-weight: bold;
  display: inline-block;
  border-bottom: 1px solid #ccc;
  padding-bottom: 0.3rem;
}

.profile-info .title {
  font-size: 1rem;
  /* font-style: italic; */
  color: #666;
  margin-bottom: 0.1rem;
}

.profile-info .affiliation {
  font-size: 1rem;
  font-style: italic;
  color: #666;
  margin-bottom: 1.5rem;
}

.social-icons {
  display: flex;
  gap: 0;
  margin: 1rem 0;
  justify-content: flex-start;
}

.social-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 40px;
  background-color: #4a5568;
  color: white;
  text-decoration: none;
  transition: all 0.3s ease;
  border: none;
}

.social-icon:first-child {
  border-radius: 5px 0 0 5px;
}

.social-icon:last-child {
  border-radius: 0 5px 5px 0;
}

.social-icon:hover {
  background-color: #2d3748;
  transform: translateY(-2px);
}

.social-icon svg {
  width: 20px;
  height: 20px;
}

.cv-text {
  font-size: 20px;
  font-weight: bold;
  color: white !important;
  text-align: center;
  line-height: 1;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
  
  .profile-photo img {
    width: 150px;
    height: 150px;
  }
}
</style>


<!-- Profile Header Section -->
<div class="profile-header">
  <div class="profile-photo">
    <img src="/images/Jaechul Roh Photo 2.jpg" alt="Jaechul Roh">
  </div>
  <div class="profile-info">
    <h1>Jaechul Roh</h1>
    <div class="title">Ph.D. Student in Computer Science</div>
    <div class="affiliation">University of Massachusetts Amherst</div>

  <!-- Social Media Icons -->
  <div class="social-icons">
    <a href="mailto:jroh@cs.umass.edu" class="social-icon" title="Email">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
      </svg>
    </a>
    <a href="https://x.com/JaechulRoh" class="social-icon" title="Twitter">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
      </svg>
    </a>
    <a href="https://scholar.google.com/citations?user=knCeRjsAAAAJ&hl=ko" class="social-icon" title="Google Scholar">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M12 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-24L0 9.5l4.838 3.94A8 8 0 0 1 12 9a8 8 0 0 1 7.162 4.44L24 9.5z"/>
      </svg>
    </a>
    <a href="https://github.com/jrohsc" class="social-icon" title="GitHub">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    </a>
    <a href="files/CV - Jaechul_Roh.pdf" class="social-icon" title="CV/Resume">
      <div class="cv-text">CV</div>
    </a>
    <a href="https://www.linkedin.com/in/jaechul-roh-572363155/" class="social-icon" title="LinkedIn">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    </a>
  </div>

</div>
</div>



<!-- ######################################################################################################################################## -->

<style>
        .logo-emoji {
            width: 1.2em;
            height: 1.2em;
            vertical-align: -0.1em;
            display: inline-block;
        }
        
        .text-with-logo {
            font-size: 16px;
            line-height: 1.4;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
</style>

<h2 style="font-size: 1.5rem; display: flex; align-items: center; gap: 0.5rem; color: #2c3e50;">
  <svg width="30" height="30" viewBox="0 0 24 24" fill="#2c3e50">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
  About
</h2>

I am a Ph.D. student in computer science at the University of Massachusetts Amherst, advised by <a href="https://people.cs.umass.edu/~amir/" target="_blank">Amir Houmansadr</a>. 

My research centers on the **privacy and security,** of **AI models** and **agentic systems**. I am particularly interested in understanding and mitigating vulnerabilities in multimodal systems, with recent work examining the reliability of models that process **audio**, **text**, and **text-to-image** inputs. Alongside these efforts, I remain engaged with broader topics in **fairness, interpretability,** and **responsible AI**, aiming to develop methods that make AI systems not only powerful but also aligned with societal values.

Prior to my graduate studies, I earned my bachelor's degree in computer engineering from the Hong Kong University of Science and Technology (HKUST) in the year 2023, where I completed my Final Year Thesis (FYT) on the topic of "Adversarial Attacks in Federated Learning" under the supervision of <a href="https://eejzhang.people.ust.hk/" target="_black">Jun Zhang</a>. I have also worked with [Minhao Cheng](https://cmhcbb.github.io/) on the robustness of language models, specifically exploring methods associated with defense against backdoor attacks in language models.

<p class="text-with-logo">
        <img src="/images/brave_software.png" 
             alt="Brave Software Logo" 
             class="logo-emoji"> 
        I am currently doing a Summer Research Internship at Brave Software working on privacy and security of AI agents with <a href="https://alishahin.github.io/">Ali Shahin Shamsabadi</a>.
</p>

-------- -->
<h2 style="font-size: 1.5rem;">💬 Office Hours</h2>
I’m hosting weekly office hours—feel free to drop by! I'm happy to chat and advise on research (or projects), PhD applications, or anything else on your mind. Casual chats welcome too (I’m a big football (soccer) fan ⚽️). Lately, I've been working on trustworthiness of AI agents and audio modality safety, but I'm always open to exploring new areas and directions you might bring.

Feel free to book a time that works for you through my [Calendly](https://calendly.com/jroh-scm). 

<!-- <span style="font-family: 'Courier New', Courier, monospace;">ideas.txt</span> -->
<!-- ############################################################################################### -->
<section id="news" style="margin: 2rem 0;">
  <h2 style="font-size: 1.5rem;">📣 News</h2>
  <div style="height: 240px; overflow-y: auto; position: relative; border-left: 4px solid #007acc; padding-left: 1rem; background-color: #f8f9fa; border-radius: 8px; padding: 1rem;">
    <div id="news-ticker" style="display: flex; flex-direction: column;">
  <p><img src="/images/google-deepmind.png" 
             alt="Google DeepMind Logo" 
             class="logo-emoji">  
   <strong style="color: #fd7e14;">July 11 '25</strong>: I gave a talk at the NFM Reading Group led by the Speech Technologies Group at Google DeepMind on our <a href="https://arxiv.org/abs/2504.01094" target="_blank">Multilingual and Multi-Accent Jailbreaking of Audio LLMs</a> paper. View <a href="/files/Multi-AudioJail.pptx.pdf" target="_blank">[slides]</a></p>

  <p>🎉 <strong style="color: #fd7e14;">July 7 '25</strong>: Our <a href="https://arxiv.org/abs/2504.01094" target="_blank">Multilingual and Multi-Accent Jailbreaking of Audio LLMs</a> paper has been accepted to <em>COLM (Conference on Language Modeling) 2025</em>!</p>

  <p><img src="/images/brave_software.png" 
             alt="Brave Software Logo" 
             class="logo-emoji">  
  <strong style="color: #fd7e14;">Jun 16 '25</strong>: I will be working as a Summer Research Intern at Brave Software under the supervision of Dr. <a href="https://alishahin.github.io/" target="_blank">Ali Shahin Shamsabadi</a> on privacy and security of AI Agents.
  </p>
  
  <p>🎉 <strong style="color: #fd7e14;">Jun 11 '25</strong>: Our <a href="https://arxiv.org/pdf/2406.15213" target="_blank">Backdooring Bias into Text-to-Image Models</a> paper has been accepted to <em>USENIX Security '25</em>!</p>
  
  <p>🎉 <strong style="color: #fd7e14;">Sep 27 '24</strong>: Our <a href="https://arxiv.org/pdf/2405.16978" target="_blank">OSLO</a> paper has been accepted to <em>NeurIPS '24</em>!</p>
  
  <p>🎉 <strong style="color: #fd7e14;">Dec 22 '23</strong>: Our <a href="https://arxiv.org/pdf/2312.03692" target="_blank">Memory Triggers</a> paper has been accepted to <em>AAAI '23 PPAI Workshop</em>!</p>
</div>
  </div>
  <style>
    #news-ticker p {
      margin: 0.5rem 0;
      line-height: 1.7;
    }
  </style>
</section>


<!-- ######################################################################################################################################## -->

<style>

.paper-image-container {
  position: relative;
  flex-shrink: 0;
  width: 150px;
  height: 120px;
}

.paper-container {
  display: flex;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.paper-image {
  flex-shrink: 0;
  width: 150px;
  height: 120px;
  object-fit: cover;
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.paper-content {
  flex: 1;
}

.paper-title {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.venue-tag {
  position: absolute;
  top: 5px;
  left: 5px;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.venue-tag.preprint {
  background-color: #6c757d;
}

.venue-tag.published {
  background-color: #2c3e50;
}

.paper-authors {
  margin-bottom: 0.3rem;
}

.paper-venue {
  font-style: italic;
  font-family: "Times New Roman", Times, serif;
  margin-bottom: 0.5rem;
}

.paper-links {
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .paper-container {
    flex-direction: column;
  }
  
  .paper-image {
    width: 100%;
    height: 150px;
  }
}
</style>

 <!-- Publications Section -->
  <h2 style="font-size: 1.5rem;">🖨️ Preprint / Publications</h2>

  <h4 style="font-size: 1.3rem;">Preprint</h4>
<div class="paper-container">
  <div class="paper-image-container">
    <img src="paper_figures/cocc.png" alt="Chain-of-Code Collapse" class="paper-image">
    <span class="venue-tag preprint">arXiv</span>
  </div>
  <div class="paper-content">
    <div class="paper-title">
      <a href="https://arxiv.org/pdf/2506.06971" target="_blank">Chain-of-Code Collapse: Reasoning Failures in LLMs via Adversarial Prompting in Code Generation</a>
    </div>
    <div class="paper-authors">
      <strong><u>Jaechul Roh</u></strong>, Varun Gandhi, Shivani Anilkumar, Arin Garg
    </div>
    <div class="paper-venue">arXiv</div>
    <div class="paper-links">
      <a href="https://github.com/jrohsc/Chain-of-Code-Collapse" target="_blank">[code]</a>
    </div>
  </div>
</div>

<div class="paper-container">
  <div class="paper-image-container">
    <img src="paper_figures/r1dacted.png" alt="R1dacted" class="paper-image">
    <span class="venue-tag preprint">arXiv</span>
  </div>
  <div class="paper-content">
    <div class="paper-title">
      <a href="https://arxiv.org/pdf/2505.12625" target="_blank">R1dacted: Investigating Local Censorship in DeepSeek's R1 Language Model</a>
    </div>
    <div class="paper-authors">
      Ali Naseh, Harsh Chaudhari, <strong><u>Jaechul Roh</u></strong>, Mingshi Wu, Alina Oprea, Amir Houmansadr
    </div>
    <div class="paper-venue">arXiv</div>
  </div>
</div>

<div class="paper-container">
  <div class="paper-image-container">
    <img src="paper_figures/overthink.png" alt="OverThink" class="paper-image">
    <span class="venue-tag preprint">arXiv</span>
  </div>
  <div class="paper-content">
    <div class="paper-title">
      <a href="https://arxiv.org/abs/2502.02542" target="_blank">OverThink: Slowdown Attacks on Reasoning LLMs</a>
    </div>
    <div class="paper-authors">
      Abhinav Kumar, <strong><u>Jaechul Roh</u></strong>, Ali Naseh, Marezna Karpinska, Mohit Iyyer, Amir Houmansadr, and Eugene Bagdasaryan
    </div>
    <div class="paper-venue">arXiv</div>
    <div class="paper-links">
      <a href="https://github.com/akumar2709/OVERTHINK_public" target="_blank">[code]</a>
    </div>
  </div>
</div>

<div class="paper-container">
  <div class="paper-image-container">
    <img src="paper_figures/fambias.png" alt="FameBias" class="paper-image">
    <span class="venue-tag preprint">arXiv</span>
  </div>
  <div class="paper-content">
    <div class="paper-title">
      <a href="https://arxiv.org/pdf/2412.18302" target="_blank">FameBias: Embedding Manipulation Bias Attack in Text-to-Image Models</a>
    </div>
    <div class="paper-authors">
      <strong><u>Jaechul Roh</u></strong>, Andrew Yuan, Jinsong Mao
    </div>
    <div class="paper-venue">arXiv</div>
  </div>
</div>

<div class="paper-container">
  <div class="paper-image-container">
    <img src="paper_figures/(un)intended.png" alt="Understanding Memorization" class="paper-image">
    <span class="venue-tag preprint">arXiv</span>
  </div>
  <div class="paper-content">
    <div class="paper-title">
      <a href="https://arxiv.org/pdf/2312.07550" target="_blank">Understanding (Un)Intended Memorization in Text-to-Image Generative Models</a>
    </div>
    <div class="paper-authors">
      Ali Naseh, <strong><u>Jaechul Roh</u></strong>, Amir Houmansadr
    </div>
    <div class="paper-venue">arXiv</div>
  </div>
</div>

<h4 style="font-size: 1.3rem;">2025</h4>

<div class="paper-container">
  <div class="paper-image-container">
    <img src="paper_figures/multi_audiojail.png" alt="Multilingual Audio Jailbreaking" class="paper-image">
    <span class="venue-tag published">COLM '25</span>
  </div>
  <div class="paper-content">
    <div class="paper-title">
      <a href="https://arxiv.org/abs/2504.01094" target="_blank">Multilingual and Multi-Accent Jailbreaking of Audio LLMs</a>
    </div>
    <div class="paper-authors">
      <strong><u>Jaechul Roh</u></strong>, Virat Shejwalkar, Amir Houmansadr
    </div>
    <div class="paper-venue">COLM 2025</div>
  </div>
</div>

<div class="paper-container">
  <div class="paper-image-container">
    <img src="paper_figures/backdooring_bias_t2i.png" alt="Backdooring Bias" class="paper-image">
    <span class="venue-tag published">USENIX '25</span>
  </div>
  <div class="paper-content">
    <div class="paper-title">
      <a href="https://arxiv.org/pdf/2406.15213" target="_blank">Backdooring Bias into Text-to-Image Models</a>
    </div>
    <div class="paper-authors">
      Ali Naseh, <strong><u>Jaechul Roh</u></strong>, Eugene Bagdasaryan, Amir Houmansadr
    </div>
    <div class="paper-venue">USENIX Security '25</div>
    <div class="paper-links">
      <a href="https://github.com/jcroh0508/Backdororing_Bias/" target="_blank">[code]</a>
    </div>
  </div>
</div>

<h4 style="font-size: 1.3rem;">2024</h4>

<div class="paper-container">
  <div class="paper-image-container">
    <img src="paper_figures/oslo.png" alt="OSLO" class="paper-image">
    <span class="venue-tag published">NeurIPS '24</span>
  </div>
  <div class="paper-content">
    <div class="paper-title">
      <a href="https://arxiv.org/pdf/2405.16978" target="_blank">OSLO: One-Shot Label-Only Membership Inference Attacks</a>
    </div>
    <div class="paper-authors">
      Yuefeng Peng, <strong><u>Jaechul Roh</u></strong>, Subhransu Maji, Amir Houmansadr
    </div>
    <div class="paper-venue">NeurIPS 2024</div>
  </div>
</div>

<div class="paper-container">
  <div class="paper-image-container">
    <img src="paper_figures/memory_trigger.png" alt="Memory Triggers" class="paper-image">
    <span class="venue-tag published">AAAI PPAI '24</span>
  </div>
  <div class="paper-content">
    <div class="paper-title">
      <a href="https://arxiv.org/pdf/2312.03692" target="_blank">Memory Triggers: Unveiling Memorization in Text-To-Image Generative Models through Word-Level Duplication</a>
    </div>
    <div class="paper-authors">
      Ali Naseh, <strong><u>Jaechul Roh</u></strong>, Amir Houmansadr
    </div>
    <div class="paper-venue">The 5th PPAI (AAAI Workshop) 2024</div>
  </div>
</div>

<h4 style="font-size: 1.3rem;">2023</h4>

<div class="paper-container">
  <div class="paper-image-container">
    <img src="paper_figures/robust_smarthome.png" alt="Robust Smart Home" class="paper-image">
    <span class="venue-tag published">IEEE UV '22</span>
  </div>
  <div class="paper-content">
    <div class="paper-title">
      <a href="https://arxiv.org/pdf/2211.05410" target="_blank">Robust Smart Home Face Recognition under Starving Federated Data</a>
    </div>
    <div class="paper-authors">
      <strong><u>Jaechul Roh</u></strong>, Yajun Fang
    </div>
    <div class="paper-venue">IEEE UV 2022 (Oral Presentation)</div>
    <div class="paper-links">
      <a href="https://github.com/jcroh0508/FLATS" target="_blank">[code]</a> | 
      <a href="https://www.jrohs.com/_files/ugd/c489e1_bbc7e44075944cad98da82f31e7430ae.pdf" target="_blank">[slides]</a> | 
      <a href="https://www.youtube.com/watch?v=Tj9QiJEUBXU&ab_channel=jroh" target="_blank">[video]</a>
    </div>
  </div>
</div>

<div class="paper-container">
  <div class="paper-image-container">
    <img src="paper_figures/MSDT.png" alt="MSDT" class="paper-image">
    <span class="venue-tag published">IEEE UV '22</span>
  </div>
  <div class="paper-content">
    <div class="paper-title">
      <a href="https://arxiv.org/pdf/2211.05371" target="_blank">MSDT: Masked Language Model Scoring Defense in Text Domain</a>
    </div>
    <div class="paper-authors">
      <strong><u>Jaechul Roh</u></strong>, Minhao Cheng, Yajun Fang
    </div>
    <div class="paper-venue">IEEE UV 2022 (Oral Presentation)</div>
    <div class="paper-links">
      <a href="https://github.com/jcroh0508/MSDT" target="_blank">[code]</a> | 
      <a href="https://www.jrohs.com/_files/ugd/c489e1_bbc7e44075944cad98da82f31e7430ae.pdf" target="_blank">[slides]</a> | 
      <a href="https://www.youtube.com/watch?v=oO3FbxnMdv0&ab_channel=jroh" target="_blank">[video]</a>
    </div>
  </div>
</div>

<div class="paper-container">
  <div class="paper-image-container">
    <img src="paper_figures/impact_adv_training.png" alt="Impact of Adversarial Training" class="paper-image">
    <span class="venue-tag published">IEEE ICISCAE '22</span>
  </div>
  <div class="paper-content">
    <div class="paper-title">
      <a href="https://ieeexplore.ieee.org/abstract/document/9927611" target="_blank">Impact of Adversarial Training on the Robustness of Deep Neural Networks</a>
    </div>
    <div class="paper-authors">
      <strong><u>Jaechul Roh</u></strong>
    </div>
    <div class="paper-venue">IEEE ICISCAE 2022</div>
    <div class="paper-links">
      <a href="https://github.com/jcroh0508/Adversarial_Training_Impact" target="_blank">[code]</a>
    </div>
  </div>
</div>



<!-- 

<h4 style="font-size: 1.5rem;">Preprint</h4>
<div class="paper-container">
  <img src="paper_figures/cocc.png" alt="Chain-of-Code Collapse" class="paper-image">
  <div class="paper-content">
    <div class="paper-title">
      <a href="https://arxiv.org/pdf/2506.06971" target="_blank">Chain-of-Code Collapse: Reasoning Failures in LLMs via Adversarial Prompting in Code Generation</a>
    </div>
    <div class="paper-authors">
      <strong><u>Jaechul Roh</u></strong>, Varun Gandhi, Shivani Anilkumar, Arin Garg
    </div>
    <div class="paper-venue">arXiv</div>
    <div class="paper-links">
      <a href="https://github.com/jrohsc/Chain-of-Code-Collapse" target="_blank">[code]</a>
    </div>
  </div>
</div>

<div class="paper-container">
  <img src="paper_figures/r1dacted.png" alt="R1dacted" class="paper-image">
  <div class="paper-content">
    <div class="paper-title">
      <a href="https://arxiv.org/pdf/2505.12625" target="_blank">R1dacted: Investigating Local Censorship in DeepSeek's R1 Language Model</a>
    </div>
    <div class="paper-authors">
      Ali Naseh, Harsh Chaudhari, <strong><u>Jaechul Roh</u></strong>, Mingshi Wu, Alina Oprea, Amir Houmansadr
    </div>
    <div class="paper-venue">arXiv</div>
  </div>
</div>

<div class="paper-container">
  <img src="paper_figures/overthink.png" alt="OverThink" class="paper-image">
  <div class="paper-content">
    <div class="paper-title">
      <a href="https://arxiv.org/abs/2502.02542" target="_blank">OverThink: Slowdown Attacks on Reasoning LLMs</a>
    </div>
    <div class="paper-authors">
      Abhinav Kumar, <strong><u>Jaechul Roh</u></strong>, Ali Naseh, Marezna Karpinska, Mohit Iyyer, Amir Houmansadr, and Eugene Bagdasaryan
    </div>
    <div class="paper-venue">arXiv</div>
    <div class="paper-links">
      <a href="https://github.com/akumar2709/OVERTHINK_public" target="_blank">[code]</a>
    </div>
  </div>
</div>


<div class="paper-container">
  <img src="paper_figures/fambias.png" alt="FameBias" class="paper-image">
  <div class="paper-content">
    <div class="paper-title">
      <a href="https://arxiv.org/pdf/2412.18302" target="_blank">FameBias: Embedding Manipulation Bias Attack in Text-to-Image Models</a>
    </div>
    <div class="paper-authors">
      <strong><u>Jaechul Roh</u></strong>, Andrew Yuan, Jinsong Mao
    </div>
    <div class="paper-venue">arXiv</div>
  </div>
</div>


<div class="paper-container">
  <img src="paper_figures/(un)intended.png" alt="Understanding Memorization" class="paper-image">
  <div class="paper-content">
    <div class="paper-title">
      <a href="https://arxiv.org/pdf/2312.07550" target="_blank">Understanding (Un)Intended Memorization in Text-to-Image Generative Models</a>
    </div>
    <div class="paper-authors">
      Ali Naseh, <strong><u>Jaechul Roh</u></strong>, Amir Houmansadr
    </div>
    <div class="paper-venue">arXiv</div>
  </div>
</div>

<h4 style="font-size: 1.5rem;">2025</h4>

<div class="paper-container">
  <img src="paper_figures/multi_audiojail.png" alt="Multilingual Audio Jailbreaking" class="paper-image">
  <div class="paper-content">
    <div class="paper-title">
      <a href="https://arxiv.org/abs/2504.01094" target="_blank">Multilingual and Multi-Accent Jailbreaking of Audio LLMs</a>
    </div>
    <div class="paper-authors">
      <strong><u>Jaechul Roh</u></strong>, Virat Shejwalkar, Amir Houmansadr
    </div>
    <div class="paper-venue">COLM 2025</div>
  </div>
</div>
<div class="paper-container">
  <img src="paper_figures/backdooring_bias_t2i.png" alt="Backdooring Bias" class="paper-image">
  <div class="paper-content">
    <div class="paper-title">
      <a href="https://arxiv.org/pdf/2406.15213" target="_blank">Backdooring Bias into Text-to-Image Models</a>
    </div>
    <div class="paper-authors">
      Ali Naseh, <strong><u>Jaechul Roh</u></strong>, Eugene Bagdasaryan, Amir Houmansadr
    </div>
    <div class="paper-venue">USENIX Security '25</div>
    <div class="paper-links">
      <a href="https://github.com/jcroh0508/Backdororing_Bias/" target="_blank">[code]</a>
    </div>
  </div>
</div>
   

<h4 style="font-size: 1.5rem;">2024</h4>

<div class="paper-container">
  <img src="paper_figures/oslo.png" alt="OSLO" class="paper-image">
  <div class="paper-content">
    <div class="paper-title">
      <a href="https://arxiv.org/pdf/2405.16978" target="_blank">OSLO: One-Shot Label-Only Membership Inference Attacks</a>
    </div>
    <div class="paper-authors">
      Yuefeng Peng, <strong><u>Jaechul Roh</u></strong>, Subhransu Maji, Amir Houmansadr
    </div>
    <div class="paper-venue">NeurIPS 2024</div>
  </div>
</div>


<div class="paper-container">
  <img src="paper_figures/memory_trigger.png" alt="Memory Triggers" class="paper-image">
  <div class="paper-content">
    <div class="paper-title">
      <a href="https://arxiv.org/pdf/2312.03692" target="_blank">Memory Triggers: Unveiling Memorization in Text-To-Image Generative Models through Word-Level Duplication</a>
    </div>
    <div class="paper-authors">
      Ali Naseh, <strong><u>Jaechul Roh</u></strong>, Amir Houmansadr
    </div>
    <div class="paper-venue">The 5th PPAI (AAAI Workshop)</div>
  </div>
</div>

<h4 style="font-size: 1.5rem;">2023</h4>

<div class="paper-container">
  <img src="paper_figures/robust_smarthome.png" alt="Robust Smart Home" class="paper-image">
  <div class="paper-content">
    <div class="paper-title">
      <a href="https://arxiv.org/pdf/2211.05410" target="_blank">Robust Smart Home Face Recognition under Starving Federated Data</a>
    </div>
    <div class="paper-authors">
      <strong><u>Jaechul Roh</u></strong>, Yajun Fang
    </div>
    <div class="paper-venue"> IEEE UV 2022 (Oral Presentation)</div>
    <div class="paper-links">
      <a href="https://github.com/jcroh0508/FLATS" target="_blank">[code]</a> | 
      <a href="https://www.jrohs.com/_files/ugd/c489e1_bbc7e44075944cad98da82f31e7430ae.pdf" target="_blank">[slides]</a> | 
      <a href="https://www.youtube.com/watch?v=Tj9QiJEUBXU&ab_channel=jroh" target="_blank">[video]</a>
    </div>
  </div>
</div>


<div class="paper-container">
  <img src="paper_figures/MSDT.png" alt="MSDT" class="paper-image">
  <div class="paper-content">
    <div class="paper-title">
      <a href="https://arxiv.org/pdf/2211.05371" target="_blank">MSDT: Masked Language Model Scoring Defense in Text Domain</a>
    </div>
    <div class="paper-authors">
      <strong><u>Jaechul Roh</u></strong>, Minhao Cheng, Yajun Fang
    </div>
    <div class="paper-venue">IEEE UV 2022 (Oral Presentation)</div>
    <div class="paper-links">
      <a href="https://github.com/jcroh0508/MSDT" target="_blank">[code]</a> | 
      <a href="https://www.jrohs.com/_files/ugd/c489e1_bbc7e44075944cad98da82f31e7430ae.pdf" target="_blank">[slides]</a> | 
      <a href="https://www.youtube.com/watch?v=oO3FbxnMdv0&ab_channel=jroh" target="_blank">[video]</a>
    </div>
  </div>
</div>


<div class="paper-container">
  <img src="paper_figures/impact_adv_training.png" alt="Impact of Adversarial Training" class="paper-image">
  <div class="paper-content">
    <div class="paper-title">
      <a href="https://ieeexplore.ieee.org/abstract/document/9927611" target="_blank">Impact of Adversarial Training on the Robustness of Deep Neural Networks</a>
    </div>
    <div class="paper-authors">
      <strong><u>Jaechul Roh</u></strong>
    </div>
    <div class="paper-venue">IEEE ICISCAE 2022</div>
    <div class="paper-links">
      <a href="https://github.com/jcroh0508/Adversarial_Training_Impact" target="_blank">[code]</a>
    </div>
  </div>
</div> -->