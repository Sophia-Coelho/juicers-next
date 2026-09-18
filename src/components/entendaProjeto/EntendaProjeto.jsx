import { useTranslation } from "../../context/LanguageContext";
import "../../style/EntendaProjeto.css";

const T = {
  pt: {
    eyebrow: "Conheça o projeto",
    h2: "Entenda mais sobre o Juicers",
    p: "Um vídeo rápido explicando por que a Juicers existe e como ele ajuda no seu acompanhamento de saúde.",
  },
  en: {
    eyebrow: "Get to know the project",
    h2: "Learn more about our project.",
    p: "A quick video explaining why Juicers exists and how it helps with your health tracking.",
  },
};

export default function EntendaProjeto() {
  const t = useTranslation(T, "EntendaProjeto.T");

  return (
    <section id="entenda" className="section">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow">{t.eyebrow}</span>
          <h2>{t.h2}</h2>
          <p>{t.p}</p>
        </div>
        <div className="video-frame reveal">
          <div className="video-embed">
            <iframe
              src="https://www.youtube.com/embed/7a0OCLeTvXU?start=12"
              title="Juicers - Vídeo pitch"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}
