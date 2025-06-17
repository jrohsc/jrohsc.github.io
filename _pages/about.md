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
I am a Ph.D. student in computer science at the University of Massachusetts Amherst, advised by <a href="https://people.cs.umass.edu/~amir/" target="_blank">Prof. Amir Houmansadr</a>. 

My research focuses on exploring the **privacy, security, and trustworthiness** of AI models. Recently, I have been investigating the reliability of multimodal models, while also maintaining a strong interest in related areas such as **fairness, interpretability, and responsible AI**. My current work delves into assessing the trustworthiness of multimodal generative models across diverse domains, including text-to-image and audio-based modalities.

Prior to my graduate studies, I earned my bachelor's degree in computer engineering from the Hong Kong University of Science and Technology (HKUST) in the year 2023, where I completed my Final Year Thesis (FYT) on the topic of "Adversarial Attacks in Federated Learning" under the supervision of <a href="https://eejzhang.people.ust.hk/" target="_black">Prof. Jun Zhang</a>. I have also worked with [Prof. Minhao Cheng](https://cmhcbb.github.io/) on the robustness of language models, specifically exploring methods associated with backdoor defense in text domain.

--------
[[Résumé]](files/CV - Jaechul Roh.pdf) / [[Google Scholar]](https://scholar.google.com/citations?user=knCeRjsAAAAJ&hl=ko) / [[GitHub]](https://github.com/jrohsc) / [[Linkedin]](https://www.linkedin.com/in/jaechul-roh-572363155/)

<!-- <span style="font-family: 'Courier New', Courier, monospace;">ideas.txt</span> -->
<!-- ############################################################################################### -->
<section id="news" style="margin: 2rem 0;">
  <h2 style="font-size: 1.5rem;">📣 News</h2>
  <div style="height: 240px; overflow-y: auto; position: relative; border-left: 4px solid #007acc; padding-left: 1rem;">
    <div id="news-ticker" style="display: flex; flex-direction: column;">
      <p>💪 <strong>Jun 16 '25</strong>: I will be working as a Summer Research Intern at Brave Software under the supervision of Dr. <a href="https://alishahin.github.io/" target="_blank">Ali Shahin Shamsabadi</a> on privacy and security of AI Agents.</p>
      
      <p>🎉 <strong>Jun 11 '25</strong>: Our paper <a href="https://arxiv.org/pdf/2406.15213" target="_blank">"Backdooring Bias into Text-to-Image Models"</a> has been accepted to <em>USENIX Security '25</em>!</p>
      
      <p>🎉 <strong>Sep 27 '24</strong>: Our paper <a href="https://arxiv.org/pdf/2405.16978" target="_blank">"OSLO: One-Shot Label-Only Membership Inference Attacks"</a> was accepted to <em>NeurIPS '24</em>!</p>
      
      <p>🎉 <strong>Dec 22 '23</strong>: Our paper <a href="https://arxiv.org/pdf/2312.03692" target="_blank">"Memory Triggers: Unveiling Memorization in Text-To-Image Generative Models through Word-Level Duplication"</a> was accepted to <em>AAAI '23 PPAI Workshop</em>!</p>
    </div>
  </div>

  <style>
    #news-ticker p {
      margin: 0.5rem 0;
      line-height: 1.4;
    }
  </style>
</section>


<!-- ######################################################################################################################################## -->
## 📜 Publications

### 2025 
**Chain-of-Code Collapse: Reasoning Failures in LLMs via Adversarial Prompting in Code Generation** <br>
   **<u><b>Jaechul Roh</b></u>**, Varun Gandhi, Shivani Anilkumar, Arin Garg
   *Preprint at arXiv* <br>
   <!-- NeurIPS 2024 -->
   [[paper]](https://arxiv.org/pdf/2506.06971) [[code]](https://github.com/jrohsc/Chain-of-Code-Collapse)

**R1dacted: Investigating Local Censorship in DeepSeek's R1 Language Model** <br>
   Ali Naseh, Harsh Chaudhari, **<u><b>Jaechul Roh</b></u>**, Mingshi Wu, Alina Oprea, Amir Houmansadr
   *Preprint at arXiv* <br>
   <!-- NeurIPS 2024 -->
   [[paper]](https://arxiv.org/pdf/2505.12625)

**Multilingual and Multi-Accent Jailbreaking of Audio LLMs** <br>
   **<u><b>Jaechul Roh</b></u>**, Virat Shejwalkar, Amir Houmansadr <br>
   *Preprint at arXiv* <br>
   <!-- NeurIPS 2024 -->
   [[paper]](https://arxiv.org/abs/2504.01094)

**OverThink: Slowdown Attacks on Reasoning LLMs** <br>
   Abhinav Kumar, **<u><b>Jaechul Roh</b></u>**, Ali Naseh, Marezna Karpinska, Mohit Iyyer, Amir Houmansadr, and Eugene Bagdasaryan <br>
   *Preprint at arXiv* <br>
   <!-- NeurIPS 2024 -->
   [[paper]](https://arxiv.org/abs/2502.02542) [[code]](https://github.com/akumar2709/OVERTHINK_public)

## 2024
**FameBias: Embedding Manipulation Bias Attack in Text-to-Image Models** <br>
   **<u><b>Jaechul Roh</b></u>**, Andrew Yuan, Jinsong Mao <br>
   *Preprint at arXiv* <br>
   <!-- NeurIPS 2024 -->
   <a href="https://arxiv.org/pdf/2412.18302" target="_blank">[paper]</a>

**Backdooring Bias into Text-to-Image Models**  
   Ali Naseh, **<u><b>Jaechul Roh</b></u>**, Eugene Bagdasaryan, Amir Houmansadr  
   *USENIX Security '25*  
   <!-- NeurIPS 2024 -->
   [[paper]](https://arxiv.org/pdf/2406.15213) [[code]](https://github.com/jcroh0508/Backdororing_Bias/)

**OSLO: One-Shot Label-Only Membership Inference Attacks** <br>
   Yuefeng Peng, <u><b>Jaechul Roh</b></u>, Subhransu Maji, Amir Houmansadr <br>
   *NeurIPS 2024* <br>
   <!-- NeurIPS 2024 -->
   <a href="https://arxiv.org/pdf/2405.16978" target="_blank">[paper]</a>

**Memory Triggers: Unveiling Memorization in Text-To-Image Generative Models through Word-Level Duplication**  
   Ali Naseh, **<u><b>Jaechul Roh</b></u>**, Amir Houmansadr  
   *The 5th AAAI Workshop on Privacy-Preserving Artificial Intelligence*  
   <!-- The 5th AAAI Workshop on Privacy-Preserving Artificial Intelligence -->
   [[paper]](https://arxiv.org/pdf/2312.03692)

**Understanding (Un)Intended Memorization in Text-to-Image Generative Models**  
   Ali Naseh, **<u><b>Jaechul Roh</b></u>**, Amir Houmansadr  
   *Preprint at arXiv*  
   [[paper]](https://arxiv.org/pdf/2312.07550)

### 2023
**Robust Smart Home Face Recognition under Starving Federated Data**  
   **<u><b>Jaechul Roh</b></u>**, Yajun Fang  
   *Oral Presentation in the IEEE International Conference on Universal Village (IEEE UV2022)*  
   <!-- Oral Presentation in the IEEE International Conference on Universal Village (IEEE UV2022)   -->
   [[paper]](https://ieeexplore.ieee.org/stamp/stamp.jsp?arnumber=10175525) | [[code]](https://github.com/jcroh0508/FLATS) | [[slides]](https://www.jrohs.com/_files/ugd/c489e1_bbc7e44075944cad98da82f31e7430ae.pdf) | [[video]](https://www.youtube.com/watch?v=Tj9QiJEUBXU&ab_channel=jroh)

**MSDT: Masked Language Model Scoring Defense in Text Domain**  
   **<u><b>Jaechul Roh</b></u>**, Minhao Cheng, Yajun Fang  
   *Oral Presentation in the IEEE International Conference on Universal Village (IEEE UV2022*)  
   <!-- Oral Presentation in the IEEE International Conference on Universal Village (IEEE UV2022)   -->
   [[paper]](https://ieeexplore.ieee.org/document/10175524) | [[code]](https://github.com/jcroh0508/MSDT) | [[slides]](https://www.jrohs.com/_files/ugd/c489e1_bbc7e44075944cad98da82f31e7430ae.pdf) | [[video]](https://www.youtube.com/watch?v=oO3FbxnMdv0&ab_channel=jroh)

**Impact of Adversarial Training on the Robustness of Deep Neural Networks**  
   **<u><b>Jaechul Roh</b></u>**  
   *2022 IEEE 5th International Conference on Information Systems and Computer Aided Education (ICISCAE)*  
   <!-- 2022 IEEE 5th International Conference on Information Systems and Computer Aided Education (ICISCAE)   -->
   [[paper]](https://ieeexplore.ieee.org/abstract/document/9927611) | [[code]](https://github.com/jcroh0508/Adversarial_Training_Impact)