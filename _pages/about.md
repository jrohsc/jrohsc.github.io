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

<!-- ######################################################################################################################################## -->
I am a Ph.D. student in computer science at the University of Massachusetts Amherst, advised by <a href="https://people.cs.umass.edu/~amir/" target="_blank">Amir Houmansadr</a>. 

My research focuses on exploring the **privacy, security, and trustworthiness** of AI models. Recently, I have been investigating the reliability of multimodal models, while also maintaining a strong interest in related areas such as **fairness, interpretability, and responsible AI**. My current work delves into assessing the trustworthiness of multimodal generative models across diverse domains, including text-to-image and audio-based modalities. I am currently doing a Summer Internship at Brave Software working on privacy and security of AI agents with [Ali Shahin Shamsabadi](https://alishahin.github.io/).

Prior to my graduate studies, I earned my bachelor's degree in computer engineering from the Hong Kong University of Science and Technology (HKUST) in the year 2023, where I completed my Final Year Thesis (FYT) on the topic of "Adversarial Attacks in Federated Learning" under the supervision of <a href="https://eejzhang.people.ust.hk/" target="_black">Jun Zhang</a>. I have also worked with [Minhao Cheng](https://cmhcbb.github.io/) on the robustness of language models, specifically exploring methods associated with backdoor defense in text domain.

--------

[[Résumé]](files/CV - Jaechul_Roh.pdf) / [[Google Scholar]](https://scholar.google.com/citations?user=knCeRjsAAAAJ&hl=ko) / [[GitHub]](https://github.com/jrohsc) / [[Linkedin]](https://www.linkedin.com/in/jaechul-roh-572363155/)

--------

## 💬 Office Hours
I’m hosting weekly office hours—feel free to drop by! I'm happy to chat and advise on research (or projects), PhD applications, or anything else on your mind. Casual chats welcome too (I’m a big football (soccer) fan ⚽️). Lately, I've been working on trustworthiness of AI agents and audio modality safety, but I'm always open to exploring new areas and directions you might bring.

Feel free to book a time that works for you through my [Calendly](https://calendly.com/jroh-scm). 

<!-- <span style="font-family: 'Courier New', Courier, monospace;">ideas.txt</span> -->
<!-- ############################################################################################### -->
<section id="news" style="margin: 2rem 0;">
  <h2 style="font-size: 1.5rem;">📣 News</h2>
  <div style="height: 240px; overflow-y: auto; position: relative; border-left: 4px solid #007acc; padding-left: 1rem;">
    <div id="news-ticker" style="display: flex; flex-direction: column;">

      <p>🎙️ <strong>July 11 '25</strong>: I will be giving a talk at the NFM Reading Group led by the Speech Technologies Group at Google Deemind on our <a href="https://arxiv.org/abs/2504.01094" target="_blank">Multilingual and Multi-Accent Jailbreaking of Audio LLMs</a> paper. View <a href="https://docs.google.com/presentation/d/1LOQ5W4fck5dfnv5I6LJBvbk4FOHydcJ-/edit?usp=sharing&ouid=104745020285400681437&rtpof=true&sd=true" target="_blank">[slides]</a></p>

      <p>🎉 <strong>July 7 '25</strong>: Our <a href="https://arxiv.org/abs/2504.01094" target="_blank">Multilingual and Multi-Accent Jailbreaking of Audio LLMs</a> paper has been accepted to <em>COLM (Conference on Language Modeling) 2025</em>!</p>

      <p>💪 <strong>Jun 16 '25</strong>: I will be working as a Summer Research Intern at Brave Software under the supervision of Dr. <a href="https://alishahin.github.io/" target="_blank">Ali Shahin Shamsabadi</a> on privacy and security of AI Agents.</p>
      
      <p>🎉 <strong>Jun 11 '25</strong>: Our <a href="https://arxiv.org/pdf/2406.15213" target="_blank">Backdooring Bias into Text-to-Image Models</a> paper has been accepted to <em>USENIX Security '25</em>!</p>
      
      <p>🎉 <strong>Sep 27 '24</strong>: Our <a href="https://arxiv.org/pdf/2405.16978" target="_blank">OSLO</a> paper has been accepted to <em>NeurIPS '24</em>!</p>
      
      <p>🎉 <strong>Dec 22 '23</strong>: Our <a href="https://arxiv.org/pdf/2312.03692" target="_blank">Memory Triggers</a> paper has been accepted to <em>AAAI '23 PPAI Workshop</em>!</p>
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
## 🖨️ Preprint / Publications
<style>
.paper-container {
  display: flex;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;
}

.paper-image {
  flex-shrink: 0;
  width: 170px;
  height: 130px;
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

.paper-authors {
  margin-bottom: 0.3rem;
}

.paper-venue {
  font-style: italic;
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


## Preprint
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

## 2025 

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
   

## 2024

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

## 2023

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
</div>