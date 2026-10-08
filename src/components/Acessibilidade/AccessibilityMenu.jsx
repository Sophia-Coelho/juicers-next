import { useState } from "react";
import AudioReader from "./LeitorDeAudio/AudioReader";
import Acessibilidade from "../../assets/Acessibilidade.png";
import "./AccessibilityMenu.css";

const AccessibilityMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [audioAtivo, setAudioAtivo] = useState(false);

  const abrirVLibras = () => {
    const btn = document.querySelector("[vw-access-button]");
    btn?.click();
    setIsOpen(false);
  };

  const abrirUserWay = () => {
    if (window.UserWay) window.UserWay.widgetOpen();
    setIsOpen(false);
  };

  const items = [
    { label: "VLibras", icon: "👋", color: "#3a86ff", onClick: abrirVLibras },
    { label: "Leitor de Tela", icon: "🔊", color: "#06d6a0", onClick: () => { setAudioAtivo(true); setIsOpen(false); } },
    { label: "Acessibilidade", icon: "👤", color: "#f77f00", onClick: abrirUserWay },
  ];

  return (
    <>
      {audioAtivo && <AudioReader onClose={() => setAudioAtivo(false)} />}

      <div className="accessibility-menu">

        {isOpen && items.map((item, index) => (
          <div className="accessibility-menu__item" key={index}>
            <span className="accessibility-menu__label">
              {item.label}
            </span>
            <button
              type="button"
              onClick={item.onClick}
              aria-label={item.label}
              className="accessibility-menu__option"
              style={{ "--option-color": item.color }}
            >
              {item.icon}
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          aria-label={isOpen ? "Fechar menu" : "Abrir menu de acessibilidade"}
          className="accessibility-menu__trigger"
        >
          {isOpen ? (
            <span className="accessibility-menu__close">
              ✕
            </span>
          ) : (
            <img
              src={Acessibilidade}
              alt="Abrir menu de acessibilidade"
              className="accessibility-menu__icon"
            />
          )}
        </button>
      </div>
    </>
  );
};

export default AccessibilityMenu;
